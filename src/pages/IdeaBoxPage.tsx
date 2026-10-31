import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { 
  useIdeas, 
  useVoteIdea, 
  useSubmitIdea, 
  useAddIdeaComment,
  useIdeaDraft,
  useSaveIdeaDraft,
  useDeleteIdeaDraft
} from '../hooks/useIdeas';
import { authService, openAuthModal } from '../services/authService';
import { problemBankService } from '../services/problemBankService';
import { IdeaBoxSubmission, IdeaStage, User } from '../types';
import { MilestoneTracker } from '../components/IdeaBox/MilestoneTracker';
import { ProjectJourneyTracker } from '../components/Journey/ProjectJourneyTracker';
import { IdeaRubricEvaluationModal } from '../components/Admin/IdeaRubricEvaluationModal';
import {
  Lightbulb,
  Search,
  Plus,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Star,
  Layers,
  Send,
  X,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  Tag,
  Flag,
  Cloud,
  Compass,
  Scale
} from 'lucide-react';
import '../styles/ideabox.css';

const DOMAINS = [
  'All Domains',
  'AgriTech & AI',
  'CleanTech & IoT',
  'HealthTech & Robotics',
  'EdTech & WebXR',
  'Smart Kerala & Governance',
  'FinTech & Web3'
];

export const IdeaBoxPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [expandedMilestonesId, setExpandedMilestonesId] = useState<string | null>(null);
  const [expandedJourneyId, setExpandedJourneyId] = useState<string | null>(null);
  const [adoptedProblemId, setAdoptedProblemId] = useState<string | null>(null);
  const [evaluatingIdea, setEvaluatingIdea] = useState<IdeaBoxSubmission | null>(null);
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // TanStack React Query Hooks - Supabase as Single Source of Truth
  const {
    data: ideas = [],
    isLoading,
    isError,
    error,
    refetch
  } = useIdeas({
    domain: selectedDomain,
    stage: selectedStage,
    status: selectedStatus,
    searchQuery
  });

  const voteMutation = useVoteIdea();
  const submitMutation = useSubmitIdea();
  const commentMutation = useAddIdeaComment();

  // Server-side Draft Autosave Hooks
  const { data: serverDraft } = useIdeaDraft();
  const saveDraftMutation = useSaveIdeaDraft();
  const deleteDraftMutation = useDeleteIdeaDraft();
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // New Idea Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('AgriTech & AI');
  const [elevatorPitch, setElevatorPitch] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [stage, setStage] = useState<IdeaStage>('Ideation');
  const [targetAudience, setTargetAudience] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = authService.onAuthStateChange(u => setUser(u));
    return () => unsubAuth();
  }, []);

  // Check URL parameters for Problem Bank Adoption
  useEffect(() => {
    const pId = searchParams.get('problemId');
    const pTitle = searchParams.get('problemTitle');
    const pDomain = searchParams.get('domain');

    if (pId || pTitle) {
      if (pId) setAdoptedProblemId(pId);
      setIsSubmitModalOpen(true);
      if (pTitle && !title) {
        setTitle(pTitle);
      }
      if (pTitle && !problemStatement) {
        setProblemStatement(`Addressing Problem Challenge: ${pTitle}\n\nTarget Beneficiaries & Context: `);
      }
      if (pDomain) {
        const found = DOMAINS.find(d => d.toLowerCase().includes(pDomain.toLowerCase()) || pDomain.toLowerCase().includes(d.toLowerCase()));
        if (found) setDomain(found);
      }
    }
  }, [searchParams]);

  // Restore server-side draft when opening submit modal
  useEffect(() => {
    if (isSubmitModalOpen && serverDraft && !title && !problemStatement) {
      if (serverDraft.title) setTitle(serverDraft.title);
      if (serverDraft.domain) setDomain(serverDraft.domain);
      if (serverDraft.stage) setStage(serverDraft.stage);
      if (serverDraft.elevatorPitch) setElevatorPitch(serverDraft.elevatorPitch);
      if (serverDraft.problemStatement) setProblemStatement(serverDraft.problemStatement);
      if (serverDraft.proposedSolution) setProposedSolution(serverDraft.proposedSolution);
      if (serverDraft.techStackInput) setTechStackInput(serverDraft.techStackInput);
      if (serverDraft.targetAudience) setTargetAudience(serverDraft.targetAudience);
      if (serverDraft.estimatedBudget) setEstimatedBudget(serverDraft.estimatedBudget);
    }
  }, [isSubmitModalOpen, serverDraft]);

  // Debounced cloud autosave
  useEffect(() => {
    if (!isSubmitModalOpen || !user) return;
    if (!title.trim() && !problemStatement.trim()) return;

    const timeout = setTimeout(() => {
      saveDraftMutation.mutate({
        title,
        domain,
        stage,
        elevatorPitch,
        problemStatement,
        proposedSolution,
        techStackInput,
        targetAudience,
        estimatedBudget,
      });
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 800);

    return () => clearTimeout(timeout);
  }, [title, domain, stage, elevatorPitch, problemStatement, proposedSolution, techStackInput, targetAudience, estimatedBudget, isSubmitModalOpen, user]);

  const handleUpvote = (ideaId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    voteMutation.mutate({ ideaId, userId: user.id });
  };

  const handleAddComment = (ideaId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const text = commentInputMap[ideaId]?.trim();
    if (!text) return;

    commentMutation.mutate(
      {
        ideaId,
        comment: {
          authorId: user.id,
          authorName: user.fullName,
          authorAvatar: user.avatar,
          authorRole: user.role,
          text
        }
      },
      {
        onSuccess: () => {
          setCommentInputMap(prev => ({ ...prev, [ideaId]: '' }));
        }
      }
    );
  };

  const handleSubmitNewIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!title.trim() || !problemStatement.trim() || !proposedSolution.trim()) {
      alert('Please fill in the required fields: Title, Problem, and Solution.');
      return;
    }

    setSubmitting(true);
    try {
      const techArr = techStackInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await submitMutation.mutateAsync({
        title: title.trim(),
        domain,
        elevatorPitch: elevatorPitch.trim() || title.trim(),
        problemStatement: problemStatement.trim(),
        proposedSolution: proposedSolution.trim(),
        techStack: techArr.length > 0 ? techArr : ['Innovation', 'Prototyping'],
        stage,
        targetAudience: targetAudience.trim() || 'General Public & Enterprise',
        estimatedBudget: estimatedBudget.trim() || 'Undetermined',
        authorId: user.id,
        authorName: user.fullName,
        authorEmail: user.email,
        authorAvatar: user.avatar,
        authorRole: user.role,
        authorDepartment: user.department
      });

      // Increment adoption counter if pitching for a problem statement
      if (adoptedProblemId) {
        await problemBankService.adoptProblem(adoptedProblemId);
        setAdoptedProblemId(null);
      }

      // Clear search params if present
      if (searchParams.get('problemId')) {
        searchParams.delete('problemId');
        searchParams.delete('problemTitle');
        searchParams.delete('domain');
        setSearchParams(searchParams);
      }

      // Clear server-side draft after successful submission
      await deleteDraftMutation.mutateAsync();

      setIsSubmitModalOpen(false);
      setTitle('');
      setElevatorPitch('');
      setProblemStatement('');
      setProposedSolution('');
      setTechStackInput('');
      setTargetAudience('');
      setEstimatedBudget('');
      setDraftSavedTime(null);
      setSuccessToast('Your startup idea has been submitted to the BMCE IdeaBox & Nodal Evaluation Queue!');
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter ideas
  const filteredIdeas = ideas.filter(i => {
    const matchDomain = selectedDomain === 'All Domains' || i.domain.toLowerCase().includes(selectedDomain.toLowerCase());
    const matchStage = selectedStage === 'All' || i.stage === selectedStage;
    const matchStatus = selectedStatus === 'All' || i.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      i.title.toLowerCase().includes(q) ||
      i.problemStatement.toLowerCase().includes(q) ||
      i.proposedSolution.toLowerCase().includes(q) ||
      i.authorName.toLowerCase().includes(q) ||
      i.techStack.some(t => t.toLowerCase().includes(q));

    return matchDomain && matchStage && matchStatus && matchQuery;
  });

  const totalUpvotes = ideas.reduce((acc, curr) => acc + curr.upvotes, 0);
  const totalApproved = ideas.filter(i => i.status === 'Incubation Approved' || i.status === 'Mentorship Assigned').length;

  return (
    <div className="ideabox-page-root">
      <Navbar />

      {/* Hero Header */}
      <section className="ideabox-hero">
        <div className="container ideabox-hero-content">
          <div className="ideabox-badge-pill">
            <Sparkles size={14} /> BMCE Innovation Pipeline
          </div>
          <h1 className="ideabox-title">
            IEDC <span className="gradient-text">IdeaBox</span> Hub
          </h1>
          <p className="ideabox-subtitle">
            From classroom inspiration to funded startup prototype. Pitch your bold venture, gain peer traction, and receive direct evaluation & seed grant allocation from the IEDC Nodal Office.
          </p>

          {/* Quick Metrics Bar */}
          <div className="ideabox-stats-grid">
            <div className="ideabox-stat-card">
              <Lightbulb className="ideabox-stat-icon" size={24} />
              <div className="ideabox-stat-num">{ideas.length}</div>
              <div className="ideabox-stat-label">Pitched Ideas</div>
            </div>
            <div className="ideabox-stat-card">
              <Award className="ideabox-stat-icon" size={24} />
              <div className="ideabox-stat-num">{totalApproved}</div>
              <div className="ideabox-stat-label">Incubated / Mentored</div>
            </div>
            <div className="ideabox-stat-card">
              <TrendingUp className="ideabox-stat-icon" size={24} />
              <div className="ideabox-stat-num">{totalUpvotes}</div>
              <div className="ideabox-stat-label">Community Upvotes</div>
            </div>
            <div className="ideabox-stat-card">
              <ShieldCheck className="ideabox-stat-icon" size={24} />
              <div className="ideabox-stat-num">₹2.5L+</div>
              <div className="ideabox-stat-label">Seed Pool Access</div>
            </div>
          </div>

          {/* Action CTA */}
          <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
              onClick={() => {
                if (!user) openAuthModal('signup');
                else setIsSubmitModalOpen(true);
              }}
            >
              <Plus size={18} />
              Pitch Your Idea to IdeaBox
            </button>
            <a
              href="#ideas-feed"
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            >
              Browse Innovation Feed ({filteredIdeas.length})
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Feed */}
      <section id="ideas-feed" className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
        {/* Controls Bar */}
        <div className="ideabox-controls-bar">
          <div className="ideabox-search-wrapper">
            <Search size={18} className="ideabox-search-icon" />
            <input
              type="text"
              className="ideabox-search-input"
              placeholder="Search startup ideas, tech stack, author name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ideabox-filter-group">
            <select
              className="ideabox-select"
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
            >
              <option value="All">All Stages</option>
              <option value="Ideation">Ideation</option>
              <option value="Prototype">Prototype</option>
              <option value="Validation">Validation</option>
              <option value="Incubation Ready">Incubation Ready</option>
              <option value="Funded">Funded</option>
            </select>

            <select
              className="ideabox-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Incubation Approved">Incubation Approved</option>
              <option value="Mentorship Assigned">Mentorship Assigned</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Under Review">Under Review</option>
              <option value="Pending">Pending Review</option>
            </select>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="ideabox-domain-pills">
          {DOMAINS.map(d => (
            <button
              key={d}
              className={`ideabox-pill-btn ${selectedDomain === d ? 'active' : ''}`}
              onClick={() => setSelectedDomain(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="ideabox-cards-grid" style={{ opacity: 0.85, margin: '1.5rem 0' }}>
            {[1, 2, 3].map(n => (
              <div key={n} className="ideabox-card" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                <Clock className="spin-slow" size={32} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading live ideas from Supabase...</span>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(225, 29, 72, 0.08)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            borderRadius: 'var(--radius-md)',
            margin: '2rem 0'
          }}>
            <h4 style={{ color: 'var(--accent-rose)', margin: '0 0 0.5rem 0' }}>Unable to load IdeaBox feed</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              {error?.message || 'A network error occurred while querying Supabase.'}
            </p>
            <button className="btn btn-secondary" onClick={() => refetch()}>
              Try Reconnecting
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredIdeas.length === 0 && (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            margin: '2rem 0'
          }}>
            <Lightbulb size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto 1rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>No Ideas Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              No startup ideas matched your active filters. Try adjusting search criteria or be the first to submit in this track!
            </p>
            <button className="btn btn-primary" onClick={() => setIsSubmitModalOpen(true)}>
              <Plus size={16} /> Submit Your Idea
            </button>
          </div>
        )}

        {/* Ideas Grid */}
        {!isLoading && !isError && filteredIdeas.length > 0 && (
          <div className="ideabox-cards-grid">
            {filteredIdeas.map(idea => {
              const hasUpvoted = user ? idea.upvoters?.includes(user.id) : false;
              const isCommentsOpen = expandedCommentsId === idea.id;
              const isMilestonesOpen = expandedMilestonesId === idea.id;
              const isJourneyOpen = expandedJourneyId === idea.id;

            return (
              <div key={idea.id} className="ideabox-card">
                {/* Header: Domain, Stage, Status */}
                <div className="ideabox-card-top">
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span className="ideabox-tag domain">{idea.domain}</span>
                    <span className="ideabox-tag stage">{idea.stage}</span>
                  </div>
                  <span className={`ideabox-status-badge ${idea.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {idea.status}
                  </span>
                </div>

                {/* Title & Elevator Pitch */}
                <h3 className="ideabox-card-title">{idea.title}</h3>
                <p className="ideabox-card-pitch">{idea.elevatorPitch}</p>

                {/* Problem & Solution Accordion Box */}
                <div className="ideabox-details-box">
                  <div className="ideabox-detail-row">
                    <span className="ideabox-detail-label">Problem:</span>
                    <span className="ideabox-detail-text">{idea.problemStatement}</span>
                  </div>
                  <div className="ideabox-detail-row" style={{ marginTop: '0.4rem' }}>
                    <span className="ideabox-detail-label">Solution:</span>
                    <span className="ideabox-detail-text">{idea.proposedSolution}</span>
                  </div>
                </div>

                {/* Tech Stack Pills */}
                <div className="ideabox-tech-stack">
                  {idea.techStack.map((tech, idx) => (
                    <span key={idx} className="ideabox-tech-chip">
                      <Tag size={11} /> {tech}
                    </span>
                  ))}
                </div>

                {/* Official Admin Evaluation & Feedback Box */}
                {idea.adminFeedback && (
                  <div className="ideabox-admin-feedback-banner">
                    <div className="ideabox-admin-feedback-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={16} className="text-cyan" />
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                          Official Admin Evaluation
                        </span>
                      </div>
                      {idea.adminRating && (
                        <div className="ideabox-rating-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={13}
                              fill={star <= idea.adminRating! ? '#f59e0b' : 'none'}
                              color={star <= idea.adminRating! ? '#f59e0b' : '#64748b'}
                            />
                          ))}
                          <span style={{ fontSize: '0.78rem', marginLeft: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
                            {idea.adminRating}/5
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="ideabox-admin-feedback-text">
                      "{idea.adminFeedback}"
                    </p>

                    <div className="ideabox-admin-feedback-footer">
                      <span>Reviewed by: <strong>{idea.adminReviewedBy || 'Nodal Officer'}</strong></span>
                      {idea.incubatorTrackAssigned && (
                        <span style={{ color: 'var(--accent-cyan)' }}>
                          Bay: {idea.incubatorTrackAssigned}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Author Info & Actions Footer */}
                <div className="ideabox-card-footer">
                  <div className="ideabox-author-info">
                    <img src={idea.authorAvatar} alt={idea.authorName} className="ideabox-author-avatar" />
                    <div>
                      <div className="ideabox-author-name">{idea.authorName}</div>
                      <div className="ideabox-author-sub">
                        {idea.authorRole} • {idea.authorDepartment || 'BMCE'}
                      </div>
                    </div>
                  </div>

                  <div className="ideabox-card-actions">
                    <button
                      className={`ideabox-action-btn upvote ${hasUpvoted ? 'active' : ''}`}
                      onClick={() => handleUpvote(idea.id)}
                      title="Upvote this idea"
                    >
                      <ThumbsUp size={15} />
                      <span>{idea.upvotes}</span>
                    </button>

                    <button
                      className={`ideabox-action-btn comment ${isCommentsOpen ? 'active' : ''}`}
                      onClick={() => setExpandedCommentsId(isCommentsOpen ? null : idea.id)}
                      title="Discussion & Feedback"
                    >
                      <MessageSquare size={15} />
                      <span>{idea.commentsCount || idea.comments?.length || 0}</span>
                    </button>

                    <button
                      className={`ideabox-action-btn ${isMilestonesOpen ? 'active' : ''}`}
                      onClick={() => setExpandedMilestonesId(isMilestonesOpen ? null : idea.id)}
                      title="Incubation Milestones & Funding Tranches"
                    >
                      <Flag size={15} />
                      <span>Milestones</span>
                    </button>

                    <button
                      className={`ideabox-action-btn ${isJourneyOpen ? 'active' : ''}`}
                      onClick={() => setExpandedJourneyId(isJourneyOpen ? null : idea.id)}
                      title="Innovation Journey (8-Stage Pipeline)"
                    >
                      <Compass size={15} />
                      <span>Journey</span>
                    </button>

                    {(user?.role === 'Admin' || user?.role === 'Execom' || user?.role === 'Reviewer' || user?.role === 'Faculty') && (
                      <button
                        className="ideabox-action-btn"
                        onClick={() => setEvaluatingIdea(idea)}
                        title="Score Rubric (Problem, Feasibility, Impact, Team)"
                        style={{ color: 'var(--accent-cyan)' }}
                      >
                        <Scale size={15} />
                        <span>Evaluate</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Comments Drawer */}
                {isCommentsOpen && (
                  <div className="ideabox-comments-drawer">
                    <div className="ideabox-comments-list">
                      {idea.comments && idea.comments.length > 0 ? (
                        idea.comments.map(c => (
                          <div key={c.id} className="ideabox-comment-item">
                            <img src={c.authorAvatar} alt={c.authorName} className="ideabox-comment-avatar" />
                            <div className="ideabox-comment-body">
                              <div className="ideabox-comment-meta">
                                <span className="ideabox-comment-author">{c.authorName}</span>
                                <span className="ideabox-comment-role">{c.authorRole}</span>
                                <span className="ideabox-comment-time">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="ideabox-comment-text">{c.text}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                          No comments yet. Be the first to share feedback or offer collaboration!
                        </div>
                      )}
                    </div>

                    {/* New Comment Box */}
                    <div className="ideabox-new-comment-box">
                      <input
                        type="text"
                        className="ideabox-comment-input"
                        placeholder={user ? "Write constructive feedback or question..." : "Sign in to join discussion..."}
                        value={commentInputMap[idea.id] || ''}
                        onChange={e => setCommentInputMap({ ...commentInputMap, [idea.id]: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(idea.id);
                        }}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleAddComment(idea.id)}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Expandable Milestones Tracker */}
                {isMilestonesOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    <MilestoneTracker
                      ideaId={idea.id}
                      canEdit={Boolean(user && (user.id === idea.authorId || user.role === 'Admin'))}
                    />
                  </div>
                )}

                {/* Expandable 8-Stage Innovation Journey Tracker */}
                {isJourneyOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    <ProjectJourneyTracker idea={idea} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* Pitch New Idea Modal */}
      {isSubmitModalOpen && (
        <div className="ideabox-modal-overlay" onClick={() => setIsSubmitModalOpen(false)}>
          <div className="ideabox-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ideabox-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Lightbulb size={22} className="text-cyan" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Pitch New Startup Idea
                </h3>
              </div>

              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#10b981', marginLeft: 'auto', marginRight: '1rem' }}>
                  <Cloud size={14} />
                  <span>{saveDraftMutation.isPending ? 'Saving to cloud...' : (draftSavedTime ? `Autosaved (${draftSavedTime})` : 'Autosaved to cloud')}</span>
                </div>
              )}

              <button
                className="ideabox-modal-close"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewIdea} className="ideabox-form">
              <div className="ideabox-form-group">
                <label className="ideabox-label">Project / Startup Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriDrone AI: Crop Disease Detection"
                  className="ideabox-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ideabox-form-group">
                  <label className="ideabox-label">Industry Domain</label>
                  <select
                    className="ideabox-input"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                  >
                    <option value="AgriTech & AI">AgriTech & AI</option>
                    <option value="CleanTech & IoT">CleanTech & IoT</option>
                    <option value="HealthTech & Robotics">HealthTech & Robotics</option>
                    <option value="EdTech & WebXR">EdTech & WebXR</option>
                    <option value="Smart Kerala & Governance">Smart Kerala & Governance</option>
                    <option value="FinTech & Web3">FinTech & Web3</option>
                  </select>
                </div>

                <div className="ideabox-form-group">
                  <label className="ideabox-label">Development Stage</label>
                  <select
                    className="ideabox-input"
                    value={stage}
                    onChange={e => setStage(e.target.value as IdeaStage)}
                  >
                    <option value="Ideation">Ideation / Concept</option>
                    <option value="Prototype">Working Prototype / MVP</option>
                    <option value="Validation">User Validation / Pilots</option>
                    <option value="Incubation Ready">Ready for Incubation</option>
                  </select>
                </div>
              </div>

              <div className="ideabox-form-group">
                <label className="ideabox-label">One-Line Elevator Pitch</label>
                <input
                  type="text"
                  placeholder="Summarize your product value proposition in one punchy sentence..."
                  className="ideabox-input"
                  value={elevatorPitch}
                  onChange={e => setElevatorPitch(e.target.value)}
                />
              </div>

              <div className="ideabox-form-group">
                <label className="ideabox-label">Problem Statement *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What acute pain point are you solving? Who suffers from it and what is the market cost?"
                  className="ideabox-textarea"
                  value={problemStatement}
                  onChange={e => setProblemStatement(e.target.value)}
                />
              </div>

              <div className="ideabox-form-group">
                <label className="ideabox-label">Proposed Solution & Unique Value *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="How does your innovation solve this problem? What makes it better or 10x cheaper than existing alternatives?"
                  className="ideabox-textarea"
                  value={proposedSolution}
                  onChange={e => setProposedSolution(e.target.value)}
                />
              </div>

              <div className="ideabox-form-group">
                <label className="ideabox-label">Tech Stack & Hardware (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React Native, PyTorch, ESP32, LoRaWAN, 3D Carbon PETG"
                  className="ideabox-input"
                  value={techStackInput}
                  onChange={e => setTechStackInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ideabox-form-group">
                  <label className="ideabox-label">Target Audience / Market</label>
                  <input
                    type="text"
                    placeholder="e.g. Kerala Rubber Estate Owners"
                    className="ideabox-input"
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="ideabox-form-group">
                  <label className="ideabox-label">Estimated Prototype Budget</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 for sensor lab testing"
                    className="ideabox-input"
                    value={estimatedBudget}
                    onChange={e => setEstimatedBudget(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Submitting to Nodal Queue...' : 'Submit Startup Pitch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rubric Peer / Nodal Review Modal */}
      {evaluatingIdea && (
        <IdeaRubricEvaluationModal
          idea={evaluatingIdea}
          onClose={() => setEvaluatingIdea(null)}
          onNotify={(msg) => {
            setSuccessToast(msg);
            setTimeout(() => setSuccessToast(null), 5000);
          }}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="ideabox-toast">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      <Footer />
    </div>
  );
};
