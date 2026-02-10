package com.hedui.pda

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val SCAN_ACTION = "android.intent.action.RECEIVE_SCANDATA_BROADCAST"
    private val SCAN_EXTRA = "android.intent.extra.SCAN_BROADCAST_DATA"

    private val scanReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == SCAN_ACTION) {
                val code = intent.getStringExtra(SCAN_EXTRA)
                if (!code.isNullOrEmpty()) {
                    injectScan(code)
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
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
        val filter = IntentFilter(SCAN_ACTION)
        registerReceiver(scanReceiver, filter) // Note: flag not needed for simple dynamic receiver in this context, but adhere to newer API if needed. Default is fine for local.
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(scanReceiver)
    }

    private fun injectScan(code: String) {
        // Sanitize code to prevent JS injection if necessary, though simpler is better here for internal use
        val safeCode = code.replace("'", "\\'")
        val js = "if(window.scannerLabel && window.scannerLabel.onScan) { window.scannerLabel.onScan('$safeCode'); }"
        
        runOnUiThread {
            webView.evaluateJavascript(js, null)
        }
    }
}
