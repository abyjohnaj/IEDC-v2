import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { submitRegistration } from '../../services/supabaseClient';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName?: string | null;
  onSuccess: (msg: string) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  eventName,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('S1/S2');
  const [overviewReason, setOverviewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isIdeaSubmission = !eventName || eventName === 'IdeaPitch';
  const modalTitle = isIdeaSubmission ? 'Submit Your Startup Idea' : `Register for ${eventName}`;
  const modalSub = isIdeaSubmission
    ? 'Pitch your concept to IEDC BMCE to access seed funding support, mentoring, and prototyping maker labs.'
    : 'Reserve your slot in this upcoming IEDC workshop/bootcamp.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await submitRegistration({
      type: isIdeaSubmission ? 'Idea' : 'Event',
      eventName: eventName || null,
      fullName,
      email,
      phone,
      department,
      semester,
      overviewReason
    });

    setIsSubmitting(false);
    onClose();

    if (success) {
      onSuccess(`✅ Success! Your ${isIdeaSubmission ? 'Startup Idea' : 'Event Registration'} has been submitted.`);
    } else {
      onSuccess(`Saved locally. Your ${isIdeaSubmission ? 'Startup Idea' : 'Registration'} is recorded.`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={22} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <span className="eureka-badge" style={{ marginBottom: '0.6rem' }}>
            {isIdeaSubmission ? '🚀 Incubation Portal' : '🎟️ Event Pass'}
          </span>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }} className="gradient-text">
            {modalTitle}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {modalSub}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@bmce.ac.in"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone / WhatsApp *</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="EEE">Electrical (EEE)</option>
                <option value="CE">Civil Engineering (CE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
                <option value="AIDS">Artificial Intelligence (AI&DS)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select
                className="form-select"
                value={semester}
                onChange={e => setSemester(e.target.value)}
              >
                <option value="S1/S2">S1 / S2</option>
                <option value="S3/S4">S3 / S4</option>
                <option value="S5/S6">S5 / S6</option>
                <option value="S7/S8">S7 / S8</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {isIdeaSubmission ? 'Startup Idea Title & Brief Overview *' : 'Why do you wish to attend? *'}
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={overviewReason}
              onChange={e => setOverviewReason(e.target.value)}
              placeholder={
                isIdeaSubmission
                  ? 'Describe the problem statement, your prototype solution, and team composition...'
                  : 'What key technical or entrepreneurial insights do you hope to acquire...'
              }
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Send size={16} />
              {isSubmitting ? 'Submitting...' : `Submit ${isIdeaSubmission ? 'Idea Pitch' : 'Registration'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
