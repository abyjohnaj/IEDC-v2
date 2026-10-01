import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  calculateTrigramSimilarity, 
  searchContentLocally, 
  searchContent 
} from './searchService';
import * as supabaseClientModule from './supabaseClient';

describe('searchService & fuzzy matching engine', () => {
  describe('calculateTrigramSimilarity', () => {
    it('returns 1 for identical strings regardless of casing and trim', () => {
      expect(calculateTrigramSimilarity('AgriDrone AI', '  agridrone ai ')).toBe(1);
    });

    it('returns 0 for empty or null strings', () => {
      expect(calculateTrigramSimilarity('', 'test')).toBe(0);
      expect(calculateTrigramSimilarity('test', '')).toBe(0);
    });

    it('computes positive similarity for typo variations', () => {
      const sim = calculateTrigramSimilarity('EcoCharge', 'EcoCharg');
      expect(sim).toBeGreaterThan(0.5);
    });

    it('returns 0 for completely disjoint tokens', () => {
      const sim = calculateTrigramSimilarity('apple', 'quantum');
      expect(sim).toBe(0);
    });
  });

  describe('searchContentLocally', () => {
    it('returns empty array when query is blank', () => {
      expect(searchContentLocally('')).toEqual([]);
      expect(searchContentLocally('   ')).toEqual([]);
    });

    it('finds idea results by keyword in title or solution', () => {
      const results = searchContentLocally('AgriDrone');
      expect(results.length).toBeGreaterThan(0);
      const agri = results.find(r => r.title.includes('AgriDrone'));
      expect(agri).toBeDefined();
      expect(agri?.type).toBe('idea');
      expect(agri?.url).toContain('/ideabox?idea=');
    });

    it('finds forum discussions by keyword in title or channel', () => {
      const results = searchContentLocally('EcoCharge');
      expect(results.length).toBeGreaterThan(0);
      const eco = results.find(r => r.title.includes('EcoCharge'));
      expect(eco).toBeDefined();
      expect(eco?.type).toBe('forum_post');
      expect(eco?.url).toContain('/forum?thread=');
    });

    it('supports fuzzy typo matching across ideas and forum posts', () => {
      // "Hydrogrd" has a typo for "HydroGuard"
      const results = searchContentLocally('hydrogrd');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.toLowerCase().includes('hydroguard'))).toBe(true);
    });
  });

  describe('searchContent (RPC integration & fallback)', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls Supabase search_content RPC and returns results when available', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'rpc-idea-1',
            type: 'idea',
            title: 'Solar Prototyping',
            snippet: 'Clean energy for lab',
            category: 'Energy',
            url: '/ideabox?idea=rpc-idea-1',
            author_name: 'Devika',
            rank: 1.2,
            similarity: 0.9,
            created_at: new Date().toISOString()
          }
        ],
        error: null
      });

      vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue({
        rpc: mockRpc
      } as any);

      const results = await searchContent('Solar');
      expect(mockRpc).toHaveBeenCalledWith('search_content', { query: 'Solar' });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Solar Prototyping');
    });

    it('falls back to local search if Supabase RPC fails', async () => {
      vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue({
        rpc: vi.fn().mockRejectedValue(new Error('Network error'))
      } as any);

      const results = await searchContent('AgriDrone');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.includes('AgriDrone'))).toBe(true);
    });
  });
});
