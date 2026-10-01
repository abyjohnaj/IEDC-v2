import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { offlineQueueService } from '../../services/offlineQueueService';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(offlineQueueService.isOnline());
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [counts, setCounts] = useState<{ chatCount: number; draftCount: number; total: number }>(
    offlineQueueService.getPendingQueueCounts()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const unsub = offlineQueueService.onStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        setShowReconnected(true);
        timer = setTimeout(() => {
          setShowReconnected(false);
        }, 3500);
      } else {
        setShowReconnected(false);
      }
      setCounts(offlineQueueService.getPendingQueueCounts());
    });

    const handleQueueChange = () => {
      setCounts(offlineQueueService.getPendingQueueCounts());
    };

    window.addEventListener('iedc_offline_queue_changed', handleQueueChange);

    return () => {
      unsub();
      clearTimeout(timer);
      window.removeEventListener('iedc_offline_queue_changed', handleQueueChange);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await offlineQueueService.syncPendingQueues();
      setCounts(offlineQueueService.getPendingQueueCounts());
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div 
        role="status"
        aria-live="polite"
        style={{
          background: 'linear-gradient(90deg, #065f46 0%, #047857 100%)',
          color: '#ecfdf5',
          padding: '0.55rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          zIndex: 9999,
          position: 'sticky',
          top: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        <Wifi size={16} />
        <span>You are back online! Synchronized queued idea drafts and chat messages.</span>
      </div>
    );
  }

  return (
    <div 
      role="alert"
      aria-live="assertive"
      style={{
        background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
        color: '#fef2f2',
        borderBottom: '1px solid #ef4444',
        padding: '0.65rem 1.2rem',
        fontSize: '0.86rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.8rem',
        zIndex: 9999,
        position: 'sticky',
        top: 0,
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <WifiOff size={18} style={{ color: '#fca5a5', flexShrink: 0 }} />
        <span>
          <strong>Offline Mode:</strong> You are currently offline. Viewing cached content. Only idea drafts and team chat messages are queued for sync; other write actions require a network connection.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {counts.total > 0 && (
          <span 
            style={{
              background: 'rgba(0,0,0,0.35)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fef08a'
            }}
          >
            Queued: {counts.draftCount > 0 ? `${counts.draftCount} draft${counts.draftCount > 1 ? 's' : ''}` : ''}
            {counts.draftCount > 0 && counts.chatCount > 0 ? ', ' : ''}
            {counts.chatCount > 0 ? `${counts.chatCount} chat${counts.chatCount > 1 ? 's' : ''}` : ''}
          </span>
        )}

        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '0.25rem 0.65rem',
            fontSize: '0.78rem',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Retry Connection'}
        </button>
      </div>
    </div>
  );
};
