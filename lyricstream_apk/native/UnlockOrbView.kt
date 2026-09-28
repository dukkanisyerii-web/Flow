package com.example.lyricstream

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.view.MotionEvent
import android.view.View
import kotlin.math.hypot

class UnlockOrbView(
    context: Context,
    private val onTap: () -> Unit
) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var downX = 0f
    private var downY = 0f
    private var moved = false
    var accent = Color.rgb(201, 103, 255)
        set(value) { field = value; invalidate() }

    init {
        isClickable = true
        contentDescription = "LyricStream overlay control"
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val cy = height / 2f
        val glow = width * .34f
        paint.shader = RadialGradient(
            cx, cy, glow,
            intArrayOf(Color.WHITE, accent, Color.argb(0, Color.red(accent), Color.green(accent), Color.blue(accent))),
            floatArrayOf(0f, .23f, 1f),
            Shader.TileMode.CLAMP
        )
        canvas.drawCircle(cx, cy, glow, paint)
        paint.shader = null
        paint.color = Color.WHITE
        canvas.drawCircle(cx, cy, width * .047f, paint)
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
                if (hypot((event.x - downX).toDouble(), (event.y - downY).toDouble()) > 12.0) moved = true
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
