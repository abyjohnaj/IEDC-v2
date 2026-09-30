import React, { useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { ForumDiscussion } from '../../types';
import { addComment } from '../../services/supabaseClient';

interface ThreadCommentsModalProps {
  thread: ForumDiscussion | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: (threadId: string, newComment: { author: string; avatar: string; text: string; time: string }) => void;
}

export const ThreadCommentsModal: React.FC<ThreadCommentsModalProps> = ({
  thread,
  isOpen,
  onClose,
  onCommentAdded
}) => {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !thread) return null;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const newComment = {
      author: authorName.trim() || 'Fellow Innovator',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      text: commentText.trim(),
      time: 'Just now'
    };

    await addComment(thread.id, newComment);
    onCommentAdded(thread.id, newComment);

    setCommentText('');
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={22} />
        </button>

        {/* Thread Info */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <img
              src={thread.authorAvatar}
              alt={thread.authorName}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
              }}
            />
            <div>
              <h4 style={{ fontSize: '1rem', margin: 0 }}>{thread.authorName}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {thread.authorRole} • {thread.timestamp}
              </span>
            </div>
            <span
              className="eureka-badge"
              style={{ marginLeft: 'auto', marginBottom: 0, padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              {thread.channel}
            </span>
          </div>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem', lineHeight: 1.3 }}>
            {thread.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {thread.excerpt}
          </p>

          {thread.rolesNeeded && thread.rolesNeeded.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
              {thread.rolesNeeded.map((role, idx) => (
                <span key={idx} className="role-pill">
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments Stream */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageCircle size={16} /> Comments ({thread.comments?.length || 0})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '260px', overflowY: 'auto' }}>
            {(!thread.comments || thread.comments.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1rem 0' }}>
                No replies yet. Be the first to share feedback or offer collaboration!
              </p>
            ) : (
              thread.comments.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.9rem 1.1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <img
                      src={c.avatar}
                      alt={c.author}
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <strong style={{ fontSize: '0.85rem' }}>{c.author}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {c.time}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Comment Input */}
        <form onSubmit={handleCommentSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <input
              type="text"
              className="form-input"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Your Name (optional)"
            />
            <input
              type="text"
              className="form-input"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a constructive response or pitch your assistance..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Send size={15} />
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
