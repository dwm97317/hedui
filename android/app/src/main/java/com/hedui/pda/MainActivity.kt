package com.hedui.pda

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.Bundle
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var prefs: SharedPreferences
    
    private var scanAction = "android.intent.action.RECEIVE_SCANDATA_BROADCAST"
    private var scanExtra = "android.intent.extra.SCAN_BROADCAST_DATA"

    private val scanReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == scanAction) {
                val code = intent.getStringExtra(scanExtra)
                if (!code.isNullOrEmpty()) {
                    injectScan(code)
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        prefs = getSharedPreferences("pda_config", Context.MODE_PRIVATE)
        scanAction = prefs.getString("scan_action", scanAction) ?: scanAction
        scanExtra = prefs.getString("scan_extra", scanExtra) ?: scanExtra

        webView = WebView(this)
        setContentView(webView)

        // Configure WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Add Javascript Interface
        webView.addJavascriptInterface(WebAppInterface(), "Android")

        // Enable Console Logs in Logcat
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                android.util.Log.d("WebView", consoleMessage.message())
                return true
            }
        }

        webView.webViewClient = WebViewClient()

        // Load the React App (bundled in assets)
        webView.loadUrl("file:///android_asset/index.html")

        // Register Scanner Broadcast
        registerScanner()
    }

    private fun registerScanner() {
        try {
            val filter = IntentFilter(scanAction)
            registerReceiver(scanReceiver, filter)
            android.util.Log.d("PDA", "Scanner registered with Action: $scanAction")
        } catch (e: Exception) {
            android.util.Log.e("PDA", "Failed to register scanner: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(scanReceiver)
        } catch (e: Exception) {}
    }

    override fun onBackPressed() {
        val js = "if(window.handleAndroidBack && typeof window.handleAndroidBack === 'function') { window.handleAndroidBack(); } else { window.history.back(); }"
        webView.evaluateJavascript(js, null)
    }

    private fun injectScan(code: String) {
        val safeCode = code.replace("'", "\\'")
        val js = "if(window.scannerLabel && typeof window.scannerLabel.onScan === 'function') { window.scannerLabel.onScan('$safeCode'); }"
        
        runOnUiThread {
            webView.evaluateJavascript(js, null)
        }
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun updateScannerConfig(action: String, extra: String) {
            runOnUiThread {
                try {
                    unregisterReceiver(scanReceiver)
                } catch (e: Exception) {}
                
                scanAction = action
                scanExtra = extra
                
                prefs.edit().apply {
                    putString("scan_action", action)
                    putString("scan_extra", extra)
                    apply()
                }
                
                registerScanner()
            }
        }

        @JavascriptInterface
        fun getScannerConfig(): String {
            return "{\"action\": \"$scanAction\", \"extra\": \"$scanExtra\"}"
        }
        
        @JavascriptInterface
        fun toast(message: String) {
             android.widget.Toast.makeText(this@MainActivity, message, android.widget.Toast.LENGTH_SHORT).show()
        }

        @JavascriptInterface
        fun saveFile(base64Data: String, fileName: String, mimeType: String) {
            try {
                // Remove base64 header if present
                val pureBase64 = if (base64Data.contains(",")) base64Data.split(",")[1] else base64Data
                val bytes = android.util.Base64.decode(pureBase64, android.util.Base64.DEFAULT)
                
                val resolver = contentResolver
                val contentValues = android.content.ContentValues().apply {
                    put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                        put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                    }
                }

                val collection = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI
                } else {
                    // Fallback for older versions if needed, but MediaStore.Files is safer
                    android.provider.MediaStore.Files.getContentUri("external")
                }

                val uri = resolver.insert(collection, contentValues)
                uri?.let {
                    resolver.openOutputStream(it)?.use { outputStream ->
                        outputStream.write(bytes)
                    }
                    runOnUiThread {
                        android.widget.Toast.makeText(this@MainActivity, "文件已保存到下载目录: $fileName", android.widget.Toast.LENGTH_LONG).show()
                    }
                } ?: throw Exception("Failed to create MediaStore entry")
                
            } catch (e: Exception) {
                android.util.Log.e("WebView", "Save file failed", e)
                runOnUiThread {
                    android.widget.Toast.makeText(this@MainActivity, "保存失败: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
