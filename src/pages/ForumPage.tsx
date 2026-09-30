import React from 'react';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { ForumSection } from '../sections/ForumSection';

export const ForumPage: React.FC = () => {
  return (
    <div className="forum-page-root" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ paddingTop: '5.5rem' }}>
        <ForumSection />
      </div>
      <Footer />
    </div>
  );
};
