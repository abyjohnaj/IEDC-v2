import React, { useState, useEffect } from 'react';
import { NewsletterEdition } from '../../types';
import { newsletterService } from '../../services/newsletterService';
import { NewsletterFlipbook } from '../Newsletter/NewsletterFlipbook';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  BookOpen, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

export const AdminNewsletterSection: React.FC = () => {
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [issueNo, setIssueNo] = useState('');
  const [category, setCategory] = useState('Technology');
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0
  });
  const [previewEdition, setPreviewEdition] = useState<NewsletterEdition | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await newsletterService.getAllNewsletters();
      setEditions(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setNotification({ message: 'Only PDF files are supported for newsletter upload', type: 'error' });
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      if (!issueNo) {
        setIssueNo(`Issue #${editions.length + 1}`);
      }
    }
  };

  const handleUploadAndConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setNotification({ message: 'Please select a PDF file to upload', type: 'error' });
      return;
    }
    if (!title.trim() || !issueNo.trim()) {
      setNotification({ message: 'Title and Issue Number are required', type: 'error' });
      return;
    }

    setIsUploading(true);
    setNotification(null);

    try {
      const newEdition = await newsletterService.uploadNewsletterPdf(
        selectedFile,
        {
          title: title.trim(),
          issueNo: issueNo.trim(),
          category,
          summary: summary.trim(),
          author: 'BMCE Editorial Bureau'
        },
        (status, percent) => {
          setUploadProgress({ status, percent });
        }
      );

      setNotification({
        message: `Successfully uploaded "${newEdition.title}". Converted ${newEdition.totalPages || newEdition.pageWebpUrls?.length || 6} pages to WebP!`,
        type: 'success'
      });

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setIssueNo('');
      setSummary('');
      await loadData();
    } catch (err: any) {
      console.error('Failed to upload and convert PDF:', err);
      setNotification({
        message: err?.message || 'Failed to convert PDF pages to WebP. Check console for details.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({ status: '', percent: 0 });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 6px' }}>
            Eureka Newsletter & PDF-to-WebP Pipeline
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Upload raw edition PDFs. The system automatically converts all pages to WebP images,
            stores them in the public bucket, and powers the lazy-loaded flipbook reader.
          </p>
        </div>

        <button 
          className="admin-btn admin-btn-secondary" 
          onClick={loadData}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Catalog</span>
        </button>
      </div>

      {notification && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: notification.type === 'success' ? '#6ee7b7' : '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* PDF Upload Card */}
      <div className="admin-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ color: '#fef3c7', fontSize: '1.2rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UploadCloud size={20} style={{ color: '#f59e0b' }} />
          <span>Upload PDF & Trigger Automatic WebP Conversion</span>
        </h3>

        <form onSubmit={handleUploadAndConvert} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            border: '2px dashed rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            background: 'rgba(245, 158, 11, 0.03)',
            cursor: 'pointer'
          }}>
            <input 
              type="file" 
              accept=".pdf,application/pdf"
              id="newsletter-pdf-file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            <label htmlFor="newsletter-pdf-file" style={{ cursor: 'pointer', display: 'block' }}>
              <FileText size={40} style={{ color: selectedFile ? '#10b981' : '#f59e0b', margin: '0 auto 12px' }} />
              {selectedFile ? (
                <div>
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '1.05rem' }}>
                    Selected: {selectedFile.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 4 }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#fef3c7', fontWeight: 600, fontSize: '1rem' }}>
                    Click or drag & drop raw newsletter PDF here
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 4 }}>
                    Maximum 50MB • Pages will automatically be converted to WebP
                  </div>
                </div>
              )}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 6 }}>
                Edition Title *
              </label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="e.g., Tech Weekly #25" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                required
                disabled={isUploading}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 6 }}>
                Issue Identifier *
              </label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="e.g., Issue #25" 
                value={issueNo} 
                onChange={e => setIssueNo(e.target.value)}
                required
                disabled={isUploading}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 6 }}>
                Category
              </label>
              <select 
                className="admin-input"
                value={category} 
                onChange={e => setCategory(e.target.value)}
                disabled={isUploading}
              >
                <option value="Technology">Technology</option>
                <option value="Robotics">Robotics</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
                <option value="Research">Research</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 6 }}>
              Summary & Highlights
            </label>
            <textarea 
              className="admin-input" 
              rows={2} 
              placeholder="Brief summary of articles in this issue..." 
              value={summary}
              onChange={e => setSummary(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Upload and conversion progress indicator */}
          {isUploading && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fef3c7', fontSize: '0.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} style={{ color: '#f59e0b' }} />
                  {uploadProgress.status}
                </span>
                <span>{uploadProgress.percent}%</span>
              </div>
              <div style={{ height: '6px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress.percent}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="admin-btn admin-btn-primary"
              disabled={isUploading || !selectedFile}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span>{isUploading ? 'Converting to WebP...' : 'Upload & Convert to WebP'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Editions List with Flipbook Preview */}
      <div className="admin-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ color: '#fef3c7', fontSize: '1.2rem', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={20} style={{ color: '#38bdf8' }} />
          <span>Active Newsletter Catalog ({editions.length} Editions)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {editions.map(ed => (
            <div 
              key={ed.id}
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {ed.issueNo}
                  </span>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#6ee7b7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <CheckCircle size={11} /> WebP Ready
                  </span>
                </div>

                <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: '0 0 4px', fontWeight: 600 }}>
                  {ed.title}
                </h4>
                {ed.subtitle && (
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 8 }}>
                    {ed.subtitle}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>{ed.category || 'General'}</span>
                  <span>•</span>
                  <span>{ed.totalPages || ed.pageWebpUrls?.length || 6} WebP Pages</span>
                  <span>•</span>
                  <span>{ed.date}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                <button
                  className="admin-btn admin-btn-primary"
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setPreviewEdition(ed)}
                  title="Test lazy-loaded WebP flipbook viewer"
                >
                  <BookOpen size={14} />
                  <span>Preview Flipbook</span>
                </button>

                {ed.pdfUrl && (
                  <a
                    href={ed.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center' }}
                    title="Download original PDF archive"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flipbook Modal Preview */}
      {previewEdition && (
        <NewsletterFlipbook
          edition={previewEdition}
          onClose={() => setPreviewEdition(null)}
        />
      )}
    </div>
  );
};
