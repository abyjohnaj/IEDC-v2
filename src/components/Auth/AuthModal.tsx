import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, BookOpen, ShieldCheck, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
  onSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('Semester 4');
  const [collegeId, setCollegeId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialTab, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your college or registered email.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(loginEmail, loginPassword);
      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
        setTimeout(() => {
          onSuccess?.(res.user!);
          onClose();
        }, 400);
      } else {
        setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !signupEmail.trim() || !phone.trim() || !collegeId.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the IEDC BMCE Student Code of Conduct.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signup({
        fullName,
        email: signupEmail,
        phone,
        department,
        semester,
        collegeId,
        password: signupPassword,
        role: 'Student'
      });

      if (res.success && res.user) {
        setSuccessMsg(`Account created successfully! Welcome to IEDC BMCE, ${res.user.fullName}.`);
        setTimeout(() => {
          onSuccess?.(res.user!);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoKey: 'rahul' | 'anjana' | 'aditya' | 'devika' | 'arun' | 'admin') => {
    const user = authService.quickLoginDemo(demoKey);
    setSuccessMsg(`Switched to demo account: ${user.fullName} (${user.role})`);
    setTimeout(() => {
      onSuccess?.(user);
      onClose();
    }, 350);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <button className="auth-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
          <div className="auth-brand-badge">
            <Sparkles size={13} />
            BMCE Innovation Hub
          </div>
          <h2 className="auth-modal-title">
            {activeTab === 'login' ? 'Sign In to Your Account' : 'Join IEDC Innovation Hub'}
          </h2>
          <p className="auth-modal-desc">
            {activeTab === 'login'
              ? 'Access project grant trackers, Eureka library passes, and student KYC portal.'
              : 'Register to incubate ideas, join workshops, and access the BMCE Maker Lab.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs-nav">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
          >
            <Lock size={15} />
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
          >
            <UserIcon size={15} />
            Create Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="auth-modal-body">
          {errorMsg && (
            <div className="auth-alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-emerald)',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Login Helper Box */}
          <div className="auth-demo-box">
            <div className="auth-demo-title">
              <ShieldCheck size={14} />
              Instant Sandbox Demo Logins
            </div>
            <div className="auth-demo-chips">
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('rahul')}
                title="Sign in as Rahul Verma (KYC Verified Innovator)"
              >
                ⚡ Rahul (Innovator)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('devika')}
                title="Sign in as Devika Suresh (Execom Student Lead)"
              >
                ⚡ Devika (Execom Lead)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('arun')}
                title="Sign in as Arun Kumar (External Hackathon Participant from TKM)"
              >
                ⚡ Arun (External Hacker)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('admin')}
                title="Sign in as Dr. Preetha M. (IEDC Nodal Officer / Admin)"
              >
                ⚡ Dr. Preetha (Admin)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('anjana')}
                title="Sign in as Anjana Pillai (KYC Pending Review)"
              >
                ⚡ Anjana (Pending KYC)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('aditya')}
                title="Sign in as Aditya Nair (New Unverified Student)"
              >
                ⚡ Aditya (Student)
              </button>
            </div>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">
                  <Mail size={14} /> College or Registered Email
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="student@bmce.ac.in"
                    className="auth-input"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">
                    <Lock size={14} /> Password
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                    Forgot?
                  </span>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="auth-input"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGNUP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">
                  <UserIcon size={14} /> Full Name (As per College ID)
                </label>
                <div className="auth-input-wrapper">
                  <UserIcon size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anandhu Krishnan"
                    className="auth-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label className="auth-label">
                    <Mail size={14} /> College Email
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="name@bmce.ac.in"
                      className="auth-input"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">
                    <Phone size={14} /> Phone / WhatsApp
                  </label>
                  <div className="auth-input-wrapper">
                    <Phone size={16} className="auth-input-icon" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      className="auth-input"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
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
                    <option value="Computer Science & Engineering">Computer Science (CSE)</option>
                    <option value="Artificial Intelligence & Data Science">AI & Data Science (AI&DS)</option>
                    <option value="Electronics & Communication">Electronics (ECE)</option>
                    <option value="Electrical & Electronics">Electrical (EEE)</option>
                    <option value="Mechanical Engineering">Mechanical (ME)</option>
                    <option value="Civil Engineering">Civil Engineering (CE)</option>
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
                  <label className="auth-label">
                    <BookOpen size={14} /> College / KTU Reg No
                  </label>
                  <div className="auth-input-wrapper">
                    <BookOpen size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="BMCE/23/CS015"
                      className="auth-input"
                      value={collegeId}
                      onChange={e => setCollegeId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">
                    <Lock size={14} /> Choose Password
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      className="auth-input"
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to the BMCE IEDC Innovation Charter and verify that I am a bonafide student.
                </span>
              </label>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating Student Profile...' : 'Complete Registration'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Already registered?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
