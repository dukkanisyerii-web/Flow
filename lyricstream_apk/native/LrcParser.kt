package com.example.lyricstream

data class LyricLine(val timeMs: Long, val text: String)

object LrcParser {
    private val regex = Regex("""\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?]\s*(.*)""")

    fun parse(raw: String): List<LyricLine> {
        val lines = mutableListOf<LyricLine>()
        raw.lineSequence().forEach { row ->
            val m = regex.find(row) ?: return@forEach
            val min = m.groupValues[1].toLongOrNull() ?: return@forEach
            val sec = m.groupValues[2].toLongOrNull() ?: return@forEach
            val fractionRaw = m.groupValues[3]
            val fraction = when (fractionRaw.length) {
                1 -> (fractionRaw.toLongOrNull() ?: 0L) * 100
                2 -> (fractionRaw.toLongOrNull() ?: 0L) * 10
                3 -> fractionRaw.toLongOrNull() ?: 0L
                else -> 0L
            }
            val text = m.groupValues[4].trim()
            if (text.isNotEmpty()) lines += LyricLine((min * 60 + sec) * 1000 + fraction, text)
        }
        return lines.sortedBy { it.timeMs }
    }
}
