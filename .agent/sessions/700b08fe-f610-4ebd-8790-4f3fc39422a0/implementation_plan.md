# Responsive UX & Field-Level Security Implementation Plan

Refactor the application to support multi-language responsive layouts and enforce strict field-level security (Sender/Transit/Receiver) at the database layer.

## User Review Required

> [!IMPORTANT]
> - **Language Keys**: We will use English keys (e.g., `batch.id`) in the code to remain neutral. Translations will be stored in JSON files.
> - **Default Language**: The system will default to the browser/LINE system language.
> - **Mobile-First**: We will adopt a mobile-first responsive design using CSS Flex/Grid.

## Proposed Changes

### [I18N Framework]

#### [NEW] [i18n.ts](file:///www/wwwroot/hedui/src/lib/i18n.ts)
- Initialize `react-i18next`.
- Configure language detection.

#### [NEW] [locales/](file:///www/wwwroot/hedui/src/locales/)
- `zh.json`, `vi.json`, `th.json`, `mm.json` dictionaries.

### [UI Components Refactor]

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Replace static strings with `t()` functions.
- Update layout to handle multi-lane views for PAD/PC (side-by-side) and stacked views for Phone.

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Translate labels and placeholder text.
- Adapt button sizes for touch devices.

#### [MODIFY] [ParcelTable.tsx](file:///www/wwwroot/hedui/src/components/ParcelTable.tsx)
- Responsive column visibility (hide secondary info on small screens).

### [Field-Level Security & Audit]

#### [NEW] [Migration: Add Triplet Fields](file:///www/wwwroot/hedui/supabase/migrations/20240210_triplet_fields.sql)
- Add `sender_updated_at`, `transit_updated_at`, `receiver_updated_at` to `parcels`.
- Add Postgres triggers to enforce:
    - `sender_weight` can only be updated by a user with the 'sender' role for that batch.
    - Automatic timestamp updating per field.
- Refine RLS policies for `parcels` to use subquery batch-role checks.

#### [MODIFY] [types/index.ts](file:///www/wwwroot/hedui/src/types/index.ts)
- Add new triplet fields to the `Parcel` interface.

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Pass responsible user ID and timestamp to the UI.

### [Standard SOP: Print & Lock]

#### [NEW] [Migration: Add Print Status](file:///www/wwwroot/hedui/supabase/migrations/20240210_print_status.sql)
- Add `printed` (boolean), `printed_at`, `printed_by` to `parcels`.
- Add `custom_id` (text) for the "ST" number rule if `package_code` isn't sufficient.
- Update triggers to block updates if `printed = true`.

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Add "New Parcel" button for Sender role.
- Implement "ST" number generation: `ST{YYYYMMDD}-{Sequence}`.

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Add "Print & Lock" button.
- Disable inputs if `printed = true`.
- Disable inputs if `printed = true`.
- Mock BarTender integration (console log + state update).

### [Hardware Integration: Bluetooth Scale]

#### [NEW] [Weight Service Abstraction](file:///www/wwwroot/hedui/src/services/weight/index.ts)
- Define `WeightProvider` interface (`connect`, `disconnect`, `getWeight`, `isStable`).
- Implement `ManualWeightProvider` (Input fallback).
- Implement `BleWeightProvider` (Web Bluetooth).
- Implement `HidWeightProvider` (Keyboard/Input listener).

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Integrate `WeightProvider`.
- Implement stability logic (3 consecutive readings < 0.02kg diff).
- Visual feedback: Grey (Unstable) -> Green (Stable).
- Add `weight_source` recording.

#### [NEW] [Migration: Add Weight Source](file:///www/wwwroot/hedui/supabase/migrations/20240210_weight_source.sql)
- Add `weight_source` column to `parcels` ('BLE', 'HID', 'MANUAL').

### [Scanner Integration: Unified Adapter]

#### [NEW] [Scanner Service](file:///www/wwwroot/hedui/src/services/scanner/index.ts)
- Define `ScanResult` interface (`raw`, `symbology`, `source`, `device`).
- Define `SCAN_MAPPINGS` for intent/action configuration.
- Implement `ScannerAdapter` class:
    - Listen to HID (Keyboard) events.
    - Listen to Global Bridge events (`window.dispatchScanEvent`).
    - Normalize all inputs to `ScanResult`.
    - Publish events to subscribers.

#### [MODIFY] [Scanner.tsx](file:///www/wwwroot/hedui/src/components/Scanner.tsx)
- Refactor to use `ScannerAdapter`.
- Remove ad-hoc `window.onScan` logic.

## Verification Plan

### Automated Tests
- Build verification using `npm run build`.

### [Intelligent Scan Engine]

#### [NEW] [Scan Engine Service](file:///www/wwwroot/hedui/src/services/scanEngine.ts)
- **Identification Strategy**: Query DB in order: Transfer -> Parcel -> Batch.
- **Permission Pipeline**: Login -> Batch Access -> Record Access -> Edit Permission -> State Lock.
- **Action Resolver**: Return actionable result (e.g., `OPEN_PARCEL`, `SWITCH_BATCH`, `SHOW_ERROR`).

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Connect `ScannerAdapter` events to `ScanEngine`.
- Handle returned actions (Router navigation, Modal triggers).

### [Industrial Printing]

#### [NEW] [BarTender Spec](file:///home/deng/.gemini/antigravity/brain/700b08fe-f610-4ebd-8790-4f3fc39422a0/bartender_spec.md)
- Formal specification for Label 100x130mm.
- Field Mapping: `parcels` -> BarTender named data sources.
- Integration Model: Database Polling / Web Service.

#### [NEW] [Migration: Print Queue](file:///www/wwwroot/hedui/supabase/migrations/20240210_print_queue.sql)
- Table `print_jobs` (`id`, `parcel_id`, `printer_name`, `status`, `payload`).
- Trigger on `parcels` update/insert? Or explicit insert from UI?

### [Intelligent Fuzzy Search]

#### [NEW] [Migration: Document Indexing](file:///www/wwwroot/hedui/supabase/migrations/20240210_document_index.sql)
- Enable `pg_trgm`.
- Table `documents` (`id`, `doc_type`, `doc_no`, `parcel_id`, `batch_id`, `owner_role`).
- Trigger logic to sync `parcels.barcode` and `parcels.custom_id` to `documents`.

#### [MODIFY] [Scan Engine](file:///www/wwwroot/hedui/src/services/scanEngine.ts)
- Add `fuzzySearch` method.
- Fallback logic: If no exact match, query `documents` using `ILIKE`.

#### [MODIFY] [ParcelTable.tsx](file:///www/wwwroot/hedui/src/components/ParcelTable.tsx)
- Add Search Input with "Scan & Search" mode.
- Highlight hits in the table.

### [Dimensions & Sender Info]

#### [NEW] [Migration: Dimensional Fields](file:///www/wwwroot/hedui/supabase/migrations/20240210_parcel_dims.sql)
- Add `length_cm`, `width_cm`, `height_cm`, `sender_name` to `parcels`.
- Unit: CM (Centimeters).

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Add optional inputs for L/W/H (numeric keyboard).
- Add optional input for Sender Name.
- Only enabled for 'sender' role.

#### [MODIFY] [ParcelTable.tsx](file:///www/wwwroot/hedui/src/components/ParcelTable.tsx)
- Add columns for Dims and Sender Name (responsive hide on mobile).
- Ensure only readable for non-sender roles.

### [Advanced Search System]

#### [NEW] [Migration: Advanced Search Schema](file:///www/wwwroot/hedui/supabase/migrations/20260210_advanced_search.sql)
- `parcels`: `sender_name_pinyin`, `sender_name_initial`.
- `search_history`: tracks per-user keyword history (limited to 20).
- `favorite_packages`: many-to-many user/parcel relation.

#### [MODIFY] [ScanEngine.ts](file:///www/wwwroot/hedui/src/services/scanEngine.ts)
- Implement `fuzzySearch` with weighted ordering:
  1. `batch_id === active_batch_id`
  2. `pinyin` / `initial` matches
  3. Recently updated.

#### [MODIFY] [ParcelTable.tsx](file:///www/wwwroot/hedui/src/components/ParcelTable.tsx)
- Add Star (Favorite) toggle button.
- Integrate search history dropdown into the search bar.

### Manual Verification
- **Terminal Check**: Use browser tools to simulate Phone and PAD screen sizes.
- **Language Switch**: Verify the language toggle correctly updates all UI text without refreshing.

### Phase 29: Test Role Implementation
#### [NEW] [DebugRoleSwitcher.tsx](file:///www/wwwroot/hedui/src/components/DebugRoleSwitcher.tsx)
- Implements a UI widget for switching between `sender`, `transit`, and `receiver` roles.
- Uses a secure RPC `debug_grant_role` to bypass RLS and grant immediate batch access.

### Phase 30: System Verification
- **Automated Testing**: Attempted via Playwright but limited by environment (missing shared libs).
- **Manual Verification Strategy**:
  - Verification of Build Success (`npm run build`).
  - Creation of `DebugRoleSwitcher` for seamless role toggling.
  - Comprehensive Manual Test Plan (`test_plan.md`).

### Phase 31: NT20 Scanner Integration
#### [MODIFY] [Scanner Service](file:///www/wwwroot/hedui/src/services/scanner/index.ts)
- Implement `window.scannerLabel.onScan(code)` bridge.
- Map this bridge to the existing `ScannerAdapter.emit` logic.
- Ensure compatibility with `Tiandy NT20` broadcast format (string direct).

#### [NEW] [Documentation]
- Update `walkthrough.md` with PDA configuration settings (Action/Extra).

### Phase 32: Android Shell & CI/CD
#### [NEW] [Android Project](file:///www/wwwroot/hedui/android/)
- Minimal single-activity app.
- `WebView` loading `file:///android_asset/index.html`.
- `BroadcastReceiver` listening for `android.intent.action.RECEIVE_SCANDATA_BROADCAST`.
- JS Bridge: `webView.evaluateJavascript("window.scannerLabel.onScan('$code')", null)`.

#### [NEW] [GitHub Actions](file:///www/wwwroot/hedui/.github/workflows/build_apk.yml)
- `ubuntu-latest`.
- Steps:
  1. Setup Node.js -> `npm install` -> `npm run build`.
  2. Copy `dist/*` to `android/app/src/main/assets/`.
  3. Setup Java/Gradle.
  5. Upload Artifact `app-debug.apk`.

### Phase 33: Release Signing & Distribution
#### [MODIFY] [Android Build Gradle](file:///www/wwwroot/hedui/android/app/build.gradle)
- Add `signingConfigs`.
- Read `storeFile`, `storePassword`, `keyAlias`, `keyPassword` from environment variables.

#### [MODIFY] [GitHub Actions](file:///www/wwwroot/hedui/.github/workflows/build_apk.yml)
- Add step to decode keystore from Secrets.
- Change build command to `gradle assembleRelease`.
- Pass signing secrets to the build environment.

#### [NEW] [Keystore Guide](file:///home/deng/.gemini/antigravity/brain/700b08fe-f610-4ebd-8790-4f3fc39422a0/signing_guide.md)
- Instructions to generate keystore.
- Instructions to set GitHub Secrets.

### Phase 34: TDD - Fix Android Black Screen
#### [MODIFY] [Vite Config](file:///www/wwwroot/hedui/vite.config.ts)
- Add `@vitejs/plugin-legacy` to support older WebViews (Chrome 60+).
- Set `build.target` to `es2015`.

#### [VERIFY] [Dist Build](file:///www/wwwroot/hedui/dist/index.html)
- Verify `index.html` contains legacy scripts (`nomodule`).
- Verify assets load with relative paths.
### Phase 35: Industrial PDA Optimization (UX/UI)

#### [MODIFY] [Android Manifest](file:///www/wwwroot/hedui/android/app/src/main/AndroidManifest.xml)
- Force `android:screenOrientation="portrait"`.

#### [MODIFY] [Vite Config](file:///www/wwwroot/hedui/vite.config.ts)
- Add `terserOptions` to ensure symbols are preserved if needed (optional, keeping current).

#### [MODIFY] [Global CSS](file:///www/wwwroot/hedui/src/index.css)
- Increase standard input height to `48px`.
- Increase font sizes and color contrast (use white vs purple-grey).
- Apply high-contrast borders for inputs.

#### [MODIFY] [Locales (ZH)](file:///www/wwwroot/hedui/src/locales/zh.json)
- Translate technical status codes to operational Chinese.
- Update placeholders to be action-oriented (e.g., "Ready for scan").

#### [MODIFY] [WeightEditor](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Optimize L/W/H inputs layout.
- Use `inputMode="decimal"` for numeric keyboard.
- Stabilize scan-to-focus transitions.

#### [MODIFY] [BatchSelector](file:///www/wwwroot/hedui/src/components/BatchSelector.tsx)
- Improve guidance for batch selection.
- Add "Recent Batches" if available.
### Phase 36: Premium UI/UX Refactor (ui-ux-pro-max)

Refactor the application using "OLED Industrial Dark" aesthetics with vibrant accents and glassmorphism.

#### [MODIFY] [Global CSS](file:///www/wwwroot/hedui/src/index.css)
- Implement **OLED Black** theme variables (`#000000` background).
- Add **Neon Accents** (Electric Blue `#3B82F6`, Cyber Purple `#A855F7`).
- Refine Glassmorphism with `backdrop-filter: blur(12px)` and `border: 1px solid rgba(255, 255, 255, 0.15)`.
- Use **Montserrat/Inter** font stack for a premium feel.

#### [NEW] [AppLayout.tsx](file:///www/wwwroot/hedui/src/components/AppLayout.tsx)
- Create a modern wrapper with a **Floating Bottom Navigation** bar.
- Use glassmorphic blur for the navbar and header.

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Integrate `AppLayout`.
- Use a **Bento Grid** inspiration for the main dashboard tiles.

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Redesign weight display with a large, glowing digital font look.
- Use a **3-column Bento layout** for L/W/H inputs.
- Add success/warning glows based on weight stability.

#### [MODIFY] [Scanner.tsx](file:///www/wwwroot/hedui/src/components/Scanner.tsx)
- Add a **Visual "Scanning Pulse"** animation when active.
- Use a high-contrast label for scanning status.

#### [MODIFY] [BatchSelector.tsx](file:///www/wwwroot/hedui/src/components/BatchSelector.tsx)
- Transform batch list into modern cards with status badges and "Recent" indicators.

#### [VERIFY] [UI Verification]
- Check contrast ratios for accessibility.
- Verify touch targets at the edges of the PDA screen.
### Phase 37: Premium Desktop/Tablet UI Refactor (PC/PAD)

Refactor the application for non-PDA devices using a high-density, analytical dashboard layout with premium SaaS aesthetics.

#### [MODIFY] [Global CSS](file:///www/wwwroot/hedui/src/index.css)
- Implement **Plus Jakarta Sans** font stack for Desktop.
- Refine sizing for larger screens (smaller inputs, denser grids).
- Add specific Desktop hover effects and transitions.

#### [MODIFY] [AppLayout.tsx](file:///www/wwwroot/hedui/src/components/AppLayout.tsx)
- Break-out logic: 
    - **Desktop**: Vertical Sidebar (Mini/Expanded) with top breadcrumbs.
    - **Mobile**: Floating Bottom Nav (Existing).
- Add User Profile & Role switcher to the header for Desktop.

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Implement a **High-Density Bento Grid**:
    - Left Column: Stats & Active Batch details.
    - Center Column: Main Operations (Scanner/Editor).
    - Right Column: Analytics/Recent History.
- Use `antd` Grid system for responsive adaptability between iPad (Portrait/Landscape) and Desktop.

#### [MODIFY] [ParcelTable.tsx](file:///www/wwwroot/hedui/src/components/ParcelTable.tsx)
- Enhance Desktop view:
    - Detailed info columns (Dimensions, Sender).
    - Inline editing capabilities if authorized.
    - Advanced filtering drawer.
    - Batch actions (Export, Bulk Print).

#### [VERIFY] [Cross-Device Verification]
- Test on 1024px (iPad Landscape), 1280px (Standard Laptop), and 1920px (Desktop).
- Verify Mouse vs Touch interaction patterns.
### Phase 39: Radical UI Overhaul (Readability & Contrast Focus)

Radically transform the UI to address poor readability and unclear region division. Switch to a high-contrast "Crystal Professional" aesthetic.

#### [MODIFY] [Global CSS](file:///www/wwwroot/hedui/src/index.css)
- **High-Contrast Palette**: 
    - Background: `#f8fafc` (Light) / `#020617` (Dark - for depth).
    - Text: `#0f172a` (Deep Slate) for maximum legibility.
    - Accents: `#3b82f6` (Primary) and `#ca8a04` (Attention).
- **Region Division**: 
    - Explicit borders (`1px solid #e2e8f0`) for all cards.
    - Section headers with background tints to separate zones.
    - Improved padding/margins to prevent clutter.

#### [MODIFY] [AppLayout.tsx](file:///www/wwwroot/hedui/src/components/AppLayout.tsx)
- Add "High Contrast" toggle or strictly implement the new readable theme.
- Enhance Sidebar with clear icons and active states.

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Re-arrange Bento Grid into "Standard Zones":
    - **Header**: Critical Batch Stats (Large text, high contrast).
    - **Left**: Control (Scanner).
    - **Right**: Editor (Weight Entry).
    - **Bottom**: Data (Table).
- Use `antd` Space/Divider for explicit separation.

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx)
- Increase font sizes for inputs.
- Use explicit labels with bold weights.
- Improve button visibility (solid colors only).

#### [VERIFY] [Contrast & Clarity]
- Verify WCAG 2.1 AAA contrast for all text.
- User review of "Region Separation".
### Phase 40: PDA Specialized Workflow Refactor

Transform the PDA experience from "PC Adaption" to "Native Step-based Workflow" to optimize for vertical screens and high-speed operation.

#### [NEW] [PDAWorkflowView.tsx](file:///www/wwwroot/hedui/src/components/pda/PDAWorkflowView.tsx)
- **Step-Based UI**:
    - **Context Bar**: Sticky top showing Batch# and Current Barcode.
    - **Step 1 (Scan)**: Simple scanner prompt, auto-focuses next step on success.
    - **Step 2 (Weight)**: Ultra-large font (`72px+`), centered, high-contrast hardware stability indicator.
    - **Step 3 (Optional Fields)**: Collapsible "Extra Info" section for L/W/H and Sender Name.
- **Sticky Actions**: "Save & Print" as a full-width bottom button in the "Thumb Zone".
- **Recent Activity**: Simple vertically-scrollable cards (max 5) instead of a table.

#### [MODIFY] [MainApp.tsx](file:///www/wwwroot/hedui/src/pages/MainApp.tsx)
- Integrate `PDAWorkflowView` based on device detection.
- Implement "Step State Machine": `Idle -> Scanned -> Weighed -> Submitted`.
- Auto-focus logic: Force focus on Scanner input after every submission.

#### [MODIFY] [WeightEditor.tsx](file:///www/wwwroot/hedui/src/components/WeightEditor.tsx) & [Scanner.tsx](file:///www/wwwroot/hedui/src/components/Scanner.tsx)
- Expose inner states/props for PDA mode to allow for the simplified step-based rendering.
- Ensure L/W/H inputs are vertical in PDA mode.

#### [VERIFY] [PDA Field Test]
- Verify one-handed operation ergonomics.
- Test "Next Parcel" auto-reset speed.
- Verify no horizontal scrolling on 375px-480px width devices.
