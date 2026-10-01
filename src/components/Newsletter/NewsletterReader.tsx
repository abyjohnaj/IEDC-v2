import React, { useState, useEffect } from 'react';
import { NewsletterEdition } from '../../types';
import { X, ChevronLeft, ChevronRight, ExternalLink, Calendar, User, BookOpen, Layers } from 'lucide-react';
import { NewsletterFlipbook } from './NewsletterFlipbook';

interface NewsletterReaderProps {
  edition: NewsletterEdition;
  onClose: () => void;
  onPrevEdition?: () => void;
  onNextEdition?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  initialMode?: 'flipbook' | 'article';
}

export const NewsletterReader: React.FC<NewsletterReaderProps> = ({
  edition,
  onClose,
  onPrevEdition,
  onNextEdition,
  hasPrev = true,
  hasNext = true,
  initialMode = 'flipbook'
}) => {
  const [readerMode, setReaderMode] = useState<'flipbook' | 'article'>(initialMode);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Reset page when edition changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [edition.id]);

  if (readerMode === 'flipbook') {
    return (
      <NewsletterFlipbook
        edition={edition}
        onClose={onClose}
        onSwitchToTextMode={() => setReaderMode('article')}
        onPrevEdition={onPrevEdition}
        onNextEdition={onNextEdition}
      />
    );
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentPageIndex > 0) {
          setCurrentPageIndex(prev => prev - 1);
        } else if (onPrevEdition && hasPrev) {
          onPrevEdition();
        }
      } else if (e.key === 'ArrowRight') {
        if (edition.pages && currentPageIndex < edition.pages.length - 1) {
          setCurrentPageIndex(prev => prev + 1);
        } else if (onNextEdition && hasNext) {
          onNextEdition();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, edition, onClose, onPrevEdition, onNextEdition, hasPrev, hasNext]);

  const currentPage = edition.pages && edition.pages[currentPageIndex] 
    ? edition.pages[currentPageIndex] 
    : {
        pageNumber: 1,
        title: edition.title,
        headline: edition.subtitle || edition.title,
        body: [edition.content || edition.summary],
        callout: edition.highlights?.[0]
      };

  const totalPages = edition.pages?.length || 1;

  return (
    <div className="reader-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="reader-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="reader-modal-header">
          <div className="reader-header-info">
            <div style={{ fontSize: '1.4rem' }}>{edition.icon || '📖'}</div>
            <div>
              <h3 className="reader-header-title">{edition.title}</h3>
              <div className="reader-header-meta">
                {edition.issueNo} • {edition.date} • {edition.category}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="reader-page-btn"
              onClick={() => setReaderMode('flipbook')}
              style={{ background: '#b45309', color: '#fff', borderColor: '#d97706', cursor: 'pointer' }}
              title="Switch to Visual WebP Flipbook"
            >
              <BookOpen size={15} />
              <span>3D WebP Flipbook</span>
            </button>
            <button 
              className="reader-close-btn"
              onClick={onClose}
              aria-label="Close reader"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Article Reading Canvas */}
        <div className="reader-modal-content">
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Issue Category & Page indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: '#854d0e', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>SECTION: {(edition.category || 'General').toUpperCase()}</span>
              <span>PAGE {currentPageIndex + 1} OF {totalPages}</span>
            </div>

            {/* Headline */}
            <h1 className="reader-article-headline">{currentPage.headline}</h1>

            {/* Byline and Date */}
            <div className="reader-article-byline">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
                <User size={14} /> {currentPage.author || edition.author || 'BMCE Editorial Bureau'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> {edition.date}
              </span>
            </div>

            {/* Optional Callout quote */}
            {currentPage.callout && (
              <blockquote className="reader-article-callout">
                "{currentPage.callout}"
              </blockquote>
            )}

            {/* Article Paragraphs */}
            <div className="reader-article-body">
              {currentPage.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Navigation Footer */}
        <div className="reader-modal-footer">
          {/* Issue Navigation (Between Issues) */}
          <div className="reader-nav-links">
            <button
              className="reader-page-btn"
              onClick={onPrevEdition}
              disabled={!hasPrev}
              title="Read previous newsletter edition"
            >
              <ChevronLeft size={16} />
              <span>Previous Issue</span>
            </button>
            <button
              className="reader-page-btn"
              onClick={onNextEdition}
              disabled={!hasNext}
              title="Read next newsletter edition"
            >
              <span>Next Issue</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Page Turners (Within Current Issue) */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="reader-page-btn"
                onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentPageIndex === 0}
              >
                Page {currentPageIndex}
              </button>
              <span style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 600 }}>
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                className="reader-page-btn"
                onClick={() => setCurrentPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPageIndex === totalPages - 1}
              >
                Page {currentPageIndex + 2}
              </button>
            </div>
          )}

          {/* External Full PDF / Flipbook Link */}
          {edition.pdfUrl && (
            <a
              href={edition.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="reader-pdf-link"
              title="Download or open original scanned PDF archive"
            >
              <BookOpen size={16} />
              <span>Original PDF Archive</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
