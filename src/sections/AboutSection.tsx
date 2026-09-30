import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Fostering Excellence</span>
          <h2 className="section-title">
            About <span className="gradient-text">IEDC BMCE</span>
          </h2>
          <p className="section-desc">
            Located at Baselios Mathews II College of Engineering, Sasthamcotta, Kollam, IEDC creates an ecosystem where engineering curiosity meets market execution.
          </p>
        </div>

        <div className="pillars-grid">
          <div className="glass-card pillar-card">
            <div className="pillar-icon">💡</div>
            <h3>Ideation & Research</h3>
            <p>Structured design thinking sessions and ideation hackathons to help students solve real-world industry problems.</p>
          </div>

          <div className="glass-card pillar-card">
            <div className="pillar-icon">🛠️</div>
            <h3>Prototyping Lab</h3>
            <p>Access to modern IoT hardware, 3D printing equipment, and maker spaces to build Functional Minimum Viable Products (MVPs).</p>
          </div>

          <div className="glass-card pillar-card">
            <div className="pillar-icon">🚀</div>
            <h3>Pre-Incubation Support</h3>
            <p>Mentorship from successful startup founders, patent filing guidance, and seed funding support via Kerala Startup Mission (KSUM).</p>
          </div>

          <div className="glass-card pillar-card">
            <div className="pillar-icon">🌐</div>
            <h3>Industry Connections</h3>
            <p>Networking sessions with angel investors, corporate leaders, legal advisors, and technology evangelists.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
