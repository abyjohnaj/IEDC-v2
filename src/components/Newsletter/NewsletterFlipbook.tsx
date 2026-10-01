import React, { useState, useEffect, useRef } from 'react';
import { NewsletterEdition } from '../../types';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  FileText, 
  Download, 
  Layers,
  Sparkles
} from 'lucide-react';
import { newsletterService } from '../../services/newsletterService';
import '../../styles/newsletterFlipbook.css';

interface NewsletterFlipbookProps {
  edition: NewsletterEdition;
  onClose: () => void;
  onSwitchToTextMode?: () => void;
  onPrevEdition?: () => void;
  onNextEdition?: () => void;
}

export const NewsletterFlipbook: React.FC<NewsletterFlipbookProps> = ({
  edition,
  onClose,
  onSwitchToTextMode,
  onPrevEdition,
  onNextEdition
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState<number>(0);
  const [isSinglePageMode, setIsSinglePageMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageLoadedState, setImageLoadedState] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch WebP pages
  useEffect(() => {
    let isMounted = true;
    const loadPages = async () => {
      const webpUrls = await newsletterService.getNewsletterWebpPages(edition);
      if (isMounted) {
        setPages(webpUrls);
        setCurrentSpreadIndex(0);
        setZoomLevel(1);
      }
    };

    loadPages();
    return () => {
      isMounted = false;
    };
  }, [edition.id]);

  // Responsive mode detection (mobile vs desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSinglePageMode(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = pages.length;

  // Navigation logic
  const handlePrev = () => {
    if (isSinglePageMode) {
      setCurrentSpreadIndex(prev => Math.max(0, prev - 1));
    } else {
      setCurrentSpreadIndex(prev => Math.max(0, prev - 2));
    }
  };

  const handleNext = () => {
    if (isSinglePageMode) {
      setCurrentSpreadIndex(prev => Math.min(totalPages - 1, prev + 1));
    } else {
      setCurrentSpreadIndex(prev => {
        const next = prev + 2;
        return next < totalPages ? next : prev;
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(z => Math.min(2, z + 0.2));
      } else if (e.key === '-') {
        setZoomLevel(z => Math.max(0.8, z - 0.2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, isSinglePageMode]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Page indexes to show
  const leftPageIndex = isSinglePageMode ? null : (currentSpreadIndex === 0 ? null : currentSpreadIndex);
  const rightPageIndex = isSinglePageMode ? currentSpreadIndex : (currentSpreadIndex === 0 ? 0 : currentSpreadIndex + 1);

  const canGoPrev = currentSpreadIndex > 0;
  const canGoNext = isSinglePageMode ? currentSpreadIndex < totalPages - 1 : currentSpreadIndex + (currentSpreadIndex === 0 ? 1 : 2) < totalPages;

  return (
    <div 
      className="flipbook-overlay" 
      ref={containerRef}
      role="dialog" 
      aria-label={`${edition.title} - Visual WebP Flipbook`}
    >
      {/* Top Header Controls Bar */}
      <div className="flipbook-topbar">
        <div className="flipbook-title-group">
          <span className="flipbook-badge">Lazy WebP Flipbook</span>
          <div>
            <h2 className="flipbook-main-title">{edition.title}</h2>
            <div className="flipbook-subtitle">
              {edition.issueNo} • {edition.date} • {edition.category || 'Eureka Edition'}
            </div>
          </div>
        </div>

        <div className="flipbook-controls-group">
          {/* Zoom Controls */}
          <button 
            className="flipbook-btn-icon" 
            onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.2))}
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '0.8rem', color: '#fef3c7', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button 
            className="flipbook-btn-icon" 
            onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.2))}
            title="Zoom In (+)"
          >
            <ZoomIn size={16} />
          </button>

          {/* Single / Double Page Mode Toggle */}
          <button 
            className={`flipbook-btn-icon ${isSinglePageMode ? 'active' : ''}`}
            onClick={() => setIsSinglePageMode(!isSinglePageMode)}
            title={isSinglePageMode ? "Switch to Two-Page Spread" : "Switch to Single Page"}
          >
            <Layers size={16} />
          </button>

          {/* Switch to Editorial Text Mode */}
          {onSwitchToTextMode && (
            <button 
              className="flipbook-btn-icon" 
              onClick={onSwitchToTextMode}
              title="Switch to Editorial Text View"
            >
              <FileText size={16} />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button 
            className="flipbook-btn-icon" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Close Flipbook */}
          <button 
            className="flipbook-close-btn" 
            onClick={onClose}
            aria-label="Close flipbook"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Viewing Stage */}
      <div className="flipbook-stage">
        {/* Navigation Arrow Left */}
        <button 
          className="flipbook-nav-arrow flipbook-nav-prev"
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Previous Page"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Spread Container */}
        <div 
          className="flipbook-spread-container"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <div className="flipbook-book-spread">
            {/* Center spine shadow (visible in two-page mode) */}
            {!isSinglePageMode && leftPageIndex !== null && (
              <div className="flipbook-spine-crease" />
            )}

            {/* Left Page (Two-page mode) */}
            {!isSinglePageMode && leftPageIndex !== null && (
              <div className="flipbook-page-leaf left-page">
                {!imageLoadedState[leftPageIndex] && (
                  <div className="flipbook-page-skeleton">
                    <Sparkles size={24} />
                    <span>Loading Page {leftPageIndex + 1}...</span>
                  </div>
                )}
                <img
                  src={pages[leftPageIndex]}
                  alt={`Page ${leftPageIndex + 1}`}
                  loading="lazy"
                  decoding="async"
                  className={`flipbook-page-image ${imageLoadedState[leftPageIndex] ? 'loaded' : 'loading'}`}
                  onLoad={() => setImageLoadedState(prev => ({ ...prev, [leftPageIndex]: true }))}
                />
                <div className="flipbook-page-number">Page {leftPageIndex + 1}</div>
              </div>
            )}

            {/* Right / Single Page */}
            {rightPageIndex !== null && rightPageIndex < totalPages && (
              <div className={`flipbook-page-leaf ${isSinglePageMode ? 'single-mode' : 'right-page'}`}>
                {!imageLoadedState[rightPageIndex] && (
                  <div className="flipbook-page-skeleton">
                    <Sparkles size={24} />
                    <span>Loading Page {rightPageIndex + 1}...</span>
                  </div>
                )}
                <img
                  src={pages[rightPageIndex]}
                  alt={`Page ${rightPageIndex + 1}`}
                  loading="lazy"
                  decoding="async"
                  className={`flipbook-page-image ${imageLoadedState[rightPageIndex] ? 'loaded' : 'loading'}`}
                  onLoad={() => setImageLoadedState(prev => ({ ...prev, [rightPageIndex]: true }))}
                />
                <div className="flipbook-page-number">Page {rightPageIndex + 1}</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Arrow Right */}
        <button 
          className="flipbook-nav-arrow flipbook-nav-next"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next Page"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Bottom Bar: Thumbnails & Page Info */}
      <div className="flipbook-bottombar">
        <div className="flipbook-controls-row">
          <div className="flipbook-page-indicator">
            {isSinglePageMode ? (
              <span>Page {currentSpreadIndex + 1} of {totalPages}</span>
            ) : currentSpreadIndex === 0 ? (
              <span>Cover (Page 1 of {totalPages})</span>
            ) : (
              <span>
                Pages {leftPageIndex! + 1} - {Math.min(rightPageIndex! + 1, totalPages)} of {totalPages}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {edition.pdfUrl && (
              <a 
                href={edition.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  color: '#fbbf24', 
                  fontSize: '0.82rem',
                  textDecoration: 'none'
                }}
              >
                <Download size={14} />
                <span>Original PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* Lazy Thumbnail Filmstrip */}
        {totalPages > 1 && (
          <div className="flipbook-filmstrip">
            {pages.map((pageUrl, idx) => {
              const isActive = isSinglePageMode 
                ? currentSpreadIndex === idx 
                : (idx === currentSpreadIndex || idx === currentSpreadIndex + 1);

              return (
                <div
                  key={idx}
                  className={`flipbook-thumb-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentSpreadIndex(isSinglePageMode ? idx : (idx === 0 ? 0 : idx % 2 === 0 ? idx : idx - 1));
                  }}
                  title={`Jump to Page ${idx + 1}`}
                >
                  <img
                    src={pageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="flipbook-thumb-img"
                  />
                  <span className="flipbook-thumb-label">{idx + 1}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
