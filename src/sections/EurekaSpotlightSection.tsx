import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink, Sparkles } from 'lucide-react';

export const EurekaSpotlightSection: React.FC = () => {
  return (
    <section id="eureka" className="eureka-section">
      <div className="container">
        <div className="eureka-box">
          <div>
            <span className="eureka-badge">Official Digital Publication</span>
            <h2 className="eureka-title">
              Eureka <span className="gradient-text">– The Official IEDC Newsletter</span>
            </h2>
            <p className="eureka-desc">
              Eureka is the recurring publication of IEDC BMCE, designed to keep our community inspired and connected. Each edition captures student startup stories, technology highlights, and campus innovation milestones.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/newsletter" className="btn btn-amber">
                <BookOpen size={18} />
                Explore 3D Newsletter Library Shelf
              </Link>
              <a
                href="https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={18} />
                Open Latest PDF Edition
              </a>
            </div>
          </div>

          <div className="eureka-preview-card">
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📰</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }} className="gradient-text">
              Eureka Interactive 3D Shelf
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Access all past and current monthly issues in our 3D rotating cylinder shelf and page-folding magazine viewer.
            </p>
            <Link to="/newsletter" className="btn btn-primary" style={{ padding: '0.55rem 1.4rem', fontSize: '0.88rem' }}>
              <Sparkles size={16} /> Enter 3D Library Shelf →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
