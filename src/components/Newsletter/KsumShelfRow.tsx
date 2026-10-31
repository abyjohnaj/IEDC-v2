import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NewsletterEdition } from '../../types';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface KsumShelfRowProps {
  shelfTitle?: string;
  shelfTag?: string;
  editions: NewsletterEdition[];
  onOpenReader: (edition: NewsletterEdition) => void;
  shelfIndex?: number;
}

export const KsumShelfRow: React.FC<KsumShelfRowProps> = ({
  shelfTitle,
  shelfTag,
  editions,
  onOpenReader,
  shelfIndex = 0
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({ startX: 0, scrollLeft: 0, moved: false });

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 15);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 15);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, editions]);

  // Horizontal scroll across books only with Shift+Wheel or trackpad horizontal deltaX.
  // Regular vertical mouse wheel is left to bubble up to switch shelf rows!
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey || (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 4)) {
        if (el.scrollWidth > el.clientWidth) {
          e.preventDefault();
          const move = e.deltaX || e.deltaY;
          el.scrollBy({ left: move * 1.2, behavior: 'auto' });
          checkScroll();
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 350);
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    dragInfo.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = trackRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.4;
    el.scrollLeft = dragInfo.current.scrollLeft - walk;
    if (Math.abs(walk) > 6) {
      dragInfo.current.moved = true;
    }
    checkScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleBookClick = (edition: NewsletterEdition) => {
    if (dragInfo.current.moved) {
      dragInfo.current.moved = false;
      return;
    }
    onOpenReader(edition);
  };

  // Display label formatting matching KSUM
  const getBookLabel = (edition: NewsletterEdition) => {
    if (edition.id === 'handbook-we-2026') return 'WE Handbook English';
    if (edition.date) {
      return `Newsletter ${edition.date}`;
    }
    return edition.title;
  };

  return (
    <div className="ksum-shelf-wrapper" data-shelf-index={shelfIndex}>
      {/* Optional Shelf Header / Tag */}
      {(shelfTitle || shelfTag) && (
        <div className="ksum-shelf-header-bar">
          {shelfTitle && <h4 className="ksum-shelf-title">{shelfTitle}</h4>}
          {shelfTag && <span className="ksum-shelf-tag-badge">{shelfTag}</span>}
          {editions.length > 3 && (
            <span className="ksum-shelf-scroll-hint">
              Scroll across shelf →
            </span>
          )}
        </div>
      )}

      {/* Main Wall Shelf Unit with Navigation Chevrons */}
      <div className="ksum-shelf-stage">
        {/* Left Arrow Button */}
        <button
          type="button"
          aria-label="Scroll newsletters left"
          className={`ksum-shelf-nav-btn prev ${canScrollLeft ? 'visible' : ''}`}
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft size={22} />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          aria-label="Scroll newsletters right"
          className={`ksum-shelf-nav-btn next ${canScrollRight ? 'visible' : ''}`}
          onClick={() => handleScroll('right')}
        >
          <ChevronRight size={22} />
        </button>

        {/* Left / Right Fade Gradients */}
        <div className={`ksum-shelf-fade left ${canScrollLeft ? 'active' : ''}`} />
        <div className={`ksum-shelf-fade right ${canScrollRight ? 'active' : ''}`} />

        {/* Horizontally Scrollable Books Track */}
        <div
          ref={trackRef}
          className={`ksum-shelf-track ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onScroll={checkScroll}
        >
          {editions.map((edition) => (
            <div
              key={edition.id}
              className="ksum-shelf-book-item"
              onClick={() => handleBookClick(edition)}
              title={`Read ${edition.title} - ${edition.date}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenReader(edition);
                }
              }}
            >
              {/* Issue Label floating above the book */}
              <p className="ksum-book-label">{getBookLabel(edition)}</p>

              {/* Physical Book Cover container */}
              <div className="ksum-book-card">
                {edition.coverImage ? (
                  <div className="ksum-book-cover-wrap">
                    <img
                      src={edition.coverImage}
                      alt={edition.title}
                      loading="lazy"
                      className="ksum-book-cover-img"
                    />
                    {/* Realistic Gloss Sheen on Cover */}
                    <div className="ksum-book-sheen" />
                    {/* Left Spine Thickness Highlight */}
                    <div className="ksum-book-spine-line" />
                  </div>
                ) : (
                  /* Editorial CSS Fallback Cover if no image */
                  <div
                    className={`ksum-book-custom-cover cover-${edition.coverStyle || 'navy'}`}
                    style={{ borderLeftColor: edition.spineColor || '#1e3a8a' }}
                  >
                    <div className="ksum-fallback-badge">{edition.issueNo}</div>
                    <div className="ksum-fallback-title">{edition.title}</div>
                    <div className="ksum-fallback-date">{edition.date}</div>
                  </div>
                )}

                {/* Subtle Hover Action Pill */}
                <div className="ksum-book-hover-pill">
                  <BookOpen size={14} />
                  <span>Read Edition</span>
                </div>

                {/* Contact Shadow on Wooden Shelf */}
                <div className="ksum-book-contact-shadow" />
              </div>
            </div>
          ))}
        </div>

        {/* Realistic Wooden Shelf Plank resting directly under the books */}
        <div className="ksum-wooden-shelf-plank-wrap" aria-hidden="true">
          <div className="ksum-wooden-shelf-beam" />
          <img
            src="/assets/ksum_shelf.png"
            alt="Wooden Bookshelf"
            className="ksum-wooden-shelf-plank-img"
          />
        </div>
      </div>
    </div>
  );
};
