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
import androidx.lifecycle.lifecycleScope
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import android.net.Uri

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
            allowFileAccessFromFileURLs = true // Critical for file:// protocol ES modules
            allowUniversalAccessFromFileURLs = true // Critical for file:// protocol CORS
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Add Javascript Interface
        webView.addJavascriptInterface(WebAppInterface(), "Android")

        // Enable Console Logs in Logcat and Handle Permissions
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                android.util.Log.d("WebView", consoleMessage.message())
                return true
            }

            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                runOnUiThread {
                    request.grant(request.resources)
                }
            }
        }

        // Check and Request Camera Permission if needed
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            androidx.core.app.ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.CAMERA), 101)
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

        @JavascriptInterface
        fun startDownload(downloadUrl: String, fileName: String) {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val url = URL(downloadUrl)
                    val connection = url.openConnection() as HttpURLConnection
                    connection.connectTimeout = 15000
                    connection.readTimeout = 15000
                    connection.connect()

                    if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                        runOnUiThread {
                            android.widget.Toast.makeText(this@MainActivity, "服务器返回错误: ${connection.responseCode}", android.widget.Toast.LENGTH_SHORT).show()
                        }
                        return@launch
                    }

                    val fileLength = connection.contentLength
                    val input = connection.inputStream
                    
                    // Save to internal cache for installation (safer for FileProvider)
                    val apkFile = File(cacheDir, fileName)
                    val output = FileOutputStream(apkFile)

                    val data = ByteArray(8192)
                    var total: Long = 0
                    var count: Int
                    var lastProgress = -1

                    while (input.read(data).also { count = it } != -1) {
                        total += count
                        if (fileLength > 0) {
                            val progress = (total * 100 / fileLength).toInt()
                            if (progress != lastProgress) {
                                lastProgress = progress
                                runOnUiThread {
                                    webView.evaluateJavascript("if(window.onUpdateProgress) window.onUpdateProgress($progress)", null)
                                }
                            }
                        }
                        output.write(data, 0, count)
                    }

                    output.flush()
                    output.close()
                    input.close()

                    // Also save a copy to public downloads as requested
                    saveToPublicDownloads(apkFile, fileName)

                    runOnUiThread {
                        installApk(apkFile)
                    }
                } catch (e: Exception) {
                    android.util.Log.e("WebView", "Download failed", e)
                    runOnUiThread {
                        android.widget.Toast.makeText(this@MainActivity, "下载异常: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
                        webView.evaluateJavascript("if(window.onUpdateProgress) window.onUpdateProgress(-1)", null)
                    }
                }
            }
        }

        private fun saveToPublicDownloads(sourceFile: File, fileName: String) {
             try {
                val resolver = contentResolver
                val contentValues = android.content.ContentValues().apply {
                    put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/vnd.android.package-archive")
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                        put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                    }
                }
                val collection = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI
                } else {
                    android.provider.MediaStore.Files.getContentUri("external")
                }
                val uri = resolver.insert(collection, contentValues)
                uri?.let {
                    resolver.openOutputStream(it)?.use { outputStream ->
                        sourceFile.inputStream().use { input ->
                            input.copyTo(outputStream)
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("WebView", "Secondary save failed", e)
            }
        }

        private fun installApk(file: File) {
            try {
                val intent = Intent(Intent.ACTION_VIEW)
                val apkUri = FileProvider.getUriForFile(this@MainActivity, "${packageName}.fileprovider", file)
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive")
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(intent)
            } catch (e: Exception) {
                android.util.Log.e("WebView", "Installation failed", e)
                android.widget.Toast.makeText(this@MainActivity, "无法启动安装程序: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
            }
        }
    }
}
