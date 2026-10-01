import { getSupabase } from './supabaseClient';
import { INITIAL_IDEAS } from './ideaBoxService';
import { initialForumDiscussions } from '../data/forumData';

export interface SearchResultItem {
  id: string;
  type: 'idea' | 'forum_post';
  title: string;
  snippet: string;
  category: string;
  url: string;
  author_name: string;
  rank?: number;
  similarity?: number;
  created_at?: string;
}

/**
 * Trigram-like similarity calculation between two strings (0.0 to 1.0)
 * Includes word_similarity behavior like pg_trgm
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();
  if (!strA || !strB) return 0;
  if (strA === strB) return 1;

  if (strA.includes(strB) || strB.includes(strA)) {
    return Math.max(0.6, Math.min(strA.length, strB.length) / Math.max(strA.length, strB.length));
  }

  const getTrigrams = (str: string): Set<string> => {
    const padded = `  ${str} `;
    const trigrams = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) {
      trigrams.add(padded.substring(i, i + 3));
    }
    return trigrams;
  };

  const trigramScore = (s1: string, s2: string): number => {
    const t1 = getTrigrams(s1);
    const t2 = getTrigrams(s2);
    let common = 0;
    t1.forEach(tri => {
      if (t2.has(tri)) common++;
    });
    const union = t1.size + t2.size - common;
    return union > 0 ? common / union : 0;
  };

  const fullScore = trigramScore(strA, strB);

  // Test words of strA against strB
  const wordsA = strA.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  // Test words of strB against strA
  const wordsB = strB.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);

  let bestWordScore = 0;
  for (const wA of wordsA) {
    for (const wB of wordsB) {
      const score = trigramScore(wA, wB);
      if (score > bestWordScore) bestWordScore = score;
    }
    const scoreSingle = trigramScore(wA, strB);
    if (scoreSingle > bestWordScore) bestWordScore = scoreSingle;
  }

  for (const wB of wordsB) {
    const scoreSingle = trigramScore(strA, wB);
    if (scoreSingle > bestWordScore) bestWordScore = scoreSingle;
  }

  return Math.max(fullScore, bestWordScore);
}

/**
 * Client-side fallback search across in-memory ideas and forum posts
 */
export function searchContentLocally(query: string): SearchResultItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const results: SearchResultItem[] = [];

  // 1. Search ideas
  INITIAL_IDEAS.forEach(idea => {
    const titleSim = calculateTrigramSimilarity(idea.title, clean);
    const domainSim = calculateTrigramSimilarity(idea.domain, clean);
    const solutionSim = calculateTrigramSimilarity(idea.proposedSolution, clean);
    const maxSim = Math.max(titleSim, domainSim, solutionSim);

    const matchesSubstring = 
      idea.title.toLowerCase().includes(clean) ||
      idea.domain.toLowerCase().includes(clean) ||
      idea.proposedSolution.toLowerCase().includes(clean) ||
      (idea.elevatorPitch && idea.elevatorPitch.toLowerCase().includes(clean)) ||
      idea.authorName.toLowerCase().includes(clean);

    if (maxSim > 0.15 || matchesSubstring) {
      results.push({
        id: idea.id,
        type: 'idea',
        title: idea.title,
        snippet: idea.elevatorPitch || idea.proposedSolution.slice(0, 140) + '...',
        category: idea.domain,
        url: `/ideabox?idea=${idea.id}`,
        author_name: idea.authorName,
        similarity: maxSim,
        rank: matchesSubstring ? 0.8 : maxSim
      });
    }
  });

  // 2. Search forum discussions
  initialForumDiscussions.forEach(thread => {
    const titleSim = calculateTrigramSimilarity(thread.title, clean);
    const excerptSim = calculateTrigramSimilarity(thread.excerpt, clean);
    const channelSim = calculateTrigramSimilarity(thread.channel, clean);
    const maxSim = Math.max(titleSim, excerptSim, channelSim);

    const matchesSubstring = 
      thread.title.toLowerCase().includes(clean) ||
      thread.excerpt.toLowerCase().includes(clean) ||
      thread.channel.toLowerCase().includes(clean) ||
      thread.authorName.toLowerCase().includes(clean);

    if (maxSim > 0.15 || matchesSubstring) {
      results.push({
        id: thread.id,
        type: 'forum_post',
        title: thread.title,
        snippet: thread.excerpt.slice(0, 140) + '...',
        category: thread.channel,
        url: `/forum?thread=${thread.id}`,
        author_name: thread.authorName,
        similarity: maxSim,
        rank: matchesSubstring ? 0.8 : maxSim
      });
    }
  });

  // Sort by rank and similarity
  return results.sort((a, b) => ((b.rank || 0) + (b.similarity || 0)) - ((a.rank || 0) + (a.similarity || 0)));
}

/**
 * Executes full-text + trigram fuzzy search via Supabase RPC search_content(query),
 * with resilient client-side fallback.
 */
export async function searchContent(query: string): Promise<SearchResultItem[]> {
  const clean = query.trim();
  if (!clean) return [];

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('search_content', { query: clean });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data as SearchResultItem[];
      }
    } catch (err) {
      console.warn('search_content RPC call encountered an issue, falling back to local search:', err);
    }
  }

  return searchContentLocally(clean);
}
