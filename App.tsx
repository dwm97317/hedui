
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { useUserStore } from './store/user.store';
import { useScannerStore } from './store/scanner.store';
import Home from './pages/Home';
import CreateShipment from './pages/CreateShipment';
import BatchList from './pages/BatchList';
import Settings from './pages/Settings';
import TransitHome from './pages/transit/TransitHome';
import TransitCheck from './pages/transit/TransitCheck';
import MergeParcel from './pages/transit/MergeParcel';
import SplitParcel from './pages/transit/SplitParcel';
import TransitExceptions from './pages/transit/TransitExceptions';
import SenderMonitor from './pages/sender/SenderMonitor';
import CargoCreate from './pages/sender/CargoCreate';
import SentHome from './pages/sender/SentHome';
import ReceiverHome from './pages/receiver/ReceiverHome';
import ReceiverCheck from './pages/receiver/ReceiverCheck';
import ReceiverMerge from './pages/receiver/ReceiverMerge';
import ReceiverSplit from './pages/receiver/ReceiverSplit';
import ReceiverExceptions from './pages/receiver/ReceiverExceptions';
import ReceiverArchive from './pages/receiver/ReceiverArchive';
import BartenderConfig from './pages/BartenderConfig';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateBatch from './pages/CreateBatch';
import RiskMonitor from './pages/supervisor/RiskMonitor';
import BatchManager from './pages/BatchManager';
import FinanceHome from './pages/finance/FinanceHome';
import BillList from './pages/finance/BillList';
import BillDetail from './pages/finance/BillDetail';
import Reconciliation from './pages/finance/Reconciliation';
import ExchangeRates from './pages/finance/ExchangeRates';
import SenderFinance from './pages/finance/SenderFinance';
import TransitFinance from './pages/finance/TransitFinance';
import ReceiverFinance from './pages/finance/ReceiverFinance';
import FundsFlow from './pages/finance/FundsFlow';
import AdminPriceConfig from './pages/finance/AdminPriceConfig';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import ReportCenter from './pages/ReportCenter';
import BottomNav from './components/BottomNav';
import BatchDetailPage from './pages/batch-detail';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CompanyManagement from './pages/admin/CompanyManagement';
import BatchManagement from './pages/admin/BatchManagement';
import AdminBillManagement from './pages/admin/AdminBillManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AdminProfile from './pages/admin/AdminProfile';
import { BatchBillingSettings } from './pages/finance/BatchBillingSettings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { toast, Toaster } from 'react-hot-toast';


const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useUserStore(state => state.signOut);
  const fetchUser = useUserStore(state => state.fetchUser);
  const syncWithNative = useScannerStore(state => state.syncWithNative);

  useEffect(() => {
    // Sync native configuration on startup
    syncWithNative();
  }, [syncWithNative]);

  useEffect(() => {
    // Register global scanner listener
    (window as any).scannerLabel = {
      onScan: (code: string) => {
        console.log('PDA Scan Received:', code);
        // We can toast it or dispatch a custom event that components can listen to
        toast.success(`PDA Scanned: ${code}`, {
          icon: '🔍',
          id: 'pda-scan-toast'
        });

        // Dispatch custom event for components to consume
        const event = new CustomEvent('pda-scan', { detail: code });
        window.dispatchEvent(event);
      }
    };

    // Register global back button handler for Android
    (window as any).handleAndroidBack = () => {
      // Get clean path without hash and query params
      const fullPath = window.location.hash.replace('#', '') || '/';
      const path = fullPath.split('?')[0];

      // Define root pages for each module
      const rootPages = [
        '/sender',
        '/transit',
        '/receiver',
        '/finance',
        '/settings',
        '/batch-list',
        '/reports',
        '/profile',
        '/supervisor/risk',
        '/batch-manager'
      ];

      if (path === '/' || path === '/login') {
        // At the absolute root
        console.log('At root, ignoring back');
      } else if (rootPages.includes(path)) {
        // At a module root, go back to main dashboard
        navigate('/');
      } else {
        // Deep page, go back to previous
        navigate(-1);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[App] 🔑 Auth State Changed - Event: ${event}`, { hasSession: !!session });

      if (event === 'SIGNED_OUT') {
        console.log('[App] 🚪 User signed out, navigating to login');
        // Check if we still think we are authenticated
        if (useUserStore.getState().isAuthenticated) {
          // Only call signOut if store hasn't been cleared yet
          await signOut();
        }
        navigate('/login', { replace: true });
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (session) {
          fetchUser();
        } else {
          useUserStore.getState().setUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      delete (window as any).scannerLabel;
      delete (window as any).handleAndroidBack;
    };
  }, []); // Only run once on mount! navigate and actions are stable.

  // Define paths where BottomNav should be hidden
  // We want to hide it on login, create pages, sub-pages, etc to valid space
  // Actually, let's keep it simple: Show on Home, History, Profile. Hide on others.
  // Or use the inverse logic as before.
  const hideNavPaths = [
    '/login',
    '/create',
    '/create-batch',
    '/transit/',
    '/receiver/',
    '/sender/',
    '/settings/',
    '/supervisor/',
    '/finance',
    '/batch-manager'
  ];

  const shouldHideNav = hideNavPaths.some(path => location.pathname.startsWith(path));

  // Determine if we should show the nav bar
  // Simplified logic: Only show on main tabs if you want
  // For now let's stick to the previous 'hide' list but optimized
  // But wait, the previous list was exhaustive.
  // Let's use a cleaner approach: Only show on specific main pages?
  // Home (/), History (/history), Profile (/profile), Settings (/settings) -> Wait settings has children
  // Let's stick to the "Hide on verified full screen pages" approach.

  const isFullScreenPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    (location.pathname.startsWith('/transit/') && location.pathname !== '/transit') ||
    (location.pathname.startsWith('/receiver/') && location.pathname !== '/receiver') ||
    (location.pathname.startsWith('/sender/') && location.pathname !== '/sender') ||
    (location.pathname.startsWith('/supervisor/') && location.pathname !== '/supervisor') ||
    location.pathname.startsWith('/finance') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/batch/') ||
    location.pathname.startsWith('/report-center') ||
    location.pathname.startsWith('/batch-detail/');

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <div className="flex-1 overflow-y-auto relative z-0 scroller-custom">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<ProtectedRoute><CreateShipment /></ProtectedRoute>} />
          <Route path="/create-batch" element={<ProtectedRoute><CreateBatch /></ProtectedRoute>} />
          <Route path="/batch-list" element={<ProtectedRoute><BatchList /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/report-center" element={<ProtectedRoute><ReportCenter /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/bartender" element={<ProtectedRoute><BartenderConfig /></ProtectedRoute>} />

          <Route
            path="/batch/:id"
            element={
              <ProtectedRoute allowedRoles={['sender', 'transit', 'receiver']}>
                <BatchDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batch-detail/:id"
            element={
              <ProtectedRoute allowedRoles={['sender', 'transit', 'receiver']}>
                <BatchDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/sender" element={<ProtectedRoute allowedRoles={['sender', 'admin']}><SentHome /></ProtectedRoute>} />
          <Route path="/sender/create" element={<ProtectedRoute allowedRoles={['sender', 'admin']}><CargoCreate /></ProtectedRoute>} />
          <Route
            path="/sender/monitor"
            element={<ProtectedRoute allowedRoles={['sender', 'admin']}><SenderMonitor /></ProtectedRoute>}
          />
          <Route path="/transit" element={<ProtectedRoute allowedRoles={['transit', 'admin']}><TransitHome /></ProtectedRoute>} />
          <Route path="/transit/check" element={<ProtectedRoute allowedRoles={['transit', 'admin']} requiredPermission="warehouse"><TransitCheck /></ProtectedRoute>} />
          <Route path="/transit/merge" element={<ProtectedRoute allowedRoles={['transit', 'admin']} requiredPermission="warehouse"><MergeParcel /></ProtectedRoute>} />
          <Route path="/transit/split" element={<ProtectedRoute allowedRoles={['transit', 'admin']} requiredPermission="warehouse"><SplitParcel /></ProtectedRoute>} />
          <Route path="/transit/exceptions" element={<ProtectedRoute allowedRoles={['transit', 'admin']} requiredPermission="warehouse"><TransitExceptions /></ProtectedRoute>} />

          {/* Receiver Routes */}
          <Route path="/receiver" element={<ProtectedRoute allowedRoles={['receiver', 'admin']}><ReceiverHome /></ProtectedRoute>} />
          <Route path="/receiver/check" element={<ProtectedRoute allowedRoles={['receiver', 'admin']} requiredPermission="warehouse"><ReceiverCheck /></ProtectedRoute>} />
          <Route path="/receiver/merge" element={<ProtectedRoute allowedRoles={['receiver', 'admin']} requiredPermission="warehouse"><ReceiverMerge /></ProtectedRoute>} />
          <Route path="/receiver/split" element={<ProtectedRoute allowedRoles={['receiver', 'admin']} requiredPermission="warehouse"><ReceiverSplit /></ProtectedRoute>} />
          <Route path="/receiver/exceptions" element={<ProtectedRoute allowedRoles={['receiver', 'admin']} requiredPermission="warehouse"><ReceiverExceptions /></ProtectedRoute>} />
          <Route path="/receiver/archive" element={<ProtectedRoute allowedRoles={['receiver', 'admin']}><ReceiverArchive /></ProtectedRoute>} />

          {/* Advanced Roles */}
          <Route path="/supervisor/risk" element={<ProtectedRoute allowedRoles={['admin']}><RiskMonitor /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><CompanyManagement /></ProtectedRoute>} />
          <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={['admin']}><BatchManagement /></ProtectedRoute>} />
          <Route path="/admin/bills" element={<ProtectedRoute allowedRoles={['admin']}><AdminBillManagement /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SystemSettings /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>} />
          <Route path="/batch-manager" element={<ProtectedRoute allowedRoles={['admin', 'sender', 'transit', 'receiver']}><BatchManager /></ProtectedRoute>} />

          {/* Finance & Profile Routes */}
          <Route path="/finance" element={<ProtectedRoute requiredPermission="finance"><FinanceHome /></ProtectedRoute>} />
          <Route path="/finance/sender" element={<ProtectedRoute requiredPermission="finance"><SenderFinance /></ProtectedRoute>} />
          <Route path="/finance/transit" element={<ProtectedRoute requiredPermission="finance"><TransitFinance /></ProtectedRoute>} />
          <Route path="/finance/receiver" element={<ProtectedRoute requiredPermission="finance"><ReceiverFinance /></ProtectedRoute>} />
          <Route path="/finance/flow" element={<ProtectedRoute requiredPermission="finance"><FundsFlow /></ProtectedRoute>} />
          <Route path="/finance/bills" element={<ProtectedRoute requiredPermission="finance"><BillList /></ProtectedRoute>} />
          <Route path="/finance/bill/:id" element={<ProtectedRoute><BillDetail /></ProtectedRoute>} />
          <Route path="/finance/bill/completed" element={<ProtectedRoute><BillDetail /></ProtectedRoute>} />
          <Route path="/finance/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
          <Route path="/finance/rates" element={<ProtectedRoute><ExchangeRates /></ProtectedRoute>} />
          <Route path="/finance/admin/pricing" element={<ProtectedRoute><AdminPriceConfig /></ProtectedRoute>} />
          <Route path="/finance/batch-settings/:batchId" element={<ProtectedRoute><BatchBillingSettings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        </Routes>
      </div>
      {!isFullScreenPage && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppContent />
      </HashRouter>
      <Toaster position="top-center" />
    </ErrorBoundary>
  );
};

export default App;
