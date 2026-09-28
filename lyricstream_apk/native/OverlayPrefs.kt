package com.example.lyricstream

import android.content.Context

class OverlayPrefs(context: Context) {
    private val p = context.getSharedPreferences("lyricstream_overlay", Context.MODE_PRIVATE)

    var strength: Float
        get() = p.getFloat("strength", .78f)
        set(v) = p.edit().putFloat("strength", v).apply()

    var spread: Float
        get() = p.getFloat("spread", .62f)
        set(v) = p.edit().putFloat("spread", v).apply()

    var fontScale: Float
        get() = p.getFloat("fontScale", 1f)
        set(v) = p.edit().putFloat("fontScale", v).apply()

    var opacity: Float
        get() = p.getFloat("opacity", .98f)
        set(v) = p.edit().putFloat("opacity", v).apply()

    var syncMs: Long
        get() = p.getLong("syncMs", 0L)
        set(v) = p.edit().putLong("syncMs", v).apply()

    var reduceMotion: Boolean
        get() = p.getBoolean("reduceMotion", false)
        set(v) = p.edit().putBoolean("reduceMotion", v).apply()

    var highContrast: Boolean
        get() = p.getBoolean("highContrast", false)
        set(v) = p.edit().putBoolean("highContrast", v).apply()

    var theme: String
        get() = p.getString("theme", "aurora") ?: "aurora"
        set(v) = p.edit().putString("theme", v).apply()

    fun positionX(landscape: Boolean): Int {
        val key = if (landscape) "overlayX_landscape" else "overlayX_portrait"
        if (p.contains(key)) return p.getInt(key, 0)
        return if (!landscape) p.getInt("overlayX", 0) else 0
    }

    fun positionY(landscape: Boolean): Int {
        val key = if (landscape) "overlayY_landscape" else "overlayY_portrait"
        if (p.contains(key)) return p.getInt(key, -1)
        return if (!landscape) p.getInt("overlayY", -1) else -1
    }

    fun savePosition(landscape: Boolean, x: Int, y: Int) {
        val xKey = if (landscape) "overlayX_landscape" else "overlayX_portrait"
        val yKey = if (landscape) "overlayY_landscape" else "overlayY_portrait"
        p.edit().putInt(xKey, x).putInt(yKey, y).apply()
    }

    fun applyFrom(args: Map<String, Any?>) {
        val e = p.edit()
        (args["strength"] as? Number)?.toFloat()?.let {
            e.putFloat("strength", it.coerceIn(.1f, 1f))
        }
        (args["spread"] as? Number)?.toFloat()?.let {
            e.putFloat("spread", it.coerceIn(.15f, 1f))
        }
        (args["fontScale"] as? Number)?.toFloat()?.let {
            e.putFloat("fontScale", it.coerceIn(.7f, 1.5f))
        }
        (args["opacity"] as? Number)?.toFloat()?.let {
            e.putFloat("opacity", it.coerceIn(.35f, 1f))
        }
        (args["syncMs"] as? Number)?.toLong()?.let {
            e.putLong("syncMs", it.coerceIn(-5000, 5000))
        }
        (args["reduceMotion"] as? Boolean)?.let { e.putBoolean("reduceMotion", it) }
        (args["highContrast"] as? Boolean)?.let { e.putBoolean("highContrast", it) }
        (args["theme"] as? String)?.let { e.putString("theme", it) }
        e.apply()
    }
}
