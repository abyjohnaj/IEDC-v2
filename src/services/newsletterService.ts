import { NewsletterEdition } from '../types';
import { newsletterLibraryData } from '../data/newsletterLibraryData';

/**
 * Newsletter Service
 * 
 * Provides an abstracted data access layer for newsletter releases.
 * Designed to easily switch between local static data, Supabase, Firebase,
 * Headless CMS, or REST endpoints without refactoring visual components.
 */
class NewsletterService {
  private cache: NewsletterEdition[] = newsletterLibraryData;

  /**
   * Fetch all newsletter editions ordered by release / tier
   */
  public async getAllNewsletters(): Promise<NewsletterEdition[]> {
    return Promise.resolve([...this.cache]);
  }

  /**
   * Fetch a single newsletter edition by ID
   */
  public async getNewsletterById(id: string): Promise<NewsletterEdition | undefined> {
    const found = this.cache.find(item => item.id === id);
    return Promise.resolve(found ? { ...found } : undefined);
  }

  /**
   * Fetch a single newsletter edition by Issue number
   */
  public async getNewsletterByIssue(issue: number | string): Promise<NewsletterEdition | undefined> {
    const found = this.cache.find(item => String(item.issue) === String(issue));
    return Promise.resolve(found ? { ...found } : undefined);
  }

  /**
   * Fetch newsletters positioned on a specific shelf tier (1 = top, 4 = bottom)
   */
  public async getNewslettersByTier(tier: number): Promise<NewsletterEdition[]> {
    const results = this.cache.filter(item => item.tier === tier);
    return Promise.resolve(results);
  }

  /**
   * Get unique categories across all editions
   */
  public async getAvailableCategories(): Promise<string[]> {
    const categories = Array.from(new Set(this.cache.map(item => item.category || 'General')));
    return Promise.resolve(categories);
  }

  /**
   * Search newsletters by keyword across title, subtitle, summary, and highlights
   */
  public async searchNewsletters(query: string): Promise<NewsletterEdition[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllNewsletters();

    const results = this.cache.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      item.highlights.some(h => h.toLowerCase().includes(q))
    );

    return Promise.resolve(results);
  }
}

export const newsletterService = new NewsletterService();
