import React, { useState, useEffect } from 'react';
import { execomService } from '../services/execomService';
import { ExecomStructure } from '../types';
import { Linkedin, Sparkles } from 'lucide-react';

export const ExecomSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodal' | 'leads' | 'coordinators'>('nodal');
  const [execomData, setExecomData] = useState<ExecomStructure>(execomService.getExecomStructure());

  useEffect(() => {
    // Initial fetch in case storage updated
    setExecomData(execomService.getExecomStructure());

    // Live subscription to Execom appointments/updates made by admin
    const unsubscribe = execomService.subscribe((updated) => {
      setExecomData(updated);
    });
    return unsubscribe;
  }, []);

  return (
    <section id="execom" className="execom-section">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Leadership & Guidance</span>
          <h2 className="section-title">
            Executive <span className="gradient-text">Committee</span>
          </h2>
          <p className="section-desc">
            Meet the dedicated faculty nodal officers, student executive leads, and department coordinators driving IEDC BMCE forward.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="filter-pills">
          <button
            className={`pill-btn ${activeTab === 'nodal' ? 'active' : ''}`}
            onClick={() => setActiveTab('nodal')}
          >
            Nodal Officers ({execomData.nodalOfficers.length})
          </button>
          <button
            className={`pill-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            Student Leads (ExeCom) ({execomData.studentLeads.length})
          </button>
          <button
            className={`pill-btn ${activeTab === 'coordinators' ? 'active' : ''}`}
            onClick={() => setActiveTab('coordinators')}
          >
            Department Co-ordinators ({execomData.departmentCoordinators.length})
          </button>
        </div>

        {/* Members Grid */}
        <div className="team-grid">
          {activeTab === 'nodal' &&
            execomData.nodalOfficers.map((mem, idx) => (
              <div key={idx} className="glass-card team-card">
                <img
                  src={mem.avatar}
                  alt={mem.name}
                  className="team-avatar"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = mem.fallbackAvatar;
                  }}
                />
                <h3 className="team-name">{mem.name}</h3>
                <div className="team-role">{mem.role}</div>
                <div className="team-dept">{mem.department}</div>
                {mem.bio && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.8rem', lineHeight: 1.5 }}>
                    {mem.bio}
                  </p>
                )}
              </div>
            ))}

          {activeTab === 'leads' &&
            execomData.studentLeads.map((mem, idx) => (
              <div key={idx} className="glass-card team-card" style={{ position: 'relative' }}>
                <img
                  src={mem.avatar}
                  alt={mem.name}
                  className="team-avatar"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = mem.fallbackAvatar;
                  }}
                />
                <h3 className="team-name">{mem.name}</h3>
                <div className="team-role" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Sparkles size={13} style={{ color: 'var(--accent-amber)' }} />
                  {mem.role}
                </div>
                <div className="team-dept">{mem.department}</div>
                {mem.bio && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.6rem', lineHeight: 1.5 }}>
                    {mem.bio}
                  </p>
                )}
                {mem.linkedin && (
                  <a
                    href={mem.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: '0.8rem', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}
                  >
                    <Linkedin size={15} /> LinkedIn
                  </a>
                )}
              </div>
            ))}

          {activeTab === 'coordinators' &&
            execomData.departmentCoordinators.map((mem, idx) => (
              <div key={idx} className="glass-card team-card" style={{ padding: '1.8rem 1.2rem' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(0, 242, 254, 0.1)',
                    border: '2px solid var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    marginInline: 'auto'
                  }}
                >
                  🎓
                </div>
                <h3 className="team-name" style={{ fontSize: '1.05rem' }}>{mem.name}</h3>
                <div className="team-role">{mem.role}</div>
                <div className="team-dept">{mem.department}</div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
