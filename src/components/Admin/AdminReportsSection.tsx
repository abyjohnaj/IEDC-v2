import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { hackathonService } from '../../services/hackathonService';
import { ideaBoxService } from '../../services/ideaBoxService';
import { fetchRegistrations, fetchAdminKYCSubmissions, AdminKYCItem } from '../../services/supabaseClient';
import { HackathonTeam, IdeaBoxSubmission, RegistrationSubmission } from '../../types';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  Award,
  Users,
  ShieldCheck,
  Calendar,
  Lightbulb,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface AdminReportsSectionProps {
  onNotify: (msg: string) => void;
}

export const AdminReportsSection: React.FC<AdminReportsSectionProps> = ({ onNotify }) => {
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [ideas, setIdeas] = useState<IdeaBoxSubmission[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationSubmission[]>([]);
  const [kycList, setKycList] = useState<AdminKYCItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [loadedTeams, loadedIdeas, loadedRegs, loadedKyc] = await Promise.all([
          hackathonService.getAllTeams(),
          ideaBoxService.getAllIdeas(),
          fetchRegistrations(),
          fetchAdminKYCSubmissions()
        ]);

        setTeams(loadedTeams);
        setIdeas(loadedIdeas);
        setRegistrations(loadedRegs);
        setKycList(loadedKyc);
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleExportHackathonCSV = () => {
    const csv = reportService.generateHackathonReportCSV(teams);
    reportService.downloadCSV(`iedc_hackathon_teams_report_${Date.now()}.csv`, csv);
    onNotify('📥 Hackathon Teams & Submissions Report CSV downloaded!');
  };

  const handleExportIdeaBoxCSV = () => {
    const csv = reportService.generateIdeaBoxReportCSV(ideas);
    reportService.downloadCSV(`iedc_ideabox_innovations_report_${Date.now()}.csv`, csv);
    onNotify('📥 IdeaBox Innovations Pipeline CSV downloaded!');
  };

  const handleExportRegistrationsCSV = () => {
    const csv = reportService.generateRegistrationsReportCSV(registrations);
    reportService.downloadCSV(`iedc_event_registrations_report_${Date.now()}.csv`, csv);
    onNotify('📥 Event Registrations & Attendee List CSV downloaded!');
  };

  const handleExportKYCCSV = () => {
    const csv = reportService.generateKYCReportCSV(kycList);
    reportService.downloadCSV(`iedc_kyc_verification_report_${Date.now()}.csv`, csv);
    onNotify('📥 KYC Member Compliance Audit CSV downloaded!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const verifiedKYCCount = kycList.filter(k => k.status === 'verified').length;
  const submittedProjectsCount = teams.filter(t => t.projectSubmission?.status === 'submitted').length;
  const approvedIdeasCount = ideas.filter(i => i.status === 'Incubation Approved' || i.status === 'Mentorship Assigned').length;

  return (
    <div>
      {/* Reports Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={24} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              Official Administrative Reports & Analytics Desk
            </h3>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Audit compliance, export hackathon team rosters, extract innovation pipeline data, and download institutional records.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handlePrintReport}>
          <Printer size={16} /> Print Official Summary
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Hackathon Squads
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-cyan)', margin: '0.3rem 0' }}>
            {teams.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
            {submittedProjectsCount} Final Submissions
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            IdeaBox Innovations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', margin: '0.3rem 0' }}>
            {ideas.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
            {approvedIdeasCount} Incubated / Mentored
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Event Registrations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#a78bfa', margin: '0.3rem 0' }}>
            {registrations.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Across Workshops & Fests
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            KYC Compliance
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', margin: '0.3rem 0' }}>
            {verifiedKYCCount} / {kycList.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Verified Student Passes
          </div>
        </div>
      </div>

      {/* Required CSV Exports Hub */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h4 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 800 }}>
          Export Compliance & Analytical CSV Datasets
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Export 1: Hackathon */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Award size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                Hackathon Squads & Submissions
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>
              Complete breakdown of all registered teams, members, Discord/WhatsApp invite links, GitHub repos, demo videos, jury scores, and official admin feedback.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={handleExportHackathonCSV}>
              <Download size={14} /> Download Hackathon CSV ({teams.length} Teams)
            </button>
          </div>

          {/* Export 2: IdeaBox */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Lightbulb size={18} style={{ color: '#f59e0b' }} />
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                IdeaBox Innovation Pipeline
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>
              Detailed inventory of student pitches, problem statements, budgets, domain classifications, upvote counts, assigned incubator bays, and nodal review remarks.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={handleExportIdeaBoxCSV}>
              <Download size={14} /> Download IdeaBox CSV ({ideas.length} Pitches)
            </button>
          </div>

          {/* Export 3: Registrations */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Calendar size={18} style={{ color: '#a78bfa' }} />
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                Event Registrations & Attendees
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>
              Attendee roll with student name, verified email, phone number, branch, semester, registration status, and entry pass issuance records.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={handleExportRegistrationsCSV}>
              <Download size={14} /> Download Attendee CSV ({registrations.length} Records)
            </button>
          </div>

          {/* Export 4: KYC Compliance */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                KYC & Member Audit Records
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>
              Comprehensive KYC verification register including document ID numbers, verification status, timestamps, and nodal officer approval signatures.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={handleExportKYCCSV}>
              <Download size={14} /> Download KYC Audit CSV ({kycList.length} Records)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
