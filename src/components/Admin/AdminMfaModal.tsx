import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { mfaService } from '../../services/mfaService';

interface AdminMfaModalProps {
  email: string;
  role: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminMfaModal: React.FC<AdminMfaModalProps> = ({
  email,
  role,
  onSuccess,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const { secret, otpauthUrl, backupCodes } = mfaService.getOrCreateTotpSecret(email);

  // Time window indicator (30s TOTP rotation)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const sec = now.getSeconds();
      setSecondsRemaining(30 - (sec % 30));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const outcome = mfaService.verifyCode(email, code);
    if (outcome.success) {
      onSuccess();
    } else {
      setErrorMsg(outcome.error || 'Verification failed. Try again.');
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-modal-title"
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#0d1527',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.25)',
          padding: '2rem',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.12)',
            color: '#00d2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            border: '1px solid rgba(0, 242, 254, 0.3)'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 id="mfa-modal-title" style={{ fontSize: '1.35rem', margin: '0 0 4px', color: '#fff' }}>
            Two-Factor Authentication
          </h2>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Role: <strong style={{ color: '#00d2ff' }}>{role}</strong> ({email})
          </div>
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.7rem 0.9rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 6 }}>
              Enter 6-Digit Authenticator Code
            </label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              maxLength={12}
              value={code} 
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. 123456"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '1.4rem',
                letterSpacing: '0.3em',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={12} />
              Code rotates in {secondsRemaining}s
            </span>
            <span>Demo PIN: <code style={{ color: '#38bdf8' }}>123456</code></span>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.7rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{
                flex: 2,
                padding: '0.7rem',
                background: 'linear-gradient(135deg, #00d2ff, #0284c7)',
                border: 'none',
                borderRadius: '8px',
                color: '#0b0f19',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <KeyRound size={16} />
              Verify & Enter
            </button>
          </div>
        </form>

        {/* Setup / Backup codes toggle */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={() => setShowSetup(!showSetup)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showSetup ? 'Hide Authenticator Setup Details' : 'Configure New Authenticator App or View Backup Codes'}
          </button>

          {showSetup && (
            <div style={{
              marginTop: '0.85rem',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.78rem'
            }}>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
                Setup in Google Authenticator / Authy:
              </div>
              <div style={{ color: '#94a3b8', marginBottom: 8 }}>
                Add account with secret key:
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#020617',
                padding: '6px 10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                color: '#38bdf8',
                marginBottom: 10
              }}>
                <span>{secret}</span>
                <button 
                  type="button" 
                  onClick={copySecret}
                  style={{ background: 'none', border: 'none', color: copied ? '#10b981' : '#94a3b8', cursor: 'pointer' }}
                  title="Copy Secret"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
                Emergency Backup Codes:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontFamily: 'monospace', color: '#fef3c7' }}>
                {backupCodes.map((code, idx) => (
                  <span key={idx} style={{ background: '#020617', padding: '2px 6px', borderRadius: '4px' }}>
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
