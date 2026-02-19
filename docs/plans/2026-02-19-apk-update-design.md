# Design Plan: Real-time APK Update & Installation

## 1. Problem Statement
The current update implementation in the PDA app uses `window.open(url, '_blank')`, which simply triggers a browser opening on most Android WebViews. It does not provide progress feedback, does not save the file to a standard location reliably, and cannot trigger the APK installation process automatically, leading to a broken "Update Now" experience.

## 2. Goals
- Implement a robust native-level APK download.
- Provide real-time download progress to the React UI.
- Automatically trigger the Android installation pop-up after download.
- Save the APK to the public `Downloads` folder as a backup.

## 3. Proposed Architecture (Option A: Native Stream + JS Callback)

### 3.1. Native Components (Android/Kotlin)
- **`startDownload(url: String, fileName: String)`**: 
  - Uses `HttpURLConnection` and `java.io` inside a `Dispatchers.IO` coroutine.
  - Streams bytes from the server to `MediaStore.Downloads`.
  - Calculates percentage: `(bytesRead * 100) / totalSize`.
  - Communicates progress to JS via `webView.evaluateJavascript("window.onUpdateProgress($percent)")`.
- **`installApk(file: File)`**:
  - Uses `FileProvider` to create a secure `content://` URI.
  - Grants read permission to the Android Package Installer.
  - Launches `Intent.ACTION_VIEW` with MIME type `application/vnd.android.package-archive`.

### 3.2. Frontend Components (React/TS)
- **`Settings.tsx`**:
  - New state: `downloadProgress` (0 to 100).
  - New effect: Listen for global `window.onUpdateProgress`.
  - UI Update: Replace the button text with a progress indicator and percentage during download.
- **`update.service.ts`**:
  - Keep version check as-is.
  - Add helper to call bridge: `window.Android.startDownload(url, "app-update.apk")`.

## 4. Implementation Details

### 4.1. Security & Configuration
- **Permissions**: Add `REQUEST_INSTALL_PACKAGES` to `AndroidManifest.xml`.
- **FileProvider**: Define a `provider` in `AndroidManifest.xml` and an `xml/file_paths.xml` to allow installation from the downloads folder.

### 4.2. UI/UX Refinement
- The download button will transform into a "Progress Pill" or have a background fill indicating progress.
- Prevent double-clicking or navigation during the download process to ensure stability.

## 5. Alternatives Considered
-   **Option B (JS Download)**: Use `fetch()` in JS and pass results to native. Rejected because JS memory constraints on large APK files (20MB+) often crash WebViews, and it cannot trigger auto-installation.

## 6. Success Criteria
1. Clicking "立即更新" starting the progress count from 0 to 100%.
2. A toast confirming the download location.
3. The system "Install this application?" prompt appearing immediately after 100%.
