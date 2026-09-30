import React from 'react';
import { NewsletterEdition } from '../../types';
import { BookOpen, X, Sparkles, Calendar, Clock, User } from 'lucide-react';

interface NewsletterDetailsProps {
  edition: NewsletterEdition;
  onRead: (edition: NewsletterEdition) => void;
  onDismiss: () => void;
}

export const NewsletterDetails: React.FC<NewsletterDetailsProps> = ({
  edition,
  onRead,
  onDismiss
}) => {
  return (
    <div className="newsletter-details-panel" role="region" aria-label="Selected Issue Details">
      <div className="details-panel-header">
        <div>
          <div className="details-issue-meta">
            {edition.issueNo} • {edition.category}
          </div>
          <h2 className="details-issue-title">{edition.title}</h2>
          {edition.subtitle && (
            <div style={{ color: '#fef3c7', fontSize: '0.95rem', fontStyle: 'italic', marginBottom: '6px' }}>
              {edition.subtitle}
            </div>
          )}
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: '#a89985' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> {edition.date}
            </span>
            {edition.readTime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} /> {edition.readTime}
              </span>
            )}
            {edition.author && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={13} /> {edition.author}
              </span>
            )}
          </div>
        </div>

        <button 
          className="dismiss-selection-btn"
          onClick={onDismiss}
          aria-label="Deselect issue"
          style={{ padding: '6px 10px' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="details-panel-body">
        <p style={{ margin: 0, lineHeight: 1.65 }}>
          {edition.excerpt || edition.summary}
        </p>
      </div>

      {edition.highlights && edition.highlights.length > 0 && (
        <ul className="details-highlights-list">
          {edition.highlights.map((highlight, idx) => (
            <li key={idx}>
              <Sparkles size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="details-action-bar">
        <button
          className="read-newsletter-btn"
          onClick={() => onRead(edition)}
          aria-label={`Read ${edition.title} ${edition.issueNo}`}
        >
          <BookOpen size={18} />
          <span>Read Newsletter</span>
        </button>

        <button
          className="dismiss-selection-btn"
          onClick={onDismiss}
        >
          Return to Shelf
        </button>
      </div>
    </div>
  );
};
