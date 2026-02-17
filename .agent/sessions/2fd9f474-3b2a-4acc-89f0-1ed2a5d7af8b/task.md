# PDA Broadcast Scan & Project Consolidation Task

## Phase 1: Native (Android) Enhancements
- [x] Review `MainActivity.kt` broadcast receiver logic
- [x] Implement support for multiple PDA models (NT20 as priority)
- [x] Add JS bridge to allow UI to configure native scan parameters (Action/Extra names)

## Phase 2: Frontend (React) Integration
- [x] Implement `window.scannerLabel` global listener in `App.tsx`
- [x] Add a "PDA Settings" page in the app to select model/configure scanning
- [x] Connect the scan event to the global scan handler (hot-toast, custom events)

## Phase 3: Build & Deployment (GitHub Actions)
- [x] Update GitHub Actions to build from project root
- [x] Verify production Supabase keys and build environment
- [x] Ensure APK assets are correctly bundled from `dist/`

## Phase 4: Project Consolidation (Root Migration)
- [x] Backup legacy root files to `legacy-pda-backup/`
- [x] Move `PDA-APP-UI` contents to project root
- [x] Clean up temporary directories and redundant config files

## Phase 5: Verification
- [x] Manual verification of JS bridge and native config sync
- [x] Verified GitHub Action build script paths
- [x] Final E2E workflow check

## Phase 6: Finance System Design (Stitch)
- [x] Generate 'Finance Dashboard Home' screen with charts
- [x] Generate 'Bill List' & 'Bill Detail' screens
- [x] Generate 'Reconciliation Dashboard' screen
- [x] Generate 'Exchange Rates' screen

## Phase 7: Batch-Centric Finance Logic (Stitch Generation)
- [x] Generate 'Admin Batch Master Board' (3-Bill View)
- [x] Generate 'Sender/Transit/Receiver Finance Dashboards' (Role-based Views)
- [x] Generate 'Funds Flow Visualization' (Profit Logic Diagram)

## Phase 8: Financial Logic Implementation (React)
- [x] Create `FinanceBatch` Store with 3-Bill Logic (A/B/C)
- [x] Implement 'Sender Finance' Dashboard (Payable Focus)
- [x] Implement 'Transit Finance' Dashboard (Receivable Focus)
- [x] Implement 'Receiver Finance' Dashboard (Goods Focus)
- [x] Implement 'Funds Flow Topology' Page (Admin Only)
- [x] Fix: Resolve infinite render loop on `useFinanceStore` selectors
- [x] Data: Migrate `finance.store` to use Supabase (Real DB)
- [x] Data: Seed DB with 3-Bill Batch Examples
- [x] Localization: Fully translated Finance pages (Sender/Transit/Receiver/Flow) to Chinese
