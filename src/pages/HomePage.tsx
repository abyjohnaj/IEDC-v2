import React, { useState } from 'react';
import { Navbar } from '../components/Navigation/Navbar';
import { Hero } from '../components/Hero/Hero';
import { AboutSection } from '../sections/AboutSection';
import { EventsSection } from '../sections/EventsSection';
import { ExecomSection } from '../sections/ExecomSection';
import { EurekaSpotlightSection } from '../sections/EurekaSpotlightSection';
import { ForumSection } from '../sections/ForumSection';
import { IncubationSection } from '../sections/IncubationSection';
import { Footer } from '../components/Navigation/Footer';
import { RegistrationModal } from '../components/Modals/RegistrationModal';
import { Toast } from '../components/UI/Toast';

export const HomePage: React.FC = () => {
  const [activeEventName, setActiveEventName] = useState<string | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenRegistration = (eventName: string) => {
    setActiveEventName(eventName);
    setIsRegModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="home-page-container">
      {/* Continuous Full-Page Notebook Red Margin Line */}
      <div className="global-notebook-spine" aria-hidden="true">
        <div className="global-notebook-margin-line" />
      </div>

      {/* Fixed Glassmorphic Navigation */}
      <Navbar />

      {/* Hero Section with Ground-Up Articulated Character Short Film & Paper Rockets */}
      <Hero />

      {/* About & 4 Core Pillars */}
      <AboutSection />

      {/* Events & Bootcamps Grid with Registration Pass */}
      <EventsSection onOpenRegistration={handleOpenRegistration} />

      {/* Executive Committee & Leadership */}
      <ExecomSection />

      {/* Eureka Newsletter Spotlight */}
      <EurekaSpotlightSection />

      {/* Community Collaboration Forum */}
      <ForumSection />

      {/* Incubation Hub & Prototyping Facilities */}
      <IncubationSection />

      {/* Footer */}
      <Footer />

      {/* Global Registration & Startup Idea Pitch Modal */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        eventName={activeEventName}
        onClose={() => setIsRegModalOpen(false)}
        onSuccess={showToast}
      />

      {/* Feedback Toast */}
      <Toast message={toastMessage} />
    </div>
  );
};
