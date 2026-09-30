import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../services/supabaseClient';
import { initialEventsData } from '../data/eventsData';
import { EventItem } from '../types';
import { Calendar, MapPin, ArrowUpRight } from 'lucide-react';

interface EventsSectionProps {
  onOpenRegistration: (eventName: string) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ onOpenRegistration }) => {
  const [events, setEvents] = useState<EventItem[]>(initialEventsData);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', 'Workshops', 'Bootcamps', 'Fests', 'Orientation'];

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

  const filteredEvents = activeCategory === 'All'
    ? events
    : events.filter(e => e.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <section id="events" className="events-section">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Stay Inspired & Learn</span>
          <h2 className="section-title">
            Explore <span className="gradient-text">Events & Bootcamps</span>
          </h2>
          <p className="section-desc">
            Explore our past and upcoming workshops, boot camps, techno-cultural fests, and legal awareness modules.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="filter-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? 'All Events' : cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.map(evt => (
            <div key={evt.id} className="glass-card event-card">
              <div className="event-poster-wrapper">
                <img
                  src={evt.assetImage}
                  alt={evt.title}
                  className="event-poster"
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
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => onOpenRegistration(evt.title)}
                  >
                    {evt.status === 'Upcoming' ? 'Register Now' : 'Details'}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
