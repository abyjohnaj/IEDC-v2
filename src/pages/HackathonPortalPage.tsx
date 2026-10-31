import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { hackathonService } from '../services/hackathonService';
import { authService, openAuthModal } from '../services/authService';
import {
  HackathonEvent,
  HackathonTeam,
  HackathonRole,
  TeamChatMessage,
  ProjectSubmission,
  HackathonLeaderboardRow,
  User
} from '../types';
import {
  Users,
  Flame,
  Clock,
  MessageSquare,
  Share2,
  ExternalLink,
  Plus,
  Shield,
  CheckCircle,
  Copy,
  Check,
  Send,
  Code2,
  Award,
  Video,
  FileText,
  Github,
  Globe,
  Star,
  Settings,
  UserPlus,
  X,
  Filter,
  Search,
  MessageCircle,
  Hash,
  Key,
  GitCommit,
  AlertTriangle,
  Trophy,
  Scale
} from 'lucide-react';
import '../styles/hackathon.css';
import {
  validateKycForRegistrationOrTeamJoin,
  checkSubmissionDeadline
} from '../utils/hackathonEnforcementRules';


const AVAILABLE_ROLES: HackathonRole[] = [
  'Team Lead',
  'Frontend Dev',
  'Backend Dev',
  'AI / ML Engineer',
  'UI / UX Designer',
  'Hardware / IoT',
  'Pitch Presenter',
  'Fullstack Dev'
];

export const HackathonPortalPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [hackathon, setHackathon] = useState<HackathonEvent>(hackathonService.getActiveHackathon());
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [activeTab, setActiveTab] = useState<'directory' | 'my-team' | 'create-team' | 'leaderboard' | 'jury'>('directory');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Leaderboard & Jury Scoring State
  const [leaderboardRows, setLeaderboardRows] = useState<HackathonLeaderboardRow[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [evaluatingTeam, setEvaluatingTeam] = useState<HackathonTeam | null>(null);
  const [scoreInnovation, setScoreInnovation] = useState<number>(23);
  const [scoreTechnical, setScoreTechnical] = useState<number>(22);
  const [scoreUIUX, setScoreUIUX] = useState<number>(24);
  const [scorePresentation, setScorePresentation] = useState<number>(23);
  const [juryFeedback, setJuryFeedback] = useState<string>('');
  const [declaredNoConflict, setDeclaredNoConflict] = useState<boolean>(false);
  const [submittingGrade, setSubmittingGrade] = useState<boolean>(false);

  // Filters for Team Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All Tracks');
  const [onlyOpenTeams, setOnlyOpenTeams] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All Roles');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 28,
    minutes: 42,
    seconds: 15
  });

  // Team Workspace Tab state
  const [workspaceTab, setWorkspaceTab] = useState<'chat' | 'roster' | 'submission' | 'settings'>('chat');
  const [chatMessages, setChatMessages] = useState<TeamChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Modals & Actions
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinTargetTeam, setJoinTargetTeam] = useState<HackathonTeam | null>(null);
  const [joinRequestedRole, setJoinRequestedRole] = useState<HackathonRole>('Frontend Dev');
  const [joinNote, setJoinNote] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Team Form State
  const [teamName, setTeamName] = useState('');
  const [teamTagline, setTeamTagline] = useState('');
  const [teamTrack, setTeamTrack] = useState(hackathon.tracks[0] || 'Generative AI & LLMs');
  const [teamIsOpen, setTeamIsOpen] = useState(true);
  const [selectedSeekingRoles, setSelectedSeekingRoles] = useState<HackathonRole[]>(['Frontend Dev', 'UI / UX Designer']);
  const [teamDiscordUrl, setTeamDiscordUrl] = useState('');
  const [teamWhatsappUrl, setTeamWhatsappUrl] = useState('');
  const [myLeaderRole, setMyLeaderRole] = useState<HackathonRole>('Team Lead');

  // Project Submission Form State inside Workspace
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionTagline, setSubmissionTagline] = useState('');
  const [submissionOverview, setSubmissionOverview] = useState('');
  const [submissionTechStack, setSubmissionTechStack] = useState('');
  const [submissionGithub, setSubmissionGithub] = useState('');
  const [submissionDemoVideo, setSubmissionDemoVideo] = useState('');
  const [submissionLiveDemo, setSubmissionLiveDemo] = useState('');
  const [submissionPitchDeck, setSubmissionPitchDeck] = useState('');
  const [submissionCommitSha, setSubmissionCommitSha] = useState('');
  const [savingSubmission, setSavingSubmission] = useState(false);

  // Invite Code Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteRoleInput, setInviteRoleInput] = useState<HackathonRole>('Frontend Dev');

  // Load teams and current user's team
  const refreshTeams = () => {
    const all = hackathonService.getAllTeams(hackathon.id);
    setTeams(all);

    // If user has a team, select it automatically
    if (user) {
      const myTeam = hackathonService.getUserTeam(user.id, hackathon.id);
      if (myTeam && !selectedTeamId) {
        setSelectedTeamId(myTeam.id);
      }
    }
  };

  useEffect(() => {
    refreshTeams();

    const unsubAuth = authService.onAuthStateChange(u => {
      setUser(u);
      refreshTeams();
    });

    const unsubTeams = hackathonService.subscribeTeams(() => refreshTeams());

    return () => {
      unsubAuth();
      unsubTeams();
    };
  }, [hackathon.id]);

  // Real-time Countdown Timer
  useEffect(() => {
    const end = new Date(hackathon.endDate).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, end - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(interval);
  }, [hackathon.endDate]);

  // Load chat messages when active team changes
  const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

  useEffect(() => {
    if (activeTeam) {
      setChatMessages(hackathonService.getTeamChatMessages(activeTeam.id));

      // populate submission form if exists
      if (activeTeam.projectSubmission) {
        const sub = activeTeam.projectSubmission;
        setSubmissionTitle(sub.projectTitle || '');
        setSubmissionTagline(sub.tagline || '');
        setSubmissionOverview(sub.overview || '');
        setSubmissionTechStack(sub.techStack?.join(', ') || '');
        setSubmissionGithub(sub.githubUrl || '');
        setSubmissionDemoVideo(sub.demoVideoUrl || '');
        setSubmissionLiveDemo(sub.liveDemoUrl || '');
        setSubmissionPitchDeck(sub.pitchDeckUrl || '');
      }
    }

    const unsubChat = hackathonService.subscribeChat(teamId => {
      if (activeTeam && teamId === activeTeam.id) {
        setChatMessages(hackathonService.getTeamChatMessages(teamId));
      }
    });

    return () => unsubChat();
  }, [activeTeam?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyInviteCode = () => {
    if (!activeTeam) return;
    navigator.clipboard.writeText(activeTeam.inviteCode);
    setCopiedCode(true);
    showToast(`Invite code "${activeTeam.inviteCode}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim() || !activeTeam) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    const member = activeTeam.members.find(m => m.userId === user.id);
    const roleName = member?.roleInTeam || user.role;

    hackathonService.sendTeamChatMessage(activeTeam.id, {
      senderId: user.id,
      senderName: user.fullName,
      senderAvatar: user.avatar,
      senderRole: roleName,
      text: newChatText.trim()
    });

    setNewChatText('');
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('signup');
      return;
    }

    if (!teamName.trim() || !teamTagline.trim()) {
      alert('Please fill in Team Name and Tagline.');
      return;
    }

    const created = hackathonService.createTeam({
      hackathonId: hackathon.id,
      hackathonTitle: hackathon.title,
      name: teamName.trim(),
      tagline: teamTagline.trim(),
      track: teamTrack,
      isOpen: teamIsOpen,
      rolesNeeded: selectedSeekingRoles,
      leader: user,
      leaderRole: myLeaderRole,
      discordInviteUrl: teamDiscordUrl.trim() || undefined,
      whatsappGroupUrl: teamWhatsappUrl.trim() || undefined
    });

    setSelectedTeamId(created.id);
    setActiveTab('my-team');
    showToast(`Squad "${created.name}" created! Welcome to your Lablab Workspace!`);
    refreshTeams();
  };

  const handleOpenJoinModal = (team: HackathonTeam) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setJoinTargetTeam(team);
    setJoinRequestedRole(team.rolesNeeded[0] || 'Frontend Dev');
    setIsJoinModalOpen(true);
  };

  const handleConfirmJoin = async () => {
    if (!user || !joinTargetTeam) return;

    const kycCheck = validateKycForRegistrationOrTeamJoin(user.kyc?.status || user.kycStatus);
    if (!kycCheck.allowed) {
      alert(kycCheck.error);
      return;
    }

    const res = await hackathonService.joinTeam(
      joinTargetTeam.id,
      user,
      joinRequestedRole,
      joinNote
    );

    setIsJoinModalOpen(false);
    if (res.joined) {
      setSelectedTeamId(joinTargetTeam.id);
      setActiveTab('my-team');
      showToast(`Joined team "${joinTargetTeam.name}" successfully! Welcome aboard!`);
    } else if (res.pending) {
      showToast(`Join request submitted to team leader for review!`);
    } else if (res.error) {
      alert(res.error);
    }
    refreshTeams();
  };

  const handleJoinViaInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!inviteCodeInput.trim()) {
      alert('Please enter a valid squad invite code.');
      return;
    }

    const kycCheck = validateKycForRegistrationOrTeamJoin(user.kyc?.status || user.kycStatus);
    if (!kycCheck.allowed) {
      alert(kycCheck.error);
      return;
    }

    try {
      const res = await hackathonService.joinTeamWithInvite(inviteCodeInput.trim(), inviteRoleInput);
      if (res.success) {
        showToast(`Joined ${res.team_name || 'team'} successfully! Welcome aboard!`);
        setIsInviteModalOpen(false);
        setInviteCodeInput('');
        refreshTeams();
        if (res.team_id) {
          setSelectedTeamId(res.team_id);
          setActiveTab('my-team');
        }
        return;
      }
    } catch {
      // Fallback: match against local stored teams inviteCode
      const matched = teams.find(t => t.inviteCode.toUpperCase() === inviteCodeInput.trim().toUpperCase());
      if (matched) {
        const joinRes = await hackathonService.joinTeam(matched.id, user, inviteRoleInput);
        if (joinRes.joined) {
          setSelectedTeamId(matched.id);
          setActiveTab('my-team');
          showToast(`Joined team "${matched.name}" successfully with code!`);
          setIsInviteModalOpen(false);
          setInviteCodeInput('');
          refreshTeams();
          return;
        } else if (joinRes.error) {
          alert(joinRes.error);
          return;
        }
      }
      alert('Invalid, full, or expired invite code. Please confirm with your team leader.');
    }
  };

  const handleRespondRequest = async (requestId: string, decision: 'accepted' | 'declined') => {
    if (!activeTeam) return;
    await hackathonService.respondToJoinRequest(activeTeam.id, requestId, decision);
    showToast(`Request ${decision === 'accepted' ? 'accepted! Member added to roster' : 'declined'}.`);
    refreshTeams();
  };

  const handleRoleChange = async (memberUserId: string, newRole: HackathonRole) => {
    if (!activeTeam) return;
    await hackathonService.assignMemberRole(activeTeam.id, memberUserId, newRole);
    showToast('Member role assigned successfully!');
    refreshTeams();
  };

  const handleSaveSubmission = async (status: 'draft' | 'submitted') => {
    if (!activeTeam) return;

    if (status === 'submitted') {
      const deadlineCheck = checkSubmissionDeadline(hackathon.endDate);
      if (!deadlineCheck.allowed) {
        alert(deadlineCheck.error || 'Submission deadline has passed. Submissions are now locked.');
        return;
      }

      if (!submissionTitle.trim() || !submissionGithub.trim()) {
        alert('Project Title and GitHub Repository URL are required to submit to jury.');
        return;
      }
    }

    setSavingSubmission(true);
    try {
      const techArr = submissionTechStack.split(',').map(s => s.trim()).filter(Boolean);

      const sub: ProjectSubmission = {
        projectTitle: submissionTitle.trim() || activeTeam.name,
        tagline: submissionTagline.trim() || activeTeam.tagline,
        track: activeTeam.track,
        overview: submissionOverview.trim(),
        techStack: techArr,
        githubUrl: submissionGithub.trim(),
        demoVideoUrl: submissionDemoVideo.trim() || undefined,
        liveDemoUrl: submissionLiveDemo.trim() || undefined,
        pitchDeckUrl: submissionPitchDeck.trim() || undefined,
        status
      };

      await hackathonService.saveProjectSubmission(activeTeam.id, sub);
      showToast(status === 'submitted' ? 'Project finalized & snapshot saved for Hackathon Jury!' : 'Draft saved successfully!');
      refreshTeams();
    } catch (err: any) {
      alert(err.message || 'Error saving project');
    } finally {
      setSavingSubmission(false);
    }
  };

  // Filtered teams list
  const filteredTeams = teams.filter(t => {
    const matchTrack = selectedTrack === 'All Tracks' || t.track === selectedTrack;
    const matchOpen = !onlyOpenTeams || t.isOpen;
    const matchRole = roleFilter === 'All Roles' || t.rolesNeeded.includes(roleFilter as HackathonRole);
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.tagline.toLowerCase().includes(q) ||
      t.members.some(m => m.name.toLowerCase().includes(q));

    return matchTrack && matchOpen && matchRole && matchQuery;
  });

  const isLeaderOfActiveTeam = user && activeTeam && activeTeam.members.find(m => m.userId === user.id)?.isLeader;
  const isMemberOfActiveTeam = user && activeTeam && activeTeam.members.some(m => m.userId === user.id);

  // Load official leaderboard
  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const rows = await hackathonService.getLeaderboard(hackathon.id);
      if (rows && rows.length > 0) {
        setLeaderboardRows(rows);
      } else {
        // Fallback from submitted teams
        const submitted = teams
          .filter(t => t.projectSubmission?.score?.total)
          .map(t => ({
            teamId: t.id,
            teamName: t.name,
            track: t.track,
            projectTitle: t.projectSubmission?.projectTitle,
            totalScore: t.projectSubmission?.score?.total || 0,
            judgesCount: 1,
            rank: 0
          }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((item, idx) => ({ ...item, rank: idx + 1 }));
        setLeaderboardRows(submitted);
      }
    } catch {
      // Fallback from submitted teams
      const submitted = teams
        .filter(t => t.projectSubmission?.score?.total)
        .map(t => ({
          teamId: t.id,
          teamName: t.name,
          track: t.track,
          projectTitle: t.projectSubmission?.projectTitle,
          totalScore: t.projectSubmission?.score?.total || 0,
          judgesCount: 1,
          rank: 0
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));
      setLeaderboardRows(submitted);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, teams]);

  const handleOpenJuryModal = (team: HackathonTeam) => {
    setEvaluatingTeam(team);
    if (team.projectSubmission?.score) {
      setScoreInnovation(team.projectSubmission.score.innovation);
      setScoreTechnical(team.projectSubmission.score.technical);
      setScorePresentation(team.projectSubmission.score.presentation);
      setScoreUIUX(team.projectSubmission.score.feasibility);
      setJuryFeedback(team.projectSubmission.adminFeedback || '');
    } else {
      setScoreInnovation(22);
      setScoreTechnical(22);
      setScoreUIUX(22);
      setScorePresentation(22);
      setJuryFeedback('');
    }
    setDeclaredNoConflict(false);
  };

  const handleSubmitJuryScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingTeam) return;

    if (!declaredNoConflict) {
      alert('Please confirm the Conflict of Interest declaration to submit official jury scores.');
      return;
    }

    if (!juryFeedback.trim()) {
      alert('Please provide qualitative feedback to guide the student innovators.');
      return;
    }

    setSubmittingGrade(true);
    try {
      const total = scoreInnovation + scoreTechnical + scoreUIUX + scorePresentation;
      await hackathonService.gradeTeamSubmission(
        evaluatingTeam.id,
        {
          innovation: scoreInnovation,
          technical: scoreTechnical,
          presentation: scorePresentation,
          feasibility: scoreUIUX,
          total
        },
        juryFeedback.trim(),
        user?.fullName || 'Hackathon Juror'
      );

      showToast(`⭐ Evaluation submitted for "${evaluatingTeam.name}"! Total score: ${total}/100.`);
      setEvaluatingTeam(null);
      refreshTeams();
      if (activeTab === 'leaderboard') {
        loadLeaderboard();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit jury evaluation.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div className="hackathon-page-root">
      <Navbar />

      {/* Hero Banner with Live Countdown */}
      <section className="hackathon-banner">
        <div className="container hackathon-banner-inner">
          <div className="hackathon-live-badge">
            <span className="live-pulse-dot" />
            <span>HACKATHON SPRINT LIVE</span>
          </div>

          <h1 className="hackathon-banner-title">{hackathon.title}</h1>
          <p className="hackathon-banner-sub">{hackathon.subtitle}</p>

          {/* Countdown & Key Stats Box */}
          <div className="hackathon-timer-card">
            <div className="hackathon-timer-col">
              <span className="timer-label">Programme Ends In:</span>
              <div className="timer-digits-row">
                <div className="timer-digit-box">
                  <span className="digit-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="digit-unit">Hours</span>
                </div>
                <span className="timer-sep">:</span>
                <div className="timer-digit-box">
                  <span className="digit-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="digit-unit">Mins</span>
                </div>
                <span className="timer-sep">:</span>
                <div className="timer-digit-box">
                  <span className="digit-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="digit-unit">Secs</span>
                </div>
              </div>
            </div>

            <div className="timer-stats-divider" />

            <div className="hackathon-stat-capsules">
              <div className="capsule-item">
                <span className="capsule-val">{teams.length}</span>
                <span className="capsule-txt">Active Teams</span>
              </div>
              <div className="capsule-item">
                <span className="capsule-val">
                  {teams.reduce((acc, t) => acc + t.members.length, 0)}
                </span>
                <span className="capsule-txt">Hackers Building</span>
              </div>
              <div className="capsule-item">
                <span className="capsule-val">{hackathon.prizePool}</span>
                <span className="capsule-txt">Prize & Grants</span>
              </div>
            </div>
          </div>

          {/* Main Top Navigation Tabs (Lablab Style) */}
          <div className="hackathon-nav-tabs">
            <button
              className={`hackathon-nav-btn ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              <Users size={16} />
              <span>Explore Teams & Open Squads ({teams.length})</span>
            </button>

            <button
              className={`hackathon-nav-btn ${activeTab === 'my-team' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-team')}
            >
              <Code2 size={16} />
              <span>
                {activeTeam ? `Team Workspace: ${activeTeam.name}` : 'My Team Workspace'}
              </span>
            </button>

            <button
              className={`hackathon-nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy size={16} style={{ color: '#f59e0b' }} />
              <span>Leaderboard & Ranks</span>
            </button>

            {(user?.role === 'Admin' || user?.role === 'Execom' || user?.role === 'Judge' || user?.role === 'Reviewer') && (
              <button
                className={`hackathon-nav-btn ${activeTab === 'jury' ? 'active' : ''}`}
                onClick={() => setActiveTab('jury')}
                style={{ borderColor: 'var(--accent-cyan)' }}
              >
                <Scale size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>Jury Scoring Desk</span>
              </button>
            )}

            <button
              className={`hackathon-nav-btn ${activeTab === 'create-team' ? 'active' : ''}`}
              onClick={() => {
                if (!user) openAuthModal('signup');
                else setActiveTab('create-team');
              }}
            >
              <Plus size={16} />
              <span>Form Squad</span>
            </button>

            <button
              className="hackathon-nav-btn"
              onClick={() => {
                if (!user) openAuthModal('login');
                else setIsInviteModalOpen(true);
              }}
            >
              <Key size={16} />
              <span>Join with Invite Code</span>
            </button>
          </div>
        </div>
      </section>

      {/* TAB 1: EXPLORE TEAMS DIRECTORY */}
      {activeTab === 'directory' && (
        <section className="container hackathon-section">
          {/* Filter Bar */}
          <div className="hackathon-filter-bar">
            <div className="hackathon-search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search teams by name, project tagline, or teammate..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="hackathon-search-input"
              />
            </div>

            <div className="filter-dropdowns">
              <select
                className="hackathon-select"
                value={selectedTrack}
                onChange={e => setSelectedTrack(e.target.value)}
              >
                <option value="All Tracks">All Tracks</option>
                {hackathon.tracks.map(tr => (
                  <option key={tr} value={tr}>{tr}</option>
                ))}
              </select>

              <select
                className="hackathon-select"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="All Roles">Roles Needed (All)</option>
                {AVAILABLE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyOpenTeams}
                  onChange={e => setOnlyOpenTeams(e.target.checked)}
                />
                <span>Open for Joining</span>
              </label>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="hackathon-teams-grid">
            {filteredTeams.map(team => {
              const isFull = team.members.length >= team.maxMembers;
              const userInTeam = user && team.members.some(m => m.userId === user.id);

              return (
                <div key={team.id} className="team-card">
                  <div className="team-card-top">
                    <span className="track-badge">{team.track}</span>
                    <span className={`open-badge ${team.isOpen && !isFull ? 'open' : 'closed'}`}>
                      {isFull ? 'Team Full (4/4)' : team.isOpen ? 'Open Team' : 'Invite Only'}
                    </span>
                  </div>

                  <h3 className="team-card-name">{team.name}</h3>
                  <p className="team-card-tagline">{team.tagline}</p>

                  {/* Seeking Roles Pills */}
                  {team.rolesNeeded.length > 0 && !isFull && (
                    <div className="seeking-roles-box">
                      <span className="seeking-title">Seeking:</span>
                      <div className="seeking-chips">
                        {team.rolesNeeded.map((r, i) => (
                          <span key={i} className="seeking-chip">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members Roster Preview */}
                  <div className="team-members-row">
                    <div className="members-avatars">
                      {team.members.map(m => (
                        <img
                          key={m.userId}
                          src={m.avatar}
                          alt={m.name}
                          className="member-avatar-stacked"
                          title={`${m.name} (${m.roleInTeam})`}
                        />
                      ))}
                    </div>
                    <span className="members-count-badge">
                      {team.members.length}/{team.maxMembers} Members
                    </span>
                  </div>

                  {/* External Links Bar */}
                  <div className="team-card-links">
                    {team.discordInviteUrl && (
                      <a
                        href={team.discordInviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn discord"
                        title="Join Team Discord"
                      >
                        <MessageSquare size={13} /> Discord
                      </a>
                    )}
                    {team.whatsappGroupUrl && (
                      <a
                        href={team.whatsappGroupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn whatsapp"
                        title="Join Team WhatsApp"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    )}
                    {team.githubOrgUrl && (
                      <a
                        href={team.githubOrgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn github"
                        title="View GitHub Repository"
                      >
                        <Github size={13} /> Repo
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="team-card-footer">
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setActiveTab('my-team');
                      }}
                    >
                      Inspect Team
                    </button>

                    {userInTeam ? (
                      <span className="btn-in-team">
                        <Check size={14} /> You are in this squad
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                        disabled={isFull}
                        onClick={() => handleOpenJoinModal(team)}
                      >
                        <UserPlus size={14} />
                        {team.isOpen ? 'Join Open Squad' : 'Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: LABLAB-STYLE TEAM WORKSPACE */}
      {activeTab === 'my-team' && activeTeam && (
        <section className="container hackathon-section">
          {/* Workspace Hero Bar */}
          <div className="workspace-hero">
            <div className="workspace-hero-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="track-badge">{activeTeam.track}</span>
                <span className="invite-code-pill" onClick={handleCopyInviteCode}>
                  Invite Code: <strong>{activeTeam.inviteCode}</strong>
                  {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                </span>
                {activeTeam.projectSubmission?.status === 'submitted' && (
                  <span className="submission-submitted-pill">
                    <Award size={13} /> Project Submitted
                  </span>
                )}
              </div>

              <h2 className="workspace-title">{activeTeam.name}</h2>
              <p className="workspace-tagline">{activeTeam.tagline}</p>
            </div>

            {/* Quick External Group Action Buttons */}
            <div className="workspace-social-actions">
              {activeTeam.discordInviteUrl ? (
                <a
                  href={activeTeam.discordInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-discord"
                >
                  <MessageSquare size={16} /> Open Team Discord
                </a>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setWorkspaceTab('settings')}
                >
                  + Add Discord Link
                </button>
              )}

              {activeTeam.whatsappGroupUrl ? (
                <a
                  href={activeTeam.whatsappGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp"
                >
                  <MessageCircle size={16} /> WhatsApp Group
                </a>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setWorkspaceTab('settings')}
                >
                  + Add WhatsApp Link
                </button>
              )}
            </div>
          </div>

          {/* Workspace Inner Navigation Tabs */}
          <div className="workspace-tabs-bar">
            <button
              className={`workspace-tab-btn ${workspaceTab === 'chat' ? 'active' : ''}`}
              onClick={() => setWorkspaceTab('chat')}
            >
              <MessageSquare size={16} />
              <span>Live Team Chat</span>
            </button>

            <button
              className={`workspace-tab-btn ${workspaceTab === 'roster' ? 'active' : ''}`}
              onClick={() => setWorkspaceTab('roster')}
            >
              <Users size={16} />
              <span>Team Roster & Roles ({activeTeam.members.length})</span>
              {activeTeam.joinRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="pending-badge">
                  {activeTeam.joinRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              className={`workspace-tab-btn ${workspaceTab === 'submission' ? 'active' : ''}`}
              onClick={() => setWorkspaceTab('submission')}
            >
              <Award size={16} />
              <span>Project Submission & Evaluation</span>
            </button>

            {isLeaderOfActiveTeam && (
              <button
                className={`workspace-tab-btn ${workspaceTab === 'settings' ? 'active' : ''}`}
                onClick={() => setWorkspaceTab('settings')}
              >
                <Settings size={16} />
                <span>Team Settings</span>
              </button>
            )}
          </div>

          {/* SUBTAB 1: LIVE TEAM CHAT ROOM (Active Till Programme Ends) */}
          {workspaceTab === 'chat' && (
            <div className="workspace-chat-container">
              <div className="chat-header-notice">
                <Clock size={16} className="text-cyan" />
                <span>
                  Team channel is active and synchronized till hackathon sprint concludes. Coordinate code, share pins, and synchronize testing!
                </span>
              </div>

              <div className="chat-messages-scroll">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-bubble-row ${msg.isAnnouncement ? 'announcement' : ''} ${msg.senderId === user?.id ? 'self' : ''}`}
                  >
                    {!msg.isAnnouncement && (
                      <img src={msg.senderAvatar} alt={msg.senderName} className="chat-avatar" />
                    )}

                    <div className="chat-bubble-content">
                      <div className="chat-bubble-header">
                        <span className="chat-sender-name">{msg.senderName}</span>
                        <span className="chat-sender-role">{msg.senderRole}</span>
                        <span className="chat-timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="chat-bubble-text">{msg.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} className="chat-input-bar">
                <input
                  type="text"
                  placeholder={user ? "Write message to teammates, paste links or notes..." : "Sign in to chat with team..."}
                  className="chat-text-input"
                  value={newChatText}
                  onChange={e => setNewChatText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary chat-send-btn">
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* SUBTAB 2: ROSTER & ROLE MANAGEMENT */}
          {workspaceTab === 'roster' && (
            <div className="workspace-roster-view">
              <div className="roster-grid">
                {activeTeam.members.map(member => (
                  <div key={member.userId} className="roster-member-card">
                    <img src={member.avatar} alt={member.name} className="roster-avatar" />
                    <div className="roster-info">
                      <div className="roster-name-row">
                        <h4 className="roster-name">{member.name}</h4>
                        {member.isLeader && (
                          <span className="leader-star-badge" title="Team Leader">
                            ★ Leader
                          </span>
                        )}
                      </div>
                      <div className="roster-email">{member.email}</div>
                      <div className="roster-college">
                        {member.college || 'Baselios Mathews II College of Engineering'}
                      </div>

                      {/* Role Selector / Display */}
                      <div className="roster-role-box">
                        <span className="role-label">Assigned Role:</span>
                        {isLeaderOfActiveTeam ? (
                          <select
                            className="role-select"
                            value={member.roleInTeam}
                            onChange={e => handleRoleChange(member.userId, e.target.value as HackathonRole)}
                          >
                            {AVAILABLE_ROLES.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="role-pill">{member.roleInTeam}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending Join Requests Section (Only for Team Leader or viewing squad) */}
              {activeTeam.joinRequests.length > 0 && (
                <div className="pending-requests-section">
                  <h3 className="section-title-sm">
                    Pending Squad Join Requests ({activeTeam.joinRequests.filter(r => r.status === 'pending').length})
                  </h3>

                  <div className="requests-list">
                    {activeTeam.joinRequests.map(req => (
                      <div key={req.id} className="request-card">
                        <img src={req.userAvatar} alt={req.userName} className="request-avatar" />
                        <div className="request-body">
                          <div className="request-top">
                            <span className="request-name">{req.userName}</span>
                            <span className="request-role-tag">Requested: {req.requestedRole}</span>
                            <span className={`request-status-pill ${req.status}`}>
                              {req.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="request-college">{req.userCollege || 'BMCE'}</div>
                          <div className="request-message">"{req.message}"</div>
                        </div>

                        {isLeaderOfActiveTeam && req.status === 'pending' && (
                          <div className="request-actions">
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => handleRespondRequest(req.id, 'accepted')}
                            >
                              Accept Into Squad
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => handleRespondRequest(req.id, 'declined')}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: PROJECT SUBMISSION (Devfolio / Lablab style) */}
          {workspaceTab === 'submission' && (
            <div className="workspace-submission-view">
              {/* Jury Evaluation Scorecard (If reviewed by Admin) */}
              {activeTeam.projectSubmission?.score && (
                <div className="jury-scorecard-card">
                  <div className="scorecard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Star size={20} fill="#f59e0b" color="#f59e0b" />
                      <h3 style={{ margin: 0, fontWeight: 800 }}>Official Hackathon Jury Scorecard</h3>
                    </div>
                    <div className="total-score-badge">
                      {activeTeam.projectSubmission.score.total} / 100 PTS
                    </div>
                  </div>

                  <div className="score-breakdown-grid">
                    <div className="score-metric">
                      <span className="metric-val">{activeTeam.projectSubmission.score.innovation}/25</span>
                      <span className="metric-lbl">Innovation & Novelty</span>
                    </div>
                    <div className="score-metric">
                      <span className="metric-val">{activeTeam.projectSubmission.score.technical}/25</span>
                      <span className="metric-lbl">Technical Execution</span>
                    </div>
                    <div className="score-metric">
                      <span className="metric-val">{activeTeam.projectSubmission.score.feasibility}/25</span>
                      <span className="metric-lbl">Feasibility & Impact</span>
                    </div>
                    <div className="score-metric">
                      <span className="metric-val">{activeTeam.projectSubmission.score.presentation}/25</span>
                      <span className="metric-lbl">Presentation & Demo</span>
                    </div>
                  </div>

                  <div className="jury-feedback-box">
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>
                      Jury Evaluation Remarks ({activeTeam.projectSubmission.reviewedBy || 'Jury Panel'}):
                    </div>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      "{activeTeam.projectSubmission.adminFeedback}"
                    </p>
                  </div>
                </div>
              )}

              {/* Submission Form */}
              <div className="submission-form-card">
                <h3 className="section-title-sm" style={{ marginBottom: '1.25rem' }}>
                  Project Submission & Artifact Repository
                </h3>

                <div className="submission-fields-grid">
                  <div className="form-group-full">
                    <label className="form-label">Project Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AgriVision Jetson Sentinel"
                      value={submissionTitle}
                      onChange={e => setSubmissionTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Punchy One-Liner Pitch Tagline</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Multispectral edge AI rig that maps fungal decay in plantations"
                      value={submissionTagline}
                      onChange={e => setSubmissionTagline(e.target.value)}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Comprehensive Overview & Technical Architecture</label>
                    <textarea
                      rows={4}
                      className="form-textarea"
                      placeholder="Describe what your team built during the sprint, the problem tackled, and how your code or hardware functions..."
                      value={submissionOverview}
                      onChange={e => setSubmissionOverview(e.target.value)}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Tech Stack (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="PyTorch, Jetson Orin Nano, PX4 Autopilot, FastAPI, React"
                      value={submissionTechStack}
                      onChange={e => setSubmissionTechStack(e.target.value)}
                    />
                  </div>

                  <div className="form-group-half">
                    <label className="form-label">
                      <Github size={14} /> GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://github.com/org/hackathon-project"
                      value={submissionGithub}
                      onChange={e => setSubmissionGithub(e.target.value)}
                    />
                  </div>

                  <div className="form-group-half">
                    <label className="form-label">
                      <GitCommit size={14} /> Git Commit SHA (Auditable Snapshot)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 7f8a9c3d4e (immutable snapshot)"
                      value={submissionCommitSha}
                      onChange={e => setSubmissionCommitSha(e.target.value)}
                    />
                  </div>

                  <div className="form-group-half">
                    <label className="form-label">
                      <Video size={14} /> Demo Video Link (YouTube / Loom)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://youtube.com/watch?v=..."
                      value={submissionDemoVideo}
                      onChange={e => setSubmissionDemoVideo(e.target.value)}
                    />
                  </div>

                  <div className="form-group-half">
                    <label className="form-label">
                      <Globe size={14} /> Live Demo WebApp or APK Link
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://my-demo-app.web.app"
                      value={submissionLiveDemo}
                      onChange={e => setSubmissionLiveDemo(e.target.value)}
                    />
                  </div>

                  <div className="form-group-half">
                    <label className="form-label">
                      <FileText size={14} /> Pitch Deck Slides URL (Google Slides / PDF)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://slides.google.com/..."
                      value={submissionPitchDeck}
                      onChange={e => setSubmissionPitchDeck(e.target.value)}
                    />
                  </div>
                </div>

                <div className="submission-actions-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={savingSubmission}
                    onClick={() => handleSaveSubmission('draft')}
                  >
                    Save Draft
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={savingSubmission}
                    onClick={() => handleSaveSubmission('submitted')}
                  >
                    <Award size={16} />
                    Finalize & Submit to Jury
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: SQUAD SETTINGS (LEADER ONLY) */}
          {workspaceTab === 'settings' && isLeaderOfActiveTeam && (
            <div className="workspace-settings-card">
              <h3 className="section-title-sm" style={{ marginBottom: '1.25rem' }}>
                Squad Preferences & External Communication Channels
              </h3>

              <div className="form-group-full" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Team Discord Invite Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://discord.gg/..."
                  value={activeTeam.discordInviteUrl || ''}
                  onChange={e => {
                    hackathonService.updateSocialLinks(activeTeam.id, { discordInviteUrl: e.target.value });
                    refreshTeams();
                  }}
                />
              </div>

              <div className="form-group-full" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Team WhatsApp Group Invite Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://chat.whatsapp.com/..."
                  value={activeTeam.whatsappGroupUrl || ''}
                  onChange={e => {
                    hackathonService.updateSocialLinks(activeTeam.id, { whatsappGroupUrl: e.target.value });
                    refreshTeams();
                  }}
                />
              </div>

              <div className="form-group-full" style={{ marginBottom: '1rem' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={activeTeam.isOpen}
                    onChange={e => {
                      hackathonService.updateSocialLinks(activeTeam.id, { isOpen: e.target.checked });
                      refreshTeams();
                    }}
                  />
                  <span>Allow Open Squad Join Requests</span>
                </label>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: FORM NEW HACKATHON SQUAD FORM */}
      {activeTab === 'create-team' && (
        <section className="container hackathon-section">
          <div className="create-team-container">
            <h2 className="workspace-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              Register & Form New Hackathon Squad
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Create your squad workspace, set seeking roles, and share direct WhatsApp/Discord channels for seamless buildathon collaboration.
            </p>

            <form onSubmit={handleCreateTeam} className="create-team-form">
              <div className="form-group-full">
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ApexRobotics, QuantumShift, ByteForge"
                  className="form-input"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                />
              </div>

              <div className="form-group-full">
                <label className="form-label">Project Tagline & Vision *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous marine rover that detects toxic chemical seepage"
                  className="form-input"
                  value={teamTagline}
                  onChange={e => setTeamTagline(e.target.value)}
                />
              </div>

              <div className="form-group-half">
                <label className="form-label">Hackathon Track</label>
                <select
                  className="form-input"
                  value={teamTrack}
                  onChange={e => setTeamTrack(e.target.value)}
                >
                  {hackathon.tracks.map(tr => (
                    <option key={tr} value={tr}>{tr}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-half">
                <label className="form-label">Your Role as Leader</label>
                <select
                  className="form-input"
                  value={myLeaderRole}
                  onChange={e => setMyLeaderRole(e.target.value as HackathonRole)}
                >
                  {AVAILABLE_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-full">
                <label className="form-label">Seeking Roles (Select needed members):</label>
                <div className="role-checkboxes-grid">
                  {AVAILABLE_ROLES.filter(r => r !== myLeaderRole).map(r => (
                    <label key={r} className="role-check-item">
                      <input
                        type="checkbox"
                        checked={selectedSeekingRoles.includes(r)}
                        onChange={e => {
                          if (e.target.checked) setSelectedSeekingRoles([...selectedSeekingRoles, r]);
                          else setSelectedSeekingRoles(selectedSeekingRoles.filter(item => item !== r));
                        }}
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group-half">
                <label className="form-label">Discord Server Invite (Optional)</label>
                <input
                  type="url"
                  placeholder="https://discord.gg/..."
                  className="form-input"
                  value={teamDiscordUrl}
                  onChange={e => setTeamDiscordUrl(e.target.value)}
                />
              </div>

              <div className="form-group-half">
                <label className="form-label">WhatsApp Group Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  className="form-input"
                  value={teamWhatsappUrl}
                  onChange={e => setTeamWhatsappUrl(e.target.value)}
                />
              </div>

              <div className="form-group-full">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={teamIsOpen}
                    onChange={e => setTeamIsOpen(e.target.checked)}
                  />
                  <span>
                    Open Squad (Anyone can join directly without manual approval if spots are open)
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem' }}>
                  <Flame size={18} /> Launch Squad Workspace
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* TAB 4: OFFICIAL LEADERBOARD & RESULTS */}
      {activeTab === 'leaderboard' && (
        <section className="container hackathon-section">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Trophy size={24} style={{ color: '#f59e0b' }} />
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                    Official Hackathon Leaderboard
                  </h2>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Evaluated across 4 rubric pillars: Innovation (25%), Architecture (25%), UI/UX (25%), and Practical Impact (25%).
                </p>
              </div>

              <button
                onClick={loadLeaderboard}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
              >
                Refresh Rankings
              </button>
            </div>

            {/* Deliberation notice if results not yet finalized and user not admin */}
            {hackathon.status !== 'Completed' && user?.role !== 'Admin' && user?.role !== 'Execom' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Clock size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <strong>Jury Deliberation in Progress:</strong> Final rankings and scores are verified by the Nodal Evaluation Board before public release.
                </div>
              </div>
            )}

            {/* Podium for Top 3 */}
            {leaderboardRows.length >= 3 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
              }}>
                {/* 1st Place */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  border: '2px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  order: 1
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥇</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1st Place Champion
                  </div>
                  <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.2rem', fontWeight: 800 }}>
                    {leaderboardRows[0].teamName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                    {leaderboardRows[0].track}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b' }}>
                    {leaderboardRows[0].totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>

                {/* 2nd Place */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(148, 163, 184, 0.05) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  order: 2
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥈</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1st Runner-Up
                  </div>
                  <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.2rem', fontWeight: 800 }}>
                    {leaderboardRows[1].teamName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                    {leaderboardRows[1].track}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#cbd5e1' }}>
                    {leaderboardRows[1].totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.04) 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  order: 3
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥉</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2nd Runner-Up
                  </div>
                  <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.2rem', fontWeight: 800 }}>
                    {leaderboardRows[2].teamName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                    {leaderboardRows[2].track}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#d97706' }}>
                    {leaderboardRows[2].totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Ranked Table */}
            {loadingLeaderboard ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading verified standings...
              </div>
            ) : leaderboardRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No evaluated submissions yet. Check back during live jury presentations!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Rank</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Squad & Project</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Track</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Jury Reviews</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardRows.map((row) => (
                      <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.05rem' }}>
                          {row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{row.teamName}</div>
                          {row.projectTitle && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {row.projectTitle}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: 'var(--accent-cyan)',
                            borderRadius: '6px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.76rem',
                            fontWeight: 600
                          }}>
                            {row.track}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                          {row.judgesCount} evaluation(s)
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#10b981' }}>
                          {row.totalScore} / 100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 5: JURY SCORING DESK */}
      {activeTab === 'jury' && (
        <section className="container hackathon-section">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Scale size={24} style={{ color: 'var(--accent-cyan)' }} />
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                    Hackathon Jury & Expert Reviewer Desk
                  </h2>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Score finalized projects against standardized criteria: Innovation, Architecture, UI/UX Polish, and Real-World Impact.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: 'var(--accent-cyan)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  Evaluator: {user?.fullName || 'Juror'} ({user?.role || 'Jury Member'})
                </span>
              </div>
            </div>

            {/* Submitted Squads Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {teams
                .filter(t => t.projectSubmission?.status === 'submitted')
                .map(team => {
                  const sub = team.projectSubmission!;
                  const isGraded = Boolean(sub.score?.total);

                  return (
                    <div
                      key={team.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isGraded ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: 'var(--accent-cyan)',
                            borderRadius: '6px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {team.track}
                          </span>

                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            background: isGraded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isGraded ? '#10b981' : '#f59e0b'
                          }}>
                            {isGraded ? `Graded: ${sub.score?.total}/100` : 'Pending Evaluation'}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                          {team.name}
                        </h3>
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {sub.projectTitle}: {sub.tagline || team.tagline}
                        </p>

                        {/* Artifact Links */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {sub.githubUrl && (
                            <a
                              href={sub.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Github size={13} /> Code Repo
                            </a>
                          )}
                          {sub.liveDemoUrl && (
                            <a
                              href={sub.liveDemoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Globe size={13} /> Live Demo
                            </a>
                          )}
                          {sub.demoVideoUrl && (
                            <a
                              href={sub.demoVideoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Video size={13} /> Walkthrough
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenJuryModal(team)}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '0.6rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <Scale size={15} />
                        {isGraded ? 'Review / Update Evaluation' : 'Evaluate Project Rubric'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* JOIN SQUAD MODAL */}
      {/* Join Squad Modal */}
      {isJoinModalOpen && joinTargetTeam && (
        <div className="hackathon-modal-overlay" onClick={() => setIsJoinModalOpen(false)}>
          <div className="hackathon-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 800 }}>
                Join Squad: {joinTargetTeam.name}
              </h3>
              <button className="modal-close" onClick={() => setIsJoinModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                {joinTargetTeam.isOpen
                  ? "This squad is openly accepting teammates! Pick your role to join immediately."
                  : "This squad requires leader approval. Your request will be sent to the team leader."}
              </p>

              <div className="form-group-full" style={{ marginBottom: '1rem' }}>
                <label className="form-label">What role will you fulfill? *</label>
                <select
                  className="form-input"
                  value={joinRequestedRole}
                  onChange={e => setJoinRequestedRole(e.target.value as HackathonRole)}
                >
                  {AVAILABLE_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-full" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Message / Skills Note for Team</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Share your experience (e.g. Built 2 ROS2 robots, experience in PyTorch edge models, Figma designer)..."
                  value={joinNote}
                  onChange={e => setJoinNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsJoinModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmJoin}
                >
                  Confirm & Join Squad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join via Invite Code Modal */}
      {isInviteModalOpen && (
        <div className="hackathon-modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div className="hackathon-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="var(--accent-cyan)" /> Enter Team Invite Code
              </h3>
              <button className="modal-close" onClick={() => setIsInviteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleJoinViaInviteCode}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  Have an invite code from a squad leader? Enter the 6-character code below to join their team directly.
                </p>

                <div className="form-group-full" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Invite Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. NOVA26"
                    value={inviteCodeInput}
                    onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, fontSize: '1.1rem' }}
                    required
                  />
                </div>

                <div className="form-group-full" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Role in Team *</label>
                  <select
                    className="form-input"
                    value={inviteRoleInput}
                    onChange={e => setInviteRoleInput(e.target.value as HackathonRole)}
                  >
                    {AVAILABLE_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsInviteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Join Team
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JURY RUBRIC EVALUATION MODAL */}
      {evaluatingTeam && (
        <div className="hackathon-modal-overlay" onClick={() => setEvaluatingTeam(null)}>
          <div
            className="hackathon-modal-card"
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scale size={18} color="var(--accent-cyan)" />
                  Jury Evaluation: {evaluatingTeam.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Track: {evaluatingTeam.track} • Project: {evaluatingTeam.projectSubmission?.projectTitle}
                </span>
              </div>
              <button className="modal-close" onClick={() => setEvaluatingTeam(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitJuryScore}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Score Sliders / Inputs */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                      1. Innovation & Novelty (25% weight)
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{scoreInnovation} / 25</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={scoreInnovation}
                    onChange={e => setScoreInnovation(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Originality of problem-solving approach and intellectual property value.
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                      2. Technical Architecture & Code Quality (25% weight)
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{scoreTechnical} / 25</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={scoreTechnical}
                    onChange={e => setScoreTechnical(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Robustness, scalability, hardware integration, and Git commit integrity.
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                      3. UI/UX & Working Prototype State (25% weight)
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{scoreUIUX} / 25</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={scoreUIUX}
                    onChange={e => setScoreUIUX(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Visual appeal, user feedback cues, design consistency, and MVP functionality.
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                      4. Pitch Presentation & Practical Impact (25% weight)
                    </label>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{scorePresentation} / 25</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={scorePresentation}
                    onChange={e => setScorePresentation(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Market viability, Kerala/KTU impact, and clarity of live demonstration.
                  </span>
                </div>

                {/* Total Calculated Score */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Total Weighted Score:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                    {scoreInnovation + scoreTechnical + scoreUIUX + scorePresentation} / 100
                  </span>
                </div>

                {/* Qualitative Feedback */}
                <div>
                  <label className="form-label">Qualitative Jury Review & Guidance Notes *</label>
                  <textarea
                    rows={4}
                    required
                    className="form-textarea"
                    placeholder="Provide actionable feedback on architecture strengths, potential edge cases, and next prototype milestones..."
                    value={juryFeedback}
                    onChange={e => setJuryFeedback(e.target.value)}
                  />
                </div>

                {/* Conflict of Interest Declaration */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem'
                }}>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={declaredNoConflict}
                      onChange={e => setDeclaredNoConflict(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong>Conflict of Interest Confirmation:</strong> I confirm that I have no personal connection or direct team affiliation that biases this evaluation.
                    </span>
                  </label>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEvaluatingTeam(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrade}
                    className="btn btn-primary"
                  >
                    {submittingGrade ? 'Publishing Grade...' : 'Submit Official Grade'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="hackathon-toast">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <Footer />
    </div>
  );
};

