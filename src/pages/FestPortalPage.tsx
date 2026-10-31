import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy, 
  Users, 
  ArrowLeft, 
  Flame, 
  ExternalLink, 
  CheckCircle2, 
  Gamepad2, 
  Film, 
  Radio, 
  Music, 
  Share2, 
  Phone,
  Ticket
} from 'lucide-react';
import { initialEventsData } from '../data/eventsData';
import { authService, openAuthModal } from '../services/authService';
import { FestSubEvent, User } from '../types';
import '../styles/festPortal.css';

export const FestPortalPage: React.FC = () => {
  const { festId } = useParams<{ festId?: string }>();
  const navigate = useNavigate();

  // Find the fest item
  const fest = initialEventsData.find(e => 
    e.isMegaFest && (e.festPortalSlug === festId || e.id === festId)
  ) || initialEventsData.find(e => e.isMegaFest) || initialEventsData[0];

  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [registeredSubEvents, setRegisteredSubEvents] = useState<string[]>([]);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 178,
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  useEffect(() => {
    const unsub = authService.onAuthStateChange(u => {
      setUser(u);
      if (u) {
        setRegisteredSubEvents(u.registeredEvents || []);
      }
    });

    if (user) {
      setRegisteredSubEvents(user.registeredEvents || []);
    }

    // Dynamic countdown timer targeting October 16, 2026
    const targetDate = new Date('2026-10-16T09:00:00+05:30').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRegisterSubEvent = async (sub: FestSubEvent) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }

    const currentRegs = user.registeredEvents || [];
    const eventKey = `${fest.id}:${sub.id}`;

    if (currentRegs.includes(eventKey) || currentRegs.includes(sub.id)) {
      showToast(`You already hold an active pass for ${sub.title}! Check your profile.`);
      return;
    }

    const updatedEvents = [...currentRegs, sub.id, fest.id];
    try {
      const updatedUser = await authService.updateProfile(user.id, {
        registeredEvents: Array.from(new Set(updatedEvents))
      });
      setUser(updatedUser);
      setRegisteredSubEvents(updatedUser.registeredEvents);
      showToast(`🎟️ Pass Confirmed for ${sub.title}! Added to your My Events tab.`);
    } catch (e) {
      showToast(`Pass reserved for ${sub.title}!`);
    }
  };

  const handleClaimAllAccessPass = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const currentRegs = user.registeredEvents || [];
    if (currentRegs.includes(fest.id)) {
      showToast(`You already have an All-Access Pass for ${fest.title}!`);
      navigate('/profile?tab=events');
      return;
    }

    const updatedEvents = Array.from(new Set([...currentRegs, fest.id]));
    try {
      const updatedUser = await authService.updateProfile(user.id, {
        registeredEvents: updatedEvents
      });
      setUser(updatedUser);
      setRegisteredSubEvents(updatedUser.registeredEvents);
      showToast(`🎉 Congratulations! Your ${fest.title} All-Access Pass is activated.`);
    } catch (e) {
      showToast(`All-Access Pass reserved!`);
    }
  };

  const subEventsList = fest.subEvents || [];
  const categories = ['All', 'Hackathon', 'Gaming', 'Ideathon', 'MovieShow', 'PanelDiscussion', 'ProShow'];

  const filteredSubEvents = activeCategory === 'All'
    ? subEventsList
    : subEventsList.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase());

  const isMainFestRegistered = user && (user.registeredEvents || []).includes(fest.id);

  return (
    <div className="fest-page">
      {/* Visual Ambient Glows */}
      <div className="fest-glow-orb-1" />
      <div className="fest-glow-orb-2" />
      <div className="fest-glow-orb-3" />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.9rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 9999,
          border: '1px solid rgba(56, 189, 248, 0.4)'
        }}>
          <CheckCircle2 size={18} style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* FESTIVAL STANDALONE NAVBAR */}
      <header className="fest-navbar">
        <div className="fest-nav-container">
          <Link to={`/fest/${fest.festPortalSlug || 'ekah-2026'}`} className="fest-brand">
            <span className="fest-logo-badge">
              <Sparkles size={20} />
              EKAH '26
            </span>
            <span className="fest-brand-sub">The Techno-Cultural Odyssey</span>
          </Link>

          <nav>
            <ul className="fest-nav-links">
              <li><a href="#sub-events" className="fest-nav-link">Sub-Events</a></li>
              <li><a href="#schedule" className="fest-nav-link">Festival Schedule</a></li>
              <li><Link to="/hackathons" className="fest-nav-link" style={{ color: '#f87171' }}>⚡ Hackathon Arena</Link></li>
              <li><a href="#passes" className="fest-nav-link">Passes & Pricing</a></li>
            </ul>
          </nav>

          <div className="fest-nav-actions">
            {user ? (
              <Link to="/profile?tab=events" className="fest-btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                <Ticket size={14} /> My Event Passes
              </Link>
            ) : (
              <button 
                type="button" 
                className="fest-btn-primary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                onClick={() => openAuthModal('signup')}
              >
                Sign In / Register
              </button>
            )}

            <Link to="/" className="fest-back-btn" title="Return to Main IEDC BMCE Platform">
              <ArrowLeft size={14} /> Back to IEDC Main
            </Link>
          </div>
        </div>
      </header>

      {/* FESTIVAL HERO */}
      <section className="fest-hero">
        <div className="fest-hero-pill">
          <Sparkles size={14} /> Baselios Mathews II College of Engineering • Flagship 2026
        </div>

        <h1 className="fest-hero-title">
          THE TECHNO-CULTURAL <br />
          <span className="fest-gradient-text">ODYSSEY OF CENTRAL KERALA</span>
        </h1>

        <p className="fest-hero-desc">
          3 Days of adrenaline-charged hackathons, high-stakes pitch battles, LAN gaming championships, 
          starlit tech screenings, and unforgettable pro-shows. Join 2,000+ innovators across Kerala!
        </p>

        {/* Live Festival Countdown */}
        <div className="fest-countdown-container">
          <div className="fest-countdown-box">
            <span className="fest-countdown-num">{timeLeft.days}</span>
            <span className="fest-countdown-lbl">Days</span>
          </div>
          <div className="fest-countdown-box">
            <span className="fest-countdown-num">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="fest-countdown-lbl">Hours</span>
          </div>
          <div className="fest-countdown-box">
            <span className="fest-countdown-num">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="fest-countdown-lbl">Mins</span>
          </div>
          <div className="fest-countdown-box">
            <span className="fest-countdown-num">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="fest-countdown-lbl">Secs</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="fest-btn-primary"
            onClick={handleClaimAllAccessPass}
          >
            <Ticket size={18} />
            {isMainFestRegistered ? '✅ All-Access Pass Active (View in Profile)' : 'Claim All-Access Fest Pass'}
          </button>

          <a href="#sub-events" className="fest-btn-secondary">
            Explore 15+ Sub-Events
          </a>
        </div>

        {/* Fest Fast Stats */}
        <div className="fest-stats-grid">
          <div className="fest-stat-card">
            <div className="fest-stat-val">₹1,50,000+</div>
            <div className="fest-stat-lbl">Total Cash Prizes & Seed Grants</div>
          </div>
          <div className="fest-stat-card">
            <div className="fest-stat-val">15+</div>
            <div className="fest-stat-lbl">Competitive Sub-Events</div>
          </div>
          <div className="fest-stat-card">
            <div className="fest-stat-val">36 Hours</div>
            <div className="fest-stat-lbl">Flagship Hardware & AI Hackathon</div>
          </div>
          <div className="fest-stat-card">
            <div className="fest-stat-val">30+</div>
            <div className="fest-stat-lbl">Colleges & Campuses Participating</div>
          </div>
        </div>
      </section>

      {/* SUB-EVENTS SECTION */}
      <section id="sub-events" className="fest-section">
        <div className="fest-section-header">
          <span className="fest-section-tag">Explore The Arena</span>
          <h2 className="fest-section-title">Official EKAH '26 Sub-Events</h2>
          <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0.5rem auto 0' }}>
            Choose your battleground. From 36-hour code sprints to high-octane esports and celebrity debates.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="fest-filters">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              className={`fest-filter-btn ${activeCategory === c ? 'active' : ''}`}
              onClick={() => setActiveCategory(c)}
            >
              {c === 'All' ? 'All Sub-Events' :
               c === 'Hackathon' ? '💻 Hackathons' :
               c === 'Gaming' ? '🎮 Gaming Arenas' :
               c === 'Ideathon' ? '💡 Ideathons' :
               c === 'MovieShow' ? '🎬 Movie Night' :
               c === 'PanelDiscussion' ? '🎙️ Talks & Panels' :
               '🎭 Pro-Shows'}
            </button>
          ))}
        </div>

        {/* Sub-Events Cards Grid */}
        <div className="fest-subevents-grid">
          {filteredSubEvents.map(sub => {
            const isSubRegistered = registeredSubEvents.includes(sub.id);

            return (
              <div key={sub.id} className="fest-subevent-card">
                <div>
                  <div className="fest-subevent-top">
                    <span className={`fest-subevent-badge ${sub.category}`}>
                      {sub.category}
                    </span>

                    {sub.prizePool && (
                      <span className="fest-prize-chip">
                        <Trophy size={14} /> {sub.prizePool}
                      </span>
                    )}
                  </div>

                  <h3 className="fest-subevent-title">{sub.title}</h3>
                  <p className="fest-subevent-desc">{sub.description}</p>

                  <div className="fest-meta-list">
                    <div className="fest-meta-row">
                      <Calendar size={14} style={{ color: '#38bdf8' }} />
                      <span>{sub.date} • {sub.time}</span>
                    </div>
                    <div className="fest-meta-row">
                      <MapPin size={14} style={{ color: '#a855f7' }} />
                      <span>{sub.venue}</span>
                    </div>
                    {sub.teamSize && (
                      <div className="fest-meta-row">
                        <Users size={14} style={{ color: '#f59e0b' }} />
                        <span>Team Size: {sub.teamSize}</span>
                      </div>
                    )}
                    {sub.coordinator && (
                      <div className="fest-meta-row" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        <Phone size={12} />
                        <span>Lead: {sub.coordinator.name} ({sub.coordinator.phone})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fest-subevent-actions">
                  {sub.isHackathon ? (
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <button
                        type="button"
                        className="fest-btn-primary"
                        style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleRegisterSubEvent(sub)}
                      >
                        {isSubRegistered ? '✅ Pass Active' : 'Register Pass'}
                      </button>
                      <Link 
                        to="/hackathons" 
                        className="fest-btn-secondary"
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                        title="Open Live Hackathon Arena"
                      >
                        <Flame size={15} style={{ color: '#f87171' }} /> Squad
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={isSubRegistered ? 'fest-btn-secondary' : 'fest-btn-primary'}
                      style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.88rem' }}
                      onClick={() => handleRegisterSubEvent(sub)}
                    >
                      {isSubRegistered ? '✅ Pass Confirmed (In My Events)' : 'Claim Pass / Register'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SCHEDULE TIMELINE */}
      <section id="schedule" className="fest-section">
        <div className="fest-section-header">
          <span className="fest-section-tag">Festival Itinerary</span>
          <h2 className="fest-section-title">Day-by-Day Timeline</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Never miss a keynote, hackathon checkpoint, or LAN gaming bracket match.
          </p>
        </div>

        {/* Day Selector */}
        <div className="fest-timeline-nav">
          <button
            type="button"
            className={`fest-timeline-tab ${selectedDay === 1 ? 'active' : ''}`}
            onClick={() => setSelectedDay(1)}
          >
            <div className="fest-timeline-tab-day">Day 01 • Oct 16</div>
            <div className="fest-timeline-tab-title">Inception & Talks</div>
          </button>
          <button
            type="button"
            className={`fest-timeline-tab ${selectedDay === 2 ? 'active' : ''}`}
            onClick={() => setSelectedDay(2)}
          >
            <div className="fest-timeline-tab-day">Day 02 • Oct 17</div>
            <div className="fest-timeline-tab-title">Sprint & Gaming Arena</div>
          </button>
          <button
            type="button"
            className={`fest-timeline-tab ${selectedDay === 3 ? 'active' : ''}`}
            onClick={() => setSelectedDay(3)}
          >
            <div className="fest-timeline-tab-day">Day 03 • Oct 18</div>
            <div className="fest-timeline-tab-title">Pitch Finals & ProShow</div>
          </button>
        </div>

        {/* Timeline Items */}
        <div className="fest-timeline-cards">
          {selectedDay === 1 && (
            <>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">09:30 AM</div>
                <div className="fest-timeline-content">
                  <h4>Grand Inauguration Ceremony</h4>
                  <p>Inaugural keynote with distinguished dignitaries, nodal officers, and BMCE management. Main Auditorium.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">10:00 AM</div>
                <div className="fest-timeline-content">
                  <h4>HackBMCE 36H Sprint Kickoff</h4>
                  <p>Problem statements released! 60+ squads begin rapid coding and IoT hardware assembly. Maker Lab.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">11:30 AM</div>
                <div className="fest-timeline-content">
                  <h4>Founders Unplugged Panel Debate</h4>
                  <p>Fireside debate on seed grant strategies with KSUM catalysts and alumni startup founders. Seminar Hall 1.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">07:30 PM</div>
                <div className="fest-timeline-content">
                  <h4>CineWave: Open-Air Tech Film Night</h4>
                  <p>Starlit screening of tech documentaries and student short films under the night sky. Amphitheatre.</p>
                </div>
              </div>
            </>
          )}

          {selectedDay === 2 && (
            <>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">10:00 AM</div>
                <div className="fest-timeline-content">
                  <h4>Hackathon Mentor Review Checkpoint #1</h4>
                  <p>Industry evaluators conduct 1-on-1 code reviews and feasibility checks for all active teams.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">11:00 AM</div>
                <div className="fest-timeline-content">
                  <h4>Apex Arena: LAN Gaming Championship</h4>
                  <p>Valorant 5v5 knockouts and BGMI battle royale playoffs with live casters. Computer Lab 4.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">02:00 PM</div>
                <div className="fest-timeline-content">
                  <h4>InnovateX Pre-Seed Ideathon</h4>
                  <p>Student innovators pitch non-hackathon ventures for pre-seed prototyping grants. Seminar Hall 2.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">03:30 PM</div>
                <div className="fest-timeline-content">
                  <h4>RoboWars 15kg Combat Derby</h4>
                  <p>Heavyweight combat robots clash in a double-elimination tournament. Central Courtyard Arena.</p>
                </div>
              </div>
            </>
          )}

          {selectedDay === 3 && (
            <>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">10:00 AM</div>
                <div className="fest-timeline-content">
                  <h4>HackBMCE Code Freeze & Jury Demos</h4>
                  <p>Final project submission cutoff. Top 10 shortlisted squads pitch on stage to jury. Main Auditorium.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">03:00 PM</div>
                <div className="fest-timeline-content">
                  <h4>Grand Valedictory & Awards Ceremony</h4>
                  <p>Distribution of ₹1.5L cash prizes, trophies, incubation offers, and KTU activity point certificates.</p>
                </div>
              </div>
              <div className="fest-timeline-item">
                <div className="fest-timeline-time">06:30 PM</div>
                <div className="fest-timeline-content">
                  <h4>Starlit EDM & Fusion Band ProShow</h4>
                  <p>Celebrity live music performances, DJ sets, and visual stage show. Main Festival Grounds.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* FESTIVAL FOOTER */}
      <footer className="fest-footer">
        <div className="fest-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <Sparkles size={20} style={{ color: '#38bdf8' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.25rem' }}>
              EKAH '26 FESTIVAL PORTAL
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Hosted & Powered by Innovation & Entrepreneurship Development Centre (IEDC)<br />
            Baselios Mathews II College of Engineering, Sasthamcotta, Kollam, Kerala.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.84rem' }}>
              IEDC BMCE Home
            </Link>
            <Link to="/hackathons" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.84rem' }}>
              Hackathon Arena
            </Link>
            <Link to="/profile?tab=events" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.84rem' }}>
              My Registered Events
            </Link>
            <Link to="/ideabox" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.84rem' }}>
              IdeaBox Incubation
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
