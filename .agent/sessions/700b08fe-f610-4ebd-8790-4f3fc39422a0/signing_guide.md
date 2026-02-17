# Android Release Signing Guide

To automate the release build, you need to generate a signing certificate (Keystore) and add it to your GitHub Repository Secrets.

## 1. Get Your Secrets (Generated for you)

I have already generated a secure keystore for you. You just need to copy these values into GitHub.

## 2. Add Secrets to GitHub (Crucial Step)

**Do NOT use "Deploy keys"!**

1.  In your repository, click **Settings** (top right tab).
2.  In the left sidebar, scroll down to the **Security** section.
3.  Click **Secrets and variables** (it will expand).
4.  Select **Actions**.
5.  Click the green button **New repository secret**.

> [!TIP]
> It is the menu item *directly below* "Deploy keys" in your screenshot!

| Secret Name | Value |
| :--- | :--- |
| **ANDROID_KEYSTORE_BASE64** | *(Copy the long string I provided in the chat)* |
| **ANDROID_KEYSTORE_PASSWORD** | `hedui_password` |
| **ANDROID_KEY_ALIAS** | `hedui_release` |
| **ANDROID_KEY_PASSWORD** | `hedui_password` |

## 3. Trigger Build
Once these secrets are set:
1. Push your code to `main`.
2. Go to the **Actions** tab in GitHub.
3. You will see the "Build Android APK" workflow running.
4. When finished, download the `app-release.apk` artifact.

> [!IMPORTANT]
> **Backup your `hedui.keystore` file securely!** If you lose it, you cannot update the existing app on devices without uninstalling it first.
