import React, { useState } from 'react';
import { useIdeas, useEvaluateIdea, useDeleteIdea } from '../../hooks/useIdeas';
import { IdeaBoxSubmission, IdeaStatus } from '../../types';
import {
  Lightbulb,
  Search,
  Star,
  ShieldCheck,
  Award,
  CheckCircle,
  Clock,
  Filter,
  Trash2,
  Edit3,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  RotateCw,
  X
} from 'lucide-react';

interface AdminIdeaBoxSectionProps {
  onNotify: (msg: string) => void;
}

export const AdminIdeaBoxSection: React.FC<AdminIdeaBoxSectionProps> = ({ onNotify }) => {
  const { data: ideas = [], isLoading, isError, error, refetch } = useIdeas();
  const evaluateMutation = useEvaluateIdea();
  const deleteMutation = useDeleteIdea();

  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Evaluation modal
  const [evaluatingIdea, setEvaluatingIdea] = useState<IdeaBoxSubmission | null>(null);
  const [evalStatus, setEvalStatus] = useState<IdeaStatus>('Incubation Approved');
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalIncubatorTrack, setEvalIncubatorTrack] = useState<string>('Robotics & Hardware Prototyping Lab (Bay 2)');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalReviewer, setEvalReviewer] = useState<string>('Dr. Preetha M. (IEDC Nodal Officer)');

  const handleOpenEvaluationModal = (idea: IdeaBoxSubmission) => {
    setEvaluatingIdea(idea);
    setEvalStatus(idea.status === 'Pending' ? 'Incubation Approved' : idea.status);
    setEvalRating(idea.adminRating || 5);
    setEvalIncubatorTrack(idea.incubatorTrackAssigned || 'Robotics & Hardware Prototyping Lab (Bay 2)');
    setEvalFeedback(idea.adminFeedback || 'Promising student startup initiative. Approved for pre-incubation prototyping space and lab equipment.');
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingIdea) return;

    try {
      await evaluateMutation.mutateAsync({
        ideaId: evaluatingIdea.id,
        review: {
          status: evalStatus,
          rating: evalRating,
          feedback: evalFeedback,
          incubatorTrack: evalIncubatorTrack,
          reviewerName: evalReviewer
        }
      });

      setEvaluatingIdea(null);
      onNotify(`✅ Official evaluation & feedback published for "${evaluatingIdea.title}"!`);
    } catch (err: unknown) {
      onNotify(`❌ Failed to save evaluation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (ideaId: string, title: string) => {
    if (confirm(`Are you sure you want to permanently delete idea "${title}"?`)) {
      try {
        await deleteMutation.mutateAsync(ideaId);
        onNotify(`🗑️ Idea "${title}" deleted.`);
      } catch (err: unknown) {
        onNotify(`❌ Failed to delete idea: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchDomain = domainFilter === 'all' || idea.domain.toLowerCase().includes(domainFilter.toLowerCase());
    const matchStatus = statusFilter === 'all' || idea.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      idea.title.toLowerCase().includes(q) ||
      idea.authorName.toLowerCase().includes(q) ||
      idea.problemStatement.toLowerCase().includes(q);

    return matchDomain && matchStatus && matchQuery;
  });

  const totalApproved = ideas.filter(i => i.status === 'Incubation Approved' || i.status === 'Mentorship Assigned').length;

  return (
    <div>
      {/* Metrics Banner */}
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
            <Lightbulb size={24} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              IdeaBox Innovation Pipeline & Evaluation Desk
            </h3>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Review incoming student startup pitches, allocate incubation tracks, assign faculty mentors, and issue seed grant reviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {ideas.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Pitches
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
              {totalApproved}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Incubated / Mentored
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
            placeholder="Search startup ideas, innovator name, or problem keyword..."
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
            <option value="all">All Statuses ({ideas.length})</option>
            <option value="Incubation Approved">Incubation Approved</option>
            <option value="Mentorship Assigned">Mentorship Assigned</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Under Review">Under Review</option>
            <option value="Pending">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {isError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            color: '#f87171'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Failed to load pitches: {error instanceof Error ? error.message : 'Network error'}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Ideas Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Idea Title & Domain</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Innovator Details</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Stage & Traction</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Nodal Status</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>Rating & Assigned Bay</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4].map(idx => (
                <tr key={`skeleton-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td colSpan={6} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '14px', width: '30%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ height: '10px', width: '60%', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredIdeas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Lightbulb size={36} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'inline-block' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    No ideas match the current filters
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Try changing the search query or status filter.
                  </div>
                </td>
              </tr>
            ) : (
              filteredIdeas.map(idea => (
              <tr key={idea.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {/* Title & Domain */}
                <td style={{ padding: '1rem', maxWidth: '280px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {idea.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600, marginTop: '0.2rem' }}>
                    {idea.domain}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {idea.elevatorPitch}
                  </div>
                </td>

                {/* Innovator */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={idea.authorAvatar}
                      alt={idea.authorName}
                      style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{idea.authorName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {idea.authorRole} • {idea.authorDepartment || 'BMCE'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Stage & Upvotes */}
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#a78bfa'
                    }}
                  >
                    {idea.stage}
                  </span>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>👍 {idea.upvotes} Upvotes</span>
                    <span>💬 {idea.commentsCount || idea.comments?.length || 0} Comments</span>
                  </div>
                </td>

                {/* Nodal Status */}
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background:
                        idea.status === 'Incubation Approved' ? 'rgba(16, 185, 129, 0.15)' :
                        idea.status === 'Shortlisted' ? 'rgba(245, 158, 11, 0.15)' :
                        idea.status === 'Mentorship Assigned' ? 'rgba(59, 130, 246, 0.15)' :
                        'rgba(148, 163, 184, 0.15)',
                      color:
                        idea.status === 'Incubation Approved' ? '#10b981' :
                        idea.status === 'Shortlisted' ? '#f59e0b' :
                        idea.status === 'Mentorship Assigned' ? '#3b82f6' :
                        '#94a3b8'
                    }}
                  >
                    {idea.status}
                  </span>
                </td>

                {/* Rating & Bay */}
                <td style={{ padding: '1rem' }}>
                  {idea.adminRating ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 800, fontSize: '0.84rem' }}>
                        {'★'.repeat(idea.adminRating)}{'☆'.repeat(5 - idea.adminRating)} ({idea.adminRating}/5)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                        {idea.incubatorTrackAssigned || 'Prototyping Bay'}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unreviewed</span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                      onClick={() => handleOpenEvaluationModal(idea)}
                    >
                      <ShieldCheck size={13} /> Review & Feedback
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.5rem', color: '#ef4444' }}
                      onClick={() => handleDelete(idea.id, idea.title)}
                      title="Delete Pitch"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* EVALUATION & FEEDBACK MODAL */}
      {evaluatingIdea && (
        <div className="modal-backdrop" onClick={() => setEvaluatingIdea(null)}>
          <div className="modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800 }}>
                  Nodal Evaluation: {evaluatingIdea.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Innovator: {evaluatingIdea.authorName} ({evaluatingIdea.authorDepartment || 'BMCE'})
                </span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setEvaluatingIdea(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Incubation Status Decision</label>
                  <select
                    className="form-input"
                    value={evalStatus}
                    onChange={e => setEvalStatus(e.target.value as IdeaStatus)}
                  >
                    <option value="Incubation Approved">Incubation Approved (Full Pass)</option>
                    <option value="Mentorship Assigned">Mentorship Assigned</option>
                    <option value="Shortlisted">Shortlisted for KSUM Idea Grant</option>
                    <option value="Under Review">Under Review / Need Working Prototype</option>
                    <option value="Needs Revision">Needs Revision & Market Re-alignment</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Evaluation Rating (1 to 5 Stars)</label>
                  <select
                    className="form-input"
                    value={evalRating}
                    onChange={e => setEvalRating(Number(e.target.value))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Outstanding</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Very Promising</option>
                    <option value={3}>⭐⭐⭐ (3/5) Feasible Concept</option>
                    <option value={2}>⭐⭐ (2/5) Early Stage</option>
                    <option value={1}>⭐ (1/5) Needs Fundamental Rework</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Prototyping Bay / Incubation Track</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Robotics Prototyping Lab (Bay 2), CleanTech Hub"
                  value={evalIncubatorTrack}
                  onChange={e => setEvalIncubatorTrack(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Official Admin Evaluation Feedback *</label>
                <textarea
                  rows={4}
                  required
                  className="form-textarea"
                  placeholder="Write clear, encouraging feedback explaining the evaluation verdict, mentor assigned, and next steps for the innovator..."
                  value={evalFeedback}
                  onChange={e => setEvalFeedback(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reviewed By (Nodal Officer Signature)</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={evalReviewer}
                  onChange={e => setEvalReviewer(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEvaluatingIdea(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <ShieldCheck size={15} /> Publish Evaluation & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
