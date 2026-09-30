import React, { useState } from 'react';
import { IdeaMilestone } from '../../types';
import { 
  useIdeaMilestones, 
  useCreateIdeaMilestone, 
  useUpdateIdeaMilestone 
} from '../../hooks/useIdeas';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar, 
  IndianRupee, 
  Flag, 
  ChevronRight 
} from 'lucide-react';

interface MilestoneTrackerProps {
  ideaId: string;
  canEdit?: boolean;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ ideaId, canEdit = false }) => {
  const { data: milestones = [], isLoading, isError } = useIdeaMilestones(ideaId);
  const createMilestoneMutation = useCreateIdeaMilestone();
  const updateMilestoneMutation = useUpdateIdeaMilestone();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTranche, setNewTranche] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const totalFunding = milestones.reduce((sum, m) => sum + (m.fundingTranche || 0), 0);
  const releasedFunding = milestones
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + (m.fundingTranche || 0), 0);
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createMilestoneMutation.mutateAsync({
      ideaId,
      title: newTitle.trim(),
      dueDate: newDueDate || undefined,
      description: newDescription.trim() || undefined,
      status: 'pending',
      fundingTranche: Number(newTranche) || 0,
    });

    setNewTitle('');
    setNewDueDate('');
    setNewTranche('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleToggleStatus = async (milestone: IdeaMilestone) => {
    if (!canEdit) return;
    const nextStatus = milestone.status === 'completed' ? 'in_progress' : 'completed';
    await updateMilestoneMutation.mutateAsync({
      milestoneId: milestone.id,
      ideaId,
      updates: { status: nextStatus },
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginTop: '1.25rem',
      }}
    >
      {/* Tracker Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flag size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
              Incubation Milestones & Grant Tranche Tracker
            </h4>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Track project execution phases, lab deliverables, and seed fund release requirements.
          </p>
        </div>

        {canEdit && !isAdding && (
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setIsAdding(true)}
          >
            <Plus size={14} /> Add Milestone
          </button>
        )}
      </div>

      {/* Progress & Funding Bar */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>Milestone Progress</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{completedCount} / {milestones.length} Completed ({progressPct}%)</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent-cyan)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Released Grant</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>₹{releasedFunding.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tranche Pool</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{totalFunding.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Add Milestone Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>New Incubation Milestone</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Milestone Title (e.g. PCB Gerber Finalization & Sensor Rig Test)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ fontSize: '0.82rem' }}
            />
            <input
              type="date"
              className="form-input"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              style={{ fontSize: '0.82rem' }}
            />
            <input
              type="number"
              className="form-input"
              placeholder="Tranche (₹)"
              value={newTranche}
              onChange={(e) => setNewTranche(e.target.value)}
              style={{ fontSize: '0.82rem' }}
            />
          </div>
          <input
            type="text"
            className="form-input"
            placeholder="Deliverable Description / Success Metrics (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            style={{ fontSize: '0.82rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
              disabled={createMilestoneMutation.isPending}
            >
              {createMilestoneMutation.isPending ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      )}

      {/* Milestones List */}
      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading milestones...
        </div>
      ) : milestones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No milestones defined yet. {canEdit && 'Add the first prototyping target to unlock seed tranches!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {milestones.map((m, idx) => {
            const isCompleted = m.status === 'completed';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-secondary)',
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <button
                    onClick={() => handleToggleStatus(m)}
                    disabled={!canEdit}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: canEdit ? 'pointer' : 'default',
                      color: isCompleted ? '#10b981' : 'var(--text-muted)',
                      padding: 0,
                    }}
                    title={canEdit ? (isCompleted ? 'Mark In Progress' : 'Mark Completed') : undefined}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                        }}
                      >
                        {idx + 1}. {m.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isCompleted ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    {m.description && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {m.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem' }}>
                  {m.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      <span>{new Date(m.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {m.fundingTranche > 0 && (
                    <div
                      style={{
                        fontWeight: 800,
                        color: isCompleted ? '#10b981' : 'var(--accent-cyan)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      ₹{m.fundingTranche.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
