import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchRegistrations,
  updateRegistrationStatus,
  fetchDiscussions,
  deleteDiscussion,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchAdminKYCSubmissions,
  updateAdminKYCStatus,
  AdminKYCItem
} from '../services/supabaseClient';
import { authService } from '../services/authService';
import { RegistrationSubmission, EventItem, ForumDiscussion } from '../types';
import { AdminExecomRoleManager } from '../components/Admin/AdminExecomRoleManager';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  LogOut,
  Download,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Search,
  CheckCircle,
  Clock,
  Edit3,
  MapPin,
  Tag,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  Ticket,
  Lightbulb,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCheck,
  FileCheck,
  Flame,
  BookOpen
} from 'lucide-react';
import { AdminHackathonSection } from '../components/Admin/AdminHackathonSection';
import { AdminIdeaBoxSection } from '../components/Admin/AdminIdeaBoxSection';
import { AdminReportsSection } from '../components/Admin/AdminReportsSection';
import { AdminNewsletterSection } from '../components/Admin/AdminNewsletterSection';
import '../styles/admin.css';


const IMAGE_PRESETS = [
  { label: 'AI Hackathon', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Robotics', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Web3 & Coding', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80' },
  { label: 'Startup Pitch', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Design & UI/UX', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bootcamp', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' }
];

export const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState('admin@iedcbmce.in');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');

  // Top-level Navigation: Operations, KYC Verifications, Events & Programs, Hackathons, IdeaBox, Reports, Forum, Execom, Newsletter
  const [activeSection, setActiveSection] = useState<'dashboard' | 'kyc' | 'events' | 'hackathon' | 'ideabox' | 'reports' | 'forum' | 'execom' | 'newsletter'>('dashboard');
  
  // Sub-tabs inside Events: Catalog, Registrations & Attendees, Startup Pitches
  const [eventsTab, setEventsTab] = useState<'catalog' | 'registrations' | 'pitches'>('catalog');

  const [registrations, setRegistrations] = useState<RegistrationSubmission[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumDiscussion[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<AdminKYCItem[]>([]);

  // Filter state for KYC Verifications
  const [kycSearch, setKycSearch] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('all');
  const [kycDeptFilter, setKycDeptFilter] = useState('all');
  const [selectedKYCForInspect, setSelectedKYCForInspect] = useState<AdminKYCItem | null>(null);
  const [rejectionModalItem, setRejectionModalItem] = useState<AdminKYCItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [signedDocUrl, setSignedDocUrl] = useState<string | null>(null);

  // Filter state for Events Catalog
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');

  // Filter state for Event Registrations / Attendees
  const [attendeeEventFilter, setAttendeeEventFilter] = useState('all');
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState('all');

  // Filter state for Startup Pitches
  const [pitchSearch, setPitchSearch] = useState('');
  const [pitchStatusFilter, setPitchStatusFilter] = useState('all');

  // Create / Edit Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Workshops');
  const [eventDate, setEventDate] = useState('');
  const [eventStatus, setEventStatus] = useState('Upcoming');
  const [eventLocation, setEventLocation] = useState('IEDC Innovation Hub, BMCE');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [eventImage, setEventImage] = useState(IMAGE_PRESETS[0].url);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('iedc_admin_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadAdminData();
    }
  }, []);

  // Listen for event updates & KYC updates across tabs / components
  useEffect(() => {
    const handleEventsUpdated = async () => {
      const evts = await fetchEvents();
      setEvents(evts);
    };

    const handleKycUpdated = async () => {
      const kycList = await fetchAdminKYCSubmissions();
      setKycSubmissions(kycList);
    };

    window.addEventListener('iedc-events-updated', handleEventsUpdated);
    window.addEventListener('iedc-kyc-updated', handleKycUpdated);
    window.addEventListener('storage', handleEventsUpdated);
    window.addEventListener('storage', handleKycUpdated);
    return () => {
      window.removeEventListener('iedc-events-updated', handleEventsUpdated);
      window.removeEventListener('iedc-kyc-updated', handleKycUpdated);
      window.removeEventListener('storage', handleEventsUpdated);
      window.removeEventListener('storage', handleKycUpdated);
    };
  }, []);

  // Fetch 60-second short-lived signed URL whenever an admin inspects a KYC document
  useEffect(() => {
    let active = true;
    if (selectedKYCForInspect) {
      const path = selectedKYCForInspect.docFilePath;
      if (path && !path.startsWith('http') && !path.startsWith('data:')) {
        authService.getKYCDocSignedUrl(path).then((url: string | null) => {
          if (active) setSignedDocUrl(url);
        });
      } else {
        setSignedDocUrl(selectedKYCForInspect.docFileUrl || null);
      }
    } else {
      setSignedDocUrl(null);
    }
    return () => { active = false; };
  }, [selectedKYCForInspect]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const loadAdminData = async () => {
    const regs = await fetchRegistrations();
    setRegistrations(regs);

    const evts = await fetchEvents();
    setEvents(evts);

    const threads = await fetchDiscussions();
    setForumThreads(threads);

    const kycList = await fetchAdminKYCSubmissions();
    setKycSubmissions(kycList);
  };


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true';

    if (
      isDemoEnabled &&
      (email.toLowerCase() === 'admin@iedcbmce.in' || email.toLowerCase() === 'admin') &&
      password === 'admin123'
    ) {
      sessionStorage.setItem('iedc_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      loadAdminData();
    } else {
      setAuthError(
        isDemoEnabled
          ? 'Invalid administrator credentials. Use demo: admin@iedcbmce.in / admin123'
          : 'Invalid administrator credentials or unauthorized account.'
      );
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('iedc_admin_auth');
    setIsAuthenticated(false);
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    setRegistrations(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
    await updateRegistrationStatus(id, newStatus);
    showNotification('Status updated.');
  };

  const handleDeleteThread = async (id: string) => {
    if (confirm('Are you sure you want to remove this discussion thread?')) {
      setForumThreads(prev => prev.filter(t => t.id !== id));
      await deleteDiscussion(id);
      showNotification('Discussion thread removed.');
    }
  };

  // ==========================================
  // Event Management Handlers
  // ==========================================

  const openCreateEventModal = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventCategory('Workshops');
    setEventDate('Apr 2026');
    setEventStatus('Upcoming');
    setEventLocation('IEDC Innovation Hub, BMCE');
    setEventDesc('');
    setEventDetails('');
    setEventImage(IMAGE_PRESETS[0].url);
    setActiveSection('events');
    setEventsTab('catalog');
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (evt: EventItem) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventCategory(evt.category);
    setEventDate(evt.date);
    setEventStatus(evt.status);
    setEventLocation(evt.location || 'IEDC Innovation Hub, BMCE');
    setEventDesc(evt.description);
    setEventDetails(evt.details || evt.description);
    setEventImage(evt.assetImage || IMAGE_PRESETS[0].url);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      alert('Please enter an event title.');
      return;
    }

    try {
      setIsSubmittingEvent(true);

      const eventPayload: Omit<EventItem, 'id'> = {
        title: eventTitle.trim(),
        category: eventCategory,
        date: eventDate.trim() || 'Upcoming 2026',
        status: eventStatus,
        location: eventLocation.trim() || 'IEDC Hub, BMCE',
        description: eventDesc.trim() || 'Join us for this exciting IEDC session exploring innovation and entrepreneurship.',
        details: eventDetails.trim() || eventDesc.trim() || 'Details, schedule, and prerequisites will be announced.',
        assetImage: eventImage.trim() || IMAGE_PRESETS[0].url,
        fallbackImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'
      };

      if (editingEventId) {
        const updatedItem: EventItem = {
          ...eventPayload,
          id: editingEventId
        };
        await updateEvent(updatedItem);
        setEvents(prev => prev.map(evt => evt.id === editingEventId ? updatedItem : evt));
        showNotification(`✅ Event "${updatedItem.title}" updated successfully!`);
      } else {
        const createdItem = await createEvent(eventPayload);
        setEvents(prev => [createdItem, ...prev.filter(evt => evt.id !== createdItem.id)]);
        showNotification(`🎉 New event "${createdItem.title}" published!`);
      }

      setActiveSection('events');
      setEventsTab('catalog');
      setIsEventModalOpen(false);
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Error saving event: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      await deleteEvent(id);
      setEvents(prev => prev.filter(evt => evt.id !== id));
      showNotification(`🗑️ Event "${title}" deleted.`);
    }
  };

  const handleToggleEventStatus = async (evt: EventItem) => {
    const newStatus = evt.status === 'Upcoming' ? 'Completed' : 'Upcoming';
    const updated: EventItem = { ...evt, status: newStatus };
    await updateEvent(updated);
    setEvents(prev => prev.map(e => e.id === evt.id ? updated : e));
    showNotification(`Event status set to ${newStatus}.`);
  };

  const getRegistrationCountForEvent = (eventTitle: string) => {
    return registrations.filter(
      r => r.type === 'Event' && r.eventName?.toLowerCase().trim() === eventTitle.toLowerCase().trim()
    ).length;
  };

  const handleViewEventAttendees = (eventTitle: string) => {
    setEventsTab('registrations');
    setAttendeeEventFilter(eventTitle);
    setAttendeeSearch('');
  };

  // CSV / JSON Exports
  const exportAttendeesCSV = (items: RegistrationSubmission[], filenamePrefix: string) => {
    if (items.length === 0) return alert('No records to export.');
    const headers = ['Type', 'EventName', 'FullName', 'Email', 'Phone', 'Department', 'Semester', 'OverviewReason', 'Status', 'Date'];
    const rows = items.map(r => [
      `"${r.type}"`,
      `"${r.eventName || ''}"`,
      `"${r.fullName}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.department}"`,
      `"${r.semester}"`,
      `"${(r.overviewReason || '').replace(/"/g, '""')}"`,
      `"${r.status || 'Pending'}"`,
      `"${r.created_at || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}_${Date.now()}.csv`;
    link.click();
  };

  // KYC Handlers & Approvals (Using server-side kyc-decide)
  const handleApproveKYC = async (userId: string, name: string) => {
    await authService.decideKYC(userId, 'verified', undefined, 'Approved by BMCE IEDC Nodal Center. Full Innovation Pass issued.');
    setKycSubmissions(prev => prev.map(k => k.userId === userId ? { ...k, status: 'verified', verifiedAt: new Date().toISOString() } : k));
    showNotification(`✅ Student KYC for "${name}" approved & Innovation Pass issued!`);
  };

  const handleOpenRejectModal = (item: AdminKYCItem) => {
    setRejectionModalItem(item);
    setRejectionReasonInput('Uploaded document photograph was illegible. Please resubmit a clear photo of your student ID card.');
  };

  const handleConfirmRejectKYC = async () => {
    if (!rejectionModalItem) return;
    await authService.decideKYC(rejectionModalItem.userId, 'rejected', rejectionReasonInput, rejectionReasonInput);
    setKycSubmissions(prev => prev.map(k => k.userId === rejectionModalItem.userId ? { ...k, status: 'rejected', rejectionReason: rejectionReasonInput } : k));
    showNotification(`❌ KYC for "${rejectionModalItem.fullName}" marked as Rejected.`);
    setRejectionModalItem(null);
  };

  const handleResetToPendingKYC = async (userId: string, name: string) => {
    await authService.decideKYC(userId, 'pending', undefined, 'Re-evaluation requested by administrator.');
    setKycSubmissions(prev => prev.map(k => k.userId === userId ? { ...k, status: 'pending' } : k));
    showNotification(`🔄 KYC for "${name}" moved back to Pending Review.`);
  };

  const handleBulkApprovePendingKYC = async () => {
    const pending = kycSubmissions.filter(k => k.status === 'pending');
    if (pending.length === 0) {
      alert('No pending student KYC verifications to approve.');
      return;
    }
    if (!confirm(`Are you sure you want to approve all ${pending.length} pending student KYC submissions?`)) return;

    for (const item of pending) {
      await updateAdminKYCStatus(item.userId, 'verified', 'Bulk approved by BMCE IEDC Nodal Center.');
    }
    setKycSubmissions(prev => prev.map(k => k.status === 'pending' ? { ...k, status: 'verified', verifiedAt: new Date().toISOString() } : k));
    showNotification(`🎉 All ${pending.length} pending student KYC verifications approved!`);
  };

  const exportKYCCSV = (items: AdminKYCItem[]) => {
    if (items.length === 0) return alert('No records to export.');
    const headers = ['FullName', 'Email', 'Phone', 'Department', 'Semester', 'CollegeID', 'DocType', 'DocNumber', 'KYCStatus', 'SubmittedAt', 'VerifiedAt', 'RejectionReason'];
    const rows = items.map(k => [
      `"${k.fullName}"`,
      `"${k.email}"`,
      `"${k.phone}"`,
      `"${k.department}"`,
      `"${k.semester}"`,
      `"${k.collegeId}"`,
      `"${k.docType}"`,
      `"${k.docNumber}"`,
      `"${k.status}"`,
      `"${k.submittedAt || ''}"`,
      `"${k.verifiedAt || ''}"`,
      `"${(k.rejectionReason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iedc_kyc_verifications_${Date.now()}.csv`;
    link.click();
  };

  // Filtered KYC Submissions
  const filteredKYC = kycSubmissions.filter(k => {
    const matchStatus = kycStatusFilter === 'all' || k.status === kycStatusFilter;
    const matchDept = kycDeptFilter === 'all' || k.department.toLowerCase().includes(kycDeptFilter.toLowerCase());
    const q = kycSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      k.fullName.toLowerCase().includes(q) ||
      k.email.toLowerCase().includes(q) ||
      k.collegeId.toLowerCase().includes(q) ||
      k.docNumber.toLowerCase().includes(q) ||
      k.department.toLowerCase().includes(q);

    return matchStatus && matchDept && matchQuery;
  });

  const pendingKycCount = kycSubmissions.filter(k => k.status === 'pending').length;
  const verifiedKycCount = kycSubmissions.filter(k => k.status === 'verified').length;
  const rejectedKycCount = kycSubmissions.filter(k => k.status === 'rejected').length;


  // Filtered Events Catalog
  const filteredEvents = events.filter(evt => {
    const matchCategory = eventCategoryFilter === 'all' || evt.category === eventCategoryFilter;
    const matchStatus = eventStatusFilter === 'all' || evt.status === eventStatusFilter;
    const q = eventSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      evt.title.toLowerCase().includes(q) ||
      evt.description.toLowerCase().includes(q) ||
      (evt.location || '').toLowerCase().includes(q) ||
      evt.category.toLowerCase().includes(q);

    return matchCategory && matchStatus && matchQuery;
  });

  // Filtered Attendees (Event passes)
  const eventRegistrations = registrations.filter(r => r.type === 'Event');
  const filteredAttendees = eventRegistrations.filter(r => {
    const matchEvent =
      attendeeEventFilter === 'all' ||
      (r.eventName || '').toLowerCase().trim() === attendeeEventFilter.toLowerCase().trim();
    const matchStatus = attendeeStatusFilter === 'all' || (r.status || 'Pending') === attendeeStatusFilter;
    const q = attendeeSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      (r.eventName || '').toLowerCase().includes(q);

    return matchEvent && matchStatus && matchQuery;
  });

  // Filtered Startup Pitches
  const startupPitches = registrations.filter(r => r.type === 'Idea');
  const filteredPitches = startupPitches.filter(r => {
    const matchStatus = pitchStatusFilter === 'all' || (r.status || 'Pending') === pitchStatusFilter;
    const q = pitchSearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.overviewReason.toLowerCase().includes(q);

    return matchStatus && matchQuery;
  });

  const totalUpcomingEvents = events.filter(e => e.status === 'Upcoming').length;

  if (!isAuthenticated) {
    return (
      <div className="auth-overlay">
        <div className="auth-card">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
          <span className="sidebar-badge">IEDC BMCE Portal</span>
          <h2 style={{ fontSize: '1.6rem', marginTop: '0.4rem', marginBottom: '0.4rem' }}>
            Admin Authentication
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Sign in to access student registrations, startup pitches, and event management controls.
          </p>

          {authError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Administrator Email</label>
              <input
                type="text"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              <Lock size={16} /> Authenticate & Enter Panel
            </button>
          </form>

          <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 Demo Credentials: <code>admin@iedcbmce.in</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Toast notification */}
      {notificationMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(11, 17, 32, 0.95)',
            border: '1px solid var(--accent-cyan)',
            boxShadow: '0 10px 30px rgba(0, 242, 254, 0.25)',
            color: '#fff',
            padding: '0.8rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
          {notificationMsg}
        </div>
      )}

      {/* Sidebar - No separate registrations option; everything is managed under Events & Programs! */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span style={{ fontSize: '1.5rem' }}>🚀</span>
          <div>
            <div className="sidebar-brand-title">
              IEDC <span style={{ color: 'var(--accent-cyan)' }}>BMCE</span>
            </div>
            <span className="sidebar-badge">Control Center</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'kyc' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('kyc')}>
              <ShieldCheck size={18} /> KYC Verifications
              {pendingKycCount > 0 && <span className="admin-badge-count">{pendingKycCount}</span>}
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'events' ? 'active' : ''}`}>
            <button onClick={() => { setActiveSection('events'); setEventsTab('catalog'); }}>
              <Calendar size={18} /> Events & Programs ({events.length})
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'hackathon' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('hackathon')}>
              <Flame size={18} /> Hackathon & Lablab Teams
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'ideabox' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('ideabox')}>
              <Lightbulb size={18} /> IdeaBox Innovations
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'reports' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('reports')}>
              <FileText size={18} /> Reports & Analytics Hub
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'forum' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('forum')}>
              <MessageSquare size={18} /> Forum Threads ({forumThreads.length})
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'newsletter' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('newsletter')}>
              <BookOpen size={18} /> Eureka Newsletter
            </button>
          </li>
          <li className={`menu-item ${activeSection === 'execom' ? 'active' : ''}`}>
            <button onClick={() => setActiveSection('execom')}>
              <Users size={18} /> Execom & Roles
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Admin: <strong>{email.split('@')[0]}</strong>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.6rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
            {activeSection === 'dashboard' && 'Operations Dashboard'}
            {activeSection === 'kyc' && 'Student KYC & Identity Approvals'}
            {activeSection === 'events' && 'Events, Registrations & Pitches Hub'}
            {activeSection === 'hackathon' && 'Hackathon Squads & Lablab Oversight'}
            {activeSection === 'ideabox' && 'IdeaBox Innovation Pipeline & Evaluation'}
            {activeSection === 'reports' && 'Administrative Reports & Required Datasets'}
            {activeSection === 'newsletter' && 'Eureka Newsletter & PDF-to-WebP Engine'}
            {activeSection === 'forum' && 'Community Forum Moderation'}
            {activeSection === 'execom' && 'Executive Committee & Role Appointments'}
          </h2>


          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={openCreateEventModal}>
              <Plus size={15} /> Add New Event
            </button>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} target="_blank">
              <ExternalLink size={14} /> View Live Website
            </Link>
          </div>
        </header>

        <div className="admin-content">
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div>
              <div className="metrics-grid">
                <div
                  className="metric-card"
                  style={{
                    cursor: 'pointer',
                    border: pendingKycCount > 0 ? '1px solid rgba(245, 158, 11, 0.45)' : undefined,
                    boxShadow: pendingKycCount > 0 ? '0 0 15px rgba(245, 158, 11, 0.12)' : undefined
                  }}
                  onClick={() => setActiveSection('kyc')}
                >
                  <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                    🛡️
                  </div>
                  <div>
                    <div className="metric-val">{pendingKycCount}</div>
                    <div className="metric-label">{pendingKycCount > 0 ? 'Pending KYC Reviews' : 'Student KYC Portal'}</div>
                  </div>
                </div>

                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setActiveSection('events'); setEventsTab('registrations'); }}
                >
                  <div className="metric-icon">🎟️</div>
                  <div>
                    <div className="metric-val">{eventRegistrations.length}</div>
                    <div className="metric-label">Event Attendees</div>
                  </div>
                </div>


                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setActiveSection('events'); setEventsTab('pitches'); }}
                >
                  <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
                    💡
                  </div>
                  <div>
                    <div className="metric-val">{startupPitches.length}</div>
                    <div className="metric-label">Startup Idea Pitches</div>
                  </div>
                </div>

                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setActiveSection('events'); setEventsTab('catalog'); }}
                >
                  <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    📅
                  </div>
                  <div>
                    <div className="metric-val">{events.length}</div>
                    <div className="metric-label">{totalUpcomingEvents} Upcoming Events</div>
                  </div>
                </div>

                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveSection('hackathon')}
                >
                  <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    🔥
                  </div>
                  <div>
                    <div className="metric-val">LabLab</div>
                    <div className="metric-label">Hackathon Squads</div>
                  </div>
                </div>

                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveSection('ideabox')}
                >
                  <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    💡
                  </div>
                  <div>
                    <div className="metric-val">IdeaBox</div>
                    <div className="metric-label">Innovation Hub</div>
                  </div>
                </div>

                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveSection('reports')}
                >
                  <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    📊
                  </div>
                  <div>
                    <div className="metric-val">Export</div>
                    <div className="metric-label">Reports & CSVs</div>
                  </div>
                </div>

                <div
                  className="metric-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveSection('forum')}
                >
                  <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    💬
                  </div>
                  <div>
                    <div className="metric-val">{forumThreads.length}</div>
                    <div className="metric-label">Community Threads</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Submissions */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Registrations & Pitches</h3>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                      onClick={() => { setActiveSection('events'); setEventsTab('registrations'); }}
                    >
                      Manage in Events
                    </button>
                  </div>

                  {registrations.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No submissions recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {registrations.slice(0, 5).map((r, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <div>
                            <strong>{r.fullName}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {r.type === 'Idea' ? '💡 Startup Idea Pitch' : `🎟️ ${r.eventName}`} • {r.department}
                            </div>
                          </div>
                          <span className={`status-badge status-${(r.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                            {r.status || 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Controls */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Quick Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      className="btn btn-primary"
                      style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
                      onClick={() => setActiveSection('kyc')}
                    >
                      <ShieldCheck size={16} /> Review KYC Verifications ({pendingKycCount})
                    </button>
                    <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={openCreateEventModal}>
                      <Plus size={16} /> Create New Event
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => { setActiveSection('events'); setEventsTab('pitches'); }}
                    >
                      <Lightbulb size={16} /> Review Startup Pitches ({startupPitches.length})
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => { setActiveSection('events'); setEventsTab('registrations'); }}
                    >
                      <Ticket size={16} /> Review Event Attendees ({eventRegistrations.length})
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => exportAttendeesCSV(registrations, 'iedc_all_submissions')}
                    >
                      <Download size={16} /> Export All Submissions CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: STUDENT KYC VERIFICATIONS & APPROVALS */}
          {activeSection === 'kyc' && (
            <div>
              {/* KYC Metrics Bar */}
              <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="metric-card" style={{ border: pendingKycCount > 0 ? '1px solid rgba(245, 158, 11, 0.45)' : undefined }}>
                  <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="metric-val">{pendingKycCount}</div>
                    <div className="metric-label">Pending Approval</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="metric-val">{verifiedKycCount}</div>
                    <div className="metric-label">Verified Innovators</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="metric-val">{rejectedKycCount}</div>
                    <div className="metric-label">Returned / Rejected</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="metric-val">{kycSubmissions.length}</div>
                    <div className="metric-label">Total Student Profiles</div>
                  </div>
                </div>
              </div>

              {/* Action Filters Bar */}
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ flexGrow: 1, position: 'relative', minWidth: 240 }}>
                  <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={kycSearch}
                    onChange={e => setKycSearch(e.target.value)}
                    placeholder="Search student name, roll number, department, or email..."
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={kycStatusFilter}
                  onChange={e => setKycStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses ({kycSubmissions.length})</option>
                  <option value="pending">⏳ Pending Review ({pendingKycCount})</option>
                  <option value="verified">✅ Verified Innovators ({verifiedKycCount})</option>
                  <option value="rejected">❌ Rejected ({rejectedKycCount})</option>
                  <option value="unverified">⚠️ Unverified</option>
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={kycDeptFilter}
                  onChange={e => setKycDeptFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence">AI & Data Science</option>
                  <option value="Electronics">Electronics (ECE)</option>
                  <option value="Electrical">Electrical (EEE)</option>
                  <option value="Mechanical">Mechanical (ME)</option>
                  <option value="Civil">Civil (CE)</option>
                </select>

                {pendingKycCount > 0 && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                    onClick={handleBulkApprovePendingKYC}
                    title="Bulk verify all currently pending submissions"
                  >
                    <CheckCheck size={16} /> Bulk Approve ({pendingKycCount})
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                  onClick={() => exportKYCCSV(filteredKYC)}
                >
                  <Download size={15} /> Export CSV
                </button>
              </div>

              {/* KYC Table */}
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Member</th>
                      <th>Academic Info</th>
                      <th>Verification Document</th>
                      <th>Status</th>
                      <th>Submitted / Verified</th>
                      <th style={{ textAlign: 'right' }}>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKYC.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                          <ShieldAlert size={36} style={{ margin: '0 auto 0.8rem', opacity: 0.5, display: 'block' }} />
                          No student KYC submissions match the current search & filters.
                        </td>
                      </tr>
                    ) : (
                      filteredKYC.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <img
                                src={item.avatar}
                                alt={item.fullName}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{item.fullName}</strong>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {item.email} {item.phone ? `• ${item.phone}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.department}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {item.semester} • <strong>{item.collegeId || 'Roll N/A'}</strong>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {item.docFileUrl ? (
                                <img
                                  src={item.docFileUrl}
                                  alt="Doc Preview"
                                  className="admin-doc-thumb"
                                  title="Click to inspect ID document in full view"
                                  onClick={() => setSelectedKYCForInspect(item)}
                                />
                              ) : (
                                <div style={{ width: 48, height: 34, borderRadius: 6, background: 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  No File
                                </div>
                              )}
                              <div>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(2, 132, 199, 0.1)',
                                  color: 'var(--accent-cyan)'
                                }}>
                                  {item.docType.replace('_', ' ')}
                                </span>
                                <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600, marginTop: '0.2rem' }}>
                                  {item.docNumber || 'Not submitted'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${item.status}`}>
                              {item.status === 'verified' && 'Verified'}
                              {item.status === 'pending' && 'Pending Review'}
                              {item.status === 'rejected' && 'Rejected'}
                              {item.status === 'unverified' && 'Unverified'}
                            </span>
                            {item.status === 'rejected' && item.rejectionReason && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', marginTop: '0.25rem', maxWidth: 180 }}>
                                "{item.rejectionReason}"
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>
                              {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
                            </div>
                            {item.verifiedAt && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
                                Approved {new Date(item.verifiedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                                onClick={() => setSelectedKYCForInspect(item)}
                                title="Inspect document details"
                              >
                                <Eye size={14} /> Inspect
                              </button>

                              {item.status !== 'verified' && (
                                <button
                                  type="button"
                                  className="btn-approve"
                                  onClick={() => handleApproveKYC(item.userId, item.fullName)}
                                  title="Approve student KYC & issue Innovation Pass"
                                >
                                  <Check size={14} /> Approve
                                </button>
                              )}

                              {item.status !== 'rejected' && (
                                <button
                                  type="button"
                                  className="btn-reject"
                                  onClick={() => handleOpenRejectModal(item)}
                                  title="Reject KYC and request resubmission"
                                >
                                  <X size={14} /> Reject
                                </button>
                              )}

                              {item.status === 'rejected' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                  onClick={() => handleResetToPendingKYC(item.userId, item.fullName)}
                                  title="Move back to Pending Review"
                                >
                                  <RotateCcw size={13} /> Re-review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* SECTION 2: INTEGRATED EVENTS HUB (CATALOG, ATTENDEES & STARTUP PITCHES) */}
          {activeSection === 'events' && (
            <div>
              {/* Sleek Sub-Tabs inside Events with prominent Add New Event Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="admin-subnav" style={{ marginBottom: 0 }}>
                  <button
                    className={`admin-subnav-btn ${eventsTab === 'catalog' ? 'active' : ''}`}
                    onClick={() => setEventsTab('catalog')}
                  >
                    <Calendar size={15} />
                    Events Catalog
                    <span className="admin-subnav-badge">{events.length}</span>
                  </button>

                  <button
                    className={`admin-subnav-btn ${eventsTab === 'registrations' ? 'active' : ''}`}
                    onClick={() => setEventsTab('registrations')}
                  >
                    <Ticket size={15} />
                    Attendee Passes & Registrations
                    <span className="admin-subnav-badge">{eventRegistrations.length}</span>
                  </button>

                  <button
                    className={`admin-subnav-btn ${eventsTab === 'pitches' ? 'active' : ''}`}
                    onClick={() => setEventsTab('pitches')}
                  >
                    <Lightbulb size={15} />
                    Startup Idea Pitches
                    <span className="admin-subnav-badge">{startupPitches.length}</span>
                  </button>
                </div>

                <button className="btn btn-primary" onClick={openCreateEventModal}>
                  <Plus size={16} /> Add New Event
                </button>
              </div>

              {/* SUB-VIEW A: EVENTS CATALOG */}
              {eventsTab === 'catalog' && (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', flexGrow: 1, maxWidth: 650 }}>
                      <div style={{ flexGrow: 1, position: 'relative', minWidth: 220 }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: '2.5rem' }}
                          value={eventSearch}
                          onChange={e => setEventSearch(e.target.value)}
                          placeholder="Search event title, venue, keywords..."
                        />
                      </div>

                      <select
                        className="form-select"
                        style={{ width: 'auto' }}
                        value={eventCategoryFilter}
                        onChange={e => setEventCategoryFilter(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        <option value="Workshops">Workshops</option>
                        <option value="Bootcamps">Bootcamps</option>
                        <option value="Fests">Fests</option>
                        <option value="Orientation">Orientation</option>
                      </select>

                      <select
                        className="form-select"
                        style={{ width: 'auto' }}
                        value={eventStatusFilter}
                        onChange={e => setEventStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="Upcoming">Upcoming Only</option>
                        <option value="Completed">Completed Only</option>
                      </select>
                    </div>

                    <button className="btn btn-primary" onClick={openCreateEventModal}>
                      <Plus size={16} /> Create New Event
                    </button>
                  </div>

                  {filteredEvents.length === 0 ? (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                      <h3>No events match your current filter.</h3>
                      <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem' }}>Try clearing the search query or category filters.</p>
                      <button className="btn btn-secondary" onClick={() => { setEventSearch(''); setEventCategoryFilter('all'); setEventStatusFilter('all'); }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                      {filteredEvents.map(evt => {
                        const regCount = getRegistrationCountForEvent(evt.title);
                        return (
                          <div key={evt.id} className="glass-card admin-event-card">
                            <div style={{ position: 'relative' }}>
                              <img
                                src={evt.assetImage}
                                alt={evt.title}
                                className="admin-event-poster"
                                onError={e => {
                                  (e.currentTarget as HTMLImageElement).src = evt.fallbackImage;
                                }}
                              />
                              <span
                                className="eureka-badge"
                                style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', marginBottom: 0, backdropFilter: 'blur(8px)', background: 'rgba(11, 17, 32, 0.85)' }}
                              >
                                {evt.category}
                              </span>
                              <span
                                className={`status-badge status-${evt.status.toLowerCase()}`}
                                style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', backdropFilter: 'blur(8px)' }}
                              >
                                {evt.status}
                              </span>
                            </div>

                            <div className="admin-event-content">
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                                <Calendar size={13} style={{ color: 'var(--accent-cyan)' }} />
                                {evt.date}
                              </div>

                              <h3 style={{ fontSize: '1.15rem', lineHeight: 1.3, marginBottom: '0.5rem', color: '#fff' }}>
                                {evt.title}
                              </h3>

                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem', flexGrow: 1 }}>
                                {evt.description}
                              </p>

                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
                                <MapPin size={13} />
                                {evt.location}
                              </div>

                              {/* Attendee Roster Jump Button */}
                              <div style={{ marginBottom: '1rem' }}>
                                <button
                                  type="button"
                                  className="admin-reg-badge-btn"
                                  onClick={() => handleViewEventAttendees(evt.title)}
                                  title={`Manage ${regCount} attendees registered for this event`}
                                >
                                  🎟️ Manage Attendees ({regCount})
                                  <ArrowRight size={12} />
                                </button>
                              </div>

                              {/* Action Buttons */}
                              <div className="admin-event-actions">
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem', flexGrow: 1, justifyContent: 'center' }}
                                  onClick={() => openEditEventModal(evt)}
                                >
                                  <Edit3 size={14} /> Edit
                                </button>

                                <button
                                  className="btn btn-secondary"
                                  style={{
                                    padding: '0.45rem 0.8rem',
                                    fontSize: '0.82rem',
                                    color: evt.status === 'Upcoming' ? '#10b981' : '#f59e0b',
                                    borderColor: evt.status === 'Upcoming' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                                  }}
                                  onClick={() => handleToggleEventStatus(evt)}
                                  title={evt.status === 'Upcoming' ? 'Mark as Completed' : 'Mark as Upcoming'}
                                >
                                  {evt.status === 'Upcoming' ? 'Mark Done' : 'Reactivate'}
                                </button>

                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.45rem 0.7rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                  onClick={() => handleDeleteEvent(evt.id, evt.title)}
                                  title="Delete Event"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW B: ATTENDEE PASSES & REGISTRATIONS */}
              {eventsTab === 'registrations' && (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                    {/* Event Selector Dropdown */}
                    <div style={{ minWidth: 200 }}>
                      <select
                        className="form-select"
                        value={attendeeEventFilter}
                        onChange={e => setAttendeeEventFilter(e.target.value)}
                      >
                        <option value="all">🎟️ All Events ({eventRegistrations.length})</option>
                        {events.map(evt => (
                          <option key={evt.id} value={evt.title}>
                            {evt.title} ({getRegistrationCountForEvent(evt.title)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flexGrow: 1, position: 'relative', minWidth: 220 }}>
                      <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={attendeeSearch}
                        onChange={e => setAttendeeSearch(e.target.value)}
                        placeholder="Search student name, email, department..."
                      />
                    </div>

                    <select
                      className="form-select"
                      style={{ width: 'auto' }}
                      value={attendeeStatusFilter}
                      onChange={e => setAttendeeStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="In Review">In Review</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    {attendeeEventFilter !== 'all' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.55rem 0.8rem' }}
                        onClick={() => setAttendeeEventFilter('all')}
                      >
                        Show All Events
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.55rem 1rem' }}
                      onClick={() => exportAttendeesCSV(filteredAttendees, 'iedc_event_attendees')}
                    >
                      <Download size={15} /> CSV
                    </button>
                  </div>

                  <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student & Contact</th>
                          <th>Event Name</th>
                          <th>Department & Semester</th>
                          <th>Status Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendees.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                              No event attendee registrations found matching the selected filter.
                            </td>
                          </tr>
                        ) : (
                          filteredAttendees.map((r, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong>{r.fullName}</strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.email} • {r.phone}</div>
                              </td>
                              <td style={{ maxWidth: 280 }}>
                                <span className="eureka-badge" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginBottom: '0.3rem', display: 'inline-block' }}>
                                  {r.eventName || 'General Event'}
                                </span>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {r.overviewReason || 'Standard Registration'}
                                </div>
                              </td>
                              <td>
                                {r.department} ({r.semester})
                              </td>
                              <td>
                                <select
                                  className="form-select"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', width: 'auto' }}
                                  value={r.status || 'Pending'}
                                  onChange={e => handleStatusChange(r.id!, e.target.value)}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Review">In Review</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-VIEW C: STARTUP IDEA PITCHES */}
              {eventsTab === 'pitches' && (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div style={{ flexGrow: 1, position: 'relative', minWidth: 260 }}>
                      <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={pitchSearch}
                        onChange={e => setPitchSearch(e.target.value)}
                        placeholder="Search founder name, email, department, pitch problem statement..."
                      />
                    </div>

                    <select
                      className="form-select"
                      style={{ width: 'auto' }}
                      value={pitchStatusFilter}
                      onChange={e => setPitchStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Review">In Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.55rem 1rem' }}
                      onClick={() => exportAttendeesCSV(filteredPitches, 'iedc_startup_pitches')}
                    >
                      <Download size={15} /> Export Pitches CSV
                    </button>
                  </div>

                  <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Founder & Contact</th>
                          <th>Startup Pitch / Concept Overview</th>
                          <th>Department & Sem</th>
                          <th>Incubation Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPitches.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                              No startup idea pitches recorded matching the criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredPitches.map((r, idx) => (
                            <tr key={idx}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '1.1rem' }}>💡</span>
                                  <strong>{r.fullName}</strong>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.email} • {r.phone}</div>
                              </td>
                              <td style={{ maxWidth: 380 }}>
                                <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4, background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                  "{r.overviewReason}"
                                </div>
                              </td>
                              <td>
                                {r.department} ({r.semester})
                              </td>
                              <td>
                                <select
                                  className="form-select"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', width: 'auto' }}
                                  value={r.status || 'Pending'}
                                  onChange={e => handleStatusChange(r.id!, e.target.value)}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Review">In Review</option>
                                  <option value="Approved">Approved (Selected)</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: FORUM MODERATION */}
          {activeSection === 'forum' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>Active Discussion Threads</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {forumThreads.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <span className="eureka-badge" style={{ marginBottom: 0, padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                          {t.channel}
                        </span>
                        <strong>{t.title}</strong>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        By {t.authorName} ({t.authorRole}) • {t.upvotes} upvotes • {t.comments?.length || 0} replies
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.7rem' }}
                      onClick={() => handleDeleteThread(t.id)}
                      title="Delete Thread"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: HACKATHONS & LABLAB TEAMS */}
          {activeSection === 'hackathon' && (
            <AdminHackathonSection onNotify={showNotification} />
          )}

          {/* SECTION: IDEABOX INNOVATIONS */}
          {activeSection === 'ideabox' && (
            <AdminIdeaBoxSection onNotify={showNotification} />
          )}

          {/* SECTION: ADMINISTRATIVE REPORTS & ANALYTICS */}
          {activeSection === 'reports' && (
            <AdminReportsSection onNotify={showNotification} />
          )}

          {/* SECTION: NEWSLETTER & PDF-TO-WEBP PIPELINE */}
          {activeSection === 'newsletter' && (
            <AdminNewsletterSection />
          )}

          {/* SECTION 4: EXECOM TEAM & ROLE SELECTION */}
          {activeSection === 'execom' && (
            <AdminExecomRoleManager onNotify={showNotification} />
          )}
        </div>
      </main>

      {/* CREATE & EDIT EVENT MODAL */}
      {isEventModalOpen && (
        <div
          className="modal-overlay active"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '1.5rem',
            opacity: 1,
            visibility: 'visible'
          }}
          onClick={() => setIsEventModalOpen(false)}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0d1527',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 242, 254, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              position: 'relative',
              opacity: 1,
              visibility: 'visible'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  {editingEventId ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                    {editingEventId ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {editingEventId ? 'Modify event parameters and publish updates.' : 'Add a workshop, hackathon, or bootcamp to the official calendar.'}
                  </div>
                </div>
              </div>

              <button
                className="modal-close"
                style={{ position: 'static' }}
                onClick={() => setIsEventModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="e.g. Next-Gen Generative AI Hackathon"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={eventCategory}
                    onChange={e => setEventCategory(e.target.value)}
                  >
                    <option value="Workshops">Workshops</option>
                    <option value="Bootcamps">Bootcamps</option>
                    <option value="Fests">Fests</option>
                    <option value="Orientation">Orientation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={eventStatus}
                    onChange={e => setEventStatus(e.target.value)}
                  >
                    <option value="Upcoming">Upcoming (Active Registration)</option>
                    <option value="Completed">Completed (Past Event)</option>
                    <option value="Featured">Featured Spotlight</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    placeholder="e.g. Apr 22, 2026 • 10:00 AM"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Venue *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventLocation}
                    onChange={e => setEventLocation(e.target.value)}
                    placeholder="e.g. Seminar Hall / IEDC Maker Lab"
                    required
                  />
                </div>
              </div>

              {/* Poster Image URL & Quick Preset Thumbnails */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Banner Poster Image URL</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click preset below or paste custom URL</span>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={eventImage}
                  onChange={e => setEventImage(e.target.value)}
                  placeholder="Paste image URL (or click a preset below)..."
                />

                {/* Preset image selector chips */}
                <div className="admin-image-preset-grid">
                  {IMAGE_PRESETS.map((preset, idx) => (
                    <div
                      key={idx}
                      className={`admin-image-preset-chip ${eventImage === preset.url ? 'active' : ''}`}
                      onClick={() => setEventImage(preset.url)}
                      title={`Select ${preset.label}`}
                    >
                      <img src={preset.url} alt={preset.label} />
                      <div className="admin-image-preset-label">{preset.label}</div>
                    </div>
                  ))}
                </div>

                {/* Live image preview */}
                <div className="admin-preview-box">
                  <img
                    src={eventImage}
                    alt="Event Poster Preview"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = IMAGE_PRESETS[0].url;
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description (for card preview)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={eventDesc}
                  onChange={e => setEventDesc(e.target.value)}
                  placeholder="Provide an engaging 1-2 sentence overview of the event..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Agenda / Learning Modules</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={eventDetails}
                  onChange={e => setEventDetails(e.target.value)}
                  placeholder="Eligibility, prerequisite knowledge, schedule outline, mentorship details..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEventModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingEvent}
                >
                  {isSubmittingEvent ? 'Saving...' : editingEventId ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KYC DOCUMENT INSPECTOR */}
      {selectedKYCForInspect && (

        <div className="kyc-inspect-modal" onClick={() => setSelectedKYCForInspect(null)}>
          <div className="kyc-inspect-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <img
                  src={selectedKYCForInspect.avatar}
                  alt={selectedKYCForInspect.fullName}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    {selectedKYCForInspect.fullName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedKYCForInspect.email} • {selectedKYCForInspect.department}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.65rem' }}
                onClick={() => setSelectedKYCForInspect(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Document Proof Viewer */}
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Submitted Document Proof ({selectedKYCForInspect.docType.replace('_', ' ').toUpperCase()})
                </span>
                <div style={{
                  marginTop: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  background: '#0b1120',
                  textAlign: 'center',
                  maxHeight: '340px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {signedDocUrl ? (
                    signedDocUrl.toLowerCase().includes('.pdf') ? (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <FileText size={48} style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          PDF Document Proof
                        </div>
                        <a
                          href={signedDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <ExternalLink size={14} /> Open PDF in Secure Viewer
                        </a>
                      </div>
                    ) : (
                      <img
                        src={signedDocUrl}
                        alt="Student ID Document"
                        style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain' }}
                      />
                    )
                  ) : (
                    <div style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                      {selectedKYCForInspect.docFilePath ? 'Generating secure 60s signed preview...' : 'No document proof attached.'}
                    </div>
                  )}
                </div>
                {signedDocUrl && (
                  <div style={{ textAlign: 'right', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={13} /> Temporary signed access (60s expiry)
                    </span>
                    <a
                      href={signedDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <ExternalLink size={13} /> Open in New Tab
                    </a>
                  </div>
                )}
              </div>

              {/* Document Metadata Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(148, 163, 184, 0.06)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Document Number</div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>{selectedKYCForInspect.docNumber || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>College Roll No</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedKYCForInspect.collegeId || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Semester</div>
                  <div style={{ fontWeight: 600 }}>{selectedKYCForInspect.semester}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Status</div>
                  <div>
                    <span className={`status-badge ${selectedKYCForInspect.status}`} style={{ fontSize: '0.78rem' }}>
                      {selectedKYCForInspect.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Contact</div>
                  <div style={{ fontWeight: 600 }}>{selectedKYCForInspect.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Institution</div>
                  <div style={{ fontSize: '0.84rem' }}>{selectedKYCForInspect.institution || 'BMCE'}</div>
                </div>
              </div>

              {selectedKYCForInspect.adminRemarks && (
                <div style={{ padding: '0.8rem', background: 'rgba(2, 132, 199, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Admin Remarks:</strong> {selectedKYCForInspect.adminRemarks}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedKYCForInspect(null)}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {selectedKYCForInspect.status !== 'rejected' && (
                  <button
                    type="button"
                    className="btn-reject"
                    onClick={() => {
                      const item = selectedKYCForInspect;
                      setSelectedKYCForInspect(null);
                      handleOpenRejectModal(item);
                    }}
                  >
                    <X size={15} /> Reject Documentation
                  </button>
                )}

                {selectedKYCForInspect.status !== 'verified' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                    onClick={() => {
                      const item = selectedKYCForInspect;
                      handleApproveKYC(item.userId, item.fullName);
                      setSelectedKYCForInspect({ ...item, status: 'verified', verifiedAt: new Date().toISOString() });
                    }}
                  >
                    <Check size={16} /> Approve & Grant Innovation Pass
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KYC REJECTION REASON PROMPT */}
      {rejectionModalItem && (
        <div className="kyc-inspect-modal" onClick={() => setRejectionModalItem(null)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Reject KYC - {rejectionModalItem.fullName}
              </h3>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Please specify the reason for rejection. This explanation will be displayed to the student in their KYC portal so they can correct and resubmit:
              </p>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Quick Preset Reasons:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {[
                    'Uploaded document photograph was illegible or blurry. Please resubmit a clear photo.',
                    'College roll number does not match KTU enrollment records.',
                    'Submitted document is expired or missing the institutional seal.',
                    'Document photo does not show front and back clearly.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={{
                        padding: '0.4rem 0.7rem',
                        fontSize: '0.78rem',
                        textAlign: 'left',
                        background: 'rgba(148, 163, 184, 0.08)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setRejectionReasonInput(preset)}
                    >
                      • {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Custom Rejection Instructions</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  placeholder="Explain what the student needs to fix..."
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectionModalItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleConfirmRejectKYC}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

