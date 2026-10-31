import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Lightbulb, 
  Calendar, 
  Settings, 
  LogOut, 
  Camera, 
  Mail, 
  Phone, 
  BookOpen, 
  Save, 
  Plus, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Award,
  Layers,
  ArrowRight,
  Flame,
  Star,
  MessageSquare,
  MessageCircle,
  Code2,
  Compass,
  Scale,
  Ticket,
  MapPin,
  Sparkles,
  Gamepad2,
  Film,
  Copy,
  Check,
  Share2,
  Users
} from 'lucide-react';
import { Navbar } from '../components/Navigation/Navbar';
import { KYCVerificationSection } from '../components/KYC/KYCVerificationSection';
import { ProjectJourneyTracker } from '../components/Journey/ProjectJourneyTracker';
import { IdeaRubricEvaluationModal } from '../components/Admin/IdeaRubricEvaluationModal';
import { authService, openAuthModal } from '../services/authService';
import { hackathonService } from '../services/hackathonService';
import { ideaBoxService } from '../services/ideaBoxService';
import { User, RegistrationSubmission, HackathonTeam, IdeaBoxSubmission, EventItem, FestSubEvent } from '../types';
import { fetchRegistrations } from '../services/supabaseClient';
import { initialEventsData } from '../data/eventsData';

export const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTabParam = searchParams.get('tab') || 'profile';

  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>(activeTabParam);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedJourneyIdeaId, setExpandedJourneyIdeaId] = useState<string | null>(null);
  const [evaluatingIdea, setEvaluatingIdea] = useState<IdeaBoxSubmission | null>(null);
  const [allIdeasForEvaluation, setAllIdeasForEvaluation] = useState<IdeaBoxSubmission[]>([]);

  // Profile Form States
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(user?.semester || 'Semester 4');
  const [collegeId, setCollegeId] = useState(user?.collegeId || '');
  const [institution, setInstitution] = useState(user?.institution || 'Baselios Mathews II College of Engineering');
  const [bio, setBio] = useState(user?.bio || '');
  const [github, setGithub] = useState(user?.github || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [discordHandle, setDiscordHandle] = useState(user?.discordHandle || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  // User Submissions, Hackathon Squad, and IdeaBox
  const [userSubmissions, setUserSubmissions] = useState<RegistrationSubmission[]>([]);
  const [mySquad, setMySquad] = useState<HackathonTeam | null>(null);
  const [myIdeas, setMyIdeas] = useState<IdeaBoxSubmission[]>([]);

  // Events Filter, Passes, and Q&A Modal States
  const [eventsCategoryFilter, setEventsCategoryFilter] = useState<string>('All');
  const [passModalEvent, setPassModalEvent] = useState<EventItem | null>(null);
  const [qaModalEvent, setQaModalEvent] = useState<EventItem | null>(null);
  const [qaQuestion, setQaQuestion] = useState<string>('');
  const [copiedSquadCode, setCopiedSquadCode] = useState(false);

  // Resolved registered events for current user
  const resolvedEvents: EventItem[] = useMemo(() => {
    if (!user) return [];
    const registeredIds = user.registeredEvents || [];
    const normalizedIds = registeredIds.map(id => {
      if (id === 'evt_1') return 'evt-ekah-26';
      if (id === 'evt_2') return 'evt-hackathon-2026';
      if (id === 'evt_3') return 'evt-founders-talk';
      return id;
    });

    const submissionTitles = userSubmissions
      .filter(s => s.type === 'Event' && s.eventName)
      .map(s => s.eventName!.toLowerCase());

    const matched = initialEventsData.filter(event => {
      if (normalizedIds.includes(event.id)) return true;
      if (event.subEvents && event.subEvents.some(s => normalizedIds.includes(s.id) || normalizedIds.includes(`${event.id}:${s.id}`))) return true;
      if (submissionTitles.some(t => event.title.toLowerCase().includes(t) || t.includes(event.title.toLowerCase()))) return true;
      return false;
    });

    if (matched.length === 0) {
      if (user.role === 'ExternalParticipant') {
        return initialEventsData.filter(e => e.id === 'evt-hackathon-2026' || e.id === 'evt-ekah-26');
      }
      return initialEventsData.filter(e => e.id === 'evt-ekah-26' || e.id === 'evt-hackathon-2026');
    }

    return matched;
  }, [user?.registeredEvents, userSubmissions, user?.role]);

  const filteredResolvedEvents = useMemo(() => {
    return resolvedEvents.filter(evt => {
      if (eventsCategoryFilter === 'All') return true;
      if (eventsCategoryFilter === 'Fests') return evt.isMegaFest || evt.category === 'Fests';
      if (eventsCategoryFilter === 'Hackathons') return evt.isHackathon || evt.category === 'Hackathons';
      if (eventsCategoryFilter === 'Talks') return evt.category === 'Talks' || evt.category === 'PanelDiscussion';
      if (eventsCategoryFilter === 'Gaming') return evt.category === 'Gaming';
      if (eventsCategoryFilter === 'Movies') return evt.category === 'Movies' || evt.category === 'MovieShow';
      if (eventsCategoryFilter === 'Workshops') return evt.category === 'Workshops';
      return true;
    });
  }, [resolvedEvents, eventsCategoryFilter]);

  const getEventPassCode = (event: EventItem) => {
    const seed = (user?.collegeId || user?.email || 'PASS').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    const eventPrefix = event.isMegaFest ? 'EKAH26' : event.isHackathon ? 'HACK26' : event.category.slice(0, 4).toUpperCase();
    return `BMCE-${eventPrefix}-${seed || '9042'}`;
  };

  const handleAddToCalendar = (event: EventItem) => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || event.details || '');
    const location = encodeURIComponent(event.location);
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSquadCode(true);
    showToast(`Invite code ${code} copied to clipboard! Share with your teammates.`);
    setTimeout(() => setCopiedSquadCode(false), 2500);
  };

  const handleSubmitQA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) return;
    showToast(`Your question for "${qaModalEvent?.title}" has been submitted to the panel moderators.`);
    setQaQuestion('');
    setQaModalEvent(null);
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsub = authService.onAuthStateChange(updatedUser => {
      setUser(updatedUser);
      if (updatedUser) {
        setFullName(updatedUser.fullName);
        setPhone(updatedUser.phone);
        setDepartment(updatedUser.department);
        setSemester(updatedUser.semester);
        setCollegeId(updatedUser.collegeId);
        setInstitution(updatedUser.institution || 'Baselios Mathews II College of Engineering');
        setBio(updatedUser.bio);
        setDiscordHandle(updatedUser.discordHandle || '');
        setWhatsappNumber(updatedUser.whatsappNumber || '');
        setSkills(updatedUser.skills || []);
        setAvatarUrl(updatedUser.avatar);

        // Load Squad and Ideas
        setMySquad(hackathonService.getUserTeam(updatedUser.id));
        ideaBoxService.getAllIdeas().then(all => {
          setMyIdeas(all.filter(i => i.authorId === updatedUser.id || i.authorEmail.toLowerCase() === updatedUser.email.toLowerCase()));
          setAllIdeasForEvaluation(all);
        });
      }
    });

    if (user) {
      setMySquad(hackathonService.getUserTeam(user.id));
      ideaBoxService.getAllIdeas().then(all => {
        setMyIdeas(all.filter(i => i.authorId === user.id || i.authorEmail.toLowerCase() === user.email.toLowerCase()));
        setAllIdeasForEvaluation(all);
      });
    }

    // Fetch user submissions from registrations
    fetchRegistrations().then(regs => {
      if (user) {
        const filtered = regs.filter(r => 
          r.email?.toLowerCase() === user.email.toLowerCase() ||
          r.fullName?.toLowerCase() === user.fullName.toLowerCase()
        );
        setUserSubmissions(filtered);
      }
    });

    return () => unsub();
  }, [user?.email, user?.fullName, user?.id]);

  // Sync tab with URL
  useEffect(() => {
    if (activeTabParam && activeTabParam !== activeTab) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAvatarPreset = (presetSeed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(presetSeed)}`;
    setAvatarUrl(newAvatar);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      const updated = await authService.updateProfile(user.id, {
        fullName,
        phone,
        department,
        semester,
        collegeId,
        institution,
        bio,
        skills,
        github,
        linkedin,
        discordHandle,
        whatsappNumber,
        avatar: avatarUrl
      });
      setUser(updated);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="profile-page-wrapper">
          <div className="container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
            <div style={{
              maxWidth: '480px',
              margin: '0 auto',
              background: 'var(--bg-card)',
              padding: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(2, 132, 199, 0.1)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <UserIcon size={32} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                Sign In Required
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Please sign in with your college account to view your personal profile, check KYC status, and manage project grants.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={() => openAuthModal('login')}
              >
                Sign In / Join IEDC
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const kycStatus = user.kyc?.status || 'unverified';

  return (
    <>
      <Navbar />

      <main className="profile-page-wrapper">
        <div className="profile-container">

          {/* Toast Notification */}
          {toastMessage && (
            <div style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.85rem 1.4rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              zIndex: 9999,
              animation: 'authFadeIn 0.2s ease-out'
            }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toastMessage}</span>
            </div>
          )}

          {/* =========================================================
              HERO PROFILE CARD
             ========================================================= */}
          <div className="profile-hero-card">
            <div className="profile-hero-inner">
              <div className="profile-hero-left">
                <div className="profile-avatar-container">
                  <img src={user.avatar} alt={user.fullName} className="profile-avatar-img" />
                  <div
                    className="profile-avatar-badge"
                    style={{
                      background: kycStatus === 'verified' ? 'var(--accent-emerald)' :
                                 kycStatus === 'pending' ? 'var(--accent-amber)' : 'var(--accent-rose)'
                    }}
                    title={`KYC Status: ${kycStatus}`}
                  >
                    {kycStatus === 'verified' && <ShieldCheck size={16} />}
                    {kycStatus === 'pending' && <Clock size={16} />}
                    {kycStatus === 'unverified' && <AlertCircle size={16} />}
                  </div>
                </div>

                <div className="profile-hero-meta">
                  <div className="profile-user-name">
                    <span>{user.fullName}</span>
                    <span className="profile-role-tag">{user.role}</span>
                    <span className={`kyc-badge ${kycStatus}`}>
                      {kycStatus === 'verified' && <><ShieldCheck size={14} /> KYC Verified</>}
                      {kycStatus === 'pending' && <><Clock size={14} /> KYC Pending</>}
                      {kycStatus === 'unverified' && <><AlertCircle size={14} /> Unverified KYC</>}
                      {kycStatus === 'rejected' && <><AlertCircle size={14} /> KYC Rejected</>}
                    </span>
                  </div>

                  <div className="profile-user-sub">
                    <span className="profile-meta-item">
                      <BookOpen size={14} />
                      {user.department} • {user.semester}
                    </span>
                    <span className="profile-meta-item">
                      <Mail size={14} />
                      {user.email}
                    </span>
                    {user.collegeId && (
                      <span className="profile-meta-item">
                        ID: {user.collegeId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="profile-stats-strip">
                <div className="profile-stat-box">
                  <span className="profile-stat-val">
                    {myIdeas.length > 0 ? myIdeas.length : userSubmissions.length}
                  </span>
                  <span className="profile-stat-label">IdeaBox Pitches</span>
                </div>
                <div className="profile-stat-box">
                  <span className="profile-stat-val">
                    {resolvedEvents.length}
                  </span>
                  <span className="profile-stat-label">My Events</span>
                </div>
                <div className="profile-stat-box">
                  <span className="profile-stat-val">
                    {mySquad ? 'Active Squad' : (resolvedEvents.some(e => e.isHackathon) ? 'Arena Access' : 'Verified Pass')}
                  </span>
                  <span className="profile-stat-label">Hackathon Access</span>
                </div>
              </div>
            </div>

            {/* Quick Sandbox Persona Switcher (Development Only) */}
            {import.meta.env.VITE_ENABLE_DEMO === 'true' && (
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  ⚡ Test Roles & Persona Sandbox:
                </span>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { authService.quickLoginDemo('rahul'); showToast('Switched to Rahul (Verified Innovator)'); }}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.25)', cursor: 'pointer' }}
                  >
                    Innovator (Rahul)
                  </button>
                  <button
                    type="button"
                    onClick={() => { authService.quickLoginDemo('devika'); showToast('Switched to Devika (Execom Lead)'); }}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', cursor: 'pointer' }}
                  >
                    Execom Lead (Devika)
                  </button>
                  <button
                    type="button"
                    onClick={() => { authService.quickLoginDemo('arun'); showToast('Switched to Arun (External Hackathon Participant)'); }}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.25)', cursor: 'pointer' }}
                  >
                    External Hacker (Arun - TKM)
                  </button>
                  <button
                    type="button"
                    onClick={() => { authService.quickLoginDemo('admin'); showToast('Switched to Dr. Preetha (Nodal Officer / Admin)'); }}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', cursor: 'pointer' }}
                  >
                    Admin (Dr. Preetha)
                  </button>
                  <button
                    type="button"
                    onClick={() => { authService.quickLoginDemo('aditya'); showToast('Switched to Aditya (Unverified Student)'); }}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    Unverified Student (Aditya)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================
              NAVIGATION TABS
             ========================================================= */}
          <div className="profile-tabs-bar">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => switchTab('profile')}
            >
              <UserIcon size={16} />
              Personal Profile
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
              onClick={() => switchTab('kyc')}
            >
              <ShieldCheck size={16} />
              KYC Verification
              {kycStatus === 'unverified' && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-rose)' }} />
              )}
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'events' || activeTab === 'squad' ? 'active' : ''}`}
              onClick={() => switchTab('events')}
            >
              <Calendar size={16} />
              My Events & Passes ({resolvedEvents.length})
              {resolvedEvents.some(e => e.isHackathon) && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} title="Hackathon Workspace Active" />
              )}
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'innovations' ? 'active' : ''}`}
              onClick={() => switchTab('innovations')}
            >
              <Lightbulb size={16} />
              My Innovations ({myIdeas.length > 0 ? myIdeas.length : userSubmissions.length})
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
              onClick={() => {
                switchTab('evaluations');
                ideaBoxService.getAllIdeas().then(setAllIdeasForEvaluation);
              }}
            >
              <Scale size={16} style={{ color: 'var(--accent-cyan)' }} />
              Evaluations Desk
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => switchTab('events')}
            >
              <Calendar size={16} />
              Registered Events
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => switchTab('settings')}
            >
              <Settings size={16} />
              Security & Settings
            </button>
          </div>

          {/* =========================================================
              TAB CONTENT 1: PERSONAL & ACADEMIC PROFILE
             ========================================================= */}
          {activeTab === 'profile' && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <UserIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                    Academic & Personal Information
                  </h3>
                  <p className="profile-panel-desc">
                    Keep your institutional credentials up to date for event certificates and project incubations.
                  </p>
                </div>
                <button
                  type="submit"
                  form="profile-form"
                  className="btn btn-primary"
                  disabled={isSaving}
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>

              {/* Avatar Selector Strip */}
              <div style={{ marginBottom: '1.75rem', padding: '1rem', background: 'rgba(148, 163, 184, 0.06)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem' }}>
                  Choose Avatar Icon Preset:
                </span>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {['BMCE-Tech', 'CyberPioneer', 'BioInnovator', 'AstroMaker', 'RobotArchitect'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAvatarPreset(preset)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        padding: 2,
                        background: avatarUrl.includes(preset) ? 'var(--accent-cyan)' : 'var(--border-color)',
                        border: 'none',
                        cursor: 'pointer',
                        overflow: 'hidden'
                      }}
                      title={`Select ${preset}`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${preset}`}
                        alt={preset}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => handleAvatarPreset(`${user.fullName}-${Date.now()}`)}
                  >
                    Randomize Avatar
                  </button>
                </div>
              </div>

              <form id="profile-form" onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="auth-grid-2">
                  <div className="auth-input-group">
                    <label className="auth-label">Full Name</label>
                    <input
                      type="text"
                      required
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">College Email (Institutional)</label>
                    <input
                      type="email"
                      disabled
                      className="auth-input"
                      style={{ paddingLeft: '1rem', opacity: 0.7, cursor: 'not-allowed' }}
                      value={user.email}
                      title="College email cannot be changed"
                    />
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-input-group">
                    <label className="auth-label">Department</label>
                    <select
                      className="auth-select"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Electrical & Electronics">Electrical & Electronics</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">Current Semester</label>
                    <select
                      className="auth-select"
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-input-group">
                    <label className="auth-label">College Register / Roll Number</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={collegeId}
                      onChange={e => setCollegeId(e.target.value)}
                      placeholder="BMCE/22/CS042"
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Elevator Bio / Interests</label>
                  <textarea
                    rows={3}
                    className="auth-input"
                    style={{ paddingLeft: '1rem', resize: 'vertical' }}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell other students and faculty mentors about your technology passions..."
                  />
                </div>

                {/* Skills Tags */}
                <div className="auth-input-group">
                  <label className="auth-label">Technical & Innovation Skills</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="Add a skill (e.g. IoT, Flutter, CAD, AI/ML, Robotics)"
                      value={newSkillInput}
                      onChange={e => setNewSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddSkill}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>

                  <div className="skill-tags-wrapper">
                    {skills.map(s => (
                      <span key={s} className="skill-tag">
                        {s}
                        <button
                          type="button"
                          className="skill-tag-remove"
                          onClick={() => handleRemoveSkill(s)}
                          title={`Remove ${s}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-input-group">
                    <label className="auth-label">College / Institution Name</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={institution}
                      onChange={e => setInstitution(e.target.value)}
                      placeholder="e.g. Baselios Mathews II College of Engg / TKMCE"
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">WhatsApp Number</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      placeholder="+91 98471 23456"
                    />
                  </div>
                </div>

                <div className="auth-grid-2">
                  <div className="auth-input-group">
                    <label className="auth-label">Discord Username / Tag</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={discordHandle}
                      onChange={e => setDiscordHandle(e.target.value)}
                      placeholder="username#1234 or @discord_handle"
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">GitHub Profile</label>
                    <input
                      type="url"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">LinkedIn Profile</label>
                  <input
                    type="url"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                    style={{ padding: '0.75rem 1.75rem' }}
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 2: KYC VERIFICATION PORTAL
             ========================================================= */}
          {activeTab === 'kyc' && (
            <KYCVerificationSection
              user={user}
              onUserUpdated={updated => {
                setUser(updated);
                showToast('KYC records updated successfully.');
              }}
            />
          )}

          {/* =========================================================
              TAB CONTENT: MY EVENTS & ACCESS PASSES
             ========================================================= */}
          {(activeTab === 'events' || activeTab === 'squad') && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <Calendar size={20} style={{ color: 'var(--accent-cyan)' }} />
                    My Registered Events & Access Passes
                  </h3>
                  <p className="profile-panel-desc">
                    Your confirmed entry passes, live hackathon squads, dedicated festival microsites, talk sessions, gaming tournaments, and movie screenings.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <Link to="/fest/ekah-2026" className="btn btn-fest-launch" style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}>
                    <Sparkles size={15} /> Enter EKAH '26 Fest Portal
                  </Link>
                  <a href="/#events" className="btn btn-outline" style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}>
                    <Calendar size={15} /> Explore All Events
                  </a>
                </div>
              </div>

              {/* Category Filter Pills Bar */}
              <div className="my-events-filter-bar">
                {[
                  { key: 'All', label: 'All Registered', count: resolvedEvents.length },
                  { key: 'Fests', label: 'Mega Fests', count: resolvedEvents.filter(e => e.isMegaFest || e.category === 'Fests').length },
                  { key: 'Hackathons', label: 'Hackathons & Sprints', count: resolvedEvents.filter(e => e.isHackathon || e.category === 'Hackathons').length },
                  { key: 'Talks', label: 'Talks & Panels', count: resolvedEvents.filter(e => e.category === 'Talks' || e.category === 'PanelDiscussion').length },
                  { key: 'Gaming', label: 'LAN Gaming', count: resolvedEvents.filter(e => e.category === 'Gaming').length },
                  { key: 'Movies', label: 'Movie Screenings', count: resolvedEvents.filter(e => e.category === 'Movies' || e.category === 'MovieShow').length },
                  { key: 'Workshops', label: 'Workshops', count: resolvedEvents.filter(e => e.category === 'Workshops').length },
                ].map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`my-events-filter-btn ${eventsCategoryFilter === cat.key ? 'active' : ''}`}
                    onClick={() => setEventsCategoryFilter(cat.key)}
                  >
                    <span>{cat.label}</span>
                    <span className="my-events-filter-count">{cat.count}</span>
                  </button>
                ))}
              </div>

              {/* Event Cards List */}
              {filteredResolvedEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'rgba(148, 163, 184, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <Calendar size={40} style={{ color: 'var(--accent-cyan)', margin: '0 auto 1rem', opacity: 0.6 }} />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    No Events in This Category
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                    You have not registered for any events matching the selected filter. Switch back to "All Registered" or explore upcoming sessions.
                  </p>
                  <button type="button" onClick={() => setEventsCategoryFilter('All')} className="btn btn-outline">
                    View All My Registered Events ({resolvedEvents.length})
                  </button>
                </div>
              ) : (
                <div>
                  {filteredResolvedEvents.map(evt => {
                    const isHack = evt.isHackathon || evt.category === 'Hackathons';
                    const isFest = evt.isMegaFest || evt.category === 'Fests';
                    const isTalk = evt.category === 'Talks' || evt.category === 'PanelDiscussion';
                    const isGaming = evt.category === 'Gaming';
                    const isMovie = evt.category === 'Movies' || evt.category === 'MovieShow';
                    const passCode = getEventPassCode(evt);

                    return (
                      <div
                        key={evt.id}
                        className={`my-event-card ${isFest ? 'fest-card' : isHack ? 'hackathon-card' : ''}`}
                      >
                        {/* Top Category & Status Strip */}
                        <div className="my-event-top-strip">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span className={`my-event-badge ${isFest ? 'fest' : isHack ? 'hackathon' : isTalk ? 'talk' : isGaming ? 'gaming' : isMovie ? 'movie' : 'workshop'}`}>
                              {isFest && <><Sparkles size={13} /> BMCE Mega Fest • 7 Sub-Events</>}
                              {isHack && <><Flame size={13} style={{ color: '#ef4444' }} /> 36H Sprint • Hackathon</>}
                              {isTalk && <><BookOpen size={13} /> Talk Session & Panel</>}
                              {isGaming && <><Gamepad2 size={13} /> LAN Gaming Championship</>}
                              {isMovie && <><Film size={13} /> Tech Movie Night</>}
                              {!isFest && !isHack && !isTalk && !isGaming && !isMovie && <><Award size={13} /> {evt.category}</>}
                            </span>
                            <span className="my-event-pass-token">
                              PASS #{passCode}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                              <CheckCircle2 size={14} /> Confirmed Pass
                            </span>
                          </div>
                        </div>

                        {/* Event Core Info Body */}
                        <div className="my-event-body">
                          <img
                            src={evt.assetImage || evt.fallbackImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                            alt={evt.title}
                            className="my-event-poster"
                          />

                          <div className="my-event-info">
                            <h4 className="my-event-title">{evt.title}</h4>
                            <div className="my-event-meta-row">
                              <span className="my-event-meta-item">
                                <Calendar size={14} style={{ color: 'var(--accent-cyan)' }} />
                                {evt.date}
                              </span>
                              {evt.time && (
                                <span className="my-event-meta-item">
                                  <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
                                  {evt.time}
                                </span>
                              )}
                              <span className="my-event-meta-item">
                                <MapPin size={14} style={{ color: 'var(--accent-cyan)' }} />
                                {evt.location}
                              </span>
                            </div>
                            <p className="my-event-desc">{evt.description}</p>
                          </div>
                        </div>

                        {/* SPECIAL INTEGRATION 1: HACKATHON SQUAD WORKSPACE (Platform Duty) */}
                        {isHack && (
                          <div className="my-event-hackathon-box">
                            <div className="my-event-hackathon-header">
                              <div className="my-event-hackathon-title">
                                <Flame size={18} style={{ color: '#ef4444' }} />
                                <span>Hackathon Squad & Lablab Workspace</span>
                              </div>
                              <Link to="/hackathons" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}>
                                <Flame size={14} /> Enter Live Arena
                              </Link>
                            </div>

                            {mySquad ? (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.8rem' }}>
                                  <div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                                      {mySquad.track}
                                    </span>
                                    <h4 style={{ margin: '0.35rem 0 0.2rem', fontSize: '1.25rem', fontWeight: 900 }}>
                                      {mySquad.name}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                                      {mySquad.tagline}
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', background: 'var(--bg-card)', border: '1px dashed var(--border-color)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                                      Code: <strong>{mySquad.inviteCode}</strong>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyInviteCode(mySquad.inviteCode)}
                                      className="btn btn-outline"
                                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                                      title="Copy Invite Code"
                                    >
                                      {copiedSquadCode ? <Check size={13} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={13} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Teammates Roster */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', margin: '0.8rem 0' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                                    Squad Roster ({mySquad.members.length}/{mySquad.maxMembers} Members)
                                  </div>
                                  <div className="my-event-squad-grid">
                                    {mySquad.members.map(m => (
                                      <div key={m.userId} className="my-event-squad-member">
                                        <img src={m.avatar} alt={m.name} className="my-event-member-avatar" />
                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                          <div style={{ fontWeight: 800, fontSize: '0.84rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {m.name} {m.userId === user?.id && <span style={{ color: 'var(--accent-cyan)' }}>(You)</span>}
                                          </div>
                                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                                            {m.roleInTeam} {m.isLeader && '★ Leader'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Channel links and project submission */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {mySquad.discordInviteUrl && (
                                      <a href={mySquad.discordInviteUrl} target="_blank" rel="noreferrer" className="btn btn-discord" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                                        <MessageSquare size={13} /> Discord Channel
                                      </a>
                                    )}
                                    {mySquad.whatsappGroupUrl && (
                                      <a href={mySquad.whatsappGroupUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                                        <MessageCircle size={13} /> WhatsApp Group
                                      </a>
                                    )}
                                  </div>

                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    Sprint Status: <strong>{mySquad.projectSubmission?.status === 'submitted' ? '✅ Submitted to Jury' : 'Draft in Progress'}</strong>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 0.8rem' }}>
                                  ⚡ <strong>Hackathon Pass Active:</strong> You hold verified entry to this 36-hour sprint. Form or join a squad to access the lablab workspace and submit to the jury.
                                </p>
                                <Link to="/hackathons" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}>
                                  <Users size={14} /> Form or Join Squad
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SPECIAL INTEGRATION 2: MEGA FESTIVAL PORTAL (Platform Duty) */}
                        {isFest && (
                          <div className="my-event-fest-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800, color: '#f3e8ff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <Sparkles size={16} style={{ color: '#ec4899' }} />
                                  Multi-Event Techno-Cultural Carnival Experience
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.84rem', color: '#d8b4fe' }}>
                                  EKAH '26 runs across 3 days with 7 concurrent flagship sub-events. We host a dedicated festival microsite that feels like a separate website while keeping your pass synced.
                                </p>
                              </div>

                              <Link to={`/fest/${evt.festPortalSlug || 'ekah-2026'}`} className="btn btn-fest-launch" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
                                <Sparkles size={15} /> Launch Dedicated Fest Portal →
                              </Link>
                            </div>

                            {/* Sub-events chips */}
                            <div className="my-event-fest-chips">
                              <span className="my-event-fest-chip highlight">⚡ HackBMCE 36H Sprint</span>
                              <span className="my-event-fest-chip highlight">🎮 Apex LAN Gaming</span>
                              <span className="my-event-fest-chip">💡 InnovateX Pitch Battle</span>
                              <span className="my-event-fest-chip">🤖 RoboWars 15kg Derby</span>
                              <span className="my-event-fest-chip">🎬 CineWave Tech Cinema</span>
                              <span className="my-event-fest-chip">🎙️ Founders Unplugged</span>
                              <span className="my-event-fest-chip">🎸 EDM ProShow Night</span>
                            </div>
                          </div>
                        )}

                        {/* SPECIAL INTEGRATION 3: TALK SESSIONS & PANEL DISCUSSIONS */}
                        {isTalk && (
                          <div style={{ background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                  Auditorium Keynote & Interactive Q&A
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  Have a question for the founders or venture capitalists? Submit in advance for priority moderation.
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setQaModalEvent(evt)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  <MessageSquare size={14} /> Submit Question to Panel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCalendar(evt)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  <Calendar size={14} /> Add to Calendar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SPECIAL INTEGRATION 4: LAN GAMING CHAMPIONSHIP */}
                        {isGaming && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                  LAN Zone • Computer Lab 4 Setup
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  Gigabit LAN tournament for Valorant 5v5 and BGMI. Live brackets announced 30 min before match time.
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <a
                                  href="https://discord.gg"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-discord"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  <MessageSquare size={14} /> Esports Voice Discord
                                </a>
                                <button
                                  type="button"
                                  onClick={() => showToast('Match Schedule & Bracket rules downloaded.')}
                                  className="btn btn-outline"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  Tournament Rules
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SPECIAL INTEGRATION 5: MOVIE SCREENING */}
                        {isMovie && (
                          <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                  Starlight Cinema & Refreshment Pass
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  Open-Air Amphitheatre • 07:30 PM • Starlight beanbags & refreshments voucher included with your pass.
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPassModalEvent(evt)}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              >
                                <Ticket size={14} /> View Popcorn & Entry Pass
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Bottom Actions Strip */}
                        <div className="my-event-actions-strip">
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Pass ID: <code style={{ color: 'var(--text-primary)', fontWeight: 700 }}>#{passCode}</code>
                          </div>

                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setPassModalEvent(evt)}
                              className="btn btn-outline"
                              style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}
                            >
                              <Ticket size={14} /> View Digital Pass & QR
                            </button>

                            {isFest && (
                              <Link
                                to={`/fest/${evt.festPortalSlug || 'ekah-2026'}`}
                                className="btn btn-fest-launch"
                                style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}
                              >
                                <Sparkles size={14} /> Open Fest Portal
                              </Link>
                            )}

                            {isHack && (
                              <Link
                                to="/hackathons"
                                className="btn btn-primary"
                                style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}
                              >
                                <Flame size={14} /> Open Arena
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 3: MY INNOVATIONS & SUBMISSIONS
             ========================================================= */}
          {activeTab === 'innovations' && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <Lightbulb size={20} style={{ color: 'var(--accent-amber)' }} />
                    My Submitted Innovations & Project Pitches
                  </h3>
                  <p className="profile-panel-desc">
                    Track the evaluation status of your startup pitches and official admin feedback from BMCE IEDC.
                  </p>
                </div>
                <Link to="/ideabox" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  <Plus size={16} /> Pitch New Startup Idea
                </Link>
              </div>

              {myIdeas.length === 0 && userSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'rgba(148, 163, 184, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <Lightbulb size={40} style={{ color: 'var(--accent-amber)', margin: '0 auto 1rem', opacity: 0.6 }} />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    No Project Pitches Yet
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                    Have an idea for a tech product or hardware prototype? Submit your pitch through the IdeaBox Hub to receive prototyping funds and lab mentorship.
                  </p>
                  <Link to="/ideabox" className="btn btn-primary">
                    Submit Your First Pitch
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* IdeaBox Submissions with Admin Feedback */}
                  {myIdeas.map(idea => (
                    <div key={idea.id} className="profile-idea-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(6, 182, 212, 0.12)',
                            color: 'var(--accent-cyan)',
                            marginRight: '0.6rem'
                          }}>
                            {idea.domain}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Stage: <strong>{idea.stage}</strong> • Submitted: {new Date(idea.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: idea.status === 'Incubation Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: idea.status === 'Incubation Approved' ? '#10b981' : '#f59e0b'
                        }}>
                          {idea.status}
                        </span>
                      </div>

                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        {idea.title}
                      </h4>

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.8rem' }}>
                        {idea.elevatorPitch}
                      </p>

                      {/* Official Admin Feedback Card */}
                      {idea.adminFeedback && (
                        <div style={{
                          background: 'rgba(6, 182, 212, 0.08)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.85rem 1rem',
                          marginTop: '0.75rem',
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <ShieldCheck size={14} /> Official Admin Evaluation Note:
                            </span>
                            {idea.adminRating && (
                              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                                {'★'.repeat(idea.adminRating)} ({idea.adminRating}/5)
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                            "{idea.adminFeedback}"
                          </p>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Signed: <strong>{idea.adminReviewedBy || 'IEDC Nodal Office'}</strong>
                            {idea.incubatorTrackAssigned && (
                              <span style={{ marginLeft: '1rem', color: 'var(--accent-cyan)' }}>
                                Allocated: {idea.incubatorTrackAssigned}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>👍 {idea.upvotes} Upvotes from BMCE community</span>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => setExpandedJourneyIdeaId(expandedJourneyIdeaId === idea.id ? null : idea.id)}
                          >
                            <Compass size={13} />
                            {expandedJourneyIdeaId === idea.id ? 'Close Journey' : 'Track Journey Pipeline'}
                          </button>
                          <Link to="/ideabox" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            View in IdeaBox Hub →
                          </Link>
                        </div>
                      </div>

                      {/* Expandable Journey Tracker */}
                      {expandedJourneyIdeaId === idea.id && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <ProjectJourneyTracker idea={idea} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Standard Registration Pitches */}
                  {userSubmissions.map((sub, idx) => (
                    <div key={sub.id || idx} className="profile-idea-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: sub.type === 'Idea' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                            color: sub.type === 'Idea' ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                            marginRight: '0.6rem'
                          }}>
                            {sub.type} Submission
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'Recently Submitted'}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: sub.status === 'Approved' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                          color: sub.status === 'Approved' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                        }}>
                          {sub.status || 'In Review'}
                        </span>
                      </div>

                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        {sub.eventName || 'Startup Incubation Pitch'}
                      </h4>

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.8rem' }}>
                        {sub.overviewReason}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span><strong>Department:</strong> {sub.department} ({sub.semester})</span>
                        <span><strong>Contact:</strong> {sub.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 4: REGISTERED EVENTS & EUREKA BOOKMARKS
             ========================================================= */}
          {activeTab === 'events' && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <Calendar size={20} style={{ color: 'var(--accent-cyan)' }} />
                    Active Event Registrations & Eureka Passes
                  </h3>
                  <p className="profile-panel-desc">
                    Your digital entry passes for upcoming hackathons, guest lectures, and Eureka newsletter bookmarks.
                  </p>
                </div>
                <Link to="/newsletter" className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                  <BookOpen size={16} /> Open Eureka 3D Library
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Event Pass 1 */}
                <div style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)', background: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                      Confirmed Pass
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginTop: '0.6rem', marginBottom: '0.35rem' }}>
                      Kerala Startup Mission (KSUM) Idea Pitchfest
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Date: October 14, 2026 • BMCE Seminar Hall Alpha
                    </p>
                  </div>
                  <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ticket #{user.collegeId || 'PASS'}-KSUM</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Active Badge</span>
                  </div>
                </div>

                {/* Event Pass 2 */}
                <div style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(2, 132, 199, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                      Workshop
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginTop: '0.6rem', marginBottom: '0.35rem' }}>
                      Rapid 3D Prototyping & PCB Design Lab
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Date: November 05, 2026 • BMCE Maker Space
                    </p>
                  </div>
                  <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ticket #{user.collegeId || 'PASS'}-3D</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Seat Confirmed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 5: SECURITY & SETTINGS
             ========================================================= */}
          {activeTab === 'settings' && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <Settings size={20} style={{ color: 'var(--text-secondary)' }} />
                    Account Security & Session Control
                  </h3>
                  <p className="profile-panel-desc">
                    Manage session credentials, password encryption, and sign out of devices.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                <div style={{ padding: '1.25rem', background: 'rgba(148, 163, 184, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Update Password
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Ensure your account is protected with a secure password containing letters, numbers, and symbols.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="password"
                      placeholder="Current Password"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                    />
                    <input
                      type="password"
                      placeholder="New Secure Password (Min 8 chars)"
                      className="auth-input"
                      style={{ paddingLeft: '1rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => showToast('Password updated securely!')}
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', background: 'rgba(225, 29, 72, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.4rem' }}>
                    Account Session Termination
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    End your active session on this device. You can sign back in at any time.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: 'var(--accent-rose)', borderColor: 'rgba(225, 29, 72, 0.3)' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /> Sign Out of IEDC BMCE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB CONTENT 6: EVALUATIONS & MENTORSHIP DESK
             ========================================================= */}
          {activeTab === 'evaluations' && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <Scale size={20} style={{ color: 'var(--accent-cyan)' }} />
                    Evaluations & Mentorship Desk
                  </h3>
                  <p className="profile-panel-desc">
                    Evaluate campus startup pitches against the 4 standardized KTU / IEDC criteria (Problem Clarity, Technical Feasibility, Market & Societal Impact, Multidisciplinary Team Execution).
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => ideaBoxService.getAllIdeas().then(setAllIdeasForEvaluation)}
                  style={{ fontSize: '0.82rem' }}
                >
                  Refresh Ideas Queue
                </button>
              </div>

              {allIdeasForEvaluation.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'rgba(148, 163, 184, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <Scale size={40} style={{ color: 'var(--accent-cyan)', margin: '0 auto 1rem', opacity: 0.6 }} />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    No Pitches Currently in Review Queue
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                    When student innovators submit ideas to IdeaBox, they will appear here for rubric scoring, feedback, and incubation track assignments.
                  </p>
                  <Link to="/ideabox" className="btn btn-primary">
                    Explore IdeaBox Hub
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {allIdeasForEvaluation.map(idea => {
                    const isGraded = Boolean(idea.adminRating || idea.adminFeedback);

                    return (
                      <div
                        key={idea.id}
                        className="profile-idea-card"
                        style={{ borderLeft: `4px solid ${isGraded ? 'var(--accent-emerald)' : 'var(--accent-cyan)'}` }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                          <div>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(6, 182, 212, 0.12)',
                              color: 'var(--accent-cyan)',
                              marginRight: '0.6rem'
                            }}>
                              {idea.domain}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Stage: <strong>{idea.stage}</strong> • Author: <strong>{idea.authorName}</strong> ({idea.authorDepartment || 'BMCE'})
                            </span>
                          </div>

                          <span style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            background: isGraded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isGraded ? '#10b981' : '#f59e0b'
                          }}>
                            {isGraded ? `Evaluated: ${idea.status}` : idea.status}
                          </span>
                        </div>

                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                          {idea.title}
                        </h4>

                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.8rem' }}>
                          {idea.elevatorPitch}
                        </p>

                        <div style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.84rem',
                          color: 'var(--text-muted)',
                          marginBottom: '1rem',
                          lineHeight: 1.5
                        }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Problem Statement: </strong>
                          {idea.problemStatement}
                        </div>

                        {idea.adminFeedback && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            fontSize: '0.84rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, color: '#10b981' }}>Current Rubric Evaluation:</span>
                              {idea.adminRating && <span style={{ fontWeight: 800, color: '#f59e0b' }}>★ {idea.adminRating} / 5</span>}
                            </div>
                            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>"{idea.adminFeedback}"</p>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={() => setEvaluatingIdea(idea)}
                          >
                            <Scale size={14} />
                            {isGraded ? 'Review / Update Rubric Score' : 'Score with 4-Criterion Rubric'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Rubric Evaluation Modal */}
      {evaluatingIdea && (
        <IdeaRubricEvaluationModal
          idea={evaluatingIdea}
          onClose={() => setEvaluatingIdea(null)}
          onNotify={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 4000);
            ideaBoxService.getAllIdeas().then(setAllIdeasForEvaluation);
          }}
        />
      )}

      {/* Digital Pass Modal */}
      {passModalEvent && user && (
        <div className="event-pass-modal-backdrop" onClick={() => setPassModalEvent(null)}>
          <div className="event-pass-ticket" onClick={e => e.stopPropagation()}>
            <div className="event-pass-header">
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, opacity: 0.9 }}>
                  Official Event Entry Pass
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 900 }}>
                  {passModalEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPassModalEvent(null)}
                style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="event-pass-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="event-pass-field">
                  <div className="event-pass-field-label">Attendee Name</div>
                  <div className="event-pass-field-value">{user.fullName}</div>
                </div>
                <div className="event-pass-field">
                  <div className="event-pass-field-label">Account Role</div>
                  <div className="event-pass-field-value" style={{ color: 'var(--accent-cyan)' }}>{user.role}</div>
                </div>
                <div className="event-pass-field">
                  <div className="event-pass-field-label">Institution / College</div>
                  <div className="event-pass-field-value">{user.institution || 'BMCE Sasthamcotta'}</div>
                </div>
                <div className="event-pass-field">
                  <div className="event-pass-field-label">Roll ID / Reg Number</div>
                  <div className="event-pass-field-value">{user.collegeId || 'KTU/BMCE/REG'}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#94a3b8' }}>Event Date:</span>
                  <strong>{passModalEvent.date}</strong>
                </div>
                {passModalEvent.time && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#94a3b8' }}>Session Time:</span>
                    <strong>{passModalEvent.time}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#94a3b8' }}>Venue Hall:</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{passModalEvent.location}</strong>
                </div>
              </div>

              {/* Barcode Simulation */}
              <div className="event-pass-barcode-sim">
                <div className="event-pass-barcode-lines" />
                <div className="event-pass-barcode-num">
                  *{getEventPassCode(passModalEvent)}*
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#64748b', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Present this tamper-resistant pass at registration desk / hall gates.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.6rem' }}
                >
                  Print / Save Pass
                </button>
                <button
                  type="button"
                  onClick={() => setPassModalEvent(null)}
                  className="btn btn-outline"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speaker Q&A Modal */}
      {qaModalEvent && (
        <div className="event-pass-modal-backdrop" onClick={() => setQaModalEvent(null)}>
          <div className="event-pass-ticket" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="event-pass-header" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                  Speaker Question Desk
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem', fontWeight: 900 }}>
                  {qaModalEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQaModalEvent(null)}
                style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitQA} className="event-pass-body">
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '1rem', lineHeight: 1.5 }}>
                Your question will be forwarded to the stage moderator during the live keynote / panel discussion.
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Your Question for the Speakers:
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={qaQuestion}
                  onChange={e => setQaQuestion(e.target.value)}
                  placeholder="e.g. As an early-stage hardware founder, how do you handle prototype testing before seed funding?"
                  required
                  style={{ width: '100%', resize: 'vertical', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setQaModalEvent(null)}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  Submit Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
