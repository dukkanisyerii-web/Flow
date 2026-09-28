package com.example.lyricstream

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import kotlin.math.hypot
import kotlin.math.sin

class UnlockOrbView(
    context: Context,
    private val onTap: () -> Unit
) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var downX = 0f
    private var downY = 0f
    private var moved = false

    var accent = Color.rgb(199, 106, 255)
        set(value) {
            field = value
            invalidate()
        }

    var active = false
        set(value) {
            field = value
            invalidate()
        }

    init {
        isClickable = true
        contentDescription = "LyricStream overlay control"
        setBackgroundColor(Color.TRANSPARENT)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val cx = width / 2f
        val cy = height / 2f
        val pulse = if (active) {
            .92f + .08f * sin(SystemClock.uptimeMillis() / 170.0).toFloat()
        } else {
            1f
        }

        // The view remains a comfortable touch target, but the visible orb
        // is only a tiny light nucleus with no ring, stroke, or edge.
        val halo = width * .205f * pulse
        paint.shader = RadialGradient(
            cx,
            cy,
            halo,
            intArrayOf(
                Color.WHITE,
                accent,
                Color.argb(
                    if (active) 92 else 58,
                    Color.red(accent),
                    Color.green(accent),
                    Color.blue(accent)
                ),
                Color.TRANSPARENT
            ),
            floatArrayOf(0f, .12f, .39f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx, cy, halo, paint)

        paint.shader = null
        paint.color = Color.argb(if (active) 245 else 220, 255, 255, 255)
        canvas.drawCircle(cx, cy, width * .026f, paint)

        if (active) postInvalidateOnAnimation()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                downX = event.x
                downY = event.y
                moved = false
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                if (hypot(
                        (event.x - downX).toDouble(),
                        (event.y - downY).toDouble()
                    ) > 12.0
                ) {
                    moved = true
                }
                return true
            }
            MotionEvent.ACTION_UP -> {
                if (!moved) {
                    performClick()
                    onTap()
                }
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }
}
