import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface StatProps {
  target: number;
  suffix: string;
  label: string;
}

const StatCounter: React.FC<StatProps> = ({ target, suffix, label }) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const duration = 1600;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="stat-item">
      <h3>
        {count}
        {suffix}
      </h3>
      <p>{label}</p>
    </div>
  );
};

export const HeroContent: React.FC = () => {
  return (
    <div className="hero-content">
      <h1 className="hero-title">
        Empowering Next-Gen{' '}
        <span className="gradient-text">Innovators & Founders</span>
      </h1>

      <p className="hero-desc">
        Innovation & Entrepreneurship Development Centre (IEDC) at Baselios Mathews II College of Engineering fosters student-led research, startup incubation, prototyping, and pre-seed grants.
      </p>

      <div className="hero-buttons">
        <a href="#events" className="btn btn-primary">
          <Sparkles size={18} />
          Discover What's Brewing at IEDC BMCE
          <ArrowRight size={18} />
        </a>
      </div>

      <div className="stats-bar">
        <StatCounter target={50} suffix="+" label="Startup Ideas Incubation" />
        <StatCounter target={25} suffix="+" label="Workshops & Bootcamps" />
        <StatCounter target={500} suffix="+" label="Active Innovators" />
        <StatCounter target={10} suffix="L+" label="Grant & Seed Support" />
      </div>

      <div 
        className="hero-scroll-launch-hint"
        onClick={() => {
          const aboutSection = document.getElementById('about');
          if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        title="Scroll to launch into next chapter"
      >
        <span>Scroll to Explore</span>
        <span className="scroll-arrow-anim">↓</span>
      </div>
    </div>
  );
};
