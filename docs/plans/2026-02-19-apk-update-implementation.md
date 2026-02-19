# Real-time APK Update & Installation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the non-functional `window.open` update logic with a native Android download stream that provides real-time progress feedback to the React UI and automatically launches the APK installer.

**Architecture:** Native Android (Kotlin) handles HTTP streaming and IPC with the installer via `FileProvider`. React (TypeScript) listens for progress updates via a global window callback `onUpdateProgress`.

**Tech Stack:** React, TypeScript, Kotlin (Android), Android Coroutines.

---

### Task 1: Android Configuration (Permissions & FileProvider)

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`
- Create: `android/app/src/main/res/xml/file_paths.xml`

**Step 1: Add permissions and provider to Manifest**
Add `REQUEST_INSTALL_PACKAGES` and define the `FileProvider`.

**Step 2: Create file paths XML**
Enable sharing of the Downloads folder for installation.

**Step 3: Commit**
```bash
git add android/app/src/main/AndroidManifest.xml android/app/src/main/res/xml/file_paths.xml
git commit -m "android: add installation permissions and FileProvider config"
```

---

### Task 2: Native Bridge Enhancement (MainActivity.kt)

**Files:**
- Modify: `android/app/src/main/java/com/hedui/pda/MainActivity.kt`

**Step 1: Implement download logic**
Add `startDownload(url: String, fileName: String)` with progress reporting.

```kotlin
// In WebAppInterface
@JavascriptInterface
fun startDownload(url: String, fileName: String) {
    // Coroutine-based download with byte counting
    // Call injectProgress(percent) periodically
}

private fun injectProgress(percent: Int) {
    runOnUiThread {
        webView.evaluateJavascript("if(window.onUpdateProgress) window.onUpdateProgress($percent)", null)
    }
}
```

**Step 2: Implement installation logic**
Add `installApk(file: File)` using `Intent.ACTION_VIEW` and `FileProvider`.

**Step 3: Commit**
```bash
git add android/app/src/main/java/com/hedui/pda/MainActivity.kt
git commit -m "android: implement native startDownload and installApk bridge"
```

---

### Task 3: React UI & Progress Hook (Settings.tsx)

**Files:**
- Modify: `www/wwwroot/hedui/pages/settings/Settings.tsx`

**Step 1: Add progress state and effect**
```typescript
const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

useEffect(() => {
    (window as any).onUpdateProgress = (p: number) => setDownloadProgress(p);
    return () => { delete (window as any).onUpdateProgress; };
}, []);
```

**Step 2: Update "Update Now" handler**
Call `window.Android.startDownload` instead of `window.open`.

**Step 3: Update Modal UI**
Show a progress bar or percentage text when `downloadProgress !== null`.

**Step 4: Commit**
```bash
git add pages/settings/Settings.tsx
git commit -m "feat: add real-time download progress UI to settings"
```

---

### Task 4: Service Layer & Types (UpdateService)

**Files:**
- Modify: `www/wwwroot/hedui/services/update.service.ts`

**Step 1: Add TypeScript definitions for the bridge**
Extend `Window` interface locally to avoid lint errors.

**Step 2: Commit**
```bash
git add services/update.service.ts
git commit -m "refactor: add update bridge type definitions"
```
