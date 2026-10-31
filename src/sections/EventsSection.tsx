import React, { useState, useEffect, useRef } from 'react';
import { fetchEvents } from '../services/supabaseClient';
import { initialEventsData } from '../data/eventsData';
import { EventItem } from '../types';
import { Calendar, MapPin, ArrowUpRight, ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal } from 'lucide-react';

interface EventsSectionProps {
  onOpenRegistration: (eventName: string) => void;
  onOpenDetails?: (event: EventItem) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ onOpenRegistration, onOpenDetails }) => {
  const [events, setEvents] = useState<EventItem[]>(initialEventsData);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');

  // Touch and mouse drag swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const categories = [
    'All',
    'Workshops',
    'Bootcamps',
    'Fests',
    'Hackathons',
    'Talks',
    'Gaming',
    'Movies',
    'Orientation'
  ];

  const loadEvents = async () => {
    const loaded = await fetchEvents();
    if (loaded && loaded.length > 0) {
      setEvents(loaded);
    }
  };

  useEffect(() => {
    loadEvents();

    const handleSync = () => {
      loadEvents();
    };

    window.addEventListener('iedc-events-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('iedc-events-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter events based on showPastEvents toggle and activeCategory
  const filteredEvents = events.filter(e => {
    // Check past vs upcoming
    const isCompleted = e.status === 'Completed';
    if (showPastEvents) {
      if (!isCompleted) return false;
    } else {
      // By default show upcoming and featured events; if none, show all
      if (isCompleted && events.some(item => item.status !== 'Completed')) return false;
    }

    // Check category filter
    if (activeCategory === 'All') return true;
    return e.category.toLowerCase() === activeCategory.toLowerCase();
  });

  // Fallback: If filtered list is empty (e.g. no events under a specific category in upcoming), fallback to all matching category
  const displayEvents = filteredEvents.length > 0
    ? filteredEvents
    : events.filter(e => activeCategory === 'All' || e.category.toLowerCase() === activeCategory.toLowerCase());

  // Reset index when category or past toggle changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory, showPastEvents]);

  // Make sure currentIndex is valid
  useEffect(() => {
    if (currentIndex >= displayEvents.length && displayEvents.length > 0) {
      setCurrentIndex(displayEvents.length - 1);
    }
  }, [displayEvents.length, currentIndex]);

  const prevSlide = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev < displayEvents.length - 1 ? prev + 1 : prev));
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isSwipeLeft = distance > 50;
    const isSwipeRight = distance < -50;

    if (isSwipeLeft) {
      nextSlide();
    } else if (isSwipeRight) {
      prevSlide();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Mouse Drag Swipe Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartXRef.current = e.clientX;
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    touchEndXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const distance = touchStartXRef.current - touchEndXRef.current;
      if (distance > 50) {
        nextSlide();
      } else if (distance < -50) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleMouseUp();
    }
  };

  const handleDetailsClick = (evt: EventItem) => {
    if (onOpenDetails) {
      onOpenDetails(evt);
    } else {
      onOpenRegistration(evt.title);
    }
  };

  return (
    <section id="events" className="events-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            Explore <span className="gradient-text">Events & Bootcamps</span>
          </h2>
          <p className="section-desc">
            Explore our workshops, bootcamps, national hackathons, and techno-cultural fests. Slide through upcoming and featured highlights below.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="filter-pills" role="tablist" aria-label="Event Categories">
          {categories.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`pill-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? 'All Events' : cat}
            </button>
          ))}
        </div>

        {/* Slider Controls Bar */}
        <div className="events-slider-controls">
          <div className="events-slider-left-controls">
            <button
              type="button"
              className="see-previous-btn"
              onClick={() => setShowPastEvents(prev => !prev)}
              title="Toggle between upcoming and completed events"
            >
              {showPastEvents ? '← See upcoming events 🚀' : '← See previous events 🕒'}
            </button>

            {viewMode === 'slider' && (
              <div className="slider-nav-arrows">
                <button
                  type="button"
                  className="slider-nav-btn"
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                  aria-label="Previous event slide"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="slider-nav-btn"
                  onClick={nextSlide}
                  disabled={currentIndex >= displayEvents.length - 1}
                  aria-label="Next event slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {viewMode === 'slider' && displayEvents.length > 0 && (
              <span className="slider-counter-badge">
                {currentIndex + 1} of {displayEvents.length}
              </span>
            )}

            {/* Toggle View Mode: Slider vs Grid */}
            <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                style={{
                  background: viewMode === 'slider' ? '#0284c7' : 'transparent',
                  color: viewMode === 'slider' ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Slider View"
              >
                <SlidersHorizontal size={13} />
                Slide
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#0284c7' : 'transparent',
                  color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Grid View"
              >
                <LayoutGrid size={13} />
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* SLIDER VIEW MODE */}
        {viewMode === 'slider' ? (
          <div>
            <div
              className="events-slider-stage"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="events-slider-track"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {displayEvents.map((evt) => (
                  <div key={evt.id} className="events-slider-slide">
                    <div className="events-slider-card">
                      <div className="events-slider-poster-wrap">
                        <img
                          src={evt.assetImage}
                          alt={evt.title}
                          className="events-slider-poster"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              evt.fallbackImage ||
                              'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <span className="event-tag">{evt.category}</span>
                      </div>

                      <div className="events-slider-body">
                        <div className="events-slider-date">
                          <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                          {evt.date} • {evt.status}
                        </div>

                        <h3 className="events-slider-title">{evt.title}</h3>
                        <p className="events-slider-desc">{evt.description}</p>

                        <div className="events-slider-divider" />

                        <div className="events-slider-footer">
                          <span className="events-slider-location">
                            <MapPin size={15} style={{ color: '#0284c7' }} />
                            {evt.location}
                          </span>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '0.45rem 1.15rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                            onClick={() => handleDetailsClick(evt)}
                          >
                            View Details
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {displayEvents.length > 1 && (
              <div className="events-slider-dots">
                {displayEvents.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`events-slider-dot ${currentIndex === idx ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* GRID VIEW MODE */
          <div className="events-grid">
            {displayEvents.map(evt => (
              <div key={evt.id} className="glass-card event-card">
                <div className="event-poster-wrapper">
                  <img
                    src={evt.assetImage}
                    alt={evt.title}
                    className="event-poster"
                    loading="lazy"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = evt.fallbackImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <span className="event-tag">{evt.category}</span>
                </div>

                <div className="event-body">
                  <div className="event-date">
                    <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {evt.date} • {evt.status}
                  </div>

                  <h3 className="event-title">{evt.title}</h3>
                  <p className="event-desc">{evt.description}</p>

                  <div className="event-footer">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} />
                      {evt.location}
                    </span>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => handleDetailsClick(evt)}
                    >
                      View Details
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
