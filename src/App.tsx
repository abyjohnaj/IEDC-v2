import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { HomePage } from './pages/HomePage';
import { NewsletterPage } from './pages/NewsletterPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { IdeaBoxPage } from './pages/IdeaBoxPage';
import { HackathonPortalPage } from './pages/HackathonPortalPage';
import { ForumPage } from './pages/ForumPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProblemBankPage } from './pages/ProblemBankPage';
import { MentorClinicsPage } from './pages/MentorClinicsPage';
import { FestPortalPage } from './pages/FestPortalPage';
import { AuthModal } from './components/Auth/AuthModal';

export const App: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'login' | 'signup' }>;
      setAuthInitialTab(customEvent.detail?.tab || 'login');
      setAuthModalOpen(true);
    };

    window.addEventListener('iedc_open_auth_modal', handleOpenAuth);
    return () => window.removeEventListener('iedc_open_auth_modal', handleOpenAuth);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/problems" element={<ProblemBankPage />} />
          <Route path="/challenges" element={<Navigate to="/problems" replace />} />
          <Route path="/ideabox" element={<IdeaBoxPage />} />
          <Route path="/hackathons" element={<HackathonPortalPage />} />
          <Route path="/hackathon" element={<Navigate to="/hackathons" replace />} />
          <Route path="/teams" element={<Navigate to="/hackathons" replace />} />
          <Route path="/fest" element={<FestPortalPage />} />
          <Route path="/fest/:festId" element={<FestPortalPage />} />
          <Route path="/ekah" element={<Navigate to="/fest/ekah-2026" replace />} />
          <Route path="/mentorship" element={<MentorClinicsPage />} />
          <Route path="/mentor-clinics" element={<Navigate to="/mentorship" replace />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/newsletter" element={<NewsletterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/kyc" element={<Navigate to="/profile?tab=kyc" replace />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Legacy redirect support */}
          <Route path="/newsletter.html" element={<Navigate to="/newsletter" replace />} />
          <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
          <Route path="/profile.html" element={<Navigate to="/profile" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          initialTab={authInitialTab}
          onClose={() => setAuthModalOpen(false)}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
