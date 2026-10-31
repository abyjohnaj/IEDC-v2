import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Users, Lightbulb, CheckCircle2, Hammer,
  GraduationCap, Trophy, Rocket, ChevronRight, ArrowRight, ShieldCheck
} from 'lucide-react';
import { IdeaBoxSubmission, IdeaStage } from '../../types';

interface ProjectJourneyTrackerProps {
  idea?: IdeaBoxSubmission | null;
  className?: string;
}

export const JOURNEY_STAGES = [
  {
    step: 1,
    id: 'problem_discovery',
    title: 'Problem Discovery',
    subtitle: 'Identify unmet campus or local challenge',
    icon: Compass,
    color: '#3b82f6',
    route: '/problems',
    actionText: 'Browse Problem Bank',
    evidence: 'Verified problem statement adopted or formulated'
  },
  {
    step: 2,
    id: 'team_formation',
    title: 'Team Formation',
    subtitle: 'Assemble complementary multidisciplinary skills',
    icon: Users,
    color: '#8b5cf6',
    route: '/hackathons',
    actionText: 'Form or Join Squad',
    evidence: 'Hackathon team registered with verified KYC members'
  },
  {
    step: 3,
    id: 'idea_pitch',
    title: 'Idea Pitch & Review',
    subtitle: 'Submit pitch deck & receive rubric peer grading',
    icon: Lightbulb,
    color: '#f59e0b',
    route: '/ideabox',
    actionText: 'Pitch to IdeaBox',
    evidence: 'IdeaBox submission evaluated on 4-criterion rubric'
  },
  {
    step: 4,
    id: 'validation',
    title: 'Assumption Validation',
    subtitle: 'Survey campus users & validate market problem',
    icon: CheckCircle2,
    color: '#10b981',
    route: '/forum',
    actionText: 'Gather User Feedback',
    evidence: 'Community feedback & validated user responses'
  },
  {
    step: 5,
    id: 'prototype_milestones',
    title: 'Prototype Building',
    subtitle: 'Build MVP & document milestone deliverables',
    icon: Hammer,
    color: '#ec4899',
    route: '/ideabox',
    actionText: 'Submit Milestone',
    evidence: 'GitHub repository or hardware proof-of-concept'
  },
  {
    step: 6,
    id: 'mentor_clinic',
    title: 'Mentorship Clinic',
    subtitle: '1-on-1 architecture & IP review with faculty',
    icon: GraduationCap,
    color: '#6366f1',
    route: '/mentorship',
    actionText: 'Book Mentor Clinic',
    evidence: 'Signed clinic notes & technical action items'
  },
  {
    step: 7,
    id: 'hackathon_defense',
    title: 'Challenge & Hackathon',
    subtitle: 'Compete in campus hackathons & live jury pitch',
    icon: Trophy,
    color: '#f97316',
    route: '/hackathons',
    actionText: 'Compete in HackBMCE',
    evidence: 'Jury score on official leaderboard'
  },
  {
    step: 8,
    id: 'incubation_grant',
    title: 'Incubation & Grants',
    subtitle: 'KSUM seed funding, patent filing & startup launch',
    icon: Rocket,
    color: '#14b8a6',
    route: '/profile',
    actionText: 'View Incubation Track',
    evidence: 'Assigned IEDC incubator track & tranche disbursals'
  }
];

export const ProjectJourneyTracker: React.FC<ProjectJourneyTrackerProps> = ({ idea, className = '' }) => {
  // Determine current active step based on idea stage
  const getActiveStep = (stage?: IdeaStage): number => {
    switch (stage) {
      case 'Ideation': return 3;
      case 'Prototype': return 5;
      case 'Validation': return 6;
      case 'Incubation Ready': return 7;
      case 'Funded': return 8;
      default: return 1;
    }
  };

  const currentStep = getActiveStep(idea?.stage);

  return (
    <div className={`journey-tracker-card ${className}`} style={{
      background: 'var(--card-bg, #1a1f2c)',
      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
      borderRadius: '16px',
      padding: '1.75rem',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            <Compass size={14} />
            <span>IEDC BMCE Innovation Pipeline</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main, #fff)' }}>
            {idea ? `Journey: ${idea.title}` : 'The 8-Stage Campus Innovation Roadmap'}
          </h3>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', maxWidth: '650px' }}>
            {idea 
              ? `Currently in Stage ${currentStep} (${idea.stage}). Complete upcoming milestone verification to unlock incubation funding.`
              : 'Follow the proven venture journey from campus problem discovery to KSUM seed grants and prototype incubation.'}
          </p>
        </div>

        {/* Progress Badge */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '30px',
          padding: '0.5rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <ShieldCheck size={18} color="#f59e0b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
            Stage {currentStep} of 8 Active
          </span>
        </div>
      </div>

      {/* Interactive Step Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {JOURNEY_STAGES.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isLocked = s.step > currentStep;
          const Icon = s.icon;

          return (
            <div
              key={s.id}
              style={{
                background: isCurrent 
                  ? 'rgba(245, 158, 11, 0.08)' 
                  : isDone 
                  ? 'rgba(16, 185, 129, 0.05)' 
                  : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${
                  isCurrent 
                    ? 'rgba(245, 158, 11, 0.4)' 
                    : isDone 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)'
                }`,
                borderRadius: '12px',
                padding: '1.1rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                opacity: isLocked ? 0.65 : 1
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isDone ? '#10b981' : isCurrent ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {isDone ? '✓' : s.step}
                  </span>

                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: `${s.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.color
                  }}>
                    <Icon size={18} />
                  </div>
                </div>

                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main, #fff)' }}>
                  {s.title}
                </h4>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.4 }}>
                  {s.subtitle}
                </p>

                <div style={{
                  fontSize: '0.72rem',
                  color: isDone ? '#10b981' : isCurrent ? '#f59e0b' : 'var(--text-muted, #64748b)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Evidence:</strong>
                  {s.evidence}
                </div>
              </div>

              <Link
                to={s.route}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  textDecoration: 'none',
                  background: isCurrent ? 'var(--accent-cyan, #06b6d4)' : 'rgba(255, 255, 255, 0.06)',
                  color: isCurrent ? '#000' : 'var(--text-main, #fff)',
                  transition: 'background 0.2s ease'
                }}
              >
                <span>{s.actionText}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Rocket size={24} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main, #fff)' }}>
              Ready to take the next step on your project?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
              Adopt a verified campus challenge, consult faculty mentors during clinic hours, and test your prototype.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/problems" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>
            <Compass size={14} style={{ marginRight: '4px' }} />
            Problem Bank
          </Link>
          <Link to="/mentorship" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>
            <GraduationCap size={14} style={{ marginRight: '4px' }} />
            Book Mentor Clinic
          </Link>
        </div>
      </div>
    </div>
  );
};
