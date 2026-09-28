package com.example.lyricstream

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.PixelFormat
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.LinkedHashMap
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.roundToInt

class OverlayService : Service() {
    companion object {
        const val ACTION_SETTINGS_CHANGED = "com.example.lyricstream.SETTINGS_CHANGED"
        const val ACTION_APP_VISIBILITY = "com.example.lyricstream.APP_VISIBILITY"
        const val EXTRA_APP_VISIBLE = "visible"
        const val ACTION_STOP = "com.example.lyricstream.STOP"
        private const val CHANNEL_ID = "lyricstream_overlay"
        private const val NOTIFICATION_ID = 713
        @Volatile var running = false

        fun start(context: Context) {
            val intent = Intent(context, OverlayService::class.java)
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent)
            else context.startService(intent)
        }
    }

    private lateinit var wm: WindowManager
    private lateinit var prefs: OverlayPrefs
    private lateinit var lyricView: LyricOverlayView
    private lateinit var orbView: UnlockOrbView
    private lateinit var lyricParams: WindowManager.LayoutParams
    private lateinit var orbParams: WindowManager.LayoutParams
    private val handler = Handler(Looper.getMainLooper())

    private var editMode = false
    private var appVisible = false
    private var landscapeMode = false
    private var dragDownRawX = 0f
    private var dragDownRawY = 0f
    private var dragStartX = 0
    private var dragStartY = 0

    private var activeTitle = ""
    private var activeArtist = ""
    private var activeKey = ""
    private var activeLines: List<LyricLine> = emptyList()
    private var lyricsGeneration = 0
    private val lyricsCache = object : LinkedHashMap<String, List<LyricLine>>(16, .75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, List<LyricLine>>?): Boolean = size > 24
    }

    private val settingsReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_SETTINGS_CHANGED -> applyVisualSettings()
                ACTION_APP_VISIBILITY -> {
                    appVisible = intent.getBooleanExtra(EXTRA_APP_VISIBLE, false)
                    setOverlayVisibility(!appVisible)
                }
            }
        }
    }

    private val autoLock = Runnable { if (editMode) setEditMode(false) }

    private val tick = object : Runnable {
        override fun run() {
            updateMedia()
            handler.postDelayed(this, if (hasPlayingSession()) 80L else 420L)
        }
    }

    override fun onCreate() {
        super.onCreate()
        running = true
        prefs = OverlayPrefs(this)
        wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        appVisible = MainActivity.isForeground
        landscapeMode = resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

        val filter = IntentFilter().apply {
            addAction(ACTION_SETTINGS_CHANGED)
            addAction(ACTION_APP_VISIBILITY)
        }
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(settingsReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(settingsReceiver, filter)
        }

        if (Settings.canDrawOverlays(this)) {
            attachWindows()
            handler.post(tick)
        } else {
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun attachWindows() {
        lyricView = LyricOverlayView(this)
        orbView = UnlockOrbView(this) { setEditMode(!editMode) }
        orbView.accent = accentForTheme()

        val type = if (Build.VERSION.SDK_INT >= 26) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        lyricParams = WindowManager.LayoutParams(
            1,
            1,
            type,
            lockedFlags(),
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            alpha = prefs.opacity
        }

        orbParams = WindowManager.LayoutParams(
            dp(30),
            dp(30),
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        lyricView.setOnTouchListener { _, event ->
            if (!editMode) return@setOnTouchListener false

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    dragDownRawX = event.rawX
                    dragDownRawY = event.rawY
                    dragStartX = lyricParams.x
                    dragStartY = lyricParams.y
                    scheduleAutoLock()
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val metrics = resources.displayMetrics
                    val safeTop = currentSafeTop()
                    val dx = (event.rawX - dragDownRawX).roundToInt()
                    val dy = (event.rawY - dragDownRawY).roundToInt()

                    lyricParams.x = (dragStartX + dx).coerceIn(
                        0,
                        (metrics.widthPixels - lyricParams.width).coerceAtLeast(0)
                    )
                    lyricParams.y = (dragStartY + dy).coerceIn(
                        safeTop,
                        (metrics.heightPixels - lyricParams.height).coerceAtLeast(safeTop)
                    )

                    safeUpdate(lyricView, lyricParams)
                    updateOrbPosition()
                    scheduleAutoLock()
                    true
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    prefs.savePosition(
                        landscape = landscapeMode,
                        x = lyricParams.x,
                        y = lyricParams.y
                    )
                    scheduleAutoLock()
                    true
                }

                else -> false
            }
        }

        applyOrientationGeometry(loadSavedPosition = true)
        wm.addView(lyricView, lyricParams)
        updateOrbPosition()
        wm.addView(orbView, orbParams)

        applyVisualSettings()
        setOverlayVisibility(!appVisible)
    }

    private fun currentSafeTop(): Int = if (landscapeMode) dp(28) else dp(54)

    private fun defaultY(): Int = if (landscapeMode) dp(46) else dp(84)

    private fun applyOrientationGeometry(loadSavedPosition: Boolean) {
        val metrics = resources.displayMetrics
        val screenW = metrics.widthPixels

        lyricParams.width = (
            screenW * if (landscapeMode) .78f else .96f
        ).roundToInt()
        lyricParams.height = if (landscapeMode) dp(154) else dp(220)

        val defaultX = ((screenW - lyricParams.width) / 2).coerceAtLeast(0)
        val safeTop = currentSafeTop()

        if (loadSavedPosition) {
            val savedY = prefs.positionY(landscapeMode)
            val savedX = prefs.positionX(landscapeMode)

            lyricParams.x = if (savedY < safeTop) {
                defaultX
            } else {
                savedX.coerceIn(
                    0,
                    (screenW - lyricParams.width).coerceAtLeast(0)
                )
            }

            lyricParams.y = if (savedY < safeTop) {
                defaultY()
            } else {
                savedY.coerceIn(
                    safeTop,
                    (metrics.heightPixels - lyricParams.height).coerceAtLeast(safeTop)
                )
            }
        } else {
            lyricParams.x = lyricParams.x.coerceIn(
                0,
                (screenW - lyricParams.width).coerceAtLeast(0)
            )
            lyricParams.y = lyricParams.y.coerceIn(
                safeTop,
                (metrics.heightPixels - lyricParams.height).coerceAtLeast(safeTop)
            )
        }

        if (::lyricView.isInitialized && lyricView.isAttachedToWindow) {
            safeUpdate(lyricView, lyricParams)
            updateOrbPosition()
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        if (::lyricParams.isInitialized) {
            prefs.savePosition(
                landscape = landscapeMode,
                x = lyricParams.x,
                y = lyricParams.y
            )
        }

        super.onConfigurationChanged(newConfig)

        landscapeMode = newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE

        if (::lyricParams.isInitialized) {
            applyOrientationGeometry(loadSavedPosition = true)
        }
    }

    private fun lockedFlags(): Int =
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN

    private fun editFlags(): Int =
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN

    private fun setEditMode(enabled: Boolean) {
        editMode = enabled
        lyricParams.flags = if (enabled) editFlags() else lockedFlags()
        lyricParams.alpha = prefs.opacity
        lyricView.setEditMode(enabled)
        orbView.active = enabled
        safeUpdate(lyricView, lyricParams)
        if (enabled) scheduleAutoLock() else handler.removeCallbacks(autoLock)
    }

    private fun scheduleAutoLock() {
        handler.removeCallbacks(autoLock)
        handler.postDelayed(autoLock, 5000L)
    }

    private fun updateOrbPosition() {
        if (!::orbParams.isInitialized) return

        // Keep the visible orb near the lyric field, not at the invisible
        // system-window edge.
        orbParams.x = (
            lyricParams.x + lyricParams.width * .095f
        ).roundToInt() - dp(15)
        orbParams.y = lyricParams.y + lyricParams.height / 2 - dp(15)

        if (::orbView.isInitialized && orbView.isAttachedToWindow) {
            safeUpdate(orbView, orbParams)
        }
    }

    private fun setOverlayVisibility(visible: Boolean) {
        if (!::lyricView.isInitialized || !::orbView.isInitialized) return

        if (!visible && editMode) {
            editMode = false
            lyricParams.flags = lockedFlags()
            lyricView.setEditMode(false)
            orbView.active = false
            safeUpdate(lyricView, lyricParams)
            handler.removeCallbacks(autoLock)
        }

        val state = if (visible) View.VISIBLE else View.INVISIBLE
        lyricView.visibility = state
        orbView.visibility = state
    }

    private fun applyVisualSettings() {
        if (::lyricView.isInitialized) {
            lyricView.reloadSettings()
            lyricParams.alpha = prefs.opacity
            safeUpdate(lyricView, lyricParams)
        }
        if (::orbView.isInitialized) {
            orbView.accent = accentForTheme()
            orbView.active = editMode
        }
    }

    private fun accentForTheme(): Int = when (prefs.theme) {
        "prism" -> Color.rgb(233,110,255)
        "ember" -> Color.rgb(255,82,106)
        "mint" -> Color.rgb(93,255,208)
        "mono" -> Color.WHITE
        else -> Color.rgb(199,106,255)
    }

    private fun safeUpdate(view: android.view.View, params: WindowManager.LayoutParams) {
        try { wm.updateViewLayout(view, params) } catch (_: Throwable) {}
    }

    private fun hasPlayingSession(): Boolean {
        return try {
            currentController()?.playbackState?.state == PlaybackState.STATE_PLAYING
        } catch (_: Throwable) { false }
    }

    private fun currentController(): MediaController? {
        return try {
            val msm = getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
            val component = ComponentName(this, NotificationAccessService::class.java)
            val sessions = msm.getActiveSessions(component)
            sessions.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING }
                ?: sessions.firstOrNull()
        } catch (_: SecurityException) {
            null
        } catch (_: Throwable) {
            null
        }
    }

    private fun updateMedia() {
        if (!::lyricView.isInitialized) return
        val controller = currentController()
        if (controller == null) {
            activeTitle = ""
            activeArtist = ""
            activeKey = ""
            activeLines = emptyList()
            lyricView.updatePlayback("", "", emptyList(), 0L, false)
            return
        }

        val metadata = controller.metadata
        val title = (
            metadata?.getString(android.media.MediaMetadata.METADATA_KEY_TITLE)
                ?: metadata?.getString(android.media.MediaMetadata.METADATA_KEY_DISPLAY_TITLE)
                ?: ""
        ).trim()
        val artist = (
            metadata?.getString(android.media.MediaMetadata.METADATA_KEY_ARTIST)
                ?: metadata?.getString(android.media.MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
                ?: metadata?.getString(android.media.MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)
                ?: ""
        ).trim()

        val state = controller.playbackState
        val isPlaying = state?.state == PlaybackState.STATE_PLAYING
        var pos = state?.position ?: 0L
        if (isPlaying && state != null && state.lastPositionUpdateTime > 0) {
            val elapsed = (SystemClock.elapsedRealtime() - state.lastPositionUpdateTime).coerceAtLeast(0L)
            pos += (elapsed * state.playbackSpeed).toLong()
        }

        val key = normalizeKey(title, artist)
        if (key.isNotBlank() && key != activeKey) {
            activeKey = key
            activeTitle = title
            activeArtist = artist
            activeLines = synchronized(lyricsCache) { lyricsCache[key] ?: emptyList() }
            if (activeLines.isEmpty()) fetchLyrics(title, artist, key)
        }

        lyricView.updatePlayback(title, artist, activeLines, pos, isPlaying)
    }

    private fun normalizeKey(title: String, artist: String): String {
        if (title.isBlank()) return ""
        return (title.lowercase().trim() + "|" + artist.lowercase().trim())
    }

    private fun fetchLyrics(title: String, artist: String, key: String) {
        val generation = ++lyricsGeneration
        Thread {
            val found = try {
                fetchExact(title, artist).ifEmpty { fetchSearch(title, artist) }
            } catch (_: Throwable) {
                emptyList()
            }
            synchronized(lyricsCache) { lyricsCache[key] = found }
            handler.post {
                if (generation == lyricsGeneration && key == activeKey) {
                    activeLines = found
                    updateMedia()
                }
            }
        }.apply { name = "LyricStream-Lyrics"; isDaemon = true }.start()
    }

    private fun fetchExact(title: String, artist: String): List<LyricLine> {
        val qTitle = URLEncoder.encode(title, "UTF-8")
        val qArtist = URLEncoder.encode(artist, "UTF-8")
        val url = URL("https://lrclib.net/api/get?track_name=" + qTitle + "&artist_name=" + qArtist)
        val json = requestJson(url) as? JSONObject ?: return emptyList()
        if (json.isNull("syncedLyrics")) return emptyList()
        val raw = json.optString("syncedLyrics", "")
        return if (raw.isBlank() || raw == "null") emptyList() else LrcParser.parse(raw)
    }

    private fun fetchSearch(title: String, artist: String): List<LyricLine> {
        val qTitle = URLEncoder.encode(title, "UTF-8")
        val qArtist = URLEncoder.encode(artist, "UTF-8")
        val url = URL("https://lrclib.net/api/search?track_name=" + qTitle + "&artist_name=" + qArtist)
        val array = requestJson(url) as? JSONArray ?: return emptyList()
        for (i in 0 until minOf(array.length(), 8)) {
            val item = array.optJSONObject(i) ?: continue
            if (item.isNull("syncedLyrics")) continue
            val raw = item.optString("syncedLyrics", "")
            val parsed = if (raw.isBlank() || raw == "null") emptyList() else LrcParser.parse(raw)
            if (parsed.isNotEmpty()) return parsed
        }
        return emptyList()
    }

    private fun requestJson(url: URL): Any? {
        val conn = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 6500
            readTimeout = 6500
            requestMethod = "GET"
            setRequestProperty("User-Agent", "LyricStream/16 Android")
            setRequestProperty("Accept", "application/json")
        }
        return try {
            val code = conn.responseCode
            if (code !in 200..299) return null
            val text = conn.inputStream.bufferedReader().use { it.readText() }.trim()
            if (text.startsWith("[")) JSONArray(text) else JSONObject(text)
        } finally {
            conn.disconnect()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            val nm = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                CHANNEL_ID,
                "LyricStream overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the lyric HUD alive while you play."
                setShowBadge(false)
            }
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val openPending = PendingIntent.getActivity(
            this, 1, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = Intent(this, OverlayService::class.java).setAction(ACTION_STOP)
        val stopPending = PendingIntent.getService(
            this, 2, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("LyricStream")
            .setContentText("Luminous HUD aktif")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(openPending)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Durdur", stopPending)
            .build()
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).roundToInt()

    override fun onDestroy() {
        running = false
        handler.removeCallbacksAndMessages(null)
        try { unregisterReceiver(settingsReceiver) } catch (_: Throwable) {}
        if (::lyricView.isInitialized) try { wm.removeView(lyricView) } catch (_: Throwable) {}
        if (::orbView.isInitialized) try { wm.removeView(orbView) } catch (_: Throwable) {}
        super.onDestroy()
    }
}
