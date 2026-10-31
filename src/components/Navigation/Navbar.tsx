import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Menu, X, BookOpen, User as UserIcon, ShieldCheck, Clock,
  AlertCircle, LogOut, Lightbulb, Settings, Flame, Bell, CheckCheck,
  ChevronDown, Home, Target, Users, MessageSquare, Calendar
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
import { NavbarSearch } from './NavbarSearch';
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
      setIsScrolled(window.scrollY > 30);
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

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  }, [location.pathname]);

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

  const kycStatus = user?.kyc?.status || 'unverified';

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Brand */}
        <Link to="/" className="logo-brand" aria-label="IEDC BMCE Home">
          <img src="/assets/iedc_brand_logo.png" alt="IEDC BMCE Logo" className="logo-img" />
          <div className="brand-text">
            <span className="brand-name">
              IEDC <span className="brand-highlight">BMCE</span>
            </span>
            <span className="brand-sub">Innovation Hub</span>
          </div>
        </Link>

        {/* Desktop Links - Streamlined, Clean Typography */}
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/problems" className={location.pathname === '/problems' ? 'active' : ''}>
              Problems
            </Link>
          </li>
          <li>
            <Link to="/ideabox" className={location.pathname === '/ideabox' ? 'active' : ''}>
              IdeaBox
            </Link>
          </li>
          <li>
            <Link to="/hackathons" className={location.pathname === '/hackathons' ? 'active' : ''}>
              Hackathons
            </Link>
          </li>
          <li>
            <Link to="/mentorship" className={location.pathname === '/mentorship' ? 'active' : ''}>
              Mentorship
            </Link>
          </li>
          <li>
            <Link to="/newsletter" className={location.pathname === '/newsletter' ? 'active' : ''}>
              Eureka
            </Link>
          </li>
          <li>
            <Link to="/forum" className={location.pathname === '/forum' ? 'active' : ''}>
              Forum
            </Link>
          </li>
          {user?.role === 'Admin' || user?.role === 'Execom' ? (
            <li>
              <Link to="/admin" className={`nav-link-admin ${location.pathname === '/admin' ? 'active' : ''}`}>
                Admin
              </Link>
            </li>
          ) : (
            <li>
              <a href="/#events">Events</a>
            </li>
          )}
        </ul>

        {/* Right Actions - Strictly Unified 38px Height */}
        <div className="nav-actions">
          {/* Global Search Box */}
          <NavbarSearch />

          {/* Real-time Notifications Bell with Badge */}
          {user && (
            <div style={{ position: 'relative' }} ref={notifDropdownRef}>
              <button
                type="button"
                className="nav-notif-btn"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Notifications"
                aria-expanded={notifDropdownOpen}
                title="Notifications"
              >
                <Bell size={17} />
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

          {/* User Auth Pill / Sign In Button */}
          {user ? (
            <div className="nav-user-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="nav-user-pill"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User profile menu"
                aria-expanded={userDropdownOpen}
              >
                <img src={user.avatar} alt={user.fullName} className="nav-user-avatar" />
                <span className="nav-user-name">{user.fullName.split(' ')[0]}</span>
                <span className={`nav-user-kyc-dot ${kycStatus}`} title={`KYC: ${kycStatus}`} />
                <ChevronDown size={13} className={`nav-user-chevron ${userDropdownOpen ? 'open' : ''}`} />
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
                    to="/profile?tab=events"
                    className="nav-user-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Calendar size={15} />
                    <span>My Events & Passes</span>
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
              className="btn-nav-auth"
              onClick={() => openAuthModal('login')}
              aria-label="Sign In or Join"
            >
              <UserIcon size={14} />
              <span>Sign In</span>
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
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          {user ? (
            <div className="mobile-drawer-user-card">
              <img src={user.avatar} alt={user.fullName} className="mobile-drawer-avatar" />
              <div className="mobile-drawer-user-info">
                <div className="mobile-drawer-user-name">{user.fullName}</div>
                <div className="mobile-drawer-user-email">{user.email} • {user.role}</div>
              </div>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-drawer-profile-link"
              >
                Profile & KYC →
              </Link>
            </div>
          ) : (
            <div style={{ padding: '0.25rem 0' }}>
              <button
                type="button"
                className="btn-nav-auth"
                style={{ width: '100%', height: '42px' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
              >
                <UserIcon size={16} />
                <span>Sign In / Join IEDC</span>
              </button>
            </div>
          )}

          <div style={{ margin: '0.25rem 0' }}>
            <NavbarSearch onSelectResult={() => setMobileMenuOpen(false)} />
          </div>

          <div className="mobile-drawer-links">
            <span className="mobile-drawer-section-title">Navigation</span>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/' ? 'active' : ''}>
              <Home size={18} /> Home
            </Link>
            <Link to="/problems" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/problems' ? 'active' : ''}>
              <Target size={18} /> Problem Bank
            </Link>
            <Link to="/ideabox" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/ideabox' ? 'active' : ''}>
              <Lightbulb size={18} /> IdeaBox Portal
            </Link>
            <Link to="/hackathons" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/hackathons' ? 'active' : ''}>
              <Flame size={18} /> Hackathon & Squads
            </Link>
            <Link to="/mentorship" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/mentorship' ? 'active' : ''}>
              <Users size={18} /> Mentor Clinics
            </Link>
            <Link to="/newsletter" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/newsletter' ? 'active' : ''}>
              <BookOpen size={18} /> Eureka 3D Library
            </Link>
            <Link to="/forum" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/forum' ? 'active' : ''}>
              <MessageSquare size={18} /> Community Forum
            </Link>
            <a href="/#events" onClick={() => setMobileMenuOpen(false)}>
              <Calendar size={18} /> Events & Workshops
            </a>
            {user && (
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={location.pathname === '/profile' ? 'active' : ''}>
                <UserIcon size={18} /> Student Profile & KYC
              </Link>
            )}
            {(user?.role === 'Admin' || user?.role === 'Execom') && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-cyan)' }} className={location.pathname === '/admin' ? 'active' : ''}>
                <Settings size={18} /> Admin Control Center
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

