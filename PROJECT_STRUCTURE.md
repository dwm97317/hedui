# Project Structure & Workflow Mapping

This document maps the codebase files to their functional areas and workflows, primarily focusing on the `PDA-APP-UI` directory. Use this for defining file locking rules and ownership.

## 1. PDA Application UI (`PDA-APP-UI/`)

### Core Infrastructure (Shared)
| File Path | Functionality | Responsible Area | Workflow Phase |
| :--- | :--- | :--- | :--- |
| `PDA-APP-UI/App.tsx` | Main Router & Layout Structure | Core | Initialization |
| `PDA-APP-UI/index.tsx` | App Entry Point, Providers | Core | Initialization |
| `PDA-APP-UI/pages/Login.tsx` | User Authentication | Auth | Login |
| `PDA-APP-UI/pages/Home.tsx` | Role-Based Dispatcher (Redirects to Dashboards) | Core | Routing |
| `PDA-APP-UI/components/ProtectedRoute.tsx` | Role Authorization Guard | Core | Security |
| `PDA-APP-UI/components/BottomNav.tsx` | Global Navigation Bar | Core | UI/Nav |
| `PDA-APP-UI/components/FinanceLayout.tsx` | Layout wrapper for Finance pages | Finance | UI/Layout |
| `PDA-APP-UI/store/user.store.ts` | Global User State (Zustand) | Core | State Management |
| `PDA-APP-UI/services/supabase.ts` | Supabase Client & Helper Functions | Core | Database |
| `PDA-APP-UI/services/auth.service.ts` | Auth API Methods | Core | Auth |
| `PDA-APP-UI/pages/Reports.tsx` | Batch Reporting & Analytics | Shared | Reporting |
| `PDA-APP-UI/pages/BatchList.tsx` | Batch History List | Shared | History |

### Sender Workflow (发货方)
| File Path | Functionality | Responsible Area | Workflow Phase |
| :--- | :--- | :--- | :--- |
| `PDA-APP-UI/pages/sender/SentHome.tsx` | Sender Home (Active Batch & Tools) | Sender | Dashboard |
| `PDA-APP-UI/pages/sender/BatchDetailPage.tsx` | Batch Mgmt, Add Parcel, Seal Batch | Sender | Batch Creation |
| `PDA-APP-UI/pages/CreateBatch.tsx` | Create New Batch Form | Sender | Batch Creation |
| `PDA-APP-UI/pages/CreateShipment.tsx` | Create Individual Shipment Form | Sender | Shipment Creation |
| `PDA-APP-UI/pages/sender/SenderMonitor.tsx` | Analytics & Monitoring | Sender | Reporting |
| `PDA-APP-UI/hooks/useBatches.ts` | Batch Data Hooks | Sender/Core | Data Access |
| `PDA-APP-UI/hooks/useShipments.ts` | Shipment Data Hooks | Sender | Data Access |
| `PDA-APP-UI/services/batch.service.ts` | Batch Database Operations | Sender/Core | Service Layer |
| `PDA-APP-UI/services/shipment.service.ts` | Shipment Database Operations | Sender | Service Layer |

### Transit Workflow (中转方)
| File Path | Functionality | Responsible Area | Workflow Phase |
| :--- | :--- | :--- | :--- |
| `PDA-APP-UI/pages/transit/TransitHome.tsx` | Transit Home (Active Batch & Tools) | Transit | Dashboard |
| `PDA-APP-UI/pages/transit/TransitCheck.tsx` | Weighing & Inspection Logic | Transit | Inspection (查验) |
| `PDA-APP-UI/pages/transit/MergeParcel.tsx` | Parcel Consolidation | Transit | Processing |
| `PDA-APP-UI/pages/transit/SplitParcel.tsx` | Parcel Splitting | Transit | Processing |
| `PDA-APP-UI/pages/transit/TransitExceptions.tsx` | Exception Reporting | Transit | Exception Handling |
| `PDA-APP-UI/hooks/useInspections.ts` | Inspection Data Hooks | Transit | Data Access |
| `PDA-APP-UI/services/inspection.service.ts` | Inspection Database Operations | Transit | Service Layer |

### Receiver Workflow (收货方)
| File Path | Functionality | Responsible Area | Workflow Phase |
| :--- | :--- | :--- | :--- |
| `PDA-APP-UI/pages/receiver/ReceiverHome.tsx` | Receiver Home (Active Batch & Tools) | Receiver | Dashboard |
| `PDA-APP-UI/pages/receiver/ReceiverCheck.tsx` | Weight Comparison & Sign-off | Receiver | Receiving (签收) |
| `PDA-APP-UI/pages/receiver/ReceiverMerge.tsx` | Destination Merge | Receiver | Processing |
| `PDA-APP-UI/pages/receiver/ReceiverSplit.tsx` | Destination Split | Receiver | Processing |
| `PDA-APP-UI/pages/receiver/ReceiverExceptions.tsx` | Receiver Exceptions | Receiver | Exception Handling |
| `PDA-APP-UI/pages/receiver/ReceiverArchive.tsx` | Historical Data View | Receiver | Archiving |

### Finance & Administration (财务/管理)
| File Path | Functionality | Responsible Area | Workflow Phase |
| :--- | :--- | :--- | :--- |
| `PDA-APP-UI/pages/finance/FinanceHome.tsx` | Finance Dashboard | Finance | Dashboard |
| `PDA-APP-UI/pages/finance/BillList.tsx` | Bill Management | Finance | Billing |
| `PDA-APP-UI/pages/finance/BillDetail.tsx` | Bill Information | Finance | Billing |
| `PDA-APP-UI/pages/finance/Reconciliation.tsx` | Account Reconciliation | Finance | Accounting |
| `PDA-APP-UI/pages/finance/ExchangeRates.tsx` | Currency Management | Finance | Settings |
| `PDA-APP-UI/hooks/useBilling.ts` | Billing Data Hooks | Finance | Data Access |
| `PDA-APP-UI/services/billing.service.ts` | Billing Database Operations | Finance | Service Layer |
| `PDA-APP-UI/pages/BatchManager.tsx` | Admin Batch Overview | Admin | Management |
| `PDA-APP-UI/pages/supervisor/RiskMonitor.tsx` | Risk Control Dashboard | Supervisor | Monitoring |
| `PDA-APP-UI/pages/BartenderConfig.tsx` | Printer Integration Settings | Admin | Device Config |
| `PDA-APP-UI/pages/Settings.tsx` | General App Settings | Shared | Configuration |
| `PDA-APP-UI/pages/Profile.tsx` | User Profile View | Shared | Account |

### Utilities & Configuration
| File Path | Description | Responsible Area | Phase |
| :--- | :--- | :--- | :--- |
| `PDA-APP-UI/seed_users.js` | Test User Registration Script (Node.js) | Dev | Setup/Testing |
| `PDA-APP-UI/vite.config.ts` | Build Configuration | Dev | Build |
| `PDA-APP-UI/tsconfig.json` | TypeScript Configuration | Dev | Build |
| `PDA-APP-UI/tailwind.config.js` | CSS Framework Configuration | Dev | Styling |
| `PDA-APP-UI/.env` | Environment Variables | Dev | Config |

## 2. Backend / Create (Supabase)

| File Path | Description | Responsible Area |
| :--- | :--- | :--- |
| `supabase/migrations/*` | Database Migrations | Backend |
| `supabase/seed.sql` | Initial Data Seeding | Backend |
