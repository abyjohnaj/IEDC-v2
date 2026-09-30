import React, { useState, useEffect } from 'react';
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
  Code2
} from 'lucide-react';
import { Navbar } from '../components/Navigation/Navbar';
import { KYCVerificationSection } from '../components/KYC/KYCVerificationSection';
import { authService, openAuthModal } from '../services/authService';
import { hackathonService } from '../services/hackathonService';
import { ideaBoxService } from '../services/ideaBoxService';
import { User, RegistrationSubmission, HackathonTeam, IdeaBoxSubmission } from '../types';
import { fetchRegistrations } from '../services/supabaseClient';

export const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTabParam = searchParams.get('tab') || 'profile';

  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>(activeTabParam);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        });
      }
    });

    if (user) {
      setMySquad(hackathonService.getUserTeam(user.id));
      ideaBoxService.getAllIdeas().then(all => {
        setMyIdeas(all.filter(i => i.authorId === user.id || i.authorEmail.toLowerCase() === user.email.toLowerCase()));
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
                    {mySquad ? 1 : 0}
                  </span>
                  <span className="profile-stat-label">Hackathon Squad</span>
                </div>
                <div className="profile-stat-box">
                  <span className="profile-stat-val">
                    {user.registeredEvents?.length || 2}
                  </span>
                  <span className="profile-stat-label">Events</span>
                </div>
              </div>
            </div>

            {/* Quick Sandbox Persona Switcher */}
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
              className={`profile-tab-btn ${activeTab === 'squad' ? 'active' : ''}`}
              onClick={() => switchTab('squad')}
            >
              <Flame size={16} style={{ color: '#ef4444' }} />
              Hackathon Squad {mySquad && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />}
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
              TAB CONTENT: HACKATHON SQUAD & LABLAB WORKSPACE
             ========================================================= */}
          {activeTab === 'squad' && (
            <div className="profile-panel-card">
              <div className="profile-panel-header">
                <div>
                  <h3 className="profile-panel-title">
                    <Flame size={20} style={{ color: '#ef4444' }} />
                    My Hackathon Squad & Lablab Workspace
                  </h3>
                  <p className="profile-panel-desc">
                    Your registered team for active national hackathons, live sprint chat room, and project submission pass.
                  </p>
                </div>
                <Link to="/hackathons" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  <Flame size={16} /> Open Hackathon Arena
                </Link>
              </div>

              {mySquad ? (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                        {mySquad.track}
                      </span>
                      <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.4rem', fontWeight: 900 }}>
                        {mySquad.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {mySquad.tagline}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', background: 'var(--bg-card)', border: '1px dashed var(--border-color)', padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-sm)' }}>
                        Code: <strong>{mySquad.inviteCode}</strong>
                      </span>
                      <Link to="/hackathons" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                        <MessageSquare size={14} /> Enter Team Chat
                      </Link>
                    </div>
                  </div>

                  {/* Teammates Roster */}
                  <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Squad Roster ({mySquad.members.length}/{mySquad.maxMembers} Members)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                      {mySquad.members.map(m => (
                        <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <img src={m.avatar} alt={m.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                              {m.name} {m.userId === user?.id && <span style={{ color: 'var(--accent-cyan)' }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              {m.roleInTeam} {m.isLeader && '★ Leader'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* External Groups & Submission */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      {mySquad.discordInviteUrl && (
                        <a href={mySquad.discordInviteUrl} target="_blank" rel="noreferrer" className="btn btn-discord" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <MessageSquare size={14} /> Discord Channel
                        </a>
                      )}
                      {mySquad.whatsappGroupUrl && (
                        <a href={mySquad.whatsappGroupUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <MessageCircle size={14} /> WhatsApp Group
                        </a>
                      )}
                    </div>

                    <div style={{ fontSize: '0.84rem' }}>
                      Project Status: <strong>{mySquad.projectSubmission?.status === 'submitted' ? '✅ Submitted to Jury' : 'Draft in Progress'}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'rgba(148, 163, 184, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <Flame size={40} style={{ color: '#ef4444', margin: '0 auto 1rem', opacity: 0.6 }} />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    No Active Hackathon Squad Yet
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                    Ready for the 36-hour sprint? Browse open squads looking for your skillset, or form your own team in the Lablab Hackathon Portal.
                  </p>
                  <Link to="/hackathons" className="btn btn-primary">
                    <Flame size={16} /> Explore Teams & Register Squad
                  </Link>
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>👍 {idea.upvotes} Upvotes from BMCE community</span>
                        <Link to="/ideabox" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          View in IdeaBox Hub →
                        </Link>
                      </div>
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

        </div>
      </main>
    </>
  );
};
