# Release Notes: Advanced Search & Test Infrastructure

**Version**: 1.2.0
**Date**: 2026-02-10

## 🚀 Key Features

### 1. Advanced Search System
- **Pinyin Support**: Search for Chinese names using Pinyin initials (e.g., input "zs" to find "张三").
- **Weighted Ranking**: Search results are intelligently sorted:
  1. Parcels in the **Current Batch**.
  2. Exact barcode matches.
  3. Recently updated records.
- **Search History**: The search bar now remembers and suggests your last 10 search queries.
- **Favoriting**: Added a "Star" button to easy mark and retrieve important parcels.

### 2. Developer Experience (DX)
- **Role Debugger**: A new floating widget (`DebugRoleSwitcher`) allows developers/testers to instantly switch between `Sender`, `Transit`, and `Receiver` roles.
- **Auto-Permissions**: Switching roles via the debugger automatically grants the necessary permissions for the active batch, eliminating manual database setup.
- **Clean Codebase**: All TypeScript errors resolved, build pipeline verified.

## 🛠️ Technical Improvements
- **Security**: Implemented `debug_grant_role` RPC to handle high-privilege permission grants securely.
- **Performance**: Added `GIN` indexes for Pinyin fields to ensure instant search results even with large datasets.
- **Stability**: Fixed `pinyin-pro` dependency issues to ensure consistent build success.

## 🧪 Verification
- **Manual Test Plan**: A comprehensive guide (`test_plan.md`) is available for verifying all new features using the Role Debugger.
- **Build Outcome**: `npm run build` ✅ Success.
