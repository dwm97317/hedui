
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { useUserStore } from './store/user.store';
import { useScannerStore } from './store/scanner.store';
import Home from './pages/Home';
import CreateShipment from './pages/CreateShipment';
import History from './pages/History';
import Settings from './pages/Settings';
import TransitHome from './pages/transit/TransitHome';
import TransitCheck from './pages/transit/TransitCheck';
import MergeParcel from './pages/transit/MergeParcel';
import SplitParcel from './pages/transit/SplitParcel';
import TransitExceptions from './pages/transit/TransitExceptions';
import SenderMonitor from './pages/sender/SenderMonitor';
import SentHome from './pages/sender/SentHome';
import ReceiverHome from './pages/receiver/ReceiverHome';
import ReceiverCheck from './pages/receiver/ReceiverCheck';
import ReceiverMerge from './pages/receiver/ReceiverMerge';
import ReceiverSplit from './pages/receiver/ReceiverSplit';
import ReceiverExceptions from './pages/receiver/ReceiverExceptions';
import ReceiverArchive from './pages/receiver/ReceiverArchive';
import BartenderConfig from './pages/BartenderConfig';
import Login from './pages/Login';
import CreateBatch from './pages/CreateBatch';
import RiskMonitor from './pages/supervisor/RiskMonitor';
import BatchManager from './pages/BatchManager';
import FinanceHome from './pages/finance/FinanceHome';
import BillList from './pages/finance/BillList';
import BillDetail from './pages/finance/BillDetail';
import Reconciliation from './pages/finance/Reconciliation';
import ExchangeRates from './pages/finance/ExchangeRates';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import BottomNav from './components/BottomNav';
import BatchDetailPage from './pages/sender/BatchDetailPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { toast, Toaster } from 'react-hot-toast';


const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, fetchUser } = useUserStore();
  const { syncWithNative } = useScannerStore();

  useEffect(() => {
    fetchUser();
    // Sync native configuration on startup
    syncWithNative();
  }, [fetchUser, syncWithNative]);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        signOut();
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
      delete (window as any).scannerLabel;
    };
  }, [navigate, signOut]);

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
    location.pathname.startsWith('/transit') ||
    location.pathname.startsWith('/receiver') ||
    location.pathname.startsWith('/sender') ||
    location.pathname.startsWith('/create') ||
    location.pathname.startsWith('/finance') ||
    location.pathname.startsWith('/supervisor') ||
    location.pathname.startsWith('/batch');

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <div className="flex-1 overflow-y-auto relative z-0 scroller-custom">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<CreateShipment />} />
          <Route path="/create-batch" element={<CreateBatch />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/bartender" element={<BartenderConfig />} />

          <Route
            path="/batch/:id"
            element={
              <ProtectedRoute allowedRoles={['sender', 'transit', 'receiver']}>
                <BatchDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/sender" element={<SentHome />} />
          <Route
            path="/sender/monitor"
            element={<SenderMonitor />}
          />
          <Route path="/transit" element={<TransitHome />} />
          <Route path="/transit/check" element={<TransitCheck />} />
          <Route path="/transit/merge" element={<MergeParcel />} />
          <Route path="/transit/split" element={<SplitParcel />} />
          <Route path="/transit/exceptions" element={<TransitExceptions />} />

          {/* Receiver Routes */}
          <Route path="/receiver" element={<ReceiverHome />} />
          <Route path="/receiver/check" element={<ReceiverCheck />} />
          <Route path="/receiver/merge" element={<ReceiverMerge />} />
          <Route path="/receiver/split" element={<ReceiverSplit />} />
          <Route path="/receiver/exceptions" element={<ReceiverExceptions />} />
          <Route path="/receiver/archive" element={<ReceiverArchive />} />

          {/* Advanced Roles */}
          <Route path="/supervisor/risk" element={<RiskMonitor />} />
          <Route path="/batch-manager" element={<BatchManager />} />

          {/* Finance & Profile Routes */}
          <Route path="/finance" element={<FinanceHome />} />
          <Route path="/finance/bills" element={<BillList />} />
          <Route path="/finance/bill/:id" element={<BillDetail />} />
          <Route path="/finance/bill/completed" element={<BillDetail />} />
          <Route path="/finance/reconciliation" element={<Reconciliation />} />
          <Route path="/finance/rates" element={<ExchangeRates />} />
          <Route path="/profile" element={<Profile />} />
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
