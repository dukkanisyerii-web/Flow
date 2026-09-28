package com.example.lyricstream

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        @Volatile
        var isForeground: Boolean = false
            private set
    }

    private val channelName = "lyricstream/overlay"

    override fun onStart() {
        super.onStart()
        isForeground = true
        publishAppVisibility(true)
    }

    override fun onStop() {
        isForeground = false
        publishAppVisibility(false)
        super.onStop()
    }

    private fun publishAppVisibility(visible: Boolean) {
        sendBroadcast(
            Intent(OverlayService.ACTION_APP_VISIBILITY)
                .setPackage(packageName)
                .putExtra(OverlayService.EXTRA_APP_VISIBLE, visible)
        )
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            channelName
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "requestOverlayPermission" -> {
                    if (!Settings.canDrawOverlays(this)) {
                        startActivity(
                            Intent(
                                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                Uri.parse("package:$packageName")
                            )
                        )
                    }
                    result.success(true)
                }

                "openNotificationAccess" -> {
                    startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                    result.success(true)
                }

                "startOverlay" -> {
                    if (!Settings.canDrawOverlays(this)) {
                        result.error(
                            "NO_OVERLAY_PERMISSION",
                            "Overlay permission is required",
                            null
                        )
                    } else {
                        OverlayService.start(this)
                        result.success(true)
                    }
                }

                "stopOverlay" -> {
                    stopService(Intent(this, OverlayService::class.java))
                    result.success(true)
                }

                "isOverlayRunning" -> result.success(OverlayService.running)

                "updateSettings" -> {
                    @Suppress("UNCHECKED_CAST")
                    val args = call.arguments as? Map<String, Any?> ?: emptyMap()
                    OverlayPrefs(this).applyFrom(args)
                    sendBroadcast(
                        Intent(OverlayService.ACTION_SETTINGS_CHANGED)
                            .setPackage(packageName)
                    )
                    result.success(true)
                }

                else -> result.notImplemented()
            }
        }
    }
}
