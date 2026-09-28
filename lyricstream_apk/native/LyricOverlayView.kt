package com.example.lyricstream

import android.content.Context
import android.graphics.BlurMaskFilter
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
    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    private var prefs = OverlayPrefs(context)
    private var lines: List<LyricLine> = emptyList()
    private var positionMs: Long = 0L
    private var playing = false
    private var title: String = ""
    private var artist: String = ""
    private var currentIndex = -1
    private var previousIndex = -1
    private var transitionStarted = 0L
    private var editMode = false

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

    private fun palette(): IntArray {
        return when (prefs.theme) {
            "prism" -> intArrayOf(Color.rgb(105,167,255), Color.rgb(233,110,255), Color.rgb(255,200,97))
            "ember" -> intArrayOf(Color.rgb(255,166,78), Color.rgb(255,82,106), Color.rgb(209,62,255))
            "mint" -> intArrayOf(Color.rgb(93,255,208), Color.rgb(93,199,255), Color.rgb(165,120,255))
            "mono" -> intArrayOf(Color.WHITE, Color.rgb(221,226,240), Color.rgb(140,149,170))
            else -> intArrayOf(Color.rgb(85,230,255), Color.rgb(199,106,255), Color.rgb(255,101,165))
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (width <= 0 || height <= 0) return

        val colors = palette()
        val cx = width * .50f
        val cy = height * .52f
        val strength = prefs.strength.coerceIn(.1f, 1f)
        val spread = prefs.spread.coerceIn(.15f, 1f)
        val radius = width * (.24f + spread * .31f)

        drawAura(canvas, cx, cy, radius, colors, strength)
        drawParticles(canvas, cx, cy, radius, colors, strength)

        if (lines.isEmpty() || currentIndex < 0) {
            drawIdle(canvas, colors, cx, cy)
        } else {
            drawLyrics(canvas, colors, cx, cy)
        }

        if (editMode) drawEditBounds(canvas, colors[1])
    }

    private fun drawAura(
        canvas: Canvas,
        cx: Float,
        cy: Float,
        radius: Float,
        colors: IntArray,
        strength: Float
    ) {
        val primaryAlpha = (52 * strength).toInt().coerceIn(0, 70)
        val secondaryAlpha = (28 * strength).toInt().coerceIn(0, 48)
        val tertiaryAlpha = (17 * strength).toInt().coerceIn(0, 34)

        val c1 = Color.argb(primaryAlpha, Color.red(colors[1]), Color.green(colors[1]), Color.blue(colors[1]))
        val c2 = Color.argb(secondaryAlpha, Color.red(colors[2]), Color.green(colors[2]), Color.blue(colors[2]))
        val c3 = Color.argb(tertiaryAlpha, Color.red(colors[0]), Color.green(colors[0]), Color.blue(colors[0]))

        auraPaint.shader = RadialGradient(
            cx, cy, radius,
            intArrayOf(c1, c2, c3, Color.TRANSPARENT),
            floatArrayOf(0f, .34f, .64f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx, cy, radius, auraPaint)

        auraPaint.shader = RadialGradient(
            cx - radius * .18f, cy + radius * .05f, radius * .56f,
            intArrayOf(
                Color.argb((22 * strength).toInt(), Color.red(colors[0]), Color.green(colors[0]), Color.blue(colors[0])),
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx - radius * .18f, cy + radius * .05f, radius * .56f, auraPaint)
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
        for (i in 0 until 9) {
            val angle = i * .79f + time * (.11f + i * .005f)
            val r = radius * (.17f + (i % 4) * .075f)
            val x = cx + cos(angle.toDouble()).toFloat() * r
            val y = cy + sin((angle * .71f).toDouble()).toFloat() * r * .42f
            val c = colors[i % colors.size]
            particlePaint.color = Color.argb(
                (22 + 20 * strength).toInt().coerceIn(0, 60),
                Color.red(c), Color.green(c), Color.blue(c)
            )
            canvas.drawCircle(x, y, 1.2f + (i % 3) * .55f, particlePaint)
        }
    }

    private fun drawIdle(canvas: Canvas, colors: IntArray, cx: Float, cy: Float) {
        val headline = if (title.isNotBlank()) title else "LyricStream"
        val sub = when {
            title.isNotBlank() && artist.isNotBlank() -> artist
            title.isNotBlank() -> "Söz aranıyor…"
            else -> "Müziğini aç — sözler burada ışığa dönüşsün"
        }
        drawCentered(
            canvas, headline, cy - 18f,
            24f * prefs.fontScale,
            Color.WHITE, .92f, true, colors
        )
        drawCentered(
            canvas, sub, cy + 26f,
            12.5f * prefs.fontScale,
            Color.WHITE, if (prefs.highContrast) .60f else .34f, false, colors
        )
    }

    private fun drawLyrics(canvas: Canvas, colors: IntArray, cx: Float, cy: Float) {
        val now = SystemClock.uptimeMillis()
        val elapsed = (now - transitionStarted).coerceAtLeast(0L)
        val transition = if (prefs.reduceMotion) 1f else min(1f, elapsed / 420f)
        val eased = 1f - (1f - transition) * (1f - transition)

        val current = lines.getOrNull(currentIndex)?.text ?: ""
        val prev = lines.getOrNull(currentIndex - 1)?.text
        val next = lines.getOrNull(currentIndex + 1)?.text

        if (prev != null) {
            drawCentered(
                canvas, prev, cy - 67f,
                12.2f * prefs.fontScale,
                Color.WHITE, if (prefs.highContrast) .44f else .25f, false, colors
            )
        }

        if (previousIndex >= 0 && previousIndex != currentIndex && transition < 1f) {
            val old = lines.getOrNull(previousIndex)?.text
            if (!old.isNullOrBlank()) {
                drawActiveLayout(
                    canvas, old,
                    cy - eased * 17f,
                    colors,
                    alpha = (1f - eased) * .58f,
                    progress = 1f,
                    blur = 4f + eased * 8f
                )
            }
        }

        val activeAlpha = .34f + eased * .66f
        val y = cy + (1f - eased) * 10f
        val progress = lineProgress()
        drawActiveLayout(
            canvas, current, y, colors,
            alpha = activeAlpha,
            progress = progress,
            blur = (1f - eased) * 8f
        )

        if (next != null) {
            drawCentered(
                canvas, next, cy + 69f,
                12.5f * prefs.fontScale,
                Color.WHITE, if (prefs.highContrast) .50f else .28f, false, colors
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
        blur: Float
    ) {
        val maxWidth = (width * .80f).toInt().coerceAtLeast(40)
        var size = 28f * prefs.fontScale
        var layout = buildLayout(text, size, maxWidth, Color.WHITE, alpha, null, blur, colors[1])

        while (layout.lineCount > 2 && size > 17f * prefs.fontScale) {
            size -= 1.4f
            layout = buildLayout(text, size, maxWidth, Color.WHITE, alpha, null, blur, colors[1])
        }

        val left = (width - layout.width) / 2f
        val top = centerY - layout.height / 2f

        val base = buildLayout(
            text, size, maxWidth,
            Color.argb((76 * alpha).toInt().coerceIn(0,255), 255,255,255),
            alpha, null, blur * .35f, colors[1]
        )
        canvas.save()
        canvas.translate(left, top)
        base.draw(canvas)
        canvas.restore()

        val gradient = LinearGradient(
            0f, 0f, maxWidth.toFloat(), 0f,
            colors, floatArrayOf(0f, .50f, 1f), Shader.TileMode.CLAMP
        )
        val lit = buildLayout(text, size, maxWidth, Color.WHITE, alpha, gradient, blur, colors[1])

        canvas.save()
        canvas.translate(left, top)
        val clipWidth = maxWidth * max(.10f, progress)
        canvas.clipRect(0f, 0f, clipWidth, lit.height.toFloat())
        lit.draw(canvas)
        canvas.restore()
    }

    private fun buildLayout(
        text: String,
        size: Float,
        maxWidth: Int,
        color: Int,
        alpha: Float,
        shader: Shader?,
        blur: Float,
        glowColor: Int
    ): StaticLayout {
        textPaint.reset()
        textPaint.isAntiAlias = true
        textPaint.textSize = size
        textPaint.color = color
        textPaint.alpha = (255 * alpha).toInt().coerceIn(0,255)
        textPaint.isFakeBoldText = true
        textPaint.shader = shader
        if (blur > .3f) {
            textPaint.setShadowLayer(
                12f + blur,
                0f, 0f,
                Color.argb((150 * alpha).toInt().coerceIn(0,190), Color.red(glowColor), Color.green(glowColor), Color.blue(glowColor))
            )
        } else {
            textPaint.clearShadowLayer()
        }

        return StaticLayout.Builder.obtain(text, 0, text.length, textPaint, maxWidth)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setIncludePad(false)
            .setMaxLines(2)
            .setLineSpacing(0f, 1.02f)
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
        dimPaint.alpha = (255 * alpha).toInt().coerceIn(0,255)
        dimPaint.isFakeBoldText = bold
        if (bold) {
            dimPaint.setShadowLayer(12f * prefs.strength, 0f, 0f, Color.argb(90, Color.red(colors[1]), Color.green(colors[1]), Color.blue(colors[1])))
        }
        val maxWidth = (width * .82f).toInt().coerceAtLeast(40)
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

    private fun drawEditBounds(canvas: Canvas, accent: Int) {
        borderPaint.style = Paint.Style.STROKE
        borderPaint.strokeWidth = 1.2f
        borderPaint.color = Color.argb(105, Color.red(accent), Color.green(accent), Color.blue(accent))
        borderPaint.pathEffect = android.graphics.DashPathEffect(floatArrayOf(7f, 8f), 0f)
        val pad = 7f
        canvas.drawRoundRect(pad, pad, width - pad, height - pad, 22f, 22f, borderPaint)
        borderPaint.pathEffect = null
        borderPaint.style = Paint.Style.FILL
        borderPaint.color = Color.argb(145, 255,255,255)
        canvas.drawCircle(width - 17f, height - 17f, 2.2f, borderPaint)
    }
}
