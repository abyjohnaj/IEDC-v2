import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Instagram, Linkedin, MessageSquare, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand & Address */}
          <div className="footer-brand">
            <div className="logo-brand">
              <img src="/assets/iedc_brand_logo.png" alt="IEDC Logo" className="logo-img" />
              <div>
                <span className="brand-name">
                  IEDC <span style={{ color: 'var(--accent-cyan)' }}>BMCE</span>
                </span>
                <span className="brand-sub">Baselios Mathews II College of Engineering</span>
              </div>
            </div>
            <p>
              Innovation & Entrepreneurship Development Centre (IEDC), Baselios Mathews II College of Engineering, Lake View, Muthupilakkadu, Sasthamcotta, Kollam – 690520.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/#about">About IEDC</a></li>
              <li><a href="/#events">Upcoming Events</a></li>
              <li><a href="/#execom">Executive Committee</a></li>
              <li><Link to="/newsletter">📚 IEDC BMCE Library</Link></li>
              <li><a href="/#forum">Community Forum</a></li>
              <li><a href="/#incubation">Incubation Hub</a></li>
              <li>
                <Link to="/admin" style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} /> Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Network */}
          <div className="footer-col">
            <h4>Social Network</h4>
            <ul className="footer-links">
              <li>
                <a href="https://www.instagram.com/iedc.bmce" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Instagram size={14} /> Instagram (@iedc.bmce)
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/company/iedc-bmce/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Linkedin size={14} /> LinkedIn Page
                </a>
              </li>
              <li>
                <a href="https://whatsapp.com/channel/0029Vb6yfNNI7BeJhuSzYL1y" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={14} /> WhatsApp Channel
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col">
            <h4>Get in Touch</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={16} style={{ color: 'var(--accent-cyan)' }} />
              <a href="mailto:iedciicbmce@gmail.com" style={{ color: 'var(--accent-cyan)' }}>
                iedciicbmce@gmail.com
              </a>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <MapPin size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 2 }} />
              Sasthamcotta, Kollam, Kerala – 690520
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; 2026 IEDC BMCE | All Rights Reserved. Innovation & Entrepreneurship Development Centre.
        </div>
      </div>
    </footer>
  );
};
