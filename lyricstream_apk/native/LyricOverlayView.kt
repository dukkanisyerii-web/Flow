package com.example.lyricstream

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.os.SystemClock
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.view.View
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

class LyricOverlayView(context: Context) : View(context) {
    private val auraPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val particlePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG)
    private val dimPaint = TextPaint(Paint.ANTI_ALIAS_FLAG)

    private var prefs = OverlayPrefs(context)
    private var lines: List<LyricLine> = emptyList()
    private var positionMs = 0L
    private var playing = false
    private var title = ""
    private var artist = ""
    private var currentIndex = -1
    private var previousIndex = -1
    private var transitionStarted = 0L

    private val density get() = resources.displayMetrics.density
    private val scaledDensity get() = resources.displayMetrics.scaledDensity
    private fun dp(v: Float) = v * density
    private fun sp(v: Float) = v * scaledDensity
    private val landscape: Boolean
        get() = resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    init {
        setLayerType(LAYER_TYPE_SOFTWARE, null)
        isFocusable = false
        isClickable = false
        setBackgroundColor(Color.TRANSPARENT)
    }

    fun reloadSettings() {
        prefs = OverlayPrefs(context)
        alpha = prefs.opacity
        invalidate()
    }

    fun setEditMode(enabled: Boolean) {
        // Pure Aura mode is intentionally frame-free.
        // Edit mode changes input handling in OverlayService only.
        invalidate()
    }

    fun updatePlayback(
        newTitle: String,
        newArtist: String,
        newLines: List<LyricLine>,
        newPositionMs: Long,
        isPlaying: Boolean
    ) {
        title = newTitle
        artist = newArtist
        lines = newLines
        positionMs = newPositionMs + prefs.syncMs
        playing = isPlaying

        val idx = indexFor(positionMs)
        if (idx != currentIndex) {
            previousIndex = currentIndex
            currentIndex = idx
            transitionStarted = SystemClock.uptimeMillis()
        }
        invalidate()
    }

    private fun indexFor(pos: Long): Int {
        if (lines.isEmpty()) return -1
        var lo = 0
        var hi = lines.lastIndex
        var result = -1
        while (lo <= hi) {
            val mid = (lo + hi) ushr 1
            if (lines[mid].timeMs <= pos) {
                result = mid
                lo = mid + 1
            } else {
                hi = mid - 1
            }
        }
        return result
    }

    private fun palette(): IntArray = when (prefs.theme) {
        "prism" -> intArrayOf(Color.rgb(104, 171, 255), Color.rgb(232, 111, 255), Color.rgb(255, 198, 95))
        "ember" -> intArrayOf(Color.rgb(255, 171, 82), Color.rgb(255, 84, 111), Color.rgb(210, 68, 255))
        "mint" -> intArrayOf(Color.rgb(91, 255, 211), Color.rgb(92, 201, 255), Color.rgb(163, 122, 255))
        "mono" -> intArrayOf(Color.WHITE, Color.rgb(222, 227, 239), Color.rgb(150, 157, 176))
        else -> intArrayOf(Color.rgb(87, 230, 255), Color.rgb(200, 107, 255), Color.rgb(255, 103, 169))
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (width <= 0 || height <= 0) return

        val colors = palette()
        val cx = width * .50f
        val cy = height * .51f
        val strength = prefs.strength.coerceIn(.1f, 1f)
        val spread = prefs.spread.coerceIn(.15f, 1f)

        drawLocalLight(canvas, cx, cy, colors, strength, spread)
        drawParticles(canvas, cx, cy, colors, strength, spread)

        if (lines.isEmpty() || currentIndex < 0) {
            drawIdle(canvas, colors, cy)
        } else {
            drawLyrics(canvas, colors, cy)
        }
    }

    private fun drawLocalLight(
        canvas: Canvas,
        cx: Float,
        cy: Float,
        colors: IntArray,
        strength: Float,
        spread: Float
    ) {
        fun argb(alpha: Int, color: Int) = Color.argb(
            alpha.coerceIn(0, 255),
            Color.red(color), Color.green(color), Color.blue(color)
        )

        val base = if (landscape) {
            min(width * .145f, dp(84f)) * (.82f + spread * .32f)
        } else {
            min(width * .22f, dp(96f)) * (.82f + spread * .36f)
        }

        // Three small feathered light clouds. None reaches the overlay bounds,
        // so there is no visible panel, edge, rectangle, or clipped light wall.
        val lobes = arrayOf(
            Triple(cx - base * .34f, cy + dp(1f), colors[0]),
            Triple(cx + base * .05f, cy - dp(2f), colors[1]),
            Triple(cx + base * .34f, cy + dp(3f), colors[2]),
        )

        for ((index, lobe) in lobes.withIndex()) {
            val lx = lobe.first
            val ly = lobe.second
            val color = lobe.third
            val radius = base * when (index) {
                0 -> .90f
                1 -> 1.08f
                else -> .88f
            }

            canvas.save()
            canvas.translate(lx, ly)
            canvas.scale(1f, if (landscape) .30f + spread * .06f else .34f + spread * .08f)

            auraPaint.shader = RadialGradient(
                0f,
                0f,
                radius,
                intArrayOf(
                    argb((68 * strength).toInt(), color),
                    argb((34 * strength).toInt(), color),
                    argb((10 * strength).toInt(), color),
                    Color.TRANSPARENT,
                ),
                floatArrayOf(0f, .30f, .65f, 1f),
                Shader.TileMode.CLAMP
            )
            canvas.drawCircle(0f, 0f, radius, auraPaint)
            canvas.restore()
        }

        auraPaint.shader = null
    }

    private fun drawParticles(
        canvas: Canvas,
        cx: Float,
        cy: Float,
        colors: IntArray,
        strength: Float,
        spread: Float
    ) {
        if (prefs.reduceMotion) return
        val time = SystemClock.uptimeMillis() / 1000f
        val orbit = min(
            width * if (landscape) .11f else .17f,
            dp(if (landscape) 64f else 78f)
        ) * (.85f + spread * .2f)

        for (i in 0 until 5) {
            val angle = i * 1.26f + time * (.07f + i * .004f)
            val r = orbit * (.52f + (i % 3) * .16f)
            val x = cx + cos(angle.toDouble()).toFloat() * r
            val y = cy + sin((angle * .72f).toDouble()).toFloat() * r * .27f
            val c = colors[i % colors.size]

            particlePaint.color = Color.argb(
                (12 + 17 * strength).toInt().coerceIn(0, 36),
                Color.red(c), Color.green(c), Color.blue(c)
            )
            canvas.drawCircle(x, y, dp(.38f + (i % 2) * .16f), particlePaint)
        }
    }

    private fun drawIdle(canvas: Canvas, colors: IntArray, cy: Float) {
        val headline = if (title.isNotBlank()) title else "LyricStream"
        val sub = when {
            title.isNotBlank() && artist.isNotBlank() -> artist
            title.isNotBlank() -> "Söz aranıyor…"
            else -> "Müziğini aç"
        }

        drawCentered(
            canvas = canvas,
            text = headline,
            y = cy - dp(8f),
            size = sp((if (landscape) 17.5f else 21f) * prefs.fontScale),
            color = Color.rgb(251, 249, 255),
            alpha = .96f,
            bold = true,
            glowColor = colors[1],
            glow = dp(7f) * prefs.strength
        )
        drawCentered(
            canvas = canvas,
            text = sub,
            y = cy + dp(if (landscape) 18f else 23f),
            size = sp((if (landscape) 10.5f else 11.5f) * prefs.fontScale),
            color = Color.WHITE,
            alpha = if (prefs.highContrast) .66f else .40f,
            bold = false,
            glowColor = colors[1],
            glow = 0f
        )
    }

    private fun drawLyrics(canvas: Canvas, colors: IntArray, cy: Float) {
        val elapsed = (SystemClock.uptimeMillis() - transitionStarted).coerceAtLeast(0L)
        val transition = if (prefs.reduceMotion) 1f else min(1f, elapsed / 420f)
        val eased = 1f - (1f - transition) * (1f - transition)

        val current = lines.getOrNull(currentIndex)?.text ?: ""
        val prev = lines.getOrNull(currentIndex - 1)?.text
        val next = lines.getOrNull(currentIndex + 1)?.text

        if (prev != null) {
            drawCentered(
                canvas = canvas,
                text = prev,
                y = cy - dp(if (landscape) 37f else 54f),
                size = sp((if (landscape) 12.4f else 15.8f) * prefs.fontScale),
                color = Color.WHITE,
                alpha = if (prefs.highContrast) .50f else .35f,
                bold = false,
                glowColor = colors[1],
                glow = 0f
            )
        }

        if (previousIndex >= 0 && previousIndex != currentIndex && transition < 1f) {
            val old = lines.getOrNull(previousIndex)?.text
            if (!old.isNullOrBlank()) {
                drawActive(
                    canvas = canvas,
                    text = old,
                    centerY = cy - eased * dp(13f),
                    colors = colors,
                    alpha = (1f - eased) * .42f,
                    progress = 1f,
                    transitionBlur = dp(2.5f + eased * 2.8f)
                )
            }
        }

        drawActive(
            canvas = canvas,
            text = current,
            centerY = cy + (1f - eased) * dp(5f),
            colors = colors,
            alpha = .48f + eased * .52f,
            progress = lineProgress(),
            transitionBlur = (1f - eased) * dp(2.2f)
        )

        if (next != null) {
            drawCentered(
                canvas = canvas,
                text = next,
                y = cy + dp(if (landscape) 38f else 55f),
                size = sp((if (landscape) 12.2f else 15.4f) * prefs.fontScale),
                color = Color.WHITE,
                alpha = if (prefs.highContrast) .45f else .29f,
                bold = false,
                glowColor = colors[1],
                glow = 0f
            )
        }

        if (playing && !prefs.reduceMotion) postInvalidateOnAnimation()
    }

    private fun lineProgress(): Float {
        if (currentIndex < 0 || lines.isEmpty()) return 1f
        val start = lines[currentIndex].timeMs
        val end = lines.getOrNull(currentIndex + 1)?.timeMs ?: (start + 4500L)
        if (end <= start) return 1f

        return ((positionMs - start).toFloat() / (end - start).toFloat())
            .coerceIn(0f, 1f)
    }

    private fun drawActive(
        canvas: Canvas,
        text: String,
        centerY: Float,
        colors: IntArray,
        alpha: Float,
        progress: Float,
        transitionBlur: Float
    ) {
        // Generous invisible margins prevent glyph glow from ever touching
        // the window edges and revealing the overlay rectangle.
        val maxWidth = (
            width * if (landscape) .62f else .74f
        ).toInt().coerceAtLeast(120)
        var size = sp((if (landscape) 24.5f else 30.5f) * prefs.fontScale)
        val minSize = sp((if (landscape) 17.5f else 19.5f) * prefs.fontScale)

        var measurement = makeLayout(
            text, size, maxWidth, Color.WHITE, 1f,
            null, 0f, colors[1], false
        )

        while (measurement.lineCount > 2 && size > minSize) {
            size -= sp(1.0f)
            measurement = makeLayout(
                text, size, maxWidth, Color.WHITE, 1f,
                null, 0f, colors[1], false
            )
        }

        val left = (width - maxWidth) / 2f
        val top = centerY - measurement.height / 2f

        val colorFlow = LinearGradient(
            0f,
            0f,
            maxWidth.toFloat(),
            0f,
            colors,
            floatArrayOf(0f, .50f, 1f),
            Shader.TileMode.CLAMP
        )

        // Distant bloom: wide, low-alpha, follows glyphs.
        val bloom = makeLayout(
            text,
            size,
            maxWidth,
            Color.WHITE,
            (if (landscape) .36f else .32f) * alpha,
            colorFlow,
            dp(if (landscape) 11f else 15f) + transitionBlur,
            colors[1],
            true
        )
        canvas.save()
        canvas.translate(left, top)
        bloom.draw(canvas)
        canvas.restore()

        // Mid glow: brighter but still only around letters.
        val midGlow = makeLayout(
            text,
            size,
            maxWidth,
            Color.WHITE,
            (if (landscape) .52f else .47f) * alpha,
            colorFlow,
            dp(if (landscape) 5.8f else 7f) + transitionBlur * .55f,
            colors[1],
            true
        )
        canvas.save()
        canvas.translate(left, top)
        midGlow.draw(canvas)
        canvas.restore()

        // Soft contrast shadow keeps white text readable on bright game UI
        // without creating a stroke or visible container.
        val contrast = makeLayout(
            text,
            size,
            maxWidth,
            Color.WHITE,
            .16f * alpha,
            null,
            dp(if (landscape) 2.2f else 2.8f),
            Color.BLACK,
            false
        )
        canvas.save()
        canvas.translate(left, top + dp(.6f))
        contrast.draw(canvas)
        canvas.restore()

        // Main core: almost white, so it looks like illuminated typography
        // instead of a fully neon-colored font.
        val core = makeLayout(
            text,
            size,
            maxWidth,
            if (prefs.highContrast) Color.WHITE else Color.rgb(252, 249, 255),
            .98f * alpha,
            null,
            transitionBlur * .22f,
            colors[1],
            false
        )
        canvas.save()
        canvas.translate(left, top)
        core.draw(canvas)
        canvas.restore()

        // Karaoke shimmer: a restrained colored pass through the white core.
        val shimmer = makeLayout(
            text,
            size,
            maxWidth,
            Color.WHITE,
            .23f * alpha,
            colorFlow,
            dp(2.2f),
            colors[1],
            true
        )
        canvas.save()
        canvas.translate(left, top)
        val clipWidth = maxWidth * max(.04f, progress)
        canvas.clipRect(0f, -dp(22f), clipWidth, shimmer.height + dp(44f))
        shimmer.draw(canvas)
        canvas.restore()
    }

    private fun makeLayout(
        text: String,
        size: Float,
        maxWidth: Int,
        color: Int,
        alpha: Float,
        shader: Shader?,
        glowRadius: Float,
        glowColor: Int,
        luminous: Boolean
    ): StaticLayout {
        textPaint.reset()
        textPaint.isAntiAlias = true
        textPaint.textSize = size
        textPaint.color = color
        textPaint.alpha = (255 * alpha).toInt().coerceIn(0, 255)
        textPaint.isFakeBoldText = true
        textPaint.shader = shader

        if (glowRadius > .2f) {
            val shadowAlpha = if (luminous) {
                (148 * alpha).toInt().coerceIn(0, 170)
            } else {
                (58 * alpha).toInt().coerceIn(0, 76)
            }
            textPaint.setShadowLayer(
                glowRadius,
                0f,
                0f,
                Color.argb(
                    shadowAlpha,
                    Color.red(glowColor),
                    Color.green(glowColor),
                    Color.blue(glowColor)
                )
            )
        } else {
            textPaint.clearShadowLayer()
        }

        return StaticLayout.Builder.obtain(text, 0, text.length, textPaint, maxWidth)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setIncludePad(false)
            .setMaxLines(2)
            .setLineSpacing(0f, 1.01f)
            .build()
    }

    private fun drawCentered(
        canvas: Canvas,
        text: String,
        y: Float,
        size: Float,
        color: Int,
        alpha: Float,
        bold: Boolean,
        glowColor: Int,
        glow: Float
    ) {
        dimPaint.reset()
        dimPaint.isAntiAlias = true
        dimPaint.textSize = size
        dimPaint.color = color
        dimPaint.alpha = (255 * alpha).toInt().coerceIn(0, 255)
        dimPaint.isFakeBoldText = bold

        if (glow > .2f) {
            dimPaint.setShadowLayer(
                glow,
                0f,
                0f,
                Color.argb(
                    (90 * alpha).toInt().coerceIn(0, 110),
                    Color.red(glowColor),
                    Color.green(glowColor),
                    Color.blue(glowColor)
                )
            )
        } else {
            dimPaint.clearShadowLayer()
        }

        val maxWidth = (
            width * if (landscape) .66f else .78f
        ).toInt().coerceAtLeast(120)
        val layout = StaticLayout.Builder.obtain(text, 0, text.length, dimPaint, maxWidth)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setIncludePad(false)
            .setMaxLines(2)
            .build()

        canvas.save()
        canvas.translate((width - maxWidth) / 2f, y - layout.height / 2f)
        layout.draw(canvas)
        canvas.restore()
    }
}
