import React from 'react';

export const IncubationSection: React.FC = () => {
  return (
    <section id="incubation" className="incubation-section">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Startup Support</span>
          <h2 className="section-title">
            Incubation & <span className="gradient-text">Prototyping Hub</span>
          </h2>
          <p className="section-desc">
            We offer end-to-end incubation facilities to turn student concepts into scalable companies.
          </p>
        </div>

        <div className="incubation-grid">
          <div className="glass-card inc-card">
            <div className="inc-icon">⚡</div>
            <h3>Pre-Seed Grants</h3>
            <p>Financial grants up to ₹2 Lakhs for student startups to develop working prototypes and validate initial market traction.</p>
          </div>

          <div className="glass-card inc-card">
            <div className="inc-icon">🔬</div>
            <h3>IoT & Maker Space</h3>
            <p>Dedicated workstation equipment, microcontrollers, sensors, 3D printers, and high-speed internet infrastructure.</p>
          </div>

          <div className="glass-card inc-card">
            <div className="inc-icon">⚖️</div>
            <h3>IPR & Patent Desk</h3>
            <p>Legal guidance for intellectual property registration, trademark filing, and technology transfer agreements.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
