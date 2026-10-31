import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { NewsletterEdition } from '../../types';
import { newsletterShelfService } from '../../services/newsletterShelfService';
import { KsumShelfRow } from './KsumShelfRow';
import { NewsletterReader } from './NewsletterReader';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import '../../styles/ksumBookshelf.css';

interface ShelfDefinition {
  id: string;
  title: string;
  tag: string;
  editions: NewsletterEdition[];
}

export const KsumCanvasBookshelf: React.FC = () => {
  const [activeReaderEdition, setActiveReaderEdition] = useState<NewsletterEdition | null>(null);
  const [activeShelfIndex, setActiveShelfIndex] = useState<number>(0);

  // Load dynamic shelves and publications from service
  const [shelvesData, setShelvesData] = useState(() => newsletterShelfService.getShelvesWithPublications());

  const viewportRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Subscribe to updates (new shelf created in admin, new publication published/uploaded)
  useEffect(() => {
    return newsletterShelfService.subscribe(() => {
      setShelvesData(newsletterShelfService.getShelvesWithPublications());
    });
  }, []);

  // Map dynamic shelves to shelf definitions
  const shelves: ShelfDefinition[] = useMemo(() => {
    return shelvesData.map(({ shelf, publications }) => ({
      id: shelf.id,
      title: shelf.name,
      tag: shelf.tag || 'Shelf',
      editions: publications
    }));
  }, [shelvesData]);

  const totalShelves = Math.max(shelves.length, 1);

  // Clamp active index if shelves change
  useEffect(() => {
    if (activeShelfIndex >= totalShelves) {
      setActiveShelfIndex(Math.max(0, totalShelves - 1));
    }
  }, [totalShelves, activeShelfIndex]);

  const goToShelf = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalShelves) {
        setActiveShelfIndex(index);
      }
    },
    [totalShelves]
  );

  const prevShelf = useCallback(() => {
    setActiveShelfIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const nextShelf = useCallback(() => {
    setActiveShelfIndex((prev) => Math.min(prev + 1, totalShelves - 1));
  }, [totalShelves]);

  // Touch swipe support on mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextShelf();
      } else {
        prevShelf();
      }
    }
  };

  const handleOpenReader = (edition: NewsletterEdition) => {
    setActiveReaderEdition(edition);
  };

  const allPublications = useMemo(() => {
    return shelvesData.flatMap((s) => s.publications);
  }, [shelvesData]);

  const handlePrevEdition = () => {
    if (!activeReaderEdition || allPublications.length === 0) return;
    const idx = allPublications.findIndex((e) => e.id === activeReaderEdition.id);
    if (idx > 0) {
      setActiveReaderEdition(allPublications[idx - 1]);
    } else {
      setActiveReaderEdition(allPublications[allPublications.length - 1]);
    }
  };

  const handleNextEdition = () => {
    if (!activeReaderEdition || allPublications.length === 0) return;
    const idx = allPublications.findIndex((e) => e.id === activeReaderEdition.id);
    if (idx < allPublications.length - 1) {
      setActiveReaderEdition(allPublications[idx + 1]);
    } else {
      setActiveReaderEdition(allPublications[0]);
    }
  };

  return (
    <section
      id="eureka"
      className="ksum-canvas-section"
      aria-label="IEDC BMCE Library"
    >
      <div className="ksum-canvas-container">
        {/* Left Sticky Narrative Column (Clean IEDC BMCE Library Layout) */}
        <div className="ksum-canvas-left">
          <div className="ksum-canvas-brand-pill">
            <span className="ksum-pulse-dot" />
            <Sparkles size={14} className="ksum-brand-icon" />
            <span>Official Digital Publication</span>
          </div>

          <h2 className="ksum-canvas-headline">
            IEDC BMCE <br />
            <span className="ksum-headline-accent">LIBRARY</span>
          </h2>

          <div className="ksum-canvas-body-text">
            <p>
              The IEDC BMCE Library is a centralized platform that provides extensive publications, research archives, and magazines for student entrepreneurs and innovators. It offers insights into current startup trends, campus innovations, and strategic technology developments.
            </p>
            <p>
              Additionally, the library features an archive of previous editions, technical blueprints, startup news, and interactive flipbook publications.
            </p>
          </div>

          {/* Clean Clickable Shelf Selector List */}
          <div className="ksum-shelf-selector-list">
            <span className="ksum-shelf-selector-heading">Browse Shelf Row</span>
            <div className="ksum-shelf-selector-group">
              {shelves.map((sh, idx) => (
                <button
                  key={sh.id}
                  type="button"
                  className={`ksum-shelf-select-btn ${activeShelfIndex === idx ? 'active' : ''}`}
                  onClick={() => goToShelf(idx)}
                >
                  <div className="ksum-shelf-select-info">
                    <span className="ksum-shelf-select-title">{sh.title}</span>
                    <span className="ksum-shelf-select-badge">{sh.tag}</span>
                  </div>
                  <span className="ksum-shelf-select-count">{sh.editions.length} issues</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Single-Row Shelf Viewport (Scroll cursor above shelf to scroll rows) */}
        <div className="ksum-canvas-right-single-area">
          {/* Vertical Shelf Row Switcher Floating Chevrons */}
          <div className="ksum-row-vertical-nav">
            <button
              type="button"
              className={`ksum-row-nav-arrow up ${activeShelfIndex === 0 ? 'disabled' : ''}`}
              onClick={prevShelf}
              disabled={activeShelfIndex === 0}
              title="Previous shelf row"
              aria-label="Previous shelf row"
            >
              <ChevronUp size={18} />
            </button>
            <span className="ksum-row-nav-count">
              {activeShelfIndex + 1}/{totalShelves}
            </span>
            <button
              type="button"
              className={`ksum-row-nav-arrow down ${activeShelfIndex === totalShelves - 1 ? 'disabled' : ''}`}
              onClick={nextShelf}
              disabled={activeShelfIndex === totalShelves - 1}
              title="Next shelf row"
              aria-label="Next shelf row"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Viewport showing EXACTLY ONE row at a time */}
          <div
            ref={viewportRef}
            className="ksum-canvas-right-viewport"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Container that moves vertically */}
            <div
              className="ksum-shelves-slider"
              style={{
                transform: `translateY(-${activeShelfIndex * 100}%)`
              }}
            >
              {shelves.map((sh, idx) => (
                <div key={sh.id} className="ksum-shelf-slide-item">
                  <KsumShelfRow
                    shelfTitle={sh.title}
                    shelfTag={sh.tag}
                    editions={sh.editions}
                    onOpenReader={handleOpenReader}
                    shelfIndex={idx + 1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Page-Turning Reader Modal */}
      {activeReaderEdition && (
        <NewsletterReader
          edition={activeReaderEdition}
          onClose={() => setActiveReaderEdition(null)}
          onPrevEdition={handlePrevEdition}
          onNextEdition={handleNextEdition}
          hasPrev={true}
          hasNext={true}
        />
      )}
    </section>
  );
};
