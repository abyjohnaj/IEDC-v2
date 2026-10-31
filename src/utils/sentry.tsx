import * as Sentry from '@sentry/react';
import React from 'react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const APP_ENV = import.meta.env.MODE || 'production';
const APP_VERSION = '2.0.0';

let isInitialized = false;

export function initSentry(): void {
  if (isInitialized) return;

  // Initialize Sentry if DSN is provided or in production/staging
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: APP_ENV,
      release: `iedc-bmce@${APP_VERSION}`,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration()
      ],
      // Performance Monitoring
      tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        // Strip out any potential student Aadhaar / PAN numbers from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(b => {
            if (b.message && /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(b.message)) {
              b.message = b.message.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED_AADHAAR]');
            }
            return b;
          });
        }
        return event;
      }
    });

    isInitialized = true;
    console.log(`[Sentry] Initialized error monitoring for environment: ${APP_ENV}`);
  } else {
    // Development fallback mock
    console.log('[Sentry] No VITE_SENTRY_DSN provided. Running with local error reporting.');
  }
}

export function captureException(error: unknown, context?: Record<string, any>): void {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Sentry Local Fallback]', error, context);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry Message:${level}]`, message);
  }
}

export const SentryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#f8fafc',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#151c2c',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', color: '#f87171', margin: '0 0 0.5rem' }}>
              Something unexpected occurred
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Our telemetry system has recorded this incident for the engineering team.
            </p>
            <button
              onClick={resetError}
              style={{
                background: '#00d2ff',
                color: '#0b0f19',
                border: 'none',
                padding: '0.6rem 1.4rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Interface
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
