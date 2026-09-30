import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Menu, X, BookOpen, User as UserIcon, ShieldCheck, Clock,
  AlertCircle, LogOut, Lightbulb, Settings, Flame, Bell, CheckCheck
} from 'lucide-react';
import { authService, openAuthModal } from '../../services/authService';
import { User } from '../../types';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from '../../hooks/useNotifications';
import { formatTimeAgo } from '../../utils/formatTime';
import '../../styles/notifications.css';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notifications State & Hooks
  const [notifDropdownOpen, setNotifDropdownOpen] = useState<boolean>(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications(user?.id);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(user?.id);
  const markReadMutation = useMarkNotificationRead(user?.id);
  const markAllReadMutation = useMarkAllNotificationsRead(user?.id);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('iedc-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);

    // Subscribe to auth changes
    const unsub = authService.onAuthStateChange(newUser => {
      setUser(newUser);
    });

    // Handle outside clicks to close dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      unsub();
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('iedc-theme', next);
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    authService.logout();
    navigate('/');
  };

  const isHome = location.pathname === '/';
  const kycStatus = user?.kyc?.status || 'unverified';

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : (isHome ? 'navbar-on-notebook' : '')}`}>
      <div className="container nav-container">
        {/* Brand */}
        <Link to="/" className="logo-brand">
          <img src="/assets/iedc_brand_logo.png" alt="IEDC BMCE Logo" className="logo-img" />
          <div>
            <span className="brand-name">
              IEDC <span style={{ color: 'var(--accent-cyan)' }}>BMCE</span>
            </span>
            <span className="brand-sub">Innovation Hub</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links">
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/ideabox" className={location.pathname === '/ideabox' ? 'active' : ''}>💡 IdeaBox</Link></li>
          <li><Link to="/hackathons" className={location.pathname === '/hackathons' ? 'active' : ''}>🔥 Hackathon & Squads</Link></li>
          <li><Link to="/newsletter" className={location.pathname === '/newsletter' ? 'active' : ''}>📰 Eureka Library</Link></li>
          <li><Link to="/forum" className={location.pathname === '/forum' ? 'active' : ''}>💬 Forum</Link></li>
          {user?.role === 'Admin' || user?.role === 'Execom' ? (
            <li><Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''} style={{ color: 'var(--accent-cyan)' }}>🔒 Admin Suite</Link></li>
          ) : (
            <li><a href="/#events">Events</a></li>
          )}
        </ul>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Direct Link to Eureka 3D Library */}
          <Link
            to="/newsletter"
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            title="Open 3D Eureka Library Shelf"
          >
            <BookOpen size={15} />
            Eureka 3D Shelf
          </Link>

          {/* Real-time Notifications Bell with Badge */}
          {user && (
            <div style={{ position: 'relative' }} ref={notifDropdownRef}>
              <button
                type="button"
                className="nav-notif-btn"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="nav-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <span className="notif-dropdown-title">
                      <Bell size={15} color="var(--accent-cyan)" />
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        className="notif-mark-read-btn"
                        onClick={() => markAllReadMutation.mutate()}
                      >
                        <CheckCheck size={13} style={{ display: 'inline', marginRight: '3px' }} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notif-dropdown-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          className={`notif-dropdown-item ${!n.readAt ? 'unread' : ''}`}
                          onClick={() => {
                            if (!n.readAt) {
                              markReadMutation.mutate({ notificationId: n.id });
                            }
                            setNotifDropdownOpen(false);
                            if (n.link) navigate(n.link);
                          }}
                        >
                          <div className="notif-item-content">
                            <div className="notif-item-title">{n.title}</div>
                            <div className="notif-item-body">{n.body}</div>
                            <div className="notif-item-time">{formatTimeAgo(n.createdAt)}</div>
                          </div>
                          {!n.readAt && <span className="notif-unread-dot" />}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notif-dropdown-footer">
                    <Link
                      to="/notifications"
                      className="notif-dropdown-view-all"
                      onClick={() => setNotifDropdownOpen(false)}
                    >
                      View all notifications &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Auth Pill / Sign In Trigger */}
          {user ? (
            <div className="nav-user-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="nav-user-pill"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User profile menu"
              >
                <img src={user.avatar} alt={user.fullName} className="nav-user-avatar" />
                <span className="nav-user-name">{user.fullName.split(' ')[0]}</span>
                <span className={`nav-user-kyc-dot ${kycStatus}`} title={`KYC: ${kycStatus}`} />
              </button>

              {userDropdownOpen && (
                <div className="nav-user-menu">
                  <div className="nav-user-menu-header">
                    <div className="nav-user-menu-title">{user.fullName}</div>
                    <div className="nav-user-menu-email">{user.email}</div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className={`kyc-badge ${kycStatus}`} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                        {kycStatus === 'verified' && <><ShieldCheck size={12} /> KYC Verified</>}
                        {kycStatus === 'pending' && <><Clock size={12} /> KYC Pending</>}
                        {kycStatus === 'unverified' && <><AlertCircle size={12} /> KYC Unverified</>}
                        {kycStatus === 'rejected' && <><AlertCircle size={12} /> KYC Rejected</>}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserIcon size={15} />
                    <span>My Profile & Portfolio</span>
                  </Link>

                  <Link
                    to="/notifications"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Bell size={15} />
                    <span>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                  </Link>

                  <Link
                    to="/profile?tab=squad"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Flame size={15} style={{ color: '#ef4444' }} />
                    <span>My Hackathon Squad</span>
                  </Link>

                  <Link
                    to="/profile?tab=innovations"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Lightbulb size={15} />
                    <span>My Innovations & Pitches</span>
                  </Link>

                  <Link
                    to="/profile?tab=kyc"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <ShieldCheck size={15} />
                    <span>KYC Verification Hub</span>
                  </Link>

                  {(user.role === 'Admin' || user.role === 'Execom') && (
                    <Link
                      to="/admin"
                      className="nav-user-menu-item"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      <Settings size={15} />
                      <span>Admin Control Center</span>
                    </Link>
                  )}

                  <Link
                    to="/profile?tab=settings"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    className="nav-user-menu-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              onClick={() => openAuthModal('login')}
            >
              <UserIcon size={15} />
              Sign In / Join
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          {user ? (
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email} • {user.role}</div>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.85rem' }}>
                View Full Profile & KYC →
              </Link>
            </div>
          ) : (
            <div style={{ padding: '0.5rem 1rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
              >
                Sign In / Join IEDC
              </button>
            </div>
          )}

          <Link to="/" onClick={() => setMobileMenuOpen(false)}>🏠 Home</Link>
          <Link to="/ideabox" onClick={() => setMobileMenuOpen(false)}>💡 IdeaBox Portal</Link>
          <Link to="/hackathons" onClick={() => setMobileMenuOpen(false)}>🔥 Hackathon & Teams</Link>
          <Link to="/newsletter" onClick={() => setMobileMenuOpen(false)}>📰 Eureka 3D Library</Link>
          <Link to="/forum" onClick={() => setMobileMenuOpen(false)}>💬 Community Forum</Link>
          <a href="/#events" onClick={() => setMobileMenuOpen(false)}>📅 Events & Workshops</a>
          {user && <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>👤 Student Profile & KYC</Link>}
          {(user?.role === 'Admin' || user?.role === 'Execom') && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-cyan)' }}>🔒 Admin Control Center</Link>
          )}
        </div>
      )}
    </header>
  );
};
