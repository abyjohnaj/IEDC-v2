import React from 'react';
import { NewsletterEdition } from '../../types';

interface NewsletterBookProps {
  edition: NewsletterEdition;
  isSelected: boolean;
  onSelect: (edition: NewsletterEdition) => void;
  radius: number;
  tierTop: number;
  angle: number;
}

export const NewsletterBook: React.FC<NewsletterBookProps> = ({
  edition,
  isSelected,
  onSelect,
  radius,
  tierTop,
  angle
}) => {
  const coverClass = edition.coverStyle ? `cover-${edition.coverStyle}` : 'cover-navy';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(edition);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${edition.title}, ${edition.issueNo} - ${edition.date}`}
      className={`newsletter-book-3d ${isSelected ? 'selected' : ''}`}
      style={{
        top: `${tierTop}px`,
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
        // CSS variables used for hover / selected transforms in CSS
        ['--book-angle' as any]: `${angle}deg`,
        ['--book-radius' as any]: `${radius}px`
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(edition);
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Contact Shadow cast on wooden shelf floor */}
      <div className="book-shelf-contact-shadow" />

      {/* 3D Spine Thickness with Clean Embossed Lettering */}
      <div 
        className="book-spine-side"
        style={{ 
          backgroundColor: edition.spineColor || '#1e3a8a'
        }}
      >
        <div className="book-spine-text">
          <span>{edition.issueNo}</span>
          <span style={{ margin: '0 4px', opacity: 0.6 }}>•</span>
          <span>{edition.title}</span>
        </div>
      </div>

      {/* 3D Pages Thickness (Aged cream parchment edge) */}
      <div className="book-pages-side" />

      {/* Front Cover facing outward */}
      <div className={`book-cover-front ${coverClass}`}>
        <div className="book-hinge-crease" />

        {/* Header: Issue & Icon */}
        <div className="book-cover-header">
          <span className="book-issue-badge">{edition.issueNo}</span>
          <span className="book-tag-icon">{edition.icon || '📖'}</span>
        </div>

        {/* Center: Clean & Legible Book Title & Subtitle */}
        <div className="book-cover-body">
          <div className="book-cover-title">{edition.title}</div>
          {edition.subtitle && (
            <div className="book-cover-subtitle">{edition.subtitle}</div>
          )}
        </div>

        {/* Footer: Date & Category */}
        <div className="book-cover-footer">
          <span className="book-cover-date">{edition.date}</span>
          <span className="book-cover-cat">{edition.category}</span>
        </div>
      </div>
    </div>
  );
};
