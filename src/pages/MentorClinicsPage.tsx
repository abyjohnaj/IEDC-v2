import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Calendar, Clock, MapPin, Video, CheckCircle2,
  AlertCircle, BookOpen, User as UserIcon, X, Plus, ExternalLink, ShieldCheck
} from 'lucide-react';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { mentorClinicService } from '../services/mentorClinicService';
import { ideaBoxService } from '../services/ideaBoxService';
import { authService, openAuthModal } from '../services/authService';
import { Mentor, MentorClinicSlot, MentorClinicBooking, IdeaBoxSubmission, ClinicType } from '../types';

export const MentorClinicsPage: React.FC = () => {
  const [mentors, setMentors] = useState<Array<Mentor & { slots: MentorClinicSlot[] }>>([]);
  const [userBookings, setUserBookings] = useState<MentorClinicBooking[]>([]);
  const [userIdeas, setUserIdeas] = useState<IdeaBoxSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'slots' | 'my_bookings'>('slots');
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [selectedSlot, setSelectedSlot] = useState<MentorClinicSlot | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [agenda, setAgenda] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const mentorsData = await mentorClinicService.fetchMentorsWithSlots();
      setMentors(mentorsData);

      if (currentUser) {
        const [bookings, ideas] = await Promise.all([
          mentorClinicService.fetchUserBookings(currentUser.id),
          ideaBoxService.getAllIdeas()
        ]);
        setUserBookings(bookings);
        // Filter user ideas
        setUserIdeas(ideas.filter((i: IdeaBoxSubmission) => i.authorId === currentUser.id));
      }
    } catch (err) {
      console.warn('Error loading mentor clinic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (slot: MentorClinicSlot) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    setSelectedSlot(slot);
    setAgenda('');
    setSelectedIdeaId(userIdeas[0]?.id || '');
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!agenda.trim() || agenda.trim().length < 5) {
      alert('Please describe your session agenda or questions in detail.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await mentorClinicService.bookClinicSlot(
        selectedSlot.id,
        agenda,
        selectedIdeaId || undefined
      );

      if (res.success) {
        setBookingSuccess(true);
        // Refresh data
        setTimeout(() => {
          setSelectedSlot(null);
          loadData();
          setActiveTab('my_bookings');
        }, 1200);
      } else {
        alert('Booking failed: ' + (res.error || 'Slot no longer available'));
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const getClinicBadgeColor = (type: ClinicType) => {
    switch (type) {
      case 'Pitch Review': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
      case 'Technical Architecture': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'Patent & IP': return { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' };
      case 'Incubation & Grants': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      default: return { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' };
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2rem 1rem 4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            marginBottom: '2.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ maxWidth: '750px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                <GraduationCap size={16} />
                <span>Stage 6 of the Innovation Journey</span>
              </div>
              <h1 style={{ margin: '0 0 0.75rem 0', fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main, #fff)', lineHeight: 1.2 }}>
                Mentor Clinics & <span style={{ color: '#818cf8' }}>Office Hours</span>
              </h1>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.6 }}>
                Book dedicated 1-on-1 clinic slots with BMCE department faculty nodal officers and industry alumni mentors. Get structured feedback on your system architecture, pitch deck, patent search, and KSUM grant readiness.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('slots')}
              style={{
                background: activeTab === 'slots' ? '#6366f1' : 'transparent',
                color: activeTab === 'slots' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={16} />
              Available Clinic Hours
            </button>

            <button
              type="button"
              onClick={() => {
                if (!currentUser) openAuthModal('login');
                else setActiveTab('my_bookings');
              }}
              style={{
                background: activeTab === 'my_bookings' ? '#6366f1' : 'transparent',
                color: activeTab === 'my_bookings' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 size={16} />
              My Bookings ({userBookings.length})
            </button>
          </div>

          {/* Content Area */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
              Loading mentors & clinic schedules...
            </div>
          ) : activeTab === 'slots' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {mentors.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--card-bg, #1a1f2c)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {/* Mentor Header */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <img
                      src={m.avatar}
                      alt={m.fullName}
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99, 102, 241, 0.4)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main, #fff)' }}>
                          {m.fullName}
                        </h3>
                        <span style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem'
                        }}>
                          Verified Mentor
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0' }}>
                        {m.designation} • {m.organization}
                      </div>
                      <p style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {m.bio}
                      </p>

                      {/* Expertise Pills */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {m.expertise.map((exp, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.72rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-main, #e2e8f0)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Available Clinic Slots */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 600 }}>
                      Upcoming Office Hours:
                    </h4>

                    {m.slots.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No open clinic slots scheduled right now. Check back soon or request a custom review.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {m.slots.map((s) => {
                          const badge = getClinicBadgeColor(s.clinicType);
                          const startTime = new Date(s.startTime);

                          return (
                            <div
                              key={s.id}
                              style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '12px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '0.75rem'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span style={{
                                    background: badge.bg,
                                    color: badge.color,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    padding: '0.2rem 0.45rem'
                                  }}>
                                    {s.clinicType}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                                    Open Slot
                                  </span>
                                </div>

                                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main, #fff)', marginBottom: '0.5rem' }}>
                                  {s.title}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Clock size={13} color="#f59e0b" />
                                    <span>{startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <MapPin size={13} color="#06b6d4" />
                                    <span>{s.location}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleOpenBooking(s)}
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.8rem',
                                  padding: '0.45rem 0.85rem',
                                  width: '100%',
                                  marginTop: '0.5rem'
                                }}
                              >
                                Book Clinic Slot
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* My Bookings Tab */
            <div>
              {userBookings.length === 0 ? (
                <div style={{
                  background: 'var(--card-bg, #1a1f2c)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Calendar size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)' }}>No booked clinic sessions</h3>
                  <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
                    Browse available clinic hours to receive guidance on your prototype, pitch deck, or patent application.
                  </p>
                  <button onClick={() => setActiveTab('slots')} className="btn btn-primary">
                    View Available Slots
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                  {userBookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: 'var(--card-bg, #1a1f2c)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '4px',
                            padding: '0.2rem 0.5rem',
                            textTransform: 'uppercase'
                          }}>
                            {b.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Booked on {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main, #fff)' }}>
                          {b.slot?.title || 'Mentorship Session'}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                          Mentor: <strong>{b.slot?.mentorName || 'Faculty Nodal Officer'}</strong>
                        </div>

                        {b.slot?.startTime && (
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            marginBottom: '1rem',
                            color: 'var(--text-muted)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                              <Clock size={14} color="#f59e0b" />
                              <span>{new Date(b.slot.startTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <MapPin size={14} color="#06b6d4" />
                              <span>{b.slot.location}</span>
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                          <strong style={{ color: 'var(--text-main, #fff)', display: 'block', marginBottom: '0.25rem' }}>Your Agenda:</strong>
                          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.45 }}>{b.agenda}</p>
                        </div>

                        {b.actionItems && b.actionItems.length > 0 && (
                          <div style={{
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                            <strong style={{ fontSize: '0.78rem', color: '#818cf8', display: 'block', marginBottom: '0.35rem' }}>
                              Mentor Action Items:
                            </strong>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {b.actionItems.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '0.2rem' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {b.slot?.meetingLink && (
                        <a
                          href={b.slot.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.82rem',
                            padding: '0.5rem'
                          }}
                        >
                          <Video size={15} />
                          Join Clinic Video Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #1a1f2c)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedSlot(null)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)', fontSize: '1.3rem' }}>
                  Clinic Slot Confirmed!
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  A calendar invite and in-app notification have been sent to you and the mentor.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)', fontSize: '1.3rem' }}>
                  Confirm Clinic Booking
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  With <strong>{selectedSlot.mentorName}</strong> ({selectedSlot.clinicType})
                </p>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <Clock size={14} color="#f59e0b" />
                    <span>{new Date(selectedSlot.startTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="#06b6d4" />
                    <span>{selectedSlot.location}</span>
                  </div>
                </div>

                <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {userIdeas.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                        Associate with Startup Idea (Optional)
                      </label>
                      <select
                        value={selectedIdeaId}
                        onChange={(e) => setSelectedIdeaId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.88rem'
                        }}
                      >
                        <option value="">General Project / No Idea Attached</option>
                        {userIdeas.map(i => (
                          <option key={i.id} value={i.id} style={{ background: '#1e293b' }}>{i.title} ({i.stage})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                      Agenda & Questions for the Mentor *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Specify the technical challenges, architecture questions, or pitch deck slides you want to review..."
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.88rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(null)}
                      className="btn btn-secondary"
                      style={{ padding: '0.6rem 1.25rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="btn btn-primary"
                      style={{ padding: '0.6rem 1.5rem' }}
                    >
                      {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
