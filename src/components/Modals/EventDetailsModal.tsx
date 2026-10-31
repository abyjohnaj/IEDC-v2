import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ArrowUpRight,
  CheckCircle,
  FileText,
  Trophy,
  Users,
  Phone
} from 'lucide-react';
import { EventItem } from '../../types';

interface EventDetailsModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  onRegisterClick?: (eventName: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  event,
  onClose,
  onRegisterClick
}) => {
  if (!isOpen || !event) return null;

  const isCompleted = event.status === 'Completed';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          background: '#ffffff',
          color: '#0f172a'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner Poster Header */}
        <div style={{ position: 'relative', width: '100%', height: '220px', background: '#0b1120' }}>
          <img
            src={event.assetImage}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = event.fallbackImage;
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%)'
            }}
          />

          {/* Floating Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0, 0, 0, 0.65)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              transition: 'transform 0.2s, background 0.2s'
            }}
          >
            <X size={18} />
          </button>

          {/* Badges on Banner */}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(0, 242, 254, 0.9)',
                color: '#0a0f1d',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {event.category}
            </span>

            <span
              style={{
                background: isCompleted ? 'rgba(100, 116, 139, 0.85)' : 'rgba(16, 185, 129, 0.9)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              {isCompleted ? '✓ Completed Event' : '● Upcoming Event'}
            </span>
          </div>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '1.75rem', maxHeight: 'calc(85vh - 280px)', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.6rem 0', color: '#0f172a', lineHeight: 1.3 }}>
            {event.title}
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
            {event.description}
          </p>

          {/* Event Quick Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}
          >
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <Calendar size={13} color="#0284c7" /> Date
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {event.date}
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <Clock size={13} color="#0284c7" /> Schedule
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {event.time || 'Schedule on pass'}
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <MapPin size={13} color="#0284c7" /> Venue
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {event.location}
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <Ticket size={13} color="#0284c7" /> Entry / Pass
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {event.entryFee || 'Free Entry'}
              </div>
            </div>
          </div>

          {/* Detailed Agenda / Overview Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              <FileText size={16} color="#0284c7" />
              <span>Event Overview & Highlights</span>
            </div>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem',
                fontSize: '0.88rem',
                color: '#334155',
                lineHeight: 1.65,
                whiteSpace: 'pre-line'
              }}
            >
              {event.details || event.description}
            </div>
          </div>

          {/* Sub-Events List (e.g. for MegaFests / Hackathons) */}
          {event.subEvents && event.subEvents.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>
                <Trophy size={16} color="#d97706" />
                <span>Featured Competitions & Sub-Events ({event.subEvents.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {event.subEvents.map(sub => (
                  <div
                    key={sub.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{sub.title}</span>
                      {sub.prizePool && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(217, 119, 6, 0.1)', color: '#b45309', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          Prize: {sub.prizePool}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{sub.description}</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {sub.venue && <span>📍 {sub.venue}</span>}
                      {sub.teamSize && <span><Users size={12} style={{ display: 'inline', marginRight: 2 }} /> {sub.teamSize}</span>}
                      {sub.coordinator && <span><Phone size={12} style={{ display: 'inline', marginRight: 2 }} /> {sub.coordinator.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            padding: '1.1rem 1.75rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.8rem'
          }}
        >
          {isCompleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Event concluded • Archive mode</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Reserve your seat before spots fill up.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {event.festPortalSlug && (
              <Link
                to={`/fest/${event.festPortalSlug}`}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                Fest Portal
                <ArrowUpRight size={14} />
              </Link>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={onClose}
            >
              Close
            </button>

            {!isCompleted && onRegisterClick && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                onClick={() => {
                  onClose();
                  onRegisterClick(event.title);
                }}
              >
                <Ticket size={15} />
                Register Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
