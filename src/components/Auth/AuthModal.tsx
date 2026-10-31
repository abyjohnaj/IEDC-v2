import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, Phone, BookOpen, Eye, EyeOff, 
  CheckCircle2, AlertCircle, GraduationCap, School, Briefcase, Globe, Building 
} from 'lucide-react';
import { authService } from '../../services/authService';
import { User, UserRole } from '../../types';

type RegistrantCategory = 'bmce_student' | 'external_student' | 'bmce_faculty' | 'community';

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

  // Signup Category Selector
  const [registrantCategory, setRegistrantCategory] = useState<RegistrantCategory>('bmce_student');

  // Common Signup Form State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // 1. BMCE Student State
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('Semester 4');
  const [collegeId, setCollegeId] = useState('');

  // 2. External Student State
  const [externalCollege, setExternalCollege] = useState('');
  const [externalDept, setExternalDept] = useState('');
  const [externalSemester, setExternalSemester] = useState('Semester 4');
  const [externalStudentId, setExternalStudentId] = useState('');

  // 3. BMCE Faculty / Staff State
  const [facultyDept, setFacultyDept] = useState('Computer Science & Engineering');
  const [facultyDesignation, setFacultyDesignation] = useState('Assistant Professor');
  const [facultyId, setFacultyId] = useState('');

  // 4. Community / Mentor / Innovator State
  const [organization, setOrganization] = useState('');
  const [domainExpertise, setDomainExpertise] = useState('Software & Artificial Intelligence');
  const [professionalRole, setProfessionalRole] = useState('');

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

    if (!fullName.trim() || !signupEmail.trim() || !phone.trim()) {
      setErrorMsg('Please fill in your name, email, and phone number.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    if (registrantCategory === 'bmce_student') {
      if (!collegeId.trim()) {
        setErrorMsg('Please enter your KTU Reg No or BMCE Admission Number.');
        return;
      }
    } else if (registrantCategory === 'external_student') {
      if (!externalCollege.trim()) {
        setErrorMsg('Please enter your College or University name.');
        return;
      }
      if (!externalDept.trim()) {
        setErrorMsg('Please enter your branch or department.');
        return;
      }
    } else if (registrantCategory === 'community') {
      if (!organization.trim()) {
        setErrorMsg('Please enter your organization, company, or startup affiliation.');
        return;
      }
    }

    setLoading(true);
    try {
      let resolvedRole: UserRole = 'Student';
      let resolvedDept = department;
      let resolvedSem = semester;
      let resolvedId = collegeId;
      let resolvedInst = 'Baselios Mathews II College of Engineering';

      if (registrantCategory === 'bmce_student') {
        resolvedRole = 'Student';
        resolvedDept = department;
        resolvedSem = semester;
        resolvedId = collegeId;
        resolvedInst = 'Baselios Mathews II College of Engineering';
      } else if (registrantCategory === 'external_student') {
        resolvedRole = 'ExternalParticipant';
        resolvedDept = externalDept;
        resolvedSem = externalSemester;
        resolvedId = externalStudentId;
        resolvedInst = externalCollege;
      } else if (registrantCategory === 'bmce_faculty') {
        resolvedRole = 'Faculty';
        resolvedDept = facultyDept;
        resolvedSem = 'Faculty';
        resolvedId = facultyId; // Optional! Faculty don't need a reg number
        resolvedInst = 'Baselios Mathews II College of Engineering';
      } else if (registrantCategory === 'community') {
        resolvedRole = 'Innovator';
        resolvedDept = domainExpertise;
        resolvedSem = 'Innovator / Mentor';
        resolvedId = '';
        resolvedInst = organization;
      }

      const res = await authService.signup({
        fullName,
        email: signupEmail,
        phone,
        department: resolvedDept,
        semester: resolvedSem,
        collegeId: resolvedId,
        institution: resolvedInst,
        designation: registrantCategory === 'bmce_faculty' ? facultyDesignation : undefined,
        organization: registrantCategory === 'community' ? organization : undefined,
        password: signupPassword,
        role: resolvedRole
      });

      if (res.success && res.user) {
        setSuccessMsg(`Welcome to IEDC BMCE, ${res.user.fullName}! Account created successfully.`);
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

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <button className="auth-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
          <img
            src="/assets/iedc_brand_logo.png"
            alt="IEDC BMCE Logo"
            className="logo-img"
            style={{ width: '48px', height: '48px', margin: '0 auto 0.6rem', display: 'block' }}
          />
          <h2 className="auth-modal-title">
            {activeTab === 'login' ? 'Sign In to Your Account' : 'Be a part of IEDC BMCE'}
          </h2>
          <p className="auth-modal-desc">
            {activeTab === 'login'
              ? 'Welcome back! Sign in to track your incubation milestones, grant applications, and maker lab projects.'
              : 'Turn your ideas into reality. Join the BMCE innovation ecosystem to access prototyping labs, seed grants, and mentor networks.'}
          </p>
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
              {/* Category Selector */}
              <div className="auth-role-wrapper">
                <label className="auth-role-header-label">I am registering as</label>
                <div className="auth-role-grid">
                  <button
                    type="button"
                    className={`auth-role-btn ${registrantCategory === 'bmce_student' ? 'active' : ''}`}
                    onClick={() => { setRegistrantCategory('bmce_student'); setErrorMsg(null); }}
                  >
                    <div className="auth-role-btn-icon"><GraduationCap size={18} /></div>
                    <span className="auth-role-btn-label">BMCE Student</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${registrantCategory === 'external_student' ? 'active' : ''}`}
                    onClick={() => { setRegistrantCategory('external_student'); setErrorMsg(null); }}
                  >
                    <div className="auth-role-btn-icon"><School size={18} /></div>
                    <span className="auth-role-btn-label">Student Outside BMCE</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${registrantCategory === 'bmce_faculty' ? 'active' : ''}`}
                    onClick={() => { setRegistrantCategory('bmce_faculty'); setErrorMsg(null); }}
                  >
                    <div className="auth-role-btn-icon"><Briefcase size={18} /></div>
                    <span className="auth-role-btn-label">BMCE Faculty</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${registrantCategory === 'community' ? 'active' : ''}`}
                    onClick={() => { setRegistrantCategory('community'); setErrorMsg(null); }}
                  >
                    <div className="auth-role-btn-icon"><Globe size={18} /></div>
                    <span className="auth-role-btn-label">Innovator / Mentor</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Role Guidance Badge */}
              {registrantCategory === 'bmce_student' && (
                <div className="auth-role-badge-hint">
                  🎓 Enrolled student at Baselios Mathews II College of Engineering with KTU/BMCE register number.
                </div>
              )}
              {registrantCategory === 'external_student' && (
                <div className="auth-role-badge-hint">
                  🏛️ Welcome inter-college innovators & hackathon participants from other institutions!
                </div>
              )}
              {registrantCategory === 'bmce_faculty' && (
                <div className="auth-role-badge-hint">
                  👨‍🏫 BMCE faculty mentors, HODs, and instructors (No KTU register number required).
                </div>
              )}
              {registrantCategory === 'community' && (
                <div className="auth-role-badge-hint">
                  🌐 Startup founders, independent innovators, alumni, and industry mentors.
                </div>
              )}

              {/* Common: Full Name */}
              <div className="auth-input-group">
                <label className="auth-label">
                  <UserIcon size={14} />{' '}
                  {registrantCategory === 'bmce_faculty'
                    ? 'Full Name & Title (e.g. Prof. / Dr. Anandhu K.)'
                    : registrantCategory === 'bmce_student'
                    ? 'Full Name (As per College ID)'
                    : 'Full Name'}
                </label>
                <div className="auth-input-wrapper">
                  <UserIcon size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder={
                      registrantCategory === 'bmce_faculty'
                        ? 'e.g. Dr. Preetha Mohan'
                        : 'e.g. Anandhu Krishnan'
                    }
                    className="auth-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Common: Email & Phone */}
              <div className="auth-grid-2">
                <div className="auth-input-group">
                  <label className="auth-label">
                    <Mail size={14} />{' '}
                    {registrantCategory === 'bmce_student' || registrantCategory === 'bmce_faculty'
                      ? 'College Email'
                      : 'Email Address'}
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      required
                      placeholder={
                        registrantCategory === 'bmce_student' || registrantCategory === 'bmce_faculty'
                          ? 'name@bmce.ac.in'
                          : 'name@example.com'
                      }
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

              {/* 1. BMCE STUDENT SPECIFIC FIELDS */}
              {registrantCategory === 'bmce_student' && (
                <>
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
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 2. EXTERNAL STUDENT SPECIFIC FIELDS */}
              {registrantCategory === 'external_student' && (
                <>
                  <div className="auth-input-group">
                    <label className="auth-label">
                      <School size={14} /> College / University Name
                    </label>
                    <div className="auth-input-wrapper">
                      <Building size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. TKM College of Engineering, Kollam"
                        className="auth-input"
                        value={externalCollege}
                        onChange={e => setExternalCollege(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="auth-grid-2">
                    <div className="auth-input-group">
                      <label className="auth-label">Department / Branch</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mechanical Engineering"
                        className="auth-input"
                        value={externalDept}
                        onChange={e => setExternalDept(e.target.value)}
                      />
                    </div>

                    <div className="auth-input-group">
                      <label className="auth-label">Current Semester</label>
                      <select
                        className="auth-select"
                        value={externalSemester}
                        onChange={e => setExternalSemester(e.target.value)}
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
                        <BookOpen size={14} /> Student ID / Reg No (Optional)
                      </label>
                      <div className="auth-input-wrapper">
                        <BookOpen size={16} className="auth-input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. TKM/22/ME088"
                          className="auth-input"
                          value={externalStudentId}
                          onChange={e => setExternalStudentId(e.target.value)}
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
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 3. BMCE FACULTY SPECIFIC FIELDS */}
              {registrantCategory === 'bmce_faculty' && (
                <>
                  <div className="auth-grid-2">
                    <div className="auth-input-group">
                      <label className="auth-label">Department</label>
                      <select
                        className="auth-select"
                        value={facultyDept}
                        onChange={e => setFacultyDept(e.target.value)}
                      >
                        <option value="Computer Science & Engineering">Computer Science (CSE)</option>
                        <option value="Artificial Intelligence & Data Science">AI & Data Science (AI&DS)</option>
                        <option value="Electronics & Communication">Electronics (ECE)</option>
                        <option value="Electrical & Electronics">Electrical (EEE)</option>
                        <option value="Mechanical Engineering">Mechanical (ME)</option>
                        <option value="Civil Engineering">Civil Engineering (CE)</option>
                        <option value="Basic Science & Humanities">Basic Science & Humanities</option>
                        <option value="IEDC Nodal Office / Admin">IEDC Nodal Office / Admin</option>
                      </select>
                    </div>

                    <div className="auth-input-group">
                      <label className="auth-label">Academic Designation</label>
                      <select
                        className="auth-select"
                        value={facultyDesignation}
                        onChange={e => setFacultyDesignation(e.target.value)}
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                        <option value="Lab Instructor / Staff">Lab Instructor / Technical Staff</option>
                        <option value="Nodal Officer / Dean">Nodal Officer / Dean</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-grid-2">
                    <div className="auth-input-group">
                      <label className="auth-label">
                        <Briefcase size={14} /> Faculty / Staff ID (Optional)
                      </label>
                      <div className="auth-input-wrapper">
                        <Briefcase size={16} className="auth-input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. BMCE/FAC/042 (optional)"
                          className="auth-input"
                          value={facultyId}
                          onChange={e => setFacultyId(e.target.value)}
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
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 4. COMMUNITY / MENTOR SPECIFIC FIELDS */}
              {registrantCategory === 'community' && (
                <>
                  <div className="auth-grid-2">
                    <div className="auth-input-group">
                      <label className="auth-label">
                        <Building size={14} /> Organization / Affiliation
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Startup / KSUM / Freelancer / Alumni"
                        className="auth-input"
                        value={organization}
                        onChange={e => setOrganization(e.target.value)}
                      />
                    </div>

                    <div className="auth-input-group">
                      <label className="auth-label">Primary Expertise</label>
                      <select
                        className="auth-select"
                        value={domainExpertise}
                        onChange={e => setDomainExpertise(e.target.value)}
                      >
                        <option value="Software & Artificial Intelligence">Software & AI</option>
                        <option value="Hardware, IoT & Robotics">Hardware & Robotics</option>
                        <option value="Product Design & UI/UX">Product Design & UI/UX</option>
                        <option value="Business Strategy & Pitching">Business & Pitching</option>
                        <option value="IPR & Patent Filing">IPR & Patents</option>
                        <option value="General Startup Mentoring">General Mentoring</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-grid-2">
                    <div className="auth-input-group">
                      <label className="auth-label">
                        <UserIcon size={14} /> Professional Role (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Founder, Senior Engineer, Mentor"
                        className="auth-input"
                        value={professionalRole}
                        onChange={e => setProfessionalRole(e.target.value)}
                      />
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
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading
                  ? 'Creating Account...'
                  : registrantCategory === 'bmce_student'
                  ? 'Complete Student Registration'
                  : registrantCategory === 'external_student'
                  ? 'Register as Student Outside BMCE'
                  : registrantCategory === 'bmce_faculty'
                  ? 'Register as Faculty Member'
                  : 'Join as Innovator / Mentor'}
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
