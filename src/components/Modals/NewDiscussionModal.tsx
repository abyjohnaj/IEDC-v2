import React, { useState } from 'react';
import { X, MessageSquare, Plus } from 'lucide-react';
import { createDiscussion } from '../../services/supabaseClient';
import { ForumDiscussion } from '../../types';

interface NewDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadCreated: (thread: ForumDiscussion) => void;
}

export const NewDiscussionModal: React.FC<NewDiscussionModalProps> = ({
  isOpen,
  onClose,
  onThreadCreated
}) => {
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('TeamUp');
  const [excerpt, setExcerpt] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [rolesNeededInput, setRolesNeededInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const roles = rolesNeededInput
      .split(',')
      .map(r => r.trim())
      .filter(Boolean);

    const newThread = await createDiscussion({
      title,
      channel,
      excerpt,
      authorName: authorName || 'Innovator',
      authorRole: authorRole || 'Student Innovator • BMCE',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      rolesNeeded: roles
    });

    setIsSubmitting(false);
    onClose();
    onThreadCreated(newThread);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={22} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <span className="eureka-badge" style={{ marginBottom: '0.6rem' }}>
            💬 Community Forum
          </span>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }} className="gradient-text">
            Start a New Innovation Thread
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Find co-founders, pitch concepts, ask hardware questions, or showcase your latest engineering project.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Discussion Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Seeking Flutter developer for Smart EV Charging project"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Forum Channel *</label>
              <select
                className="form-select"
                value={channel}
                onChange={e => setChannel(e.target.value)}
              >
                <option value="TeamUp">🤝 Team Up / Co-Founders</option>
                <option value="IdeaPitch">💡 Idea Pitches</option>
                <option value="TechQA">🛠️ Tech & Hardware Q&A</option>
                <option value="Grants">💰 Grants & Hackathons</option>
                <option value="Showcase">🎉 Project Showcase</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input
                type="text"
                className="form-input"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Role / Department</label>
            <input
              type="text"
              className="form-input"
              value={authorRole}
              onChange={e => setAuthorRole(e.target.value)}
              placeholder="e.g. S5 CSE • Backend Enthusiast"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Roles Needed (Comma Separated)</label>
            <input
              type="text"
              className="form-input"
              value={rolesNeededInput}
              onChange={e => setRolesNeededInput(e.target.value)}
              placeholder="e.g. Flutter Dev, Embedded C, UI/UX Designer"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Problem Statement *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Detail your idea, the technology stack, milestones, and how fellow BMCE engineers can collaborate..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Plus size={16} />
              {isSubmitting ? 'Publishing...' : 'Publish Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
