import React, { useState, useEffect } from 'react';
import { ForumDiscussion } from '../types';
import { fetchDiscussions, upvoteDiscussion } from '../services/supabaseClient';
import { NewDiscussionModal } from '../components/Modals/NewDiscussionModal';
import { ThreadCommentsModal } from '../components/Modals/ThreadCommentsModal';
import { Search, Plus, ThumbsUp, MessageSquare } from 'lucide-react';

export const ForumSection: React.FC = () => {
  const [discussions, setDiscussions] = useState<ForumDiscussion[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedThread, setSelectedThread] = useState<ForumDiscussion | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchDiscussions();
      setDiscussions(data);
    };
    load();
  }, []);

  const handleUpvote = async (e: React.MouseEvent, threadId: string, currentCount: number) => {
    e.stopPropagation();
    const newCount = currentCount + 1;
    setDiscussions(prev => prev.map(d => (d.id === threadId ? { ...d, upvotes: newCount } : d)));
    await upvoteDiscussion(threadId, newCount);
  };

  const handleThreadCreated = (newThread: ForumDiscussion) => {
    setDiscussions(prev => [newThread, ...prev]);
  };

  const handleCommentAdded = (threadId: string, newComment: any) => {
    setDiscussions(prev =>
      prev.map(t =>
        t.id === threadId ? { ...t, comments: [...(t.comments || []), newComment] } : t
      )
    );
    if (selectedThread && selectedThread.id === threadId) {
      setSelectedThread(prev =>
        prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null
      );
    }
  };

  const filteredDiscussions = discussions.filter(d => {
    const matchChannel = activeChannel === 'All' || d.channel === activeChannel;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.excerpt.toLowerCase().includes(q) ||
      d.authorName.toLowerCase().includes(q) ||
      d.rolesNeeded.some(r => r.toLowerCase().includes(q));
    return matchChannel && matchQuery;
  });

  const channels = [
    { id: 'All', label: '🌐 All Channels' },
    { id: 'TeamUp', label: '🤝 Team Up / Co-Founders' },
    { id: 'IdeaPitch', label: '💡 Idea Pitches' },
    { id: 'TechQA', label: '🛠️ Tech & Hardware Q&A' },
    { id: 'Grants', label: '💰 Grants & Hackathons' },
    { id: 'Showcase', label: '🎉 Project Showcase' }
  ];

  return (
    <section id="forum" className="forum-section">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Connect & Build Together</span>
          <h2 className="section-title">
            Innovators <span className="gradient-text">Community Forum</span>
          </h2>
          <p className="section-desc">
            A collaboration hub for BMCE student founders, developers, designers, and mentors to share ideas, recruit co-founders, and solve tech challenges.
          </p>
        </div>

        {/* Search & Actions Bar */}
        <div className="forum-controls">
          <div className="forum-search-box">
            <Search className="forum-search-icon" size={18} />
            <input
              type="text"
              className="forum-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ideas, roles needed, tech tags..."
            />
          </div>

          <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
            <Plus size={18} />
            Start Discussion
          </button>
        </div>

        {/* Channel Chips */}
        <div className="forum-channels">
          {channels.map(c => (
            <button
              key={c.id}
              className={`channel-chip ${activeChannel === c.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Discussions Grid */}
        <div className="forum-grid">
          {filteredDiscussions.length === 0 ? (
            <div
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No Discussions Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                Be the first innovator to launch a thread or search for co-founders in this channel!
              </p>
              <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
                <Plus size={18} /> Start Discussion
              </button>
            </div>
          ) : (
            filteredDiscussions.map(item => (
              <div
                key={item.id}
                className="glass-card forum-card"
                onClick={() => setSelectedThread(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="forum-header">
                  <img
                    src={item.authorAvatar}
                    alt={item.authorName}
                    className="forum-avatar"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div>
                    <div className="forum-author-name">{item.authorName}</div>
                    <div className="forum-author-role">{item.authorRole}</div>
                  </div>
                  <span className="forum-time">{item.timestamp}</span>
                </div>

                <h3 className="forum-thread-title">{item.title}</h3>
                <p className="forum-thread-excerpt">{item.excerpt}</p>

                {item.rolesNeeded && item.rolesNeeded.length > 0 && (
                  <div className="forum-tags">
                    {item.rolesNeeded.map((r, idx) => (
                      <span key={idx} className="role-pill">
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="forum-footer">
                  <button
                    className="upvote-btn"
                    onClick={e => handleUpvote(e, item.id, item.upvotes)}
                    title="Upvote Discussion"
                  >
                    <ThumbsUp size={14} />
                    <span>{item.upvotes}</span>
                  </button>

                  <button className="comments-badge" title="View Replies">
                    <MessageSquare size={14} />
                    <span>{item.comments?.length || 0} Replies</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <NewDiscussionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onThreadCreated={handleThreadCreated}
      />

      <ThreadCommentsModal
        thread={selectedThread}
        isOpen={Boolean(selectedThread)}
        onClose={() => setSelectedThread(null)}
        onCommentAdded={handleCommentAdded}
      />
    </section>
  );
};
