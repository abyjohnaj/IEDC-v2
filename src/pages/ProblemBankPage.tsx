import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Plus, Search, Tag, AlertTriangle, ShieldCheck,
  CheckCircle2, ArrowRight, Lightbulb, X, Users, Sparkles, Building2
} from 'lucide-react';
import { Navbar } from '../components/Navigation/Navbar';
import { Footer } from '../components/Navigation/Footer';
import { ProjectJourneyTracker } from '../components/Journey/ProjectJourneyTracker';
import { problemBankService } from '../services/problemBankService';
import { authService, openAuthModal } from '../services/authService';
import { ProblemStatement, ProblemSeverity, ProblemDifficulty } from '../types';

export const ProblemBankPage: React.FC = () => {
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  // Submit modal form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDomain, setNewDomain] = useState('Campus Tech');
  const [newSeverity, setNewSeverity] = useState<ProblemSeverity>('High');
  const [newDifficulty, setNewDifficulty] = useState<ProblemDifficulty>('Medium');
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [newTags, setNewTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const domains = [
    'All',
    'Campus Tech',
    'Agriculture & Rural',
    'Clean Energy',
    'Disaster Management',
    'EdTech',
    'Healthcare',
    'Smart Cities'
  ];

  const severities = ['All', 'Critical', 'High', 'Moderate', 'Low'];

  useEffect(() => {
    loadProblems();
  }, [selectedDomain, selectedSeverity]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await problemBankService.fetchProblems({
        domain: selectedDomain,
        severity: selectedSeverity,
        search
      });
      setProblems(data);
    } catch (err) {
      console.warn('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProblems();
  };

  const handleAdoptProblem = (problem: ProblemStatement) => {
    // Navigate to IdeaBox with problem pre-filled
    navigate(`/ideabox?problemId=${problem.id}&problemTitle=${encodeURIComponent(problem.title)}&domain=${encodeURIComponent(problem.domain)}`);
  };

  const handleCreateProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (!newTitle.trim() || !newDescription.trim() || !newBeneficiary.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedTags = newTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await problemBankService.createProblem({
        title: newTitle,
        description: newDescription,
        domain: newDomain,
        severity: newSeverity,
        difficulty: newDifficulty,
        beneficiary: newBeneficiary,
        tags: parsedTags.length > 0 ? parsedTags : [newDomain],
        authorName: currentUser.fullName,
        authorRole: currentUser.role
      });

      if (res.success && res.data) {
        setProblems(prev => [res.data!, ...prev]);
        setIsSubmitModalOpen(false);
        // Reset form
        setNewTitle('');
        setNewDescription('');
        setNewBeneficiary('');
        setNewTags('');
      } else {
        alert('Could not submit challenge: ' + (res.error || 'Unknown error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: ProblemSeverity) => {
    switch (severity) {
      case 'Critical':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'High':
        return { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'Moderate':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2rem 1rem 4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            marginBottom: '2.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ maxWidth: '750px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  <Compass size={16} />
                  <span>Stage 1 of the Innovation Journey</span>
                </div>
                <h1 style={{ margin: '0 0 0.75rem 0', fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main, #fff)', lineHeight: 1.2 }}>
                  Campus & Community <span style={{ color: 'var(--accent-cyan, #06b6d4)' }}>Problem Bank</span>
                </h1>
                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.6 }}>
                  Great startups begin with genuine, validated problems. Discover pressing challenges submitted by BMCE faculty, students, and Kollam district industries, or post an unmet challenge for student squads to adopt and solve.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!currentUser) openAuthModal('login');
                  else setIsSubmitModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
              >
                <Plus size={18} />
                Submit a Challenge
              </button>
            </div>
          </div>

          {/* Search & Domain Filter Bar */}
          <div style={{ marginBottom: '2rem' }}>
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search challenges by keyword, technology, or beneficiary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                    background: 'var(--card-bg, #1a1f2c)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    borderRadius: '10px',
                    color: 'var(--text-main, #fff)',
                    fontSize: '0.92rem'
                  }}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
                Search
              </button>
            </form>

            {/* Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.5rem' }}>Domain:</span>
              {domains.map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setSelectedDomain(dom)}
                  style={{
                    background: selectedDomain === dom ? 'var(--accent-cyan, #06b6d4)' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedDomain === dom ? '#000' : 'var(--text-main, #fff)',
                    border: `1px solid ${selectedDomain === dom ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '20px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Cards Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
              Loading verified challenges...
            </div>
          ) : problems.length === 0 ? (
            <div style={{
              background: 'var(--card-bg, #1a1f2c)',
              border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.15))',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <Compass size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)' }}>No challenges found</h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
                Try adjusting your search filters or be the first to submit a challenge for this domain.
              </p>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="btn btn-primary"
              >
                Submit New Challenge
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              {problems.map((p) => {
                const sevBadge = getSeverityBadge(p.severity);

                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--card-bg, #1a1f2c)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{
                          background: sevBadge.bg,
                          color: sevBadge.color,
                          border: `1px solid ${sevBadge.border}`,
                          borderRadius: '6px',
                          padding: '0.25rem 0.55rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {p.severity} Impact
                        </span>

                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-muted, #94a3b8)',
                            borderRadius: '6px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}>
                            {p.domain}
                          </span>
                          <span style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: 'var(--accent-cyan, #06b6d4)',
                            borderRadius: '6px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}>
                            {p.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main, #fff)', lineHeight: 1.4 }}>
                        {p.title}
                      </h3>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.86rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.55 }}>
                        {p.description}
                      </p>

                      {/* Beneficiary */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted, #cbd5e1)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}>
                        <Building2 size={14} color="#f59e0b" />
                        <span><strong>Beneficiary:</strong> {p.beneficiary}</span>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {p.tags.map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted)',
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '4px',
                              padding: '0.2rem 0.45rem'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        {p.adoptedCount > 0 ? (
                          <strong style={{ color: '#10b981' }}>{p.adoptedCount} squad(s) adopted</strong>
                        ) : (
                          <span>Unadopted — Be the first!</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAdoptProblem(p)}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.45rem 0.95rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Lightbulb size={14} />
                        Adopt & Pitch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Integrated Innovation Pipeline Tracker */}
          <div style={{ marginTop: '2rem' }}>
            <ProjectJourneyTracker />
          </div>

        </div>
      </main>

      {/* Submit Problem Modal */}
      {isSubmitModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #1a1f2c)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)', fontSize: '1.35rem' }}>
              Submit a Campus or Community Challenge
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Identify an unmet need observed in BMCE labs, local Kollam industries, or public infrastructure for innovator teams to tackle.
            </p>

            <form onSubmit={handleCreateProblemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                  Problem Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Soil Moisture & Irrigation Telemetry for Kollam Coconut Farms"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                  Problem Statement & Context *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the problem, current pain points, and why existing solutions are inadequate..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                    Domain
                  </label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    {domains.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d} style={{ background: '#1e293b' }}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as ProblemSeverity)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Critical" style={{ background: '#1e293b' }}>Critical</option>
                    <option value="High" style={{ background: '#1e293b' }}>High</option>
                    <option value="Moderate" style={{ background: '#1e293b' }}>Moderate</option>
                    <option value="Low" style={{ background: '#1e293b' }}>Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                  Target Beneficiary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local Coconut Farmers in Sasthamcotta / BMCE CSE Lab Students"
                  value={newBeneficiary}
                  onChange={(e) => setNewBeneficiary(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #fff)', marginBottom: '0.35rem' }}>
                  Keywords / Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="IoT, Agriculture, Irrigation, Microcontroller"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {submitting ? 'Publishing...' : 'Publish Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
