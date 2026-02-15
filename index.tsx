import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import '@fontsource/inter';
import '@fontsource/noto-sans-sc';
import 'material-icons/iconfont/material-icons.css';
import 'material-icons/iconfont/round.css';
import App from './App';
import VConsole from 'vconsole';

// Only init vConsole in production/app environment if needed, 
// or always keep it for PDA debugging.
if (window.location.protocol === 'file:') {
  new VConsole();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" reverseOrder={false} />
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);