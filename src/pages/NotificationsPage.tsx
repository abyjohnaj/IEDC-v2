import React, { useState } from 'react';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { authService, openAuthModal } from '../services/authService';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationPreferences,
  useUpdateNotificationPreference
} from '../hooks/useNotifications';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  Users,
  Clock,
  Trophy,
  ExternalLink,
  Settings,
  X,
  Mail,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../utils/formatTime';
import { NotificationType, NotificationCategory, NotificationChannel } from '../types';
import '../styles/notifications.css';

export const NotificationsPage: React.FC = () => {
  const user = authService.getCurrentUser();
  const userId = user?.id;

  const { data: notifications = [], isLoading } = useNotifications(userId);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(userId);
  const markReadMutation = useMarkNotificationRead(userId);
  const markAllReadMutation = useMarkAllNotificationsRead(userId);

  const { data: preferences = [] } = useNotificationPreferences(userId);
  const updatePrefMutation = useUpdateNotificationPreference(userId);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'kyc' | 'idea' | 'hackathon'>('all');
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="container notifications-page-hero" style={{ minHeight: '60vh', textAlign: 'center', paddingTop: '5rem' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Bell size={48} style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In Required</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Sign in to view your real-time notification alerts, team invitations, and submission milestones.
            </p>
            <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
              Sign In to View Notifications
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.readAt;
    if (activeFilter === 'kyc') return n.type.startsWith('kyc');
    if (activeFilter === 'idea') return n.type.startsWith('idea');
    if (activeFilter === 'hackathon') return n.type.startsWith('hackathon') || n.type.startsWith('team') || n.type === 'results_published';
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'kyc_approved':
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <ShieldCheck size={22} />
          </div>
        );
      case 'kyc_rejected':
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ShieldAlert size={22} />
          </div>
        );
      case 'idea_status_changed':
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Lightbulb size={22} />
          </div>
        );
      case 'team_join_request':
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Users size={22} />
          </div>
        );
      case 'hackathon_deadline_24h':
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
        );
      case 'results_published':
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
            <Trophy size={22} />
          </div>
        );
      default:
        return (
          <div className="notification-card-icon" style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)' }}>
            <Sparkles size={22} />
          </div>
        );
    }
  };

  const isChannelEnabled = (channel: NotificationChannel, type: NotificationCategory): boolean => {
    const pref = preferences.find(p => p.channel === channel && p.type === type);
    return pref ? pref.enabled : true;
  };

  const handleTogglePref = (channel: NotificationChannel, type: NotificationCategory) => {
    const current = isChannelEnabled(channel, type);
    updatePrefMutation.mutate({ channel, type, enabled: !current });
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="container notifications-page-hero">
        {/* Header Box */}
        <div className="notifications-header-box">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h1 className="notifications-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-status-badge unread" style={{ fontSize: '0.8rem', padding: '0.2rem 0.65rem' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="notifications-subtitle">
              Real-time activity alerts, review feedback, team squad requests, and deadline countdowns.
            </p>
          </div>

          <div className="notifications-header-actions">
            {unreadCount > 0 && (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck size={16} />
                <span>Mark all as read</span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setIsPrefsModalOpen(true)}
            >
              <Settings size={15} />
              <span>Preferences</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="notifications-filter-bar">
          <button
            className={`notif-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Alerts ({notifications.length})
          </button>

          <button
            className={`notif-filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread Only ({unreadCount})
          </button>

          <button
            className={`notif-filter-tab ${activeFilter === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveFilter('kyc')}
          >
            KYC Verification
          </button>

          <button
            className={`notif-filter-tab ${activeFilter === 'idea' ? 'active' : ''}`}
            onClick={() => setActiveFilter('idea')}
          >
            IdeaBox Innovations
          </button>

          <button
            className={`notif-filter-tab ${activeFilter === 'hackathon' ? 'active' : ''}`}
            onClick={() => setActiveFilter('hackathon')}
          >
            Hackathon & Squads
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading your activity alerts...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <Bell size={42} style={{ opacity: 0.4, marginBottom: '0.8rem' }} />
              <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                No notifications to display
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                {activeFilter === 'unread'
                  ? 'All caught up! You have zero unread notifications.'
                  : 'You do not have any notifications matching this filter yet.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                className={`notification-card ${!item.readAt ? 'unread' : ''}`}
              >
                {getNotificationIcon(item.type)}

                <div className="notification-card-main">
                  <div className="notification-card-header">
                    <h3 className="notification-card-title">{item.title}</h3>
                    <span className="notification-card-time" title={new Date(item.createdAt).toLocaleString()}>
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  <p className="notification-card-body">{item.body}</p>

                  <div className="notification-card-actions">
                    {item.link && (
                      <Link to={item.link} className="notif-link-btn">
                        <span>Open Details</span>
                        <ExternalLink size={13} />
                      </Link>
                    )}

                    {!item.readAt ? (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}
                        onClick={() => markReadMutation.mutate({ notificationId: item.id })}
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className="notif-status-badge">Read</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Preferences Modal */}
      {isPrefsModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPrefsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Notification Preferences</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Manage delivery channels for in-app alerts and Resend email updates
                </span>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setIsPrefsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div className="preferences-grid">
                {/* Category 1: KYC */}
                <div className="preference-row">
                  <div className="preference-info">
                    <div className="preference-name">KYC Verification & Identity</div>
                    <div className="preference-desc">Approvals, rejections, and administrative verification remarks</div>
                  </div>
                  <div className="preference-toggles">
                    <label className="toggle-label" title="Toggle In-App alerts">
                      <Smartphone size={14} color="var(--accent-cyan)" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('in_app', 'kyc')}
                        onChange={() => handleTogglePref('in_app', 'kyc')}
                      />
                      <span>In-App</span>
                    </label>
                    <label className="toggle-label" title="Toggle Email notifications">
                      <Mail size={14} color="#f59e0b" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('email', 'kyc')}
                        onChange={() => handleTogglePref('email', 'kyc')}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>

                {/* Category 2: Ideas */}
                <div className="preference-row">
                  <div className="preference-info">
                    <div className="preference-name">IdeaBox Innovations & Review Rubric</div>
                    <div className="preference-desc">Status transitions, jury scores, and incubation track decisions</div>
                  </div>
                  <div className="preference-toggles">
                    <label className="toggle-label">
                      <Smartphone size={14} color="var(--accent-cyan)" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('in_app', 'idea')}
                        onChange={() => handleTogglePref('in_app', 'idea')}
                      />
                      <span>In-App</span>
                    </label>
                    <label className="toggle-label">
                      <Mail size={14} color="#f59e0b" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('email', 'idea')}
                        onChange={() => handleTogglePref('email', 'idea')}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>

                {/* Category 3: Teams */}
                <div className="preference-row">
                  <div className="preference-info">
                    <div className="preference-name">Hackathon Squads & Teammate Requests</div>
                    <div className="preference-desc">Incoming builder join requests and team roster updates</div>
                  </div>
                  <div className="preference-toggles">
                    <label className="toggle-label">
                      <Smartphone size={14} color="var(--accent-cyan)" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('in_app', 'team')}
                        onChange={() => handleTogglePref('in_app', 'team')}
                      />
                      <span>In-App</span>
                    </label>
                    <label className="toggle-label">
                      <Mail size={14} color="#f59e0b" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('email', 'team')}
                        onChange={() => handleTogglePref('email', 'team')}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>

                {/* Category 4: Deadlines & Results */}
                <div className="preference-row">
                  <div className="preference-info">
                    <div className="preference-name">Deadline Countdown & Official Results</div>
                    <div className="preference-desc">24-hour submission countdown locks and public leaderboard reveals</div>
                  </div>
                  <div className="preference-toggles">
                    <label className="toggle-label">
                      <Smartphone size={14} color="var(--accent-cyan)" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('in_app', 'hackathon')}
                        onChange={() => handleTogglePref('in_app', 'hackathon')}
                      />
                      <span>In-App</span>
                    </label>
                    <label className="toggle-label">
                      <Mail size={14} color="#f59e0b" />
                      <input
                        type="checkbox"
                        checked={isChannelEnabled('email', 'hackathon')}
                        onChange={() => handleTogglePref('email', 'hackathon')}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button className="btn btn-primary" onClick={() => setIsPrefsModalOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
