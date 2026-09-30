import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Sparkles,
  Camera,
  RefreshCw,
  Award,
  ExternalLink,
  Info
} from 'lucide-react';
import { User, KYCDocumentType } from '../../types';
import { authService } from '../../services/authService';
import { getSupabase } from '../../services/supabaseClient';

interface KYCVerificationSectionProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const KYCVerificationSection: React.FC<KYCVerificationSectionProps> = ({
  user,
  onUserUpdated
}) => {
  const kyc = user.kyc;
  const isVerified = kyc.status === 'verified';
  const isPending = kyc.status === 'pending';
  const isRejected = kyc.status === 'rejected';
  const isUnverified = kyc.status === 'unverified';

  // Form State
  const [docType, setDocType] = useState<KYCDocumentType>(kyc.docType || 'student_id');
  const [docNumber, setDocNumber] = useState(kyc.docNumber || user.collegeId || '');
  const [fullName, setFullName] = useState(kyc.fullName || user.fullName);
  const [dob, setDob] = useState(kyc.dob || '2004-06-15');
  const [institution, setInstitution] = useState(kyc.institution || 'Baselios Mathews II College of Engineering');
  const [previewUrl, setPreviewUrl] = useState<string | null>(kyc.docFileUrl || null);
  const [fileName, setFileName] = useState<string>(kyc.docFileName || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'File size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Autofill sample data for quick testing
  const handleAutoFillSample = () => {
    setSelectedFile(null);
    setDocType('student_id');
    setDocNumber(`KTU-BMCE-2024-${Math.floor(1000 + Math.random() * 9000)}`);
    setFileName('BMCE_Student_Identity_Card.png');
    setPreviewUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=450&auto=format&fit=crop&q=80');
    showToast('success', 'Sample College ID document loaded. Ready to submit!');
  };

  // Submit KYC for review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      showToast('error', 'Please enter your document identification number.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await authService.submitKYC(user.id, {
        docType,
        docNumber,
        fullName,
        dob,
        institution,
        file: selectedFile || undefined
      });
      onUserUpdated(updated);
      showToast('success', 'KYC documentation submitted successfully! Review status is now Pending.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit KYC documentation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin / Demo Sandbox fast-track simulation
  const handleSimulateReview = async (status: 'verified' | 'rejected') => {
    try {
      const remarks = status === 'verified'
        ? 'Verified and approved by BMCE IEDC Nodal Center. Student verified against KTU records.'
        : 'Submitted document photograph was blurry. Please resubmit with clear roll number.';
      const updated = await authService.simulateKYCReview(user.id, status, remarks);
      onUserUpdated(updated);
      showToast('success', `KYC status simulated: Marked as ${status.toUpperCase()}`);
    } catch (err: any) {
      showToast('error', err.message || 'Simulation failed.');
    }
  };

  return (
    <div className="profile-panel-card">
      <div className="profile-panel-header">
        <div>
          <h3 className="profile-panel-title">
            <ShieldCheck size={22} style={{ color: 'var(--accent-cyan)' }} />
            Student KYC & Identity Verification
          </h3>
          <p className="profile-panel-desc">
            Verify your student enrollment to unlock project seed funding, 3D printing lab access, and official KTU activity points.
          </p>
        </div>

        <div>
          {isVerified && (
            <span className="kyc-badge verified">
              <ShieldCheck size={16} /> Verified Innovator
            </span>
          )}
          {isPending && (
            <span className="kyc-badge pending">
              <Clock size={16} /> Under Verification Review
            </span>
          )}
          {isUnverified && (
            <span className="kyc-badge unverified">
              <ShieldAlert size={16} /> Action Required: Unverified
            </span>
          )}
          {isRejected && (
            <span className="kyc-badge rejected">
              <AlertTriangle size={16} /> Verification Rejected
            </span>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div style={{
          padding: '0.85rem 1.2rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: toastMsg.type === 'success' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(225, 29, 72, 0.12)',
          color: toastMsg.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          border: `1px solid ${toastMsg.type === 'success' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`
        }}>
          {toastMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toastMsg.text}</span>
        </div>
      )}

      {/* STATUS BANNER 1: VERIFIED */}
      {isVerified && (
        <div className="kyc-status-banner verified">
          <div className="kyc-banner-icon">
            <ShieldCheck size={28} />
          </div>
          <div className="kyc-banner-content" style={{ flex: 1 }}>
            <h4>Student Identity Verified</h4>
            <p>
              Your credentials have been authenticated against the Baselios Mathews II College of Engineering KTU enrollment database. You possess full clearance for funding applications, maker lab equipment, and Eureka editorial submissions.
            </p>

            <div className="kyc-certified-box">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Innovation Pass ID
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'monospace' }}>
                  IEDC-BMCE-PASS-{user.collegeId || 'KTU2026'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Document: {kyc.docType.toUpperCase().replace('_', ' ')} ({kyc.docNumber || 'AUTHENTICATED'})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="kyc-badge verified" style={{ fontSize: '0.85rem' }}>
                  <Award size={15} /> Valid Academic Year 2025–2026
                </span>
                {kyc.verifiedAt && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Verified on {new Date(kyc.verifiedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {kyc.adminRemarks && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Note: "{kyc.adminRemarks}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATUS BANNER 2: PENDING REVIEW */}
      {isPending && (
        <div className="kyc-status-banner pending">
          <div className="kyc-banner-icon">
            <Clock size={28} />
          </div>
          <div className="kyc-banner-content" style={{ flex: 1 }}>
            <h4>Verification Under Administrative Review</h4>
            <p>
              Your KYC submission was received on{' '}
              <strong>{kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : 'recently'}</strong>. The IEDC Nodal Officer and student verification cell are reviewing your institutional records.
            </p>
            <div style={{ marginTop: '0.8rem', padding: '0.8rem 1rem', background: 'rgba(217, 119, 6, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <strong>Submitted Document:</strong> {kyc.docType.replace('_', ' ').toUpperCase()} • <strong>Reference:</strong> {kyc.docNumber}
            </div>

            {kyc.docFileName && (
              <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span>Secure Document Vaulted: <strong>{kyc.docFileName}</strong> (Stored in encrypted storage)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATUS BANNER 3: REJECTED */}
      {isRejected && (
        <div className="kyc-status-banner rejected">
          <div className="kyc-banner-icon">
            <AlertTriangle size={28} />
          </div>
          <div className="kyc-banner-content" style={{ flex: 1 }}>
            <h4>Verification Request Returned</h4>
            <p>
              Your verification could not be completed.
            </p>
            {kyc.rejectionReason && (
              <div style={{ margin: '0.6rem 0', padding: '0.75rem 1rem', background: 'rgba(225, 29, 72, 0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.88rem', fontWeight: 600 }}>
                Reason: {kyc.rejectionReason}
              </div>
            )}
            <p style={{ fontSize: '0.85rem' }}>
              Please review your document details below, ensure your student ID is clearly legible, and resubmit.
            </p>
          </div>
        </div>
      )}

      {/* STATUS BANNER 4: UNVERIFIED EXPLAINER */}
      {isUnverified && (
        <div className="kyc-status-banner unverified">
          <div className="kyc-banner-icon">
            <Info size={28} />
          </div>
          <div className="kyc-banner-content">
            <h4>Complete Your Student KYC Verification</h4>
            <p>
              BMCE IEDC mandates institutional verification to ensure grant disbursements, prototype lab access, and certificates are awarded to bonafide BMCE students. Takes under 60 seconds to submit.
            </p>
          </div>
        </div>
      )}

      {/* KYC SUBMISSION / RESUBMISSION FORM */}
      {(!isVerified || isRejected) && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isRejected ? 'Resubmit Verification Documents' : 'Submit Identity Documentation'}
            </h4>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={handleAutoFillSample}
            >
              <Sparkles size={13} />
              Autofill Sample College ID
            </button>
          </div>

          <div className="auth-grid-2">
            <div className="auth-input-group">
              <label className="auth-label">Document Identification Type</label>
              <select
                className="auth-select"
                value={docType}
                onChange={e => setDocType(e.target.value as KYCDocumentType)}
              >
                <option value="student_id">BMCE Student Identity Card (Recommended)</option>
                <option value="college_admission">KTU Admission Allotment Memo</option>
                <option value="aadhaar">Government Aadhaar Card (Masked)</option>
                <option value="pan">PAN Card (For Grant Account Setup)</option>
              </select>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Document / Roll / Registration Number</label>
              <input
                type="text"
                required
                className="auth-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="e.g. KTU-BMCE-2023-CS042"
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-grid-2">
            <div className="auth-input-group">
              <label className="auth-label">Full Name (As on Document)</label>
              <input
                type="text"
                required
                className="auth-input"
                style={{ paddingLeft: '1rem' }}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Date of Birth</label>
              <input
                type="date"
                required
                className="auth-input"
                style={{ paddingLeft: '1rem' }}
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Educational Institution</label>
            <input
              type="text"
              className="auth-input"
              style={{ paddingLeft: '1rem' }}
              value={institution}
              onChange={e => setInstitution(e.target.value)}
            />
          </div>

          {/* Document Upload Zone */}
          <div className="auth-input-group">
            <label className="auth-label">
              <Camera size={14} /> Upload Front Side Photo of ID Card (PNG, JPG, PDF)
            </label>
            <div className="kyc-doc-uploader-zone">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <Upload size={32} style={{ color: 'var(--accent-cyan)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {fileName ? fileName : 'Click or Drag & Drop Student ID Card Photo'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Clear snapshot showing your face, student register number, and college seal (Max 5MB)
              </div>
            </div>

            {previewUrl && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>File Preview:</span>
                <div className="kyc-preview-container">
                  <img src={previewUrl} alt="Preview" className="kyc-preview-img" />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin-slow" /> Submitting Documentation...
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Submit for Official Verification
              </>
            )}
          </button>
        </form>
      )}

      {/* ADMIN & EVALUATOR SANDBOX DEMO TOOLS */}
      {/* Evaluator Sandbox Simulation Tools (Dev Only) */}
      {import.meta.env.VITE_ENABLE_DEMO === 'true' && (
        <div className="kyc-sandbox-tools">
          <div className="kyc-sandbox-title">
            <Sparkles size={14} />
            Evaluator Sandbox: Fast-Track Simulation
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
            Test the different student verification states instantly without waiting for manual admin evaluation:
          </p>
          <div className="kyc-sandbox-actions">
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleSimulateReview('verified')}
            >
              <ShieldCheck size={15} />
              Simulate: Approve KYC (Verified)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', color: 'var(--accent-rose)' }}
              onClick={() => handleSimulateReview('rejected')}
            >
              <AlertTriangle size={15} />
              Simulate: Reject KYC (Needs Fix)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => {
                authService.updateProfile(user.id, {
                  kyc: {
                    ...user.kyc,
                    status: 'unverified',
                    docNumber: '',
                    verifiedAt: undefined,
                    rejectionReason: undefined
                  }
                }).then(onUserUpdated);
              }}
            >
              <RefreshCw size={14} />
              Reset to Unverified
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
