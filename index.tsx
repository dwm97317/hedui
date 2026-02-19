import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import './index.css';
import 'material-icons/iconfont/material-icons.css';
import 'material-icons/iconfont/outlined.css';
import 'material-icons/iconfont/round.css';
import 'material-icons/iconfont/sharp.css';
import App from './App';
import VConsole from 'vconsole';
import { queryClient } from './services/queryClient';

// Always init vConsole for debugging black screen issues on PDA
new VConsole();

console.log("React Index Mounting...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("FATAL: Root element #root not found in document body!");
  document.body.innerHTML = "<h1 style='color:white'>Error: Root element missing</h1>";
  throw new Error("Could not find root element to mount to");
}
console.log("Root element found, mounting React app...");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);