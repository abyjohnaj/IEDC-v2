import React from 'react';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { NewsletterLibrary } from '../components/Newsletter/NewsletterLibrary';

export const NewsletterPage: React.FC = () => {
  return (
    <div className="newsletter-page-container" style={{ background: '#0a0503', minHeight: '100vh' }}>
      <Navbar />
      <NewsletterLibrary />
      <Footer />
    </div>
  );
};
