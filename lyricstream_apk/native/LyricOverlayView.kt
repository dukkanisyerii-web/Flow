package com.example.lyricstream

import android.content.Context
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
    private val editPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    private var prefs = OverlayPrefs(context)
    private var lines: List<LyricLine> = emptyList()
    private var positionMs = 0L
    private var playing = false
    private var title = ""
    private var artist = ""
    private var currentIndex = -1
    private var previousIndex = -1
    private var transitionStarted = 0L
    private var editMode = false

    private val density get() = resources.displayMetrics.density
    private val scaledDensity get() = resources.displayMetrics.scaledDensity
    private fun dp(v: Float) = v * density
    private fun sp(v: Float) = v * scaledDensity

    init {
        setLayerType(LAYER_TYPE_SOFTWARE, null)
        isFocusable = false
        isClickable = false
    }

    fun reloadSettings() {
        prefs = OverlayPrefs(context)
        alpha = prefs.opacity
        invalidate()
    }

    fun setEditMode(enabled: Boolean) {
        editMode = enabled
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
        "prism" -> intArrayOf(Color.rgb(105, 167, 255), Color.rgb(233, 110, 255), Color.rgb(255, 200, 97))
        "ember" -> intArrayOf(Color.rgb(255, 166, 78), Color.rgb(255, 82, 106), Color.rgb(209, 62, 255))
        "mint" -> intArrayOf(Color.rgb(93, 255, 208), Color.rgb(93, 199, 255), Color.rgb(165, 120, 255))
        "mono" -> intArrayOf(Color.WHITE, Color.rgb(221, 226, 240), Color.rgb(140, 149, 170))
        else -> intArrayOf(Color.rgb(85, 230, 255), Color.rgb(199, 106, 255), Color.rgb(255, 101, 165))
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (width <= 0 || height <= 0) return

        val colors = palette()
        val cx = width * .52f
        val cy = height * .52f
        val strength = prefs.strength.coerceIn(.1f, 1f)
        val spread = prefs.spread.coerceIn(.15f, 1f)
        val radius = width * (.25f + spread * .29f)

        drawAura(canvas, cx, cy, radius, colors, strength)
        drawParticles(canvas, cx, cy, radius, colors, strength)

        if (lines.isEmpty() || currentIndex < 0) drawIdle(canvas, colors, cy)
        else drawLyrics(canvas, colors, cy)

        if (editMode) drawEditCorners(canvas, colors[1])
    }

    private fun drawAura(
        canvas: Canvas,
        cx: Float,
        cy: Float,
        radius: Float,
        colors: IntArray,
        strength: Float
    ) {
        fun argb(alpha: Int, color: Int) = Color.argb(
            alpha.coerceIn(0, 255),
            Color.red(color), Color.green(color), Color.blue(color)
        )

        // Wide, soft and deliberately non-rectangular light field.
        canvas.save()
        canvas.translate(cx, cy)
        canvas.scale(1f, .52f)
        auraPaint.shader = RadialGradient(
            0f, 0f, radius,
            intArrayOf(
                argb((94 * strength).toInt(), colors[1]),
                argb((54 * strength).toInt(), colors[2]),
                argb((27 * strength).toInt(), colors[0]),
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, .28f, .62f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(0f, 0f, radius, auraPaint)
        canvas.restore()

        // Offset cyan/pink lobes keep it from looking like one generic glow.
        val lobeRadius = radius * .62f
        auraPaint.shader = RadialGradient(
            cx - radius * .22f, cy + dp(4f), lobeRadius,
            intArrayOf(argb((42 * strength).toInt(), colors[0]), Color.TRANSPARENT),
            floatArrayOf(0f, 1f), Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx - radius * .22f, cy + dp(4f), lobeRadius, auraPaint)

        auraPaint.shader = RadialGradient(
            cx + radius * .25f, cy - dp(2f), lobeRadius * .92f,
            intArrayOf(argb((38 * strength).toInt(), colors[2]), Color.TRANSPARENT),
            floatArrayOf(0f, 1f), Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx + radius * .25f, cy - dp(2f), lobeRadius * .92f, auraPaint)
        auraPaint.shader = null
    }

    private fun drawParticles(
        canvas: Canvas,
        cx: Float,
        cy: Float,
        radius: Float,
        colors: IntArray,
        strength: Float
    ) {
        if (prefs.reduceMotion) return
        val time = SystemClock.uptimeMillis() / 1000f
        for (i in 0 until 7) {
            val angle = i * .92f + time * (.08f + i * .004f)
            val r = radius * (.18f + (i % 4) * .075f)
            val x = cx + cos(angle.toDouble()).toFloat() * r
            val y = cy + sin((angle * .71f).toDouble()).toFloat() * r * .32f
            val c = colors[i % colors.size]
            particlePaint.color = Color.argb(
                (18 + 23 * strength).toInt().coerceIn(0, 54),
                Color.red(c), Color.green(c), Color.blue(c)
            )
            canvas.drawCircle(x, y, dp(.45f + (i % 2) * .22f), particlePaint)
        }
    }

    private fun drawIdle(canvas: Canvas, colors: IntArray, cy: Float) {
        val headline = if (title.isNotBlank()) title else "LyricStream"
        val sub = when {
            title.isNotBlank() && artist.isNotBlank() -> artist
            title.isNotBlank() -> "Söz aranıyor…"
            else -> "Müziğini aç — sözler burada ışığa dönüşsün"
        }

        drawCentered(
            canvas, headline, cy - dp(9f),
            sp(22f * prefs.fontScale),
            Color.WHITE, .96f, true, colors
        )
        drawCentered(
            canvas, sub, cy + dp(24f),
            sp(11.5f * prefs.fontScale),
            Color.WHITE, if (prefs.highContrast) .68f else .42f, false, colors
        )
    }

    private fun drawLyrics(canvas: Canvas, colors: IntArray, cy: Float) {
        val elapsed = (SystemClock.uptimeMillis() - transitionStarted).coerceAtLeast(0L)
        val transition = if (prefs.reduceMotion) 1f else min(1f, elapsed / 440f)
        val eased = 1f - (1f - transition) * (1f - transition)

        val current = lines.getOrNull(currentIndex)?.text ?: ""
        val prev = lines.getOrNull(currentIndex - 1)?.text
        val next = lines.getOrNull(currentIndex + 1)?.text

        if (prev != null) {
            drawCentered(
                canvas, prev, cy - dp(50f),
                sp(15.5f * prefs.fontScale),
                Color.WHITE,
                if (prefs.highContrast) .48f else .34f,
                false, colors
            )
        }

        if (previousIndex >= 0 && previousIndex != currentIndex && transition < 1f) {
            val old = lines.getOrNull(previousIndex)?.text
            if (!old.isNullOrBlank()) {
                drawActiveLayout(
                    canvas, old,
                    cy - eased * dp(13f),
                    colors,
                    alpha = (1f - eased) * .50f,
                    progress = 1f,
                    transitionBlur = dp(2.5f + eased * 2f)
                )
            }
        }

        val y = cy + (1f - eased) * dp(6f)
        drawActiveLayout(
            canvas, current, y, colors,
            alpha = .46f + eased * .54f,
            progress = lineProgress(),
            transitionBlur = (1f - eased) * dp(2.4f)
        )

        if (next != null) {
            drawCentered(
                canvas, next, cy + dp(52f),
                sp(15f * prefs.fontScale),
                Color.WHITE,
                if (prefs.highContrast) .44f else .29f,
                false, colors
            )
        }

        if (playing && !prefs.reduceMotion) postInvalidateOnAnimation()
    }

    private fun lineProgress(): Float {
        if (currentIndex < 0 || lines.isEmpty()) return 1f
        val start = lines[currentIndex].timeMs
        val end = lines.getOrNull(currentIndex + 1)?.timeMs ?: (start + 4500L)
        if (end <= start) return 1f
        return ((positionMs - start).toFloat() / (end - start).toFloat()).coerceIn(0f, 1f)
    }

    private fun drawActiveLayout(
        canvas: Canvas,
        text: String,
        centerY: Float,
        colors: IntArray,
        alpha: Float,
        progress: Float,
        transitionBlur: Float
    ) {
        val maxWidth = (width * .86f).toInt().coerceAtLeast(80)
        var size = sp(30f * prefs.fontScale)
        val minSize = sp(20f * prefs.fontScale)

        var measurement = buildLayout(text, size, maxWidth, Color.WHITE, 1f, null, 0f, colors[1], false)
        while (measurement.lineCount > 2 && size > minSize) {
            size -= sp(1.15f)
            measurement = buildLayout(text, size, maxWidth, Color.WHITE, 1f, null, 0f, colors[1], false)
        }

        val left = (width - maxWidth) / 2f
        val top = centerY - measurement.height / 2f

        // 1) Colored luminous silhouette. The letters themselves stay mostly white.
        val glowGradient = LinearGradient(
            0f, 0f, maxWidth.toFloat(), 0f,
            colors, floatArrayOf(0f, .50f, 1f), Shader.TileMode.CLAMP
        )
        val glow = buildLayout(
            text, size, maxWidth, Color.WHITE,
            .58f * alpha, glowGradient,
            dp(4.5f) + transitionBlur,
            colors[1], true
        )
        canvas.save()
        canvas.translate(left, top)
        glow.draw(canvas)
        canvas.restore()

        // 2) Stable near-white core = readable on both dark and colorful apps.
        val core = buildLayout(
            text, size, maxWidth,
            if (prefs.highContrast) Color.WHITE else Color.rgb(249, 246, 255),
            .96f * alpha, null,
            transitionBlur * .35f,
            colors[1], false
        )
        canvas.save()
        canvas.translate(left, top)
        core.draw(canvas)
        canvas.restore()

        // 3) Karaoke tint passes through the white core instead of painting the whole line neon.
        val tint = buildLayout(
            text, size, maxWidth, Color.WHITE,
            .30f * alpha, glowGradient,
            dp(1.8f),
            colors[1], true
        )
        canvas.save()
        canvas.translate(left, top)
        val clipWidth = maxWidth * max(.06f, progress)
        canvas.clipRect(0f, 0f, clipWidth, tint.height.toFloat())
        tint.draw(canvas)
        canvas.restore()
    }

    private fun buildLayout(
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

        if (luminous && glowRadius > .2f) {
            textPaint.setShadowLayer(
                glowRadius,
                0f, 0f,
                Color.argb(
                    (160 * alpha).toInt().coerceIn(0, 180),
                    Color.red(glowColor), Color.green(glowColor), Color.blue(glowColor)
                )
            )
        } else if (!luminous && glowRadius > .2f) {
            textPaint.setShadowLayer(
                glowRadius,
                0f, 0f,
                Color.argb(
                    (72 * alpha).toInt().coerceIn(0, 90),
                    Color.red(glowColor), Color.green(glowColor), Color.blue(glowColor)
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
        colors: IntArray
    ) {
        dimPaint.reset()
        dimPaint.isAntiAlias = true
        dimPaint.textSize = size
        dimPaint.color = color
        dimPaint.alpha = (255 * alpha).toInt().coerceIn(0, 255)
        dimPaint.isFakeBoldText = bold
        if (bold) {
            dimPaint.setShadowLayer(
                dp(4f + 4f * prefs.strength),
                0f, 0f,
                Color.argb(92, Color.red(colors[1]), Color.green(colors[1]), Color.blue(colors[1]))
            )
        }

        val maxWidth = (width * .88f).toInt().coerceAtLeast(80)
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

    private fun drawEditCorners(canvas: Canvas, accent: Int) {
        editPaint.style = Paint.Style.STROKE
        editPaint.strokeCap = Paint.Cap.ROUND
        editPaint.strokeWidth = dp(1.25f)
        editPaint.color = Color.argb(150, Color.red(accent), Color.green(accent), Color.blue(accent))

        val p = dp(9f)
        val l = dp(13f)
        // top-left
        canvas.drawLine(p, p, p + l, p, editPaint)
        canvas.drawLine(p, p, p, p + l, editPaint)
        // top-right
        canvas.drawLine(width - p - l, p, width - p, p, editPaint)
        canvas.drawLine(width - p, p, width - p, p + l, editPaint)
        // bottom-left
        canvas.drawLine(p, height - p, p + l, height - p, editPaint)
        canvas.drawLine(p, height - p - l, p, height - p, editPaint)
        // bottom-right
        canvas.drawLine(width - p - l, height - p, width - p, height - p, editPaint)
        canvas.drawLine(width - p, height - p - l, width - p, height - p, editPaint)

        editPaint.style = Paint.Style.FILL
        editPaint.color = Color.argb(185, 255, 255, 255)
        canvas.drawCircle(width - p, height - p, dp(1.4f), editPaint)
    }
}
