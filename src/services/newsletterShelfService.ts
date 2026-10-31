import { NewsletterShelf, NewsletterEdition, NewsletterPageContent } from '../types';
import { newsletterLibraryData } from '../data/newsletterLibraryData';

const SHELVES_STORAGE_KEY = 'iedc_newsletter_shelves_v1';
const PUBLICATIONS_STORAGE_KEY = 'iedc_newsletter_publications_v1';

export const DEFAULT_SHELVES: NewsletterShelf[] = [
  {
    id: 'spotlight',
    name: 'Spotlight & Handbooks',
    tag: 'Latest 2026',
    description: 'Flagship publications, high-impact releases, and handbook editions',
    order: 1,
    isCustom: false
  },
  {
    id: '2026-monthly',
    name: '2026 Monthly Newsletters',
    tag: 'Volume 3',
    description: 'Monthly student startup highlights, technology breakthroughs, and events',
    order: 2,
    isCustom: false
  },
  {
    id: '2025-archive',
    name: '2025 Archive Editions',
    tag: 'Volume 2',
    description: 'Previous year publications documenting campus incubation journey',
    order: 3,
    isCustom: false
  },
  {
    id: 'classics',
    name: 'Founding Editions & Specials',
    tag: 'Volume 1 & Huddle',
    description: 'First generation issues, foundation publications, and Huddle Global coverage',
    order: 4,
    isCustom: false
  }
];

class NewsletterShelfService {
  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to changes (new shelf created, publication added/deleted)
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in newsletterShelfService subscriber:', err);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Shelves Operations
  // --------------------------------------------------------------------------

  public getShelves(): NewsletterShelf[] {
    try {
      const stored = localStorage.getItem(SHELVES_STORAGE_KEY);
      if (stored) {
        const parsed: NewsletterShelf[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read stored shelves:', e);
    }
    // Default fallback
    this.saveShelves(DEFAULT_SHELVES);
    return [...DEFAULT_SHELVES];
  }

  private saveShelves(shelves: NewsletterShelf[]) {
    try {
      localStorage.setItem(SHELVES_STORAGE_KEY, JSON.stringify(shelves));
    } catch (e) {
      console.warn('Could not save shelves to localStorage:', e);
    }
  }

  public createShelf(name: string, tag = 'Special', description = ''): NewsletterShelf {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Shelf name is required');
    }

    const currentShelves = this.getShelves();
    const id = `shelf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newShelf: NewsletterShelf = {
      id,
      name: trimmedName,
      tag: tag.trim() || 'Custom',
      description: description.trim(),
      order: currentShelves.length + 1,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updated = [...currentShelves, newShelf];
    this.saveShelves(updated);
    this.notify();
    return newShelf;
  }

  public updateShelf(id: string, updates: Partial<NewsletterShelf>): NewsletterShelf | null {
    const currentShelves = this.getShelves();
    const idx = currentShelves.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    currentShelves[idx] = {
      ...currentShelves[idx],
      ...updates
    };

    this.saveShelves(currentShelves);
    this.notify();
    return currentShelves[idx];
  }

  public deleteShelf(id: string): boolean {
    const currentShelves = this.getShelves();
    const filtered = currentShelves.filter((s) => s.id !== id);
    if (filtered.length === currentShelves.length) return false;

    this.saveShelves(filtered);
    this.notify();
    return true;
  }

  // --------------------------------------------------------------------------
  // Publications Operations
  // --------------------------------------------------------------------------

  public getAllPublications(): NewsletterEdition[] {
    let customEditions: NewsletterEdition[] = [];
    try {
      const stored = localStorage.getItem(PUBLICATIONS_STORAGE_KEY);
      if (stored) {
        customEditions = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read stored publications:', e);
    }

    // Default base mapping for existing static editions
    const baseWithShelves: NewsletterEdition[] = newsletterLibraryData.map((e) => {
      let shelfId = e.shelfId;
      if (!shelfId) {
        if (e.id === 'edition-24' || e.id === 'handbook-we-2026' || e.id === 'edition-23') {
          shelfId = 'spotlight';
        } else if (e.year === '2026') {
          shelfId = '2026-monthly';
        } else if (e.year === '2025') {
          shelfId = '2025-archive';
        } else {
          shelfId = 'classics';
        }
      }
      return {
        ...e,
        shelfId
      };
    });

    const customIds = new Set(customEditions.map((c) => c.id));
    const merged = [...customEditions, ...baseWithShelves.filter((b) => !customIds.has(b.id))];
    return merged;
  }

  private saveCustomPublications(pubs: NewsletterEdition[]) {
    try {
      localStorage.setItem(PUBLICATIONS_STORAGE_KEY, JSON.stringify(pubs));
    } catch (e) {
      console.warn('Could not save custom publications:', e);
    }
  }

  public async createPublication(data: {
    title: string;
    issueNo: string;
    subtitle?: string;
    shelfId: string;
    category?: string;
    date?: string;
    author?: string;
    summary?: string;
    coverImage?: string;
    coverStyle?: string;
    pages?: NewsletterPageContent[];
    pdfUrl?: string;
    pdfFile?: File;
  }): Promise<NewsletterEdition> {
    const title = data.title.trim();
    if (!title) throw new Error('Publication title is required');

    const issueNo = data.issueNo.trim() || `Issue #${Date.now().toString().slice(-4)}`;
    const shelfId = data.shelfId || 'spotlight';
    const id = `pub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const dateStr = data.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthStr = dateStr.split(' ')[0] || 'Recent';
    const yearStr = dateStr.split(' ')[1] || String(new Date().getFullYear());

    // Generate readable pages for the flipbook reader
    let pages = data.pages;
    if (!pages || pages.length === 0) {
      pages = [
        {
          pageNumber: 1,
          title: title,
          headline: data.subtitle || title,
          body: [
            data.summary || 'Official publication released by IEDC BMCE.',
            'This edition captures innovation stories, startup highlights, research breakthroughs, and campus technology milestones.',
            'Read full coverage, student project showcases, and mentorship insights in the official campus archive.'
          ],
          callout: `Published in ${dateStr} for BMCE Innovators.`,
          author: data.author || 'BMCE Editorial Bureau'
        },
        {
          pageNumber: 2,
          title: 'Special Feature',
          headline: 'Innovation & Incubation Highlights',
          body: [
            'Our entrepreneurship cell continues to bridge students with Kerala Startup Mission (KSUM) grant corridors and seed funding opportunities.',
            'Explore the full archive on the IEDC BMCE Library shelves for previous editions and technical blueprints.'
          ],
          callout: 'Open access academic publication.',
          author: 'By IEDC Nodal Secretariat'
        }
      ];
    }

    const newPublication: NewsletterEdition = {
      id,
      title,
      subtitle: data.subtitle?.trim() || '',
      issueNo,
      shelfId,
      category: data.category || 'Technology',
      date: dateStr,
      month: monthStr,
      year: yearStr,
      tier: 1,
      angleIndex: 0,
      readTime: '6 min read',
      author: data.author?.trim() || 'BMCE Editorial Bureau',
      theme: title,
      icon: '📖',
      color: '#0284c7',
      accent: 'rgba(2, 132, 199, 0.2)',
      spineColor: '#1e3a8a',
      coverStyle: (data.coverStyle as any) || 'navy',
      coverImage: data.coverImage || '',
      summary: data.summary?.trim() || `${title} published by IEDC BMCE.`,
      highlights: ['Official Digital Release', 'Open Access'],
      pdfUrl: data.pdfUrl || 'https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing',
      pages,
      isCustom: true,
      uploadedAt: new Date().toISOString()
    };

    // Save to custom publications in localStorage
    const stored = this.getCustomPublications();
    const updated = [newPublication, ...stored];
    this.saveCustomPublications(updated);
    this.notify();
    return newPublication;
  }

  public getCustomPublications(): NewsletterEdition[] {
    try {
      const stored = localStorage.getItem(PUBLICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read custom publications:', e);
    }
    return [];
  }

  public deletePublication(id: string): boolean {
    const stored = this.getCustomPublications();
    const filtered = stored.filter((p) => p.id !== id);
    if (filtered.length === stored.length) return false;

    this.saveCustomPublications(filtered);
    this.notify();
    return true;
  }

  /**
   * Helper to organize publications grouped by shelf
   */
  public getShelvesWithPublications(): { shelf: NewsletterShelf; publications: NewsletterEdition[] }[] {
    const shelves = this.getShelves();
    const publications = this.getAllPublications();

    return shelves.map((shelf) => {
      const pubs = publications.filter((p) => p.shelfId === shelf.id);
      return {
        shelf,
        publications: pubs
      };
    });
  }
}

export const newsletterShelfService = new NewsletterShelfService();
