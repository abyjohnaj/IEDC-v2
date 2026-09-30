import React from 'react';
import { HeroContent } from './HeroContent';
import { HeroDoodleContainer } from './HeroDoodleContainer';
import { PaperRocketsStage } from './PaperRocketsStage';

export const Hero: React.FC = () => {
  return (
    <section id="home" className="hero notebook-hero">
      {/* Paper Rockets Flight Canvas */}
      <PaperRocketsStage />

      {/* Atmospheric Soft Watercolor Wash Accents */}
      <div className="hero-glow-1" />
      <div className="hero-glow-2" />

      {/* Notebook Top Log Bar */}
      <div className="container notebook-top-container">
        <div className="notebook-header-bar">
          <div className="notebook-header-item">
            <span className="notebook-header-label">NOTEBOOK //</span>
            <span className="notebook-header-val">IEDC BMCE INNOVATION LOGBOOK</span>
          </div>
          <div className="notebook-header-item">
            <span className="notebook-header-label">EDITION //</span>
            <span className="notebook-header-val">VOL. 2026 // NO. 01</span>
          </div>
          <div className="notebook-header-item notebook-header-status">
            <span className="notebook-header-label">STATUS //</span>
            <span className="notebook-header-val status-live">● INCUBATION IN PROGRESS</span>
          </div>
        </div>
      </div>

      <div className="container hero-grid">
        {/* Left Column: Heading, Copy, CTA, Stats */}
        <HeroContent />

        {/* Right Column: Hand-Drawn Articulated Short Film Canvas */}
        <HeroDoodleContainer />
      </div>
    </section>
  );
};
