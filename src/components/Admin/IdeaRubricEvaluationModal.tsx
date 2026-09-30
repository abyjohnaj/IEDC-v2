import React, { useState, useEffect } from 'react';
import { 
  IdeaBoxSubmission, 
  IdeaStatus,
  IdeaReview,
  ReviewCriterion 
} from '../../types';
import { 
  useReviewCriteria, 
  useIdeaReviews, 
  useIdeaAggregateScore,
  useAssignReviewers,
  useSubmitIdeaReview,
  useSetIdeaStatus,
  useMentors,
  useIdeaMentorAssignments,
  useAssignMentor
} from '../../hooks/useIdeas';
import { getAllowedTransitions, validateIdeaTransition } from '../../utils/ideaTransitionRules';
import { 
  ShieldCheck, 
  X, 
  Star, 
  Users, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  Send, 
  Compass, 
  Clock 
} from 'lucide-react';

interface IdeaRubricEvaluationModalProps {
  idea: IdeaBoxSubmission;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const IdeaRubricEvaluationModal: React.FC<IdeaRubricEvaluationModalProps> = ({
  idea,
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'reviewers' | 'status' | 'mentors'>('rubric');

  // Queries
  const { data: criteria = [] } = useReviewCriteria();
  const { data: reviews = [], refetch: refetchReviews } = useIdeaReviews(idea.id);
  const { data: aggregateScore } = useIdeaAggregateScore(idea.id);
  const { data: mentors = [] } = useMentors();
  const { data: mentorAssignments = [] } = useIdeaMentorAssignments(idea.id);

  // Mutations
  const assignReviewersMutation = useAssignReviewers();
  const submitReviewMutation = useSubmitIdeaReview();
  const setStatusMutation = useSetIdeaStatus();
  const assignMentorMutation = useAssignMentor();

  // Rubric state (Problem, Feasibility, Impact, Team)
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState(idea.adminFeedback || '');

  // Reviewer assignment state
  const [reviewerInput, setReviewerInput] = useState('');
  const [assignedReviewersList, setAssignedReviewersList] = useState<string[]>([]);

  // Status transition state
  const allowedTransitions = getAllowedTransitions(idea.status);
  const [targetStatus, setTargetStatus] = useState<IdeaStatus>(
    allowedTransitions.length > 0 ? allowedTransitions[0] : idea.status
  );
  const [statusReason, setStatusReason] = useState('');

  // Mentor state
  const [selectedMentorId, setSelectedMentorId] = useState('');

  useEffect(() => {
    // Initialize scores map once criteria load
    if (criteria.length > 0 && Object.keys(scores).length === 0) {
      const initial: Record<string, { score: number; comment: string }> = {};
      criteria.forEach((c) => {
        initial[c.id] = { score: 4, comment: '' };
      });
      setScores(initial);
    }
  }, [criteria]);

  useEffect(() => {
    if (reviews.length > 0) {
      setAssignedReviewersList(reviews.map((r) => r.reviewerId));
    }
  }, [reviews]);

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score,
      },
    }));
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        comment,
      },
    }));
  };

  const handleSubmitRubric = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find review record for current user or default review
    const myReview = reviews.find((r) => !r.submittedAt) || reviews[0];
    const reviewId = myReview?.id || `rev_${Date.now()}`;

    const scorePayload = Object.entries(scores).map(([criterion_id, data]) => ({
      criterion_id,
      score: data.score,
      comment: data.comment,
    }));

    try {
      await submitReviewMutation.mutateAsync({
        reviewId,
        ideaId: idea.id,
        overallFeedback,
        scores: scorePayload,
      });

      onNotify(`✅ Rubric evaluation submitted for "${idea.title}"!`);
      refetchReviews();
      onClose();
    } catch (err: unknown) {
      onNotify(`❌ Error submitting review: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAssignReviewer = async () => {
    const trimmed = reviewerInput.trim();
    if (!trimmed) return;

    if (trimmed === idea.authorId) {
      onNotify(`⚠️ Conflict of Interest: Author cannot review their own startup idea.`);
      return;
    }

    const updated = Array.from(new Set([...assignedReviewersList, trimmed]));
    try {
      await assignReviewersMutation.mutateAsync({
        ideaId: idea.id,
        reviewerIds: updated,
      });
      setAssignedReviewersList(updated);
      setReviewerInput('');
      onNotify(`📋 Reviewer assigned successfully.`);
    } catch (err: unknown) {
      onNotify(`❌ Failed to assign reviewer: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleApplyStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateIdeaTransition(idea.status, targetStatus);
    if (!validation.valid) {
      onNotify(`⚠️ ${validation.error}`);
      return;
    }

    try {
      await setStatusMutation.mutateAsync({
        ideaId: idea.id,
        status: targetStatus,
        reason: statusReason || undefined,
      });

      onNotify(`🔄 Status transitioned: ${idea.status} ➔ ${targetStatus}`);
      onClose();
    } catch (err: unknown) {
      onNotify(`❌ Transition failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedMentorId) return;
    try {
      await assignMentorMutation.mutateAsync({
        ideaId: idea.id,
        mentorId: selectedMentorId,
      });
      onNotify(`🎓 Mentor assigned to "${idea.title}".`);
    } catch (err: unknown) {
      onNotify(`❌ Mentor assignment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={22} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>
                Multi-Reviewer Rubric & Governance
              </h3>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Pitch: <strong>{idea.title}</strong> • Innovator: {idea.authorName} ({idea.authorDepartment || 'BMCE'})
            </p>
          </div>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Aggregate Score Bar */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Weighted Rubric Average
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 900, fontSize: '1.3rem' }}>
                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                <span>{aggregateScore?.aggregateScore ? `${aggregateScore.aggregateScore} / 5.0` : (idea.adminRating ? `${idea.adminRating}.0 / 5.0` : 'Pending Reviews')}</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Reviewers
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                {reviews.length} Assigned • {reviews.filter((r) => Boolean(r.submittedAt)).length} Submitted
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Pipeline Status
            </span>
            <div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: 'var(--accent-cyan)',
                }}
              >
                {idea.status}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}
        >
          <button
            className={`btn ${activeTab === 'rubric' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('rubric')}
          >
            <Award size={14} /> Evaluation Rubric
          </button>
          <button
            className={`btn ${activeTab === 'reviewers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('reviewers')}
          >
            <Users size={14} /> Reviewers ({reviews.length})
          </button>
          <button
            className={`btn ${activeTab === 'status' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('status')}
          >
            <Compass size={14} /> Transition Status
          </button>
          <button
            className={`btn ${activeTab === 'mentors' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('mentors')}
          >
            <UserCheck size={14} /> Mentorship
          </button>
        </div>

        {/* TAB 1: Evaluation Rubric */}
        {activeTab === 'rubric' && (
          <form onSubmit={handleSubmitRubric} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {criteria.map((crit) => {
                const current = scores[crit.id] || { score: 4, comment: '' };
                return (
                  <div
                    key={crit.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{crit.name}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginLeft: '0.5rem', fontWeight: 600 }}>
                          Weight: {crit.weight}x
                        </span>
                        {crit.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {crit.description}
                          </div>
                        )}
                      </div>

                      {/* 1-5 Star Picker */}
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleScoreChange(crit.id, s)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: s <= current.score ? '#f59e0b' : 'var(--text-muted)',
                            }}
                          >
                            <Star size={18} fill={s <= current.score ? '#f59e0b' : 'none'} />
                          </button>
                        ))}
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: '0.3rem', width: '20px' }}>
                          {current.score}
                        </span>
                      </div>
                    </div>

                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Qualitative remarks on ${crit.name.toLowerCase()}...`}
                      value={current.comment}
                      onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Official Nodal Officer / Jury Feedback Synthesis</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Consolidated remarks on technical viability, intellectual property, lab track allocation..."
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitReviewMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Send size={14} /> {submitReviewMutation.isPending ? 'Publishing...' : 'Submit Rubric Evaluation'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Reviewers Assignment */}
        {activeTab === 'reviewers' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>
                Assign Expert Evaluators
              </h4>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Rule enforced: Evaluators cannot be the author or members of the author's hackathon team.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Reviewer Profile UUID or Staff ID..."
                  value={reviewerInput}
                  onChange={(e) => setReviewerInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAssignReviewer}
                  disabled={assignReviewersMutation.isPending || !reviewerInput.trim()}
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Existing Assigned Reviewers List */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                Assigned Reviewers Panel ({reviews.length})
              </h4>
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No external evaluators assigned yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={rev.reviewerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={rev.reviewerName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{rev.reviewerName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ID: {rev.reviewerId} • {rev.reviewerDepartment || 'Faculty Juror'}
                          </div>
                        </div>
                      </div>

                      <div>
                        {rev.submittedAt ? (
                          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={13} /> Submitted
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} /> Evaluation Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Transition Status */}
        {activeTab === 'status' && (
          <form onSubmit={handleApplyStatusTransition} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Current Status: <strong>{idea.status}</strong>
              </div>
              <label className="form-label">Permitted Next Status</label>
              {allowedTransitions.length === 0 ? (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Idea is in a terminal status ({idea.status}). No forward transitions allowed.
                </div>
              ) : (
                <select
                  className="form-input"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IdeaStatus)}
                >
                  {allowedTransitions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason for Transition (recorded to status_history audit)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="State the committee decision or requirement (e.g. Scored above 4.0 in feasibility; approved for prototyping bay)."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={setStatusMutation.isPending || allowedTransitions.length === 0}
              >
                {setStatusMutation.isPending ? 'Updating...' : `Transition to "${targetStatus}"`}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: Mentorship */}
        {activeTab === 'mentors' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>
                Assign Faculty / Industry Mentor
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="form-input"
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                >
                  <option value="">Select an active faculty mentor...</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.department || m.organization}) - {m.expertise.join(', ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAssignMentor}
                  disabled={assignMentorMutation.isPending || !selectedMentorId}
                >
                  Assign Mentor
                </button>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                Assigned Mentors ({mentorAssignments.length})
              </h4>
              {mentorAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No mentor assigned yet for this startup pitch.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {mentorAssignments.map((ma) => (
                    <div
                      key={ma.id}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          {ma.mentor?.fullName || 'Assigned Mentor'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Status: <strong style={{ color: ma.status === 'accepted' ? '#10b981' : '#f59e0b' }}>{ma.status}</strong>
                          {ma.responseNotes && ` • Notes: ${ma.responseNotes}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
