import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';
import './styles/profileAuth.css';

import { initSentry, SentryErrorBoundary } from './utils/sentry';

initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary>
      <App />
    </SentryErrorBoundary>
  </React.StrictMode>
);

// Register Progressive Web App Service Worker (production only; unregister on localhost to prevent stale caching)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if (window.caches) {
      caches.keys().then(names => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
    try {
      localStorage.removeItem('iedc_events_store');
      localStorage.removeItem('iedc_custom_events');
      localStorage.removeItem('iedc_deleted_events_v2');
    } catch {
      // ignore
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration skipped or failed:', err);
      });
    });
  }
}
