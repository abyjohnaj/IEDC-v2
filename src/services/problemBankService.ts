import { getSupabase } from './supabaseClient';
import { ProblemStatement, ProblemSeverity, ProblemDifficulty } from '../types';

const LOCAL_PROBLEMS_KEY = 'iedc_problem_statements_store';

const DEFAULT_PROBLEMS: ProblemStatement[] = [
  {
    id: 'prob-1',
    title: 'KTU Automated Attendance & Lab Equipment Utilization Telemetry',
    description: 'Manual attendance and equipment logbooks in engineering computer labs and workshops cause administrative overhead and resource idling. A real-time IoT/RFID or vision-assisted check-in telemetry system can log lab utilization directly to KTU academic portals.',
    domain: 'Campus Tech',
    severity: 'High',
    difficulty: 'Medium',
    beneficiary: 'BMCE Students & Department Faculty',
    tags: ['IoT', 'Automation', 'Campus Tech', 'RFID', 'Telemetry'],
    authorName: 'Prof. Nodal Officer',
    authorRole: 'Faculty Nodal Officer',
    adoptedCount: 3,
    status: 'In Progress',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'prob-2',
    title: 'Cashew Processing Waste Heat & Shell Liquid (CNSL) Recovery for Kollam Mills',
    description: 'Local cashew processing units in Kollam district release significant roasting waste heat and struggle with eco-friendly cashew nut shell liquid (CNSL) recovery and value addition. A localized thermodynamic or bio-fuel conversion prototype can generate revenue and reduce emissions.',
    domain: 'Agriculture & Rural',
    severity: 'Critical',
    difficulty: 'Advanced',
    beneficiary: 'Kollam District Cashew Workers & Small Mill Operators',
    tags: ['Agriculture', 'BioEnergy', 'Sustainability', 'Hardware', 'Kollam'],
    authorName: 'Er. Industry Liaison',
    authorRole: 'IEDC Advisory Board',
    adoptedCount: 2,
    status: 'Active',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'prob-3',
    title: 'Campus Micro-Grid Solar Energy Load Balancing During Peak Hours',
    description: 'BMCE campus generates 80kW solar rooftop energy but suffers from peak imbalances when power electronics and high-load servers run concurrently. An intelligent microcontroller-based load balancer with battery storage telemetry can cut peak grid tariff expenses.',
    domain: 'Clean Energy',
    severity: 'High',
    difficulty: 'Advanced',
    beneficiary: 'College Administration & Energy Sustainability Wing',
    tags: ['Solar', 'SmartGrid', 'Hardware', 'CleanTech', 'Microcontroller'],
    authorName: 'Electrical & Electronics Dept',
    authorRole: 'Faculty Mentor',
    adoptedCount: 1,
    status: 'Active',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'prob-4',
    title: 'Offline-First Landslide & Flood Early Warning Mesh for Western Ghats Foothills',
    description: 'Mountainous and foothill regions across eastern Kollam and Pathanamthitta lose cellular reception during severe monsoon cloudbursts. A low-cost solar LoRa mesh network of soil-moisture and tilt sensors can broadcast audible sirens and offline SMS alerts before slope failure.',
    domain: 'Disaster Management',
    severity: 'Critical',
    difficulty: 'Advanced',
    beneficiary: 'Foothill Rural Communities & Panchayath Disaster Teams',
    tags: ['LoRa', 'Offline', 'Sensors', 'DisasterTech', 'RuralSafety'],
    authorName: 'Civil & Mechanical Dept',
    authorRole: 'Department Coordinator',
    adoptedCount: 4,
    status: 'In Progress',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prob-5',
    title: 'Decentralized Campus Textbook & Scientific Calculator Exchange',
    description: 'Junior students often purchase expensive semester textbooks and scientific calculators that seniors no longer use after passing exams. An escrowed peer-to-peer campus book swap platform can eliminate paper waste and cut textbook expenses by 70%.',
    domain: 'EdTech',
    severity: 'Moderate',
    difficulty: 'Beginner',
    beneficiary: 'BMCE 1st and 2nd Year B.Tech Students',
    tags: ['EdTech', 'CampusCircularEconomy', 'Web', 'P2P'],
    authorName: 'Student Executive Lead',
    authorRole: 'Student Lead',
    adoptedCount: 5,
    status: 'Active',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

function getLocalProblems(): ProblemStatement[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_PROBLEMS;
    const raw = localStorage.getItem(LOCAL_PROBLEMS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PROBLEMS_KEY, JSON.stringify(DEFAULT_PROBLEMS));
      return DEFAULT_PROBLEMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROBLEMS;
  }
}

function saveLocalProblems(problems: ProblemStatement[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_PROBLEMS_KEY, JSON.stringify(problems));
  } catch (err) {
    console.warn('Failed to save problems locally:', err);
  }
}

export const problemBankService = {
  async fetchProblems(filters?: {
    domain?: string;
    severity?: string;
    difficulty?: string;
    status?: string;
    search?: string;
  }): Promise<ProblemStatement[]> {
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb.from('problem_statements').select('*');
        if (filters?.domain && filters.domain !== 'All') {
          query = query.eq('domain', filters.domain);
        }
        if (filters?.severity && filters.severity !== 'All') {
          query = query.eq('severity', filters.severity);
        }
        if (filters?.difficulty && filters.difficulty !== 'All') {
          query = query.eq('difficulty', filters.difficulty);
        }
        if (filters?.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: ProblemStatement[] = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            domain: row.domain,
            severity: row.severity as ProblemSeverity,
            difficulty: row.difficulty as ProblemDifficulty,
            beneficiary: row.beneficiary,
            tags: row.tags || [],
            postedBy: row.posted_by,
            authorName: row.author_name,
            authorRole: row.author_role,
            adoptedCount: row.adopted_count || 0,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          // Also filter search query in memory
          if (filters?.search && filters.search.trim()) {
            const q = filters.search.toLowerCase();
            return mapped.filter(p => 
              p.title.toLowerCase().includes(q) || 
              p.description.toLowerCase().includes(q) || 
              p.tags.some(t => t.toLowerCase().includes(q))
            );
          }
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch problems error, falling back to local:', err);
      }
    }

    // Local Fallback
    let items = getLocalProblems();
    if (filters?.domain && filters.domain !== 'All') {
      items = items.filter(p => p.domain === filters.domain);
    }
    if (filters?.severity && filters.severity !== 'All') {
      items = items.filter(p => p.severity === filters.severity);
    }
    if (filters?.difficulty && filters.difficulty !== 'All') {
      items = items.filter(p => p.difficulty === filters.difficulty);
    }
    if (filters?.status && filters.status !== 'All') {
      items = items.filter(p => p.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      items = items.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  },

  async getProblemById(id: string): Promise<ProblemStatement | null> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('problem_statements')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            description: data.description,
            domain: data.domain,
            severity: data.severity as ProblemSeverity,
            difficulty: data.difficulty as ProblemDifficulty,
            beneficiary: data.beneficiary,
            tags: data.tags || [],
            postedBy: data.posted_by,
            authorName: data.author_name,
            authorRole: data.author_role,
            adoptedCount: data.adopted_count || 0,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('Supabase fetch single problem error:', err);
      }
    }

    const local = getLocalProblems().find(p => p.id === id);
    return local || null;
  },

  async createProblem(problem: {
    title: string;
    description: string;
    domain: string;
    severity: ProblemSeverity;
    difficulty: ProblemDifficulty;
    beneficiary: string;
    tags: string[];
    authorName: string;
    authorRole: string;
  }): Promise<{ success: boolean; data?: ProblemStatement; error?: string }> {
    const sb = getSupabase();
    if (sb) {
      try {
        const user = (await sb.auth.getUser()).data.user;
        const insertPayload = {
          title: problem.title,
          description: problem.description,
          domain: problem.domain,
          severity: problem.severity,
          difficulty: problem.difficulty,
          beneficiary: problem.beneficiary,
          tags: problem.tags,
          author_name: problem.authorName,
          author_role: problem.authorRole,
          posted_by: user?.id || null
        };

        const { data, error } = await sb
          .from('problem_statements')
          .insert([insertPayload])
          .select()
          .single();

        if (!error && data) {
          const created: ProblemStatement = {
            id: data.id,
            title: data.title,
            description: data.description,
            domain: data.domain,
            severity: data.severity,
            difficulty: data.difficulty,
            beneficiary: data.beneficiary,
            tags: data.tags,
            postedBy: data.posted_by,
            authorName: data.author_name,
            authorRole: data.author_role,
            adoptedCount: 0,
            status: 'Active',
            createdAt: data.created_at
          };

          // Cache locally
          const local = getLocalProblems();
          saveLocalProblems([created, ...local]);
          return { success: true, data: created };
        }
      } catch (err: any) {
        console.warn('Error inserting problem into Supabase:', err);
      }
    }

    // Local fallback creation
    const localCreated: ProblemStatement = {
      id: `prob-local-${Date.now()}`,
      ...problem,
      adoptedCount: 0,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    const current = getLocalProblems();
    saveLocalProblems([localCreated, ...current]);
    return { success: true, data: localCreated };
  },

  async adoptProblem(id: string): Promise<boolean> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data } = await sb.from('problem_statements').select('adopted_count').eq('id', id).maybeSingle();
        if (data) {
          await sb
            .from('problem_statements')
            .update({ adopted_count: (data.adopted_count || 0) + 1 })
            .eq('id', id);
        }
      } catch (e) {
        console.warn('Could not update remote adopted_count:', e);
      }
    }

    // Local fallback update
    const list = getLocalProblems();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx].adoptedCount = (list[idx].adoptedCount || 0) + 1;
      saveLocalProblems(list);
    }
    return true;
  }
};
