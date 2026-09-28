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
            if (intent?.action == ACTION_SETTINGS_CHANGED) applyVisualSettings()
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

        val filter = IntentFilter(ACTION_SETTINGS_CHANGED)
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(settingsReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else @Suppress("DEPRECATION") registerReceiver(settingsReceiver, filter)

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
        val metrics = resources.displayMetrics
        val screenW = metrics.widthPixels
        val overlayW = (screenW * .92f).roundToInt()
        val overlayH = dp(190)
        val defaultX = ((screenW - overlayW) / 2).coerceAtLeast(0)

        lyricView = LyricOverlayView(this)
        lyricParams = WindowManager.LayoutParams(
            overlayW,
            overlayH,
            if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            lockedFlags(),
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = if (prefs.overlayX == 0) defaultX else prefs.overlayX
            y = prefs.overlayY
            alpha = .79f
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
                    val dx = (event.rawX - dragDownRawX).roundToInt()
                    val dy = (event.rawY - dragDownRawY).roundToInt()
                    lyricParams.x = (dragStartX + dx).coerceIn(0, (metrics.widthPixels - lyricParams.width).coerceAtLeast(0))
                    lyricParams.y = (dragStartY + dy).coerceIn(0, (metrics.heightPixels - lyricParams.height).coerceAtLeast(0))
                    safeUpdate(lyricView, lyricParams)
                    updateOrbPosition()
                    scheduleAutoLock()
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    prefs.overlayX = lyricParams.x
                    prefs.overlayY = lyricParams.y
                    scheduleAutoLock()
                    true
                }
                else -> false
            }
        }

        orbView = UnlockOrbView(this) { setEditMode(!editMode) }
        orbView.accent = accentForTheme()
        orbParams = WindowManager.LayoutParams(
            dp(32),
            dp(32),
            if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        wm.addView(lyricView, lyricParams)
        updateOrbPosition()
        wm.addView(orbView, orbParams)
        applyVisualSettings()
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
        lyricParams.alpha = if (enabled) 1f else .79f
        lyricView.setEditMode(enabled)
        safeUpdate(lyricView, lyricParams)
        if (enabled) scheduleAutoLock() else handler.removeCallbacks(autoLock)
    }

    private fun scheduleAutoLock() {
        handler.removeCallbacks(autoLock)
        handler.postDelayed(autoLock, 5000L)
    }

    private fun updateOrbPosition() {
        if (!::orbParams.isInitialized) return
        val left = lyricParams.x
        val desired = left - dp(18)
        orbParams.x = desired.coerceAtLeast(2)
        orbParams.y = lyricParams.y + lyricParams.height / 2 - dp(16)
        if (::orbView.isInitialized && orbView.isAttachedToWindow) safeUpdate(orbView, orbParams)
    }

    private fun applyVisualSettings() {
        if (::lyricView.isInitialized) {
            lyricView.reloadSettings()
            lyricParams.alpha = if (editMode) 1f else .79f
            safeUpdate(lyricView, lyricParams)
        }
        if (::orbView.isInitialized) orbView.accent = accentForTheme()
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
            setRequestProperty("User-Agent", "LyricStream/13 Android")
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
