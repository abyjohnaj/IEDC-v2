import { describe, it, expect, beforeEach, vi } from 'vitest';
import { newsletterService } from './newsletterService';
import * as supabaseClientModule from './supabaseClient';
import { NewsletterEdition } from '../types';

describe('Newsletter PDF-to-WebP & Lazy Flipbook System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebP Page Retrieval for Lazy Flipbook', () => {
    it('returns WebP page URLs for an edition', async () => {
      const sampleEdition: NewsletterEdition = {
        id: 'test-edition-1',
        title: 'Eureka Tech Journal',
        issueNo: 'Issue #1',
        date: 'October 2026',
        month: 'October',
        year: '2026',
        category: 'Technology',
        theme: 'Innovation',
        icon: '📖',
        color: '#b45309',
        accent: 'rgba(180, 83, 9, 0.2)',
        summary: 'Testing WebP conversion',
        highlights: ['Autonomous systems', 'WebP rendering'],
        pdfUrl: 'https://example.com/test.pdf',
        pageWebpUrls: [
          'https://storage.supabase.co/newsletter-pages/test-edition-1/page-1.webp',
          'https://storage.supabase.co/newsletter-pages/test-edition-1/page-2.webp'
        ],
        pages: []
      };

      const pages = await newsletterService.getNewsletterWebpPages(sampleEdition);
      expect(pages).toHaveLength(2);
      expect(pages[0]).toContain('page-1.webp');
      expect(pages[1]).toContain('page-2.webp');
    });

    it('generates high-fidelity WebP page vector representations if edition lacks remote pages', async () => {
      const editionWithoutWebp: NewsletterEdition = {
        id: 'test-edition-generate',
        title: 'Quantum Leap',
        issueNo: 'Issue #99',
        date: 'October 2026',
        month: 'October',
        year: '2026',
        category: 'Physics',
        theme: 'Quantum',
        icon: '⚛️',
        color: '#0284c7',
        accent: 'rgba(2, 132, 199, 0.2)',
        summary: 'Quantum computing breakthroughs at BMCE.',
        highlights: ['Annealing', 'Qubits'],
        pdfUrl: 'https://example.com/quantum.pdf',
        pages: [
          {
            pageNumber: 1,
            title: 'Qubits in Kerala',
            headline: 'Superconducting Circuits Lab',
            body: ['We tested quantum gates at low temperatures.']
          }
        ]
      };

      const pages = await newsletterService.getNewsletterWebpPages(editionWithoutWebp);
      expect(pages.length).toBeGreaterThanOrEqual(1);
      // Ensure SVG/WebP data URL or image is generated
      expect(pages[0]).toMatch(/^data:image\/svg\+xml/);
    });
  });

  describe('PDF Upload & Edge Function WebP Conversion Pipeline', () => {
    it('uploads PDF to storage and invokes convert-pdf-to-webp Edge Function', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.supabase.co/newsletters/edition-123/sample.pdf' } });
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          success: true,
          pageWebpUrls: [
            'https://storage.supabase.co/newsletter-pages/edition-123/page-1.webp',
            'https://storage.supabase.co/newsletter-pages/edition-123/page-2.webp',
            'https://storage.supabase.co/newsletter-pages/edition-123/page-3.webp'
          ],
          totalPages: 3
        },
        error: null
      });
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue({
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
          })
        },
        functions: {
          invoke: mockInvoke
        },
        rpc: mockRpc
      } as any);

      // Create a mock PDF File
      const mockPdfFile = new File(['%PDF-1.4 mock content'], 'sample.pdf', { type: 'application/pdf' });

      const newEdition = await newsletterService.uploadNewsletterPdf(
        mockPdfFile,
        {
          title: 'Autonomous Systems Weekly',
          issueNo: 'Issue #30',
          category: 'Robotics',
          summary: 'Payload drone testing'
        }
      );

      expect(mockUpload).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith(
        'convert-pdf-to-webp',
        expect.objectContaining({
          body: expect.objectContaining({
            title: 'Autonomous Systems Weekly',
            issueNo: 'Issue #30'
          })
        })
      );
      expect(newEdition.pageWebpUrls).toHaveLength(3);
      expect(newEdition.pageWebpUrls?.[0]).toContain('page-1.webp');
      expect(newEdition.conversionStatus).toBe('completed');
    });

    it('falls back to background job converter if Edge Function fails or is unreachable', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.supabase.co/newsletters/edition-fallback.pdf' } });
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Edge Function timeout'));

      vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue({
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl
          })
        },
        functions: {
          invoke: mockInvoke
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any);

      const mockPdfFile = new File(['%PDF-1.4 mock content'], 'edition_fallback.pdf', { type: 'application/pdf' });

      const newEdition = await newsletterService.uploadNewsletterPdf(
        mockPdfFile,
        {
          title: 'Fallback Edition',
          issueNo: 'Issue #31',
          category: 'Hardware'
        }
      );

      expect(newEdition.title).toBe('Fallback Edition');
      expect(newEdition.pageWebpUrls).toBeDefined();
      expect(newEdition.pageWebpUrls!.length).toBeGreaterThan(0);
      expect(newEdition.conversionStatus).toBe('completed');
    });
  });
});
