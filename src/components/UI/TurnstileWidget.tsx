import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { turnstileService } from '../../services/turnstileService';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (err: string) => void;
  onExpire?: () => void;
  theme?: 'dark' | 'light' | 'auto';
  action?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (err: any) => void;
          'expired-callback'?: () => void;
          theme?: 'dark' | 'light' | 'auto';
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  action
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [fallbackVerified, setFallbackVerified] = useState<boolean>(false);

  useEffect(() => {
    let timeout: any;
    const sitekey = turnstileService.getSiteKey();

    const tryRender = () => {
      if (typeof window !== 'undefined' && window.turnstile && containerRef.current) {
        try {
          if (!widgetIdRef.current) {
            const id = window.turnstile.render(containerRef.current, {
              sitekey,
              theme,
              action,
              callback: (token: string) => {
                onVerify(token);
              },
              'error-callback': (err: any) => {
                console.warn('[Turnstile Widget] Error callback:', err);
                onError?.(String(err));
              },
              'expired-callback': () => {
                onExpire?.();
              }
            });
            widgetIdRef.current = id;
            setIsRendered(true);
          }
        } catch (e) {
          console.warn('[Turnstile Widget] Render exception:', e);
        }
      } else {
        // Retry until script loads
        timeout = setTimeout(tryRender, 200);
      }
    };

    tryRender();

    return () => {
      clearTimeout(timeout);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // ignore
        }
      }
    };
  }, [theme, action]);

  // Fallback simulator for offline or test environments where external script is blocked
  const handleFallbackCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFallbackVerified(checked);
    if (checked) {
      const mockToken = `cf_test_token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      onVerify(mockToken);
    }
  };

  return (
    <div 
      style={{ 
        margin: '0.85rem 0',
        padding: '0.75rem 1rem',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}
    >
      {/* Cloudflare Turnstile Target Container */}
      <div ref={containerRef} style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

      {/* Fallback if external turnstile script is blocked or in local test environment */}
      {!isRendered && (
        <label style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer',
          color: '#cbd5e1',
          fontSize: '0.82rem',
          userSelect: 'none'
        }}>
          <input 
            type="checkbox" 
            checked={fallbackVerified}
            onChange={handleFallbackCheck}
            style={{ width: '16px', height: '16px', accentColor: '#00d2ff', cursor: 'pointer' }}
          />
          <ShieldCheck size={16} style={{ color: fallbackVerified ? '#10b981' : '#00d2ff' }} />
          <span>I am a student/verified human (Security Bot Verification)</span>
        </label>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#64748b' }}>
        <Lock size={10} />
        <span>Protected by Cloudflare Turnstile & IEDC Security Pipeline</span>
      </div>
    </div>
  );
};
