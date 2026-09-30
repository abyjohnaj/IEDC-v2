import React, { useState, useEffect } from 'react';
import { hackathonService } from '../../services/hackathonService';
import { reportService } from '../../services/reportService';
import { HackathonTeam, HackathonEvent, ProjectSubmission, HackathonLeaderboardRow } from '../../types';
import {
  Users,
  Award,
  Search,
  MessageSquare,
  MessageCircle,
  Github,
  Video,
  Globe,
  Star,
  ExternalLink,
  CheckCircle,
  FileText,
  Clock,
  Send,
  Eye,
  X,
  Download,
  Trophy,
  FileSpreadsheet,
  Scale,
  RefreshCw
} from 'lucide-react';

interface AdminHackathonSectionProps {
  onNotify: (msg: string) => void;
}

export const AdminHackathonSection: React.FC<AdminHackathonSectionProps> = ({ onNotify }) => {
  const [hackathons] = useState<HackathonEvent[]>(hackathonService.getHackathons());
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>(hackathons[0]?.id || '');
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Inspection modals
  const [inspectTeam, setInspectTeam] = useState<HackathonTeam | null>(null);
  const [inspectChatTeam, setInspectChatTeam] = useState<HackathonTeam | null>(null);
  const [gradeModalTeam, setGradeModalTeam] = useState<HackathonTeam | null>(null);

  // Grading form state
  const [scoreInnovation, setScoreInnovation] = useState<number>(24);
  const [scoreTechnical, setScoreTechnical] = useState<number>(23);
  const [scorePresentation, setScorePresentation] = useState<number>(22);
  const [scoreFeasibility, setScoreFeasibility] = useState<number>(23);
  const [adminFeedbackText, setAdminFeedbackText] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Dr. Preetha M. (IEDC Nodal Officer)');

  const refresh = () => {
    setTeams(hackathonService.getAllTeams(selectedHackathonId));
  };

  // View switcher state
  const [activeView, setActiveView] = useState<'submissions' | 'leaderboard'>('submissions');
  const [leaderboard, setLeaderboard] = useState<HackathonLeaderboardRow[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const fetchLeaderboardData = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const rows = await hackathonService.getLeaderboard(selectedHackathonId);
      if (rows && rows.length > 0) {
        setLeaderboard(rows);
      } else {
        // Fallback calculation from submitted teams
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
        setLeaderboard(submitted);
      }
    } catch {
      // Fallback calculation from submitted teams
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
      setLeaderboard(submitted);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeView === 'leaderboard') {
      fetchLeaderboardData();
    }
  }, [activeView, selectedHackathonId, teams]);

  const handleExportRankings = () => {
    const csv = reportService.generateHackathonRankingsCSV(leaderboard, activeHackathon.title);
    reportService.downloadCSV(csv, `${activeHackathon.title.toLowerCase().replace(/\s+/g, '-')}-rankings.csv`);
    onNotify('📥 Official Hackathon rankings CSV downloaded successfully!');
  };

  const handleExportScoreSheets = async () => {
    const sheets = teams
      .filter(t => t.projectSubmission?.score)
      .flatMap(t => {
        const score = t.projectSubmission!.score!;
        return [
          { teamName: t.name, track: t.track, judgeName: t.projectSubmission?.reviewedBy || reviewerName, criterionName: 'Innovation & Originality', weight: 1.5, score: score.innovation, feedback: t.projectSubmission?.adminFeedback },
          { teamName: t.name, track: t.track, judgeName: t.projectSubmission?.reviewedBy || reviewerName, criterionName: 'Technical Architecture & Code', weight: 1.5, score: score.technical },
          { teamName: t.name, track: t.track, judgeName: t.projectSubmission?.reviewedBy || reviewerName, criterionName: 'UI/UX & Prototype Polish', weight: 1.0, score: score.presentation },
          { teamName: t.name, track: t.track, judgeName: t.projectSubmission?.reviewedBy || reviewerName, criterionName: 'Feasibility & Impact', weight: 1.0, score: score.feasibility }
        ];
      });

    const csv = reportService.generateJudgeScoreSheetCSV(sheets);
    reportService.downloadCSV(csv, `${activeHackathon.title.toLowerCase().replace(/\s+/g, '-')}-judge-scoresheets.csv`);
    onNotify('📊 RFC-4180 compliant Judge score sheets exported successfully!');
  };

  useEffect(() => {
    refresh();
    const unsub = hackathonService.subscribeTeams(() => refresh());
    return () => unsub();
  }, [selectedHackathonId]);

  const handleOpenGradeModal = (team: HackathonTeam) => {
    setGradeModalTeam(team);
    if (team.projectSubmission?.score) {
      setScoreInnovation(team.projectSubmission.score.innovation);
      setScoreTechnical(team.projectSubmission.score.technical);
      setScorePresentation(team.projectSubmission.score.presentation);
      setScoreFeasibility(team.projectSubmission.score.feasibility);
    }
    setAdminFeedbackText(team.projectSubmission?.adminFeedback || 'Strong prototype architecture with promising commercial viability.');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeModalTeam) return;

    const total = scoreInnovation + scoreTechnical + scorePresentation + scoreFeasibility;
    await hackathonService.adminGradeSubmission(
      gradeModalTeam.id,
      {
        innovation: scoreInnovation,
        technical: scoreTechnical,
        presentation: scorePresentation,
        feasibility: scoreFeasibility,
        total
      },
      adminFeedbackText,
      reviewerName
    );

    setGradeModalTeam(null);
    onNotify(`⭐ Score & feedback published to "${gradeModalTeam.name}" (${total}/100)!`);
    refresh();
  };

  const filteredTeams = teams.filter(t => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'submitted' && t.projectSubmission?.status === 'submitted') ||
      (statusFilter === 'draft' && t.projectSubmission?.status === 'draft') ||
      (statusFilter === 'none' && !t.projectSubmission);
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.track.toLowerCase().includes(q) ||
      t.members.some(m => m.name.toLowerCase().includes(q));

    return matchStatus && matchQuery;
  });

  const totalSubmitted = teams.filter(t => t.projectSubmission?.status === 'submitted').length;
  const activeHackathon = hackathons.find(h => h.id === selectedHackathonId) || hackathons[0];

  return (
    <div>
      {/* Hackathon Header Box */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔥</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              {activeHackathon.title}
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                borderRadius: '999px'
              }}
            >
              LIVE SPRINT
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Location: {activeHackathon.location} • Max Squad Size: {activeHackathon.maxTeamSize} • Prize Pool: {activeHackathon.prizePool}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
              {totalSubmitted} / {teams.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Projects Submitted
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeView === 'submissions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setActiveView('submissions')}
          >
            <Users size={15} /> Squad Submissions & Grading ({teams.length})
          </button>
          <button
            className={`btn ${activeView === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setActiveView('leaderboard')}
          >
            <Trophy size={15} /> Official Leaderboard & Auditing
          </button>
        </div>

        {activeView === 'leaderboard' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={handleExportRankings}
            >
              <Download size={14} /> Export Rankings (CSV)
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={handleExportScoreSheets}
            >
              <FileSpreadsheet size={14} /> Export Score Sheets (CSV)
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
              onClick={fetchLeaderboardData}
              title="Refresh Leaderboard"
            >
              <RefreshCw size={14} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {activeView === 'submissions' ? (
        <>
          {/* Filter and Search Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search teams by squad name, track, or member..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <select
                className="form-input"
                style={{ width: 'auto' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Submissions ({teams.length})</option>
                <option value="submitted">Submitted Only ({totalSubmitted})</option>
                <option value="draft">Draft Only</option>
                <option value="none">No Submission Yet</option>
              </select>
            </div>
          </div>
        </>
      ) : (
        /* OFFICIAL LEADERBOARD VIEW */
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Criteria info card */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Scale size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Weighted Judging Criteria:</span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                Innovation (1.5x)
              </span>
              <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                Technical Complexity (1.5x)
              </span>
              <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                UI/UX polish (1.0x)
              </span>
              <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                Pitch & Impact (1.0x)
              </span>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, width: '70px' }}>Rank</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Squad & Track</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Project Title</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Jury Evaluations</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, textAlign: 'right' }}>Weighted Score / 100</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No scored projects recorded on the official leaderboard yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map(row => (
                    <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 900 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: row.rank === 1 ? 'rgba(234, 179, 8, 0.2)' : row.rank === 2 ? 'rgba(148, 163, 184, 0.2)' : row.rank === 3 ? 'rgba(180, 83, 9, 0.2)' : 'var(--bg-secondary)',
                            color: row.rank === 1 ? '#eab308' : row.rank === 2 ? '#94a3b8' : row.rank === 3 ? '#b45309' : 'var(--text-primary)'
                          }}
                        >
                          #{row.rank}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{row.teamName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{row.track}</div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {row.projectTitle || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {row.judgesCount} evaluation{row.judgesCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, fontSize: '1.15rem', color: '#10b981' }}>
                        {row.totalScore.toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'submissions' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Squad & Track</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Team Leader & Roster</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Comms (Discord/WA)</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Project Submission</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Jury Score / 100</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map(team => {
              const sub = team.projectSubmission;
              const leader = team.members.find(m => m.isLeader) || team.members[0];

              return (
                <tr key={team.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {/* Squad Name & Track */}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {team.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {team.track}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Code: <code>{team.inviteCode}</code> • {team.isOpen ? 'Open Squad' : 'Closed'}
                    </div>
                  </td>

                  {/* Leader & Roster */}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={leader?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=lead'}
                        alt={leader?.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{leader?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{leader?.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      Total {team.members.length} members ({team.members.map(m => m.roleInTeam).join(', ')})
                    </div>
                  </td>

                  {/* Comms Links */}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {team.discordInviteUrl ? (
                        <a
                          href={team.discordInviteUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#5865F2',
                            color: '#fff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <MessageSquare size={12} /> Discord
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No Discord</span>
                      )}

                      {team.whatsappGroupUrl ? (
                        <a
                          href={team.whatsappGroupUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#25D366',
                            color: '#fff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No WA</span>
                      )}
                    </div>
                  </td>

                  {/* Project Submission Status */}
                  <td style={{ padding: '1rem' }}>
                    {sub ? (
                      <div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: sub.status === 'submitted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: sub.status === 'submitted' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {sub.status === 'submitted' ? 'SUBMITTED TO JURY' : 'DRAFT IN PROGRESS'}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', marginTop: '0.25rem' }}>
                          {sub.projectTitle}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {sub.githubUrl && (
                            <a href={sub.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }} title="GitHub Repo">
                              <Github size={14} />
                            </a>
                          )}
                          {sub.demoVideoUrl && (
                            <a href={sub.demoVideoUrl} target="_blank" rel="noreferrer" style={{ color: '#ef4444' }} title="Demo Video">
                              <Video size={14} />
                            </a>
                          )}
                          {sub.liveDemoUrl && (
                            <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer" style={{ color: '#10b981' }} title="Live Deployment">
                              <Globe size={14} />
                            </a>
                          )}
                          {sub.pitchDeckUrl && (
                            <a href={sub.pitchDeckUrl} target="_blank" rel="noreferrer" style={{ color: '#f59e0b' }} title="Pitch Deck Slides">
                              <FileText size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No submission yet</span>
                    )}
                  </td>

                  {/* Score */}
                  <td style={{ padding: '1rem' }}>
                    {sub?.score ? (
                      <div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b' }}>
                          {sub.score.total}/100
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Inn: {sub.score.innovation} • Tech: {sub.score.technical}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pending Score</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => setInspectChatTeam(team)}
                        title="View Team Live Chat Logs"
                      >
                        <MessageSquare size={13} /> Chat Logs
                      </button>

                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        onClick={() => handleOpenGradeModal(team)}
                        title="Grade Submission & Provide Feedback"
                      >
                        <Star size={13} /> Grade & Feedback
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* CHAT LOGS MODAL */}
      {inspectChatTeam && (
        <div className="modal-backdrop" onClick={() => setInspectChatTeam(null)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800 }}>
                  Team Live Chat Logs: {inspectChatTeam.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Total {hackathonService.getTeamChatMessages(inspectChatTeam.id).length} synchronized messages
                </span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setInspectChatTeam(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {hackathonService.getTeamChatMessages(inspectChatTeam.id).map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '0.65rem', background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 800 }}>{msg.senderName} ({msg.senderRole})</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setInspectChatTeam(null)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JURY GRADING & OFFICIAL FEEDBACK MODAL */}
      {gradeModalTeam && (
        <div className="modal-backdrop" onClick={() => setGradeModalTeam(null)}>
          <div className="modal-card" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800 }}>
                  Jury Evaluation & Feedback - {gradeModalTeam.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                  Project: {gradeModalTeam.projectSubmission?.projectTitle || 'Squad Prototype'}
                </span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setGradeModalTeam(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Innovation & Novelty (/25)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    required
                    className="form-input"
                    value={scoreInnovation}
                    onChange={e => setScoreInnovation(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Technical Execution (/25)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    required
                    className="form-input"
                    value={scoreTechnical}
                    onChange={e => setScoreTechnical(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Presentation & Pitch (/25)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    required
                    className="form-input"
                    value={scorePresentation}
                    onChange={e => setScorePresentation(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Feasibility & Impact (/25)</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    required
                    className="form-input"
                    value={scoreFeasibility}
                    onChange={e => setScoreFeasibility(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Calculated Total Score:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f59e0b' }}>
                  {scoreInnovation + scoreTechnical + scorePresentation + scoreFeasibility} / 100
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Official Jury Evaluation Feedback *</label>
                <textarea
                  rows={4}
                  required
                  className="form-textarea"
                  placeholder="Provide comprehensive jury remarks, strengths of the prototype, areas for technical iteration, and incubation next steps..."
                  value={adminFeedbackText}
                  onChange={e => setAdminFeedbackText(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Evaluator / Judge Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setGradeModalTeam(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Star size={15} /> Save & Broadcast Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
