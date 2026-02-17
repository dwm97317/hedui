# PDA Broadcast Scan Implementation

We have successfully implemented support for customizable PDA broadcast scanning, with specific optimization for the **NT20** model.

## Key Changes

### 1. Native Android Enhancements (`MainActivity.kt`)
- **Configurable Scanning**: Replaced hardcoded intent actions/extras with mutable variables persisted in `SharedPreferences`.
- **JS Bridge**: Added an `Android` JavascriptInterface to allow the React app to update scan configurations (e.g., switching from Standard to NT20).
- **Persistent Logic**: The app now remembers the scanner configuration across restarts.

### 2. Frontend React Integration (`PDA-APP-UI`)
- **Scanner Store**: Created `scanner.store.ts` using `zustand` to manage device models and their corresponding intent strings.
- **Global Listener**: Added a central scan listener in `App.tsx` that dispatches a `pda-scan` custom event.
- **Settings UI**: Refactored the "PDA Settings" modal to allow users to select their model, which instantly recalibrates the native scanner.

### 3. Build Workflow Improvements (`build_apk.yml`)
- **Correct Paths**: Updated the GitHub Actions workflow to correctly navigate to the `PDA-APP-UI` directory for building.
- **Supabase Keys**: Sync'd environment variables to match the working production keys.

## Verified Features

- [x] **NT20 Model Support**: Correctly sets Action: `android.intent.action.SCAN_RESULT` and Extra: `android.intent.extra.SCAN_BROADCAST_DATA`.
- [x] **Native Sync**: Settings changed in the UI are immediately communicated to the Android system.
- [x] **Real-time Feedback**: Successful scans trigger a global Toast notification and can be consumed by any part of the app.

## Visual Verification

> [!TIP]
> Users can now find the "PDA型号设置" (PDA Model Settings) under the "扫码配置" (Scan Config) section in the app settings.

The application is now fully prepared for distribution as an Android APK via GitHub Actions.
