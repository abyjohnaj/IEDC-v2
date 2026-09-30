import React, { useState, useEffect } from 'react';
import { execomService } from '../../services/execomService';
import { authService } from '../../services/authService';
import { User, ExecomStructure, ExecomMember, UserRole } from '../../types';
import {
  Users,
  ShieldCheck,
  Search,
  Award,
  Sparkles,
  UserPlus,
  Trash2,
  Edit3,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Mail,
  Phone,
  Tag,
  X,
  Linkedin,
  Clock,
  AlertCircle,
  Filter,
  GraduationCap,
  Building,
  Crown,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';

interface AdminExecomRoleManagerProps {
  onNotify: (msg: string) => void;
}

const PRESETS_BY_CATEGORY: Record<'leads' | 'coordinators' | 'nodal', string[]> = {
  leads: [
    'Overall Executive Lead (CEO)',
    'Chief Technology Officer (CTO)',
    'Chief Operating Officer (COO)',
    'Chief Financial Officer (CFO)',
    'Creative & UI/UX Design Lead',
    'Branding & Digital Outreach Lead',
    'Women In Entrepreneurship Lead',
    'Incubation & Maker Lab Lead',
    'Hackathons & Competitions Coordinator',
    'Community & Peer Mentorship Lead',
    'Custom'
  ],
  coordinators: [
    'Computer Science & Engg Staff Coordinator',
    'AI & Data Science Staff Coordinator',
    'Electronics & Communication Staff Coordinator',
    'Mechanical Engineering Staff Coordinator',
    'Electrical & Electronics Staff Coordinator',
    'Civil Engineering Staff Coordinator',
    'Innovation & IPR Staff Mentor',
    'Maker Space Faculty In-Charge',
    'Student Startup Faculty Advisor',
    'Custom'
  ],
  nodal: [
    'Lead Nodal Officer, IEDC BMCE',
    'Joint Nodal Officer',
    'Assistant Nodal Officer',
    'Technical Nodal Officer',
    'Incubation & Research Nodal Officer',
    'Industry & Alumni Liaison Nodal Officer',
    'Custom'
  ]
};

export const AdminExecomRoleManager: React.FC<AdminExecomRoleManagerProps> = ({ onNotify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'appoint' | 'roster'>('appoint');
  const [execomData, setExecomData] = useState<ExecomStructure>(execomService.getExecomStructure());
  const [users, setUsers] = useState<User[]>(authService.getAllUsers());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleGroupFilter, setRoleGroupFilter] = useState<'all' | 'students' | 'faculty' | 'nodal' | 'appointed'>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');

  // Search inside Roster tab
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  // Modal State: Appoint / Assign Leadership
  const [selectedCandidate, setSelectedCandidate] = useState<User | null>(null);
  const [category, setCategory] = useState<'leads' | 'coordinators' | 'nodal'>('leads');
  const [designation, setDesignation] = useState(PRESETS_BY_CATEGORY.leads[0]);
  const [customDesignation, setCustomDesignation] = useState('');
  const [portfolioNotes, setPortfolioNotes] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [linkedinInput, setLinkedinInput] = useState('');
  const [isAppointing, setIsAppointing] = useState(false);

  // Modal State: Add New Staff / Student Profile
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Faculty');
  const [newDepartment, setNewDepartment] = useState('Computer Science & Engineering');
  const [newSemester, setNewSemester] = useState('Assistant Professor');
  const [newCollegeId, setNewCollegeId] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newLinkedin, setNewLinkedin] = useState('');

  const refreshData = () => {
    setExecomData(execomService.getExecomStructure());
    setUsers(authService.getAllUsers());
  };

  useEffect(() => {
    refreshData();
    const unsubExecom = execomService.subscribe(() => refreshData());
    const unsubAuth = authService.onAuthStateChange(() => refreshData());
    return () => {
      unsubExecom();
      unsubAuth();
    };
  }, []);

  // Helper: Find leadership assignment status
  const getLeadershipStatus = (name: string) => {
    const clean = name.toLowerCase().trim();
    const nodal = execomData.nodalOfficers.find(m => m.name.toLowerCase().trim() === clean);
    if (nodal) return { category: 'nodal' as const, label: `🏛️ Nodal Officer: ${nodal.role}`, item: nodal };

    const lead = execomData.studentLeads.find(m => m.name.toLowerCase().trim() === clean);
    if (lead) return { category: 'leads' as const, label: `⚡ ExeCom Lead: ${lead.role}`, item: lead };

    const coord = execomData.departmentCoordinators.find(m => m.name.toLowerCase().trim() === clean);
    if (coord) return { category: 'coordinators' as const, label: `👨‍🏫 Staff Coord: ${coord.role}`, item: coord };

    return null;
  };

  // Open Appointment Modal with targeted track
  const handleOpenAppointModal = (
    user: User,
    targetTrack?: 'leads' | 'coordinators' | 'nodal'
  ) => {
    setSelectedCandidate(user);
    const chosenTrack = targetTrack || (user.role === 'Faculty' ? 'coordinators' : 'leads');
    setCategory(chosenTrack);
    setDesignation(PRESETS_BY_CATEGORY[chosenTrack][0]);
    setCustomDesignation('');
    setPortfolioNotes(`${user.department}${user.semester ? ` • ${user.semester}` : ''}`);
    setBioInput(user.bio || `Appointed leader representing ${user.department} at IEDC BMCE.`);
    setLinkedinInput(user.linkedin || '');
  };

  // Switch category inside modal
  const handleCategorySwitch = (newCat: 'leads' | 'coordinators' | 'nodal') => {
    setCategory(newCat);
    setDesignation(PRESETS_BY_CATEGORY[newCat][0]);
    setCustomDesignation('');
    if (selectedCandidate) {
      if (newCat === 'nodal') {
        setPortfolioNotes(`${selectedCandidate.department} • Nodal Office Advisory`);
      } else if (newCat === 'coordinators') {
        setPortfolioNotes(`${selectedCandidate.department} • Department Staff Coordinator`);
      } else {
        setPortfolioNotes(`${selectedCandidate.department} • Active Student Lead`);
      }
    }
  };

  // Submit Appointment
  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setIsAppointing(true);
    try {
      const finalTitle = designation === 'Custom' && customDesignation.trim() ? customDesignation.trim() : designation;

      await execomService.appointMemberFromProfile({
        userId: selectedCandidate.id,
        category,
        roleTitle: finalTitle,
        departmentNotes: portfolioNotes.trim() || `${selectedCandidate.department}`,
        bio: bioInput.trim(),
        linkedin: linkedinInput.trim()
      });

      const trackNames = {
        leads: 'Student Executive Committee (ExeCom)',
        coordinators: 'Staff Department Coordinator',
        nodal: 'Faculty Nodal Officer'
      };

      onNotify(`🎉 ${selectedCandidate.fullName} assigned as "${finalTitle}" under ${trackNames[category]}!`);
      setSelectedCandidate(null);
      refreshData();
      setActiveSubTab('roster');
    } catch (err: any) {
      alert(err.message || 'Failed to appoint member');
    } finally {
      setIsAppointing(false);
    }
  };

  // Create new profile on the spot
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      alert('Please provide at least a full name and official email address.');
      return;
    }

    try {
      const created = authService.adminCreateUser({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole,
        department: newDepartment,
        semester: newSemester.trim(),
        collegeId: newCollegeId.trim(),
        bio: newBio.trim(),
        linkedin: newLinkedin.trim()
      });

      onNotify(`✅ Created new profile for "${created.fullName}". Ready to assign leadership roles!`);
      setIsAddUserModalOpen(false);
      refreshData();

      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewBio('');
      setNewLinkedin('');

      // Open appointment modal for the newly created user right away!
      const targetCategory = created.role === 'Faculty' ? 'coordinators' : 'leads';
      handleOpenAppointModal(created, targetCategory);
    } catch (err: any) {
      alert(err.message || 'Error creating profile');
    }
  };

  const handleRemoveExecom = async (category: 'nodal' | 'leads' | 'coordinators', name: string) => {
    if (confirm(`Remove "${name}" from the active leadership roster?`)) {
      await execomService.removeMember(category, name);
      onNotify(`Member "${name}" removed from roster.`);
      refreshData();
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: any, userName: string) => {
    await authService.updateProfile(userId, { role: newRole });
    onNotify(`Role for "${userName}" updated to ${newRole}.`);
    refreshData();
  };

  // Filter candidates according to search query and role group
  const filteredCandidates = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const leadership = getLeadershipStatus(u.fullName);

    // Role Group Pill Filtering
    if (roleGroupFilter === 'students') {
      if (u.role !== 'Student' && u.role !== 'Innovator' && u.role !== 'Execom') return false;
    } else if (roleGroupFilter === 'faculty') {
      if (u.role !== 'Faculty') return false;
    } else if (roleGroupFilter === 'nodal') {
      if (leadership?.category !== 'nodal' && u.role !== 'Admin') return false;
    } else if (roleGroupFilter === 'appointed') {
      if (!leadership) return false;
    }

    // Department filter
    if (deptFilter !== 'all' && !u.department.toLowerCase().includes(deptFilter.toLowerCase())) {
      return false;
    }

    // KYC filter
    if (kycFilter !== 'all' && u.kyc?.status !== kycFilter) {
      return false;
    }

    // Text Search
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.collegeId || '').toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (leadership?.label.toLowerCase() || '').includes(q) ||
      u.skills?.some(s => s.toLowerCase().includes(q))
    );
  });

  const totalExecomMembers =
    execomData.nodalOfficers.length + execomData.studentLeads.length + execomData.departmentCoordinators.length;

  return (
    <div>
      {/* Top Banner & Tab Navigation */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <Crown size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Execom, Staff Coordinators & Nodal Officers Desk
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Search, filter, and appoint leaders across Student ExeCom, Department Staff Coordinators, and Faculty Nodal Officers.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeSubTab === 'appoint' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('appoint')}
          >
            <Search size={15} /> Search & Assign Roles ({users.length})
          </button>
          <button
            className={`btn ${activeSubTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('roster')}
          >
            <Award size={15} /> Active Roster ({totalExecomMembers})
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <UserPlus size={15} /> + Add New Profile
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SEARCH, FIND AND ASSIGN LEADERSHIP ROLES */}
      {activeSubTab === 'appoint' && (
        <div>
          {/* SEARCH & DISCOVERY BAR */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Primary Search Input */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--accent-cyan)'
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{
                    paddingLeft: '2.75rem',
                    fontSize: '0.95rem',
                    background: 'var(--bg-secondary)',
                    borderColor: searchQuery ? 'var(--accent-cyan)' : 'var(--border-color)'
                  }}
                  placeholder="Search by Person's Name, Email, KTU/Faculty ID, Department, Tech Skills, or Role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.2rem'
                    }}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Department Dropdown */}
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: '180px', background: 'var(--bg-secondary)' }}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science & Engg</option>
                <option value="Artificial Intelligence">AI & Data Science</option>
                <option value="Electronics">Electronics & Comm.</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Electrical">Electrical & Electronics</option>
                <option value="Civil">Civil Engineering</option>
                <option value="Nodal">IEDC Nodal Office</option>
              </select>

              {/* KYC Status Dropdown */}
              <select
                className="form-input"
                style={{ width: 'auto', background: 'var(--bg-secondary)' }}
                value={kycFilter}
                onChange={e => setKycFilter(e.target.value)}
              >
                <option value="all">All KYC Statuses</option>
                <option value="verified">Verified Credentials</option>
                <option value="pending">Pending KYC</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            {/* Quick Role Category Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`pill-btn ${roleGroupFilter === 'all' ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setRoleGroupFilter('all')}
                >
                  <Users size={13} style={{ marginRight: 4 }} /> All Profiles ({users.length})
                </button>
                <button
                  className={`pill-btn ${roleGroupFilter === 'students' ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setRoleGroupFilter('students')}
                >
                  <GraduationCap size={13} style={{ marginRight: 4 }} /> Student Members / Execom Candidates
                </button>
                <button
                  className={`pill-btn ${roleGroupFilter === 'faculty' ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setRoleGroupFilter('faculty')}
                >
                  <Briefcase size={13} style={{ marginRight: 4 }} /> Staff & Faculty Coordinators
                </button>
                <button
                  className={`pill-btn ${roleGroupFilter === 'nodal' ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setRoleGroupFilter('nodal')}
                >
                  <Building size={13} style={{ marginRight: 4 }} /> Faculty Nodal Officers
                </button>
                <button
                  className={`pill-btn ${roleGroupFilter === 'appointed' ? 'active' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => setRoleGroupFilter('appointed')}
                >
                  <Award size={13} style={{ marginRight: 4 }} /> Currently Appointed Leaders
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredCandidates.length}</strong> matching profiles
              </div>
            </div>
          </div>

          {/* CANDIDATES / PROFILES GRID */}
          {filteredCandidates.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                textAlign: 'center'
              }}
            >
              <Search size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>No matching profiles found</h4>
              <p style={{ margin: '0.5rem 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No registered student, staff coordinator, or faculty member matches your current search criteria.
              </p>
              <button
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setIsAddUserModalOpen(true)}
              >
                <UserPlus size={15} /> + Add Profile for "{searchQuery || 'New Person'}"
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredCandidates.map(candidate => {
                const leadership = getLeadershipStatus(candidate.fullName);
                const kyc = candidate.kyc?.status || 'unverified';
                const isFaculty = candidate.role === 'Faculty';

                return (
                  <div
                    key={candidate.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: leadership
                        ? leadership.category === 'nodal'
                          ? '1.5px solid var(--accent-cyan)'
                          : leadership.category === 'leads'
                          ? '1.5px solid var(--accent-amber)'
                          : '1.5px solid #a855f7'
                        : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: leadership ? '0 4px 20px rgba(0, 242, 254, 0.06)' : 'none'
                    }}
                  >
                    {/* Active Leadership Badge (if already assigned) */}
                    {leadership && (
                      <div
                        style={{
                          marginBottom: '0.75rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background:
                            leadership.category === 'nodal'
                              ? 'rgba(0, 242, 254, 0.12)'
                              : leadership.category === 'leads'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(168, 85, 247, 0.12)',
                          color:
                            leadership.category === 'nodal'
                              ? 'var(--accent-cyan)'
                              : leadership.category === 'leads'
                              ? 'var(--accent-amber)'
                              : '#c084fc',
                          border:
                            leadership.category === 'nodal'
                              ? '1px solid rgba(0, 242, 254, 0.3)'
                              : leadership.category === 'leads'
                              ? '1px solid rgba(245, 158, 11, 0.3)'
                              : '1px solid rgba(168, 85, 247, 0.3)'
                        }}
                      >
                        <span>{leadership.label}</span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Active on Site</span>
                      </div>
                    )}

                    {/* Candidate Identity Header */}
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                      <img
                        src={candidate.avatar}
                        alt={candidate.fullName}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: `2px solid ${isFaculty ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.2)'}`,
                          objectFit: 'cover'
                        }}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(candidate.fullName)}`;
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.02rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {candidate.fullName}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background:
                                candidate.role === 'Faculty' ? 'rgba(0, 242, 254, 0.15)' :
                                candidate.role === 'Execom' ? 'rgba(245, 158, 11, 0.15)' :
                                candidate.role === 'Innovator' ? 'rgba(16, 185, 129, 0.15)' :
                                'rgba(148, 163, 184, 0.15)',
                              color:
                                candidate.role === 'Faculty' ? 'var(--accent-cyan)' :
                                candidate.role === 'Execom' ? '#f59e0b' :
                                candidate.role === 'Innovator' ? '#10b981' :
                                'var(--text-muted)'
                            }}
                          >
                            {candidate.role}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {candidate.department} • {candidate.semester}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'flex', gap: '0.6rem' }}>
                          <span>Email: <strong style={{ color: 'var(--text-secondary)' }}>{candidate.email}</strong></span>
                        </div>

                        {candidate.collegeId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ID: <strong style={{ color: 'var(--text-primary)' }}>{candidate.collegeId}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KYC Badge & Institution */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background:
                            kyc === 'verified' ? 'rgba(16, 185, 129, 0.12)' :
                            kyc === 'pending' ? 'rgba(245, 158, 11, 0.12)' :
                            'rgba(239, 68, 68, 0.12)',
                          color:
                            kyc === 'verified' ? '#10b981' :
                            kyc === 'pending' ? '#f59e0b' :
                            '#ef4444'
                        }}
                      >
                        {kyc === 'verified' && <><ShieldCheck size={11} /> Verified Member</>}
                        {kyc === 'pending' && <><Clock size={11} /> Pending KYC</>}
                        {kyc === 'unverified' && <><AlertCircle size={11} /> Unverified</>}
                      </span>

                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {candidate.institution || 'BMCE'}
                      </span>
                    </div>

                    {/* Bio or skills */}
                    {candidate.bio && (
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {candidate.bio}
                      </p>
                    )}

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
                        {candidate.skills.slice(0, 4).map((s, idx) => (
                          <span key={idx} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-muted)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Bar: Assign to Specific Leadership Tracks */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {/* Track 1: Appoint Execom */}
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.75rem',
                            justifyContent: 'center',
                            borderColor: leadership?.category === 'leads' ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.3)',
                            color: 'var(--accent-amber)'
                          }}
                          onClick={() => handleOpenAppointModal(candidate, 'leads')}
                          title="Assign Student Executive Committee Leadership"
                        >
                          <Sparkles size={12} />
                          {leadership?.category === 'leads' ? 'Edit ExeCom' : 'Assign ExeCom'}
                        </button>

                        {/* Track 2: Staff Coordinator */}
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.75rem',
                            justifyContent: 'center',
                            borderColor: leadership?.category === 'coordinators' ? '#a855f7' : 'rgba(168, 85, 247, 0.3)',
                            color: '#c084fc'
                          }}
                          onClick={() => handleOpenAppointModal(candidate, 'coordinators')}
                          title="Assign Department Staff Coordinator"
                        >
                          <Briefcase size={12} />
                          {leadership?.category === 'coordinators' ? 'Edit Coord' : 'Staff Coord'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Track 3: Nodal Officer */}
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.74rem',
                            flex: 1,
                            justifyContent: 'center',
                            borderColor: leadership?.category === 'nodal' ? 'var(--accent-cyan)' : 'rgba(0, 242, 254, 0.3)',
                            color: 'var(--accent-cyan)'
                          }}
                          onClick={() => handleOpenAppointModal(candidate, 'nodal')}
                          title="Assign Faculty Nodal Officer"
                        >
                          <Building size={12} />
                          {leadership?.category === 'nodal' ? 'Edit Nodal Officer' : 'Assign Nodal Officer'}
                        </button>

                        {/* Quick Role Select */}
                        <select
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.22rem 0.4rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            maxWidth: '105px'
                          }}
                          value={candidate.role}
                          onChange={e => handleQuickRoleChange(candidate.id, e.target.value, candidate.fullName)}
                          title="Change Platform Role"
                        >
                          <option value="Student">Student</option>
                          <option value="Innovator">Innovator</option>
                          <option value="Execom">Execom</option>
                          <option value="Faculty">Faculty</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ACTIVE LEADERSHIP ROSTER (WITH SEARCH) */}
      {activeSubTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Roster Search Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'center'
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ background: 'transparent', border: 'none', padding: 0 }}
              placeholder="Search active roster members by name, role title, or department..."
              value={rosterSearchQuery}
              onChange={e => setRosterSearchQuery(e.target.value)}
            />
            {rosterSearchQuery && (
              <button
                onClick={() => setRosterSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Section 1: Faculty Nodal Officers */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={18} /> Faculty Nodal Officers ({execomData.nodalOfficers.length})
                </h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Senior BMCE professors and nodal authorities overseeing institutional compliance and pre-incubation grants.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {execomData.nodalOfficers
                .filter(m => !rosterSearchQuery || m.name.toLowerCase().includes(rosterSearchQuery.toLowerCase()) || m.role.toLowerCase().includes(rosterSearchQuery.toLowerCase()) || m.department.toLowerCase().includes(rosterSearchQuery.toLowerCase()))
                .map((m, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <img src={m.avatar} alt={m.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }} onError={e => { (e.currentTarget as HTMLImageElement).src = m.fallbackAvatar; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{m.role}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.department}</div>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                      onClick={() => handleRemoveExecom('nodal', m.name)}
                      title="Revoke Nodal Officer Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 2: Department Staff Coordinators */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} /> Department Staff Coordinators ({execomData.departmentCoordinators.length})
                </h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Faculty representatives from CSE, AI&DS, ECE, ME, EEE, and Civil managing student liaison and mentorship.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {execomData.departmentCoordinators
                .filter(m => !rosterSearchQuery || m.name.toLowerCase().includes(rosterSearchQuery.toLowerCase()) || m.role.toLowerCase().includes(rosterSearchQuery.toLowerCase()) || m.department.toLowerCase().includes(rosterSearchQuery.toLowerCase()))
                .map((m, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', border: '2px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      👨‍🏫
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700 }}>{m.role}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.department}</div>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                      onClick={() => handleRemoveExecom('coordinators', m.name)}
                      title="Revoke Coordinator Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Student Executive Leads (ExeCom) */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} /> Student Executive Leads (ExeCom) ({execomData.studentLeads.length})
                </h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Appointed student officers managing overall IEDC operations, finance, media, and technology.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {execomData.studentLeads
                .filter(m => !rosterSearchQuery || m.name.toLowerCase().includes(rosterSearchQuery.toLowerCase()) || m.role.toLowerCase().includes(rosterSearchQuery.toLowerCase()) || m.department.toLowerCase().includes(rosterSearchQuery.toLowerCase()))
                .map((m, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <img src={m.avatar} alt={m.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-amber)' }} onError={e => { (e.currentTarget as HTMLImageElement).src = m.fallbackAvatar; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 700 }}>{m.role}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.department}</div>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                      onClick={() => handleRemoveExecom('leads', m.name)}
                      title="Remove from Execom Roster"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT MODAL */}
      {selectedCandidate && (
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
            padding: '1.5rem'
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedCandidate(null);
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '2rem',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
                  Leadership Appointment Desk
                </span>
                <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem', fontWeight: 800 }}>
                  Assign Leadership Role: {selectedCandidate.fullName}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Appoint to public Executive Committee, Staff Coordinator, or Nodal Officer positions.
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Category Selector Tabs */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>
                  Target Leadership Track *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${category === 'leads' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.6rem 0.5rem', fontSize: '0.78rem', justifyContent: 'center' }}
                    onClick={() => handleCategorySwitch('leads')}
                  >
                    <Sparkles size={14} /> Student ExeCom
                  </button>
                  <button
                    type="button"
                    className={`btn ${category === 'coordinators' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.6rem 0.5rem', fontSize: '0.78rem', justifyContent: 'center' }}
                    onClick={() => handleCategorySwitch('coordinators')}
                  >
                    <Briefcase size={14} /> Staff Coordinator
                  </button>
                  <button
                    type="button"
                    className={`btn ${category === 'nodal' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.6rem 0.5rem', fontSize: '0.78rem', justifyContent: 'center' }}
                    onClick={() => handleCategorySwitch('nodal')}
                  >
                    <Building size={14} /> Nodal Officer
                  </button>
                </div>
              </div>

              {/* Designation Presets */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Official Designation / Role Title *
                </label>
                <select
                  className="form-input"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                >
                  {PRESETS_BY_CATEGORY[category].map((preset, idx) => (
                    <option key={idx} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Designation field */}
              {designation === 'Custom' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    Type Custom Role Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Chief Innovation Strategist, Maker Lab Lead..."
                    value={customDesignation}
                    onChange={e => setCustomDesignation(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Department notes */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Department / Portfolio Notes
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science & Engg • Lead 2026"
                  value={portfolioNotes}
                  onChange={e => setPortfolioNotes(e.target.value)}
                />
              </div>

              {/* Leadership Bio */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Official Bio / Responsibilities Summary
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Short description of this leader's responsibilities displayed on the public Execom section..."
                  value={bioInput}
                  onChange={e => setBioInput(e.target.value)}
                />
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinInput}
                  onChange={e => setLinkedinInput(e.target.value)}
                />
              </div>

              {/* Preview Card */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Homepage Live Preview
                </div>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <img
                    src={selectedCandidate.avatar}
                    alt={selectedCandidate.fullName}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedCandidate.fullName}</div>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 700 }}>
                      {designation === 'Custom' ? customDesignation || 'Custom Title' : designation}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {portfolioNotes || selectedCandidate.department}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAppointing}
                >
                  {isAppointing ? 'Assigning Role...' : 'Confirm Leadership Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PROFILE MODAL (STAFF / FACULTY / STUDENT) */}
      {isAddUserModalOpen && (
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
            padding: '1.5rem'
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setIsAddUserModalOpen(false);
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                  Directory Onboarding
                </span>
                <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem', fontWeight: 800 }}>
                  Add Staff, Faculty or Student Profile
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Register a new faculty or student member to immediately assign as Execom, Staff Coordinator, or Nodal Officer.
                </p>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Prof. Deepa Mathew"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. deepa.mathew@bmce.ac.in"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Platform Role *</label>
                  <select
                    className="form-input"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="Faculty">Faculty (Staff Coordinator / Mentor)</option>
                    <option value="Student">Student (ExeCom Candidate)</option>
                    <option value="Innovator">Innovator (Active Founder)</option>
                    <option value="Execom">Execom (Direct Leadership)</option>
                    <option value="Admin">Admin (Nodal Office)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Department *</label>
                  <select
                    className="form-input"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engg</option>
                    <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                    <option value="Electronics & Communication">Electronics & Comm.</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="IEDC Nodal Office">IEDC Nodal Office</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Designation / Semester</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Associate Professor / Semester 6"
                    value={newSemester}
                    onChange={e => setNewSemester(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">College / Faculty ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BMCE/FAC/CE005"
                    value={newCollegeId}
                    onChange={e => setNewCollegeId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 94471 23456"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Short Bio / Background</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Specialization, laboratory experience, or research interests..."
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">LinkedIn URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://linkedin.com/in/..."
                  value={newLinkedin}
                  onChange={e => setNewLinkedin(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <UserPlus size={15} /> Save & Open Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
