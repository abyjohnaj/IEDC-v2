import { describe, it, expect, beforeEach, vi } from 'vitest';
import { problemBankService } from './problemBankService';
import * as supabaseClientModule from './supabaseClient';

// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('problemBankService - Campus Challenge Repository', () => {
  beforeEach(() => {
    storageMap.clear();
    localStorage.clear();
    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(null);
  });

  it('loads default seed problems when storage is empty', async () => {
    const problems = await problemBankService.fetchProblems();
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]).toHaveProperty('title');
    expect(problems[0]).toHaveProperty('domain');
    expect(problems[0]).toHaveProperty('severity');
    expect(problems[0]).toHaveProperty('difficulty');
    expect(problems[0]).toHaveProperty('beneficiary');
  });

  it('filters challenges by domain and severity', async () => {
    const campusTech = await problemBankService.fetchProblems({ domain: 'Campus Tech' });
    expect(campusTech.every(p => p.domain === 'Campus Tech')).toBe(true);

    const critical = await problemBankService.fetchProblems({ severity: 'Critical' });
    expect(critical.every(p => p.severity === 'Critical')).toBe(true);
  });

  it('filters challenges using search query keyword', async () => {
    const searchResults = await problemBankService.fetchProblems({ search: 'Cashew' });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].title).toContain('Cashew');
  });

  it('creates a new challenge statement and saves it locally', async () => {
    const res = await problemBankService.createProblem({
      title: 'Automated Solar Water Still for Coastal Kollam',
      description: 'Solar desalination device for drinking water purification in coastal communities.',
      domain: 'CleanTech',
      severity: 'High',
      difficulty: 'Medium',
      beneficiary: 'Coastal Fishermen Families',
      tags: ['Solar', 'Water', 'CleanTech'],
      authorName: 'Test Student',
      authorRole: 'Student'
    });

    expect(res.success).toBe(true);
    expect(res.data?.id).toBeDefined();
    expect(res.data?.title).toBe('Automated Solar Water Still for Coastal Kollam');
    expect(res.data?.adoptedCount).toBe(0);

    const found = await problemBankService.getProblemById(res.data!.id);
    expect(found).not.toBeNull();
    expect(found?.beneficiary).toBe('Coastal Fishermen Families');
  });

  it('increments adoption counter when a student adopts a problem for pitching', async () => {
    const initialList = await problemBankService.fetchProblems();
    const target = initialList[0];
    const initialCount = target.adoptedCount || 0;

    const success = await problemBankService.adoptProblem(target.id);
    expect(success).toBe(true);

    const updated = await problemBankService.getProblemById(target.id);
    expect(updated?.adoptedCount).toBe(initialCount + 1);
  });
});
