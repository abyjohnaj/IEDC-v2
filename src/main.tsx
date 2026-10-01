import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';
import './styles/profileAuth.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Progressive Web App Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.location.host.includes('localhost:5173_disable_sw')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA service worker registration skipped or failed:', err);
    });
  });
}
