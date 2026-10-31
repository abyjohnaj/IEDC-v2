import React from 'react';
import { HeroContent } from './HeroContent';
import { PaperRocketsStage } from './PaperRocketsStage';

export const Hero: React.FC = () => {
  return (
    <section id="home" className="hero notebook-hero">
      {/* Paper Rockets Flight Canvas */}
      <PaperRocketsStage />

      {/* Atmospheric Soft Watercolor Wash Accents */}
      <div className="hero-glow-1" />
      <div className="hero-glow-2" />

      <div className="container hero-grid">
        {/* Main Content: Heading, Copy, CTA, Stats */}
        <HeroContent />
      </div>
    </section>
  );
};
