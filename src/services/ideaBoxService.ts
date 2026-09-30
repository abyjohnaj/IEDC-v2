import { IdeaBoxSubmission, IdeaComment, IdeaStatus, IdeaStage } from '../types';
import { getSupabase } from './supabaseClient';

// Rich initial startup ideas for BMCE Innovators
export const INITIAL_IDEAS: IdeaBoxSubmission[] = [
  {
    id: 'idea-agridrone-01',
    title: 'AgriDrone AI: Hyperspectral Crop Pathology Detection',
    domain: 'AgriTech & AI',
    elevatorPitch: 'Autonomous drone payload with multispectral computer vision for real-time fungal outbreak and nutrient deficiency mapping in rubber and tea plantations.',
    problemStatement: 'Rubber and spice plantation farmers in Kerala suffer up to 34% crop yield destruction annually from fungal leaf fall and bud rot because early warning symptoms are undetectable from the ground level.',
    proposedSolution: 'A custom lightweight hexacopter fitted with calibrated multispectral camera lenses and an on-board NVIDIA Jetson edge inference model trained on Kerala plantation diseases that flags infected trees via GPS coordinates within 10 minutes of flight.',
    techStack: ['NVIDIA Jetson Orin Nano', 'PyTorch / YOLOv9', 'ROS 2', 'PX4 Autopilot', 'FastAPI & React Dashboard'],
    stage: 'Prototype',
    targetAudience: 'Estate managers, Rubber Board cooperatives, and smallholder spices cultivators in Kerala.',
    estimatedBudget: '₹1,85,000 for Field Testing & Sensor Array',
    authorId: 'usr_rahul_01',
    authorName: 'Rahul Verma',
    authorEmail: 'rahul@bmce.ac.in',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorRole: 'Innovator',
    authorDepartment: 'Computer Science & Engineering',
    upvotes: 42,
    upvoters: ['usr_anjana_02', 'usr_devika_execom', 'usr_arun_external'],
    commentsCount: 2,
    comments: [
      {
        id: 'c-1',
        authorId: 'usr_devika_execom',
        authorName: 'Devika Suresh',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        authorRole: 'Execom Lead',
        text: 'Phenomenal progress, Rahul! We can arrange testing at the BMCE Agricultural boundary field and connect you with the Kollam Rubber Research mentor.',
        createdAt: '2026-02-18T14:30:00Z'
      },
      {
        id: 'c-2',
        authorId: 'usr_arun_external',
        authorName: 'Arun Kumar',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        authorRole: 'External Hacker',
        text: 'Have you calibrated the PX4 flight controller against high canopy gust winds? I have experience in ROS 2 quadcopter tuning if you want to team up!',
        createdAt: '2026-02-20T09:15:00Z'
      }
    ],
    status: 'Incubation Approved',
    adminRating: 5,
    adminFeedback: 'Exceptional proposal with tangible state agricultural relevance. Pre-incubation seed grant of ₹50,000 approved from IEDC BMCE prototyping allocation. Assigned Dr. Thomas (ECE IoT Lab) as technical mentor.',
    adminReviewedBy: 'Dr. Preetha M. (IEDC Nodal Officer)',
    adminReviewedAt: '2026-02-22T11:00:00Z',
    incubatorTrackAssigned: 'Robotics & Hardware Prototyping Lab (Bay 2)',
    createdAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'idea-hydroguard-02',
    title: 'HydroGuard: IoT Backwater Microplastic & Heavy Metal Sentinel',
    domain: 'CleanTech & IoT',
    elevatorPitch: 'Solar-powered floating buoys utilizing optical absorption spectrometry and electrochemical probes to continuously detect industrial effluents and microplastics in Kerala waterways.',
    problemStatement: 'Ashtamudi Lake and Sasthamcotta freshwater lakes face chronic unmonitored effluent seepage, affecting drinking water supply and aquatic ecosystems without 24x7 telemetry.',
    proposedSolution: 'Buoyant ESP32 telemetry nodes equipped with optical turbidity sensors, pH, TDS, and micro-spectrometers that stream real-time water quality indices over LoRaWAN directly to the municipal pollution dashboard.',
    techStack: ['ESP32 LoRa', 'Electrochemical Probes', 'ThingsBoard IoT', 'Solar MPPT', 'Tailored Spectrometry'],
    stage: 'Prototype',
    targetAudience: 'Kerala State Pollution Control Board, Municipal Corporations, Aquaculture Farms.',
    estimatedBudget: '₹95,000 for 4-Node Test Mesh',
    authorId: 'usr_anjana_02',
    authorName: 'Anjana Pillai',
    authorEmail: 'anjana@bmce.ac.in',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    authorRole: 'Student',
    authorDepartment: 'Artificial Intelligence & Data Science',
    upvotes: 31,
    upvoters: ['usr_rahul_01', 'usr_aditya_03'],
    commentsCount: 1,
    comments: [
      {
        id: 'c-3',
        authorId: 'usr_rahul_01',
        authorName: 'Rahul Verma',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        authorRole: 'Innovator',
        text: 'The solar MPPT casing will need IP68 marine grade sealing. You can 3D print the waterproof prototype in our IEDC Fab Lab!',
        createdAt: '2026-02-25T16:20:00Z'
      }
    ],
    status: 'Shortlisted',
    adminRating: 4,
    adminFeedback: 'High social and ecological value. Shortlisted for the KSUM Idea Grant pitching round. Please refine sensor calibration data and long-term biofouling mitigation plan before the final presentation.',
    adminReviewedBy: 'Dr. Preetha M. (IEDC Nodal Officer)',
    adminReviewedAt: '2026-03-01T15:00:00Z',
    incubatorTrackAssigned: 'CleanTech & Environmental Sensing',
    createdAt: '2026-02-24T12:00:00Z'
  },
  {
    id: 'idea-neurosense-03',
    title: 'NeuroSense: Low-Cost EMG Myoelectric Bionic Hand with Haptic Feedback',
    domain: 'HealthTech & Robotics',
    elevatorPitch: 'Affordable 3D-printed prosthetic bionic hand powered by surface EMG bio-potential sensors and lightweight servo tendons, costing under ₹15,000.',
    problemStatement: 'Commercial myoelectric prosthetic limbs in India cost between ₹3,00,000 to ₹12,00,000, putting functional bionic restoration beyond the financial reach of 92% of amputees.',
    proposedSolution: 'A modular multi-articulating prosthetic hand 3D printed with tough PETG-CF filament, driven by miniature high-torque metal gear servos and a custom 4-channel surface EMG sensor belt processed by an STM32 microcontroller with tactile vibro-haptic feedback.',
    techStack: ['STM32 ARM Cortex', 'Surface EMG Amplifiers', '3D Carbon-PETG', 'TinyML Grip Classification', 'Bluetooth App'],
    stage: 'Validation',
    targetAudience: 'Below-elbow amputees, rehabilitation clinics, and government prosthetic aid programs.',
    estimatedBudget: '₹1,20,000 for Patient Fitting & Clinical Testing',
    authorId: 'usr_arun_external',
    authorName: 'Arun Kumar',
    authorEmail: 'arun.kumar@tkmce.ac.in',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    authorRole: 'ExternalParticipant',
    authorDepartment: 'Mechanical & Mechatronics',
    upvotes: 56,
    upvoters: ['usr_rahul_01', 'usr_anjana_02', 'usr_devika_execom'],
    commentsCount: 1,
    comments: [
      {
        id: 'c-4',
        authorId: 'usr_devika_execom',
        authorName: 'Devika Suresh',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        authorRole: 'Execom Lead',
        text: 'This is inspiring! BMCE IEDC would be thrilled to co-incubate this under our Inter-Institutional Hackathon & Innovation alliance.',
        createdAt: '2026-03-02T10:11:00Z'
      }
    ],
    status: 'Mentorship Assigned',
    adminRating: 5,
    adminFeedback: 'Exceptional biomechatronics design and human impact. Assigned Dr. Rajesh (Biomedical Innovation) & Industry Partner Cybiolabs for clinical trial validation. Fast-tracked for KTU CERD seed grant nomination.',
    adminReviewedBy: 'Dr. Preetha M. (IEDC Nodal Officer)',
    adminReviewedAt: '2026-03-04T09:40:00Z',
    incubatorTrackAssigned: 'HealthTech & Assistive Devices Incubator',
    createdAt: '2026-02-28T08:30:00Z'
  },
  {
    id: 'idea-edu-vr-04',
    title: 'EduVR: Low-Bandwidth Spatial Chemistry & Physics Laboratories',
    domain: 'EdTech & WebXR',
    elevatorPitch: 'Lightweight WebXR physics and chemistry simulation engine allowing students in under-equipped rural schools to conduct interactive lab experiments on mobile browsers.',
    problemStatement: 'Over 65% of rural secondary schools lack functional chemistry fume hoods and advanced physics apparatus, restricting STEM education to theoretical memorization.',
    proposedSolution: 'A procedural WebGL / Three.js physics sandbox running at 60fps on low-end Android phones and cardboard VR headsets, delivering interactive titration, orbital mechanics, and circuit assembly without expensive hardware.',
    techStack: ['Three.js / WebXR', 'TypeScript', 'Web Workers', 'PWA Offline Storage', 'Tailwind CSS'],
    stage: 'Ideation',
    targetAudience: 'State government high schools, rural tuition centers, and self-study students.',
    estimatedBudget: '₹45,000 for Content Digitization & Pilot Cloud Server',
    authorId: 'usr_aditya_03',
    authorName: 'Aditya Nair',
    authorEmail: 'aditya@bmce.ac.in',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorRole: 'Student',
    authorDepartment: 'Electronics & Communication',
    upvotes: 18,
    upvoters: ['usr_anjana_02'],
    commentsCount: 1,
    comments: [
      {
        id: 'c-5',
        authorId: 'usr_anjana_02',
        authorName: 'Anjana Pillai',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        authorRole: 'Student',
        text: 'Really love this concept! Make sure it works completely offline via Service Workers so schools with patchy 4G can load labs without interruption.',
        createdAt: '2026-03-05T13:45:00Z'
      }
    ],
    status: 'Under Review',
    adminRating: 3,
    adminFeedback: 'Promising EdTech initiative. We encourage the team to present a working demo of at least two interactive chemical reaction simulations at the upcoming Idea Forge Pitch Day.',
    adminReviewedBy: 'Dr. Preetha M. (IEDC Nodal Officer)',
    adminReviewedAt: '2026-03-06T17:00:00Z',
    incubatorTrackAssigned: 'Software & Digital EdTech',
    createdAt: '2026-03-03T11:20:00Z'
  }
];

function mapIdeaRow(row: any): IdeaBoxSubmission {
  const votes = Array.isArray(row.idea_votes) ? row.idea_votes : [];
  const commentsList = Array.isArray(row.ideabox_comments) 
    ? row.ideabox_comments.map((c: any): IdeaComment => ({
        id: c.id,
        authorId: c.author_id,
        authorName: c.author_name || 'Member',
        authorAvatar: c.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.author_id}`,
        authorRole: c.author_role || 'Student',
        text: c.text,
        createdAt: c.created_at
      }))
    : (Array.isArray(row.comments) ? row.comments : []);

  return {
    id: row.id,
    title: row.title,
    domain: row.domain,
    elevatorPitch: row.elevator_pitch || row.elevatorPitch || '',
    problemStatement: row.problem_statement || row.problemStatement || '',
    proposedSolution: row.proposed_solution || row.proposedSolution || '',
    techStack: row.tech_stack || row.techStack || [],
    stage: row.stage as IdeaStage,
    targetAudience: row.target_audience || row.targetAudience || '',
    estimatedBudget: row.estimated_budget || row.estimatedBudget,
    authorId: row.author_id || row.authorId,
    authorName: row.author_name || row.authorName,
    authorEmail: row.author_email || row.authorEmail,
    authorAvatar: row.author_avatar || row.authorAvatar,
    authorRole: row.author_role || row.authorRole,
    authorDepartment: row.author_department || row.authorDepartment,
    upvotes: row.upvotes ?? votes.length,
    upvoters: votes.map((v: { user_id: string }) => v.user_id),
    commentsCount: row.comments_count ?? commentsList.length,
    comments: commentsList,
    status: row.status as IdeaStatus,
    adminRating: row.admin_rating ?? row.adminRating,
    adminFeedback: row.admin_feedback || row.adminFeedback,
    adminReviewedBy: row.admin_reviewed_by || row.adminReviewedBy,
    adminReviewedAt: row.admin_reviewed_at || row.adminReviewedAt,
    incubatorTrackAssigned: row.incubator_track_assigned || row.incubatorTrackAssigned,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

export const ideaBoxService = {
  /**
   * Fetches ideas directly from Supabase (Single Source of Truth)
   */
  async getAllIdeas(filters?: {
    domain?: string;
    stage?: string;
    status?: string;
    searchQuery?: string;
  }): Promise<IdeaBoxSubmission[]> {
    const sb = getSupabase();
    if (!sb) {
      return INITIAL_IDEAS;
    }

    try {
      let query = sb
        .from('ideabox_submissions')
        .select('*, idea_votes(user_id), ideabox_comments(*)')
        .order('created_at', { ascending: false });

      if (filters?.domain && filters.domain !== 'All Domains') {
        query = query.eq('domain', filters.domain);
      }
      if (filters?.stage && filters.stage !== 'All') {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        let results = data.map(mapIdeaRow);
        if (filters?.searchQuery?.trim()) {
          const q = filters.searchQuery.toLowerCase();
          results = results.filter(i => 
            i.title.toLowerCase().includes(q) || 
            i.proposedSolution.toLowerCase().includes(q) ||
            i.authorName.toLowerCase().includes(q)
          );
        }
        return results;
      }

      // If database table is connected but empty, return sample seed items
      if (!error && (!data || data.length === 0)) {
        return INITIAL_IDEAS;
      }
    } catch (err) {
      console.warn('Supabase getAllIdeas exception, using initial ideas:', err);
    }

    return INITIAL_IDEAS;
  },

  async getIdeaById(id: string): Promise<IdeaBoxSubmission | null> {
    const sb = getSupabase();
    if (!sb) {
      return INITIAL_IDEAS.find(i => i.id === id) || null;
    }

    try {
      const { data, error } = await sb
        .from('ideabox_submissions')
        .select('*, idea_votes(user_id), ideabox_comments(*)')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapIdeaRow(data);
      }
    } catch (err) {
      console.warn('Supabase getIdeaById exception:', err);
    }

    return INITIAL_IDEAS.find(i => i.id === id) || null;
  },

  async submitIdea(submission: Omit<IdeaBoxSubmission, 'id' | 'upvotes' | 'upvoters' | 'commentsCount' | 'comments' | 'status' | 'createdAt'>): Promise<IdeaBoxSubmission> {
    const newIdeaId = `idea_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const sb = getSupabase();
    if (sb) {
      const { error: insertError } = await sb.from('ideabox_submissions').insert([{
        id: newIdeaId,
        title: submission.title,
        domain: submission.domain,
        elevator_pitch: submission.elevatorPitch,
        problem_statement: submission.problemStatement,
        proposed_solution: submission.proposedSolution,
        tech_stack: submission.techStack,
        stage: submission.stage,
        target_audience: submission.targetAudience,
        estimated_budget: submission.estimatedBudget,
        author_id: submission.authorId,
        author_name: submission.authorName,
        author_email: submission.authorEmail,
        author_avatar: submission.authorAvatar,
        author_role: submission.authorRole,
        author_department: submission.authorDepartment,
        status: 'Pending',
        created_at: now
      }]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Initial author vote via idea_votes
      if (submission.authorId && !submission.authorId.startsWith('usr_')) {
        await sb.from('idea_votes').insert([{
          idea_id: newIdeaId,
          user_id: submission.authorId
        }]);
      }
    }

    return {
      ...submission,
      id: newIdeaId,
      upvotes: 1,
      upvoters: [submission.authorId],
      commentsCount: 0,
      comments: [],
      status: 'Pending',
      createdAt: now
    };
  },

  /**
   * Toggles upvote on an idea via the atomic RPC
   */
  async toggleUpvote(ideaId: string, userId: string): Promise<{ upvotes: number; userHasUpvoted: boolean }> {
    const sb = getSupabase();
    if (sb && !userId.startsWith('usr_')) {
      const { data, error } = await sb.rpc('upvote_idea', { p_idea_id: ideaId });
      if (!error && data) {
        return {
          upvotes: data.upvotes,
          userHasUpvoted: data.hasVoted
        };
      }
      if (error) {
        console.warn('Supabase upvote_idea RPC error:', error);
      }
    }

    // Default simulation for demo persona accounts
    return { upvotes: 1, userHasUpvoted: true };
  },

  async addComment(ideaId: string, comment: Omit<IdeaComment, 'id' | 'createdAt'>): Promise<IdeaComment> {
    const commentId = `comm_${Date.now()}`;
    const now = new Date().toISOString();

    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('ideabox_comments').insert([{
        id: commentId,
        idea_id: ideaId,
        author_id: comment.authorId,
        author_name: comment.authorName,
        author_avatar: comment.authorAvatar,
        author_role: comment.authorRole,
        text: comment.text,
        created_at: now
      }]);

      if (error) {
        console.warn('Supabase addComment error:', error);
      }
    }

    return {
      ...comment,
      id: commentId,
      createdAt: now
    };
  },

  async adminReviewIdea(ideaId: string, review: {
    status: IdeaStatus;
    rating: number;
    feedback: string;
    reviewerName: string;
    incubatorTrack?: string;
  }): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('ideabox_submissions').update({
        status: review.status,
        admin_rating: review.rating,
        admin_feedback: review.feedback,
        admin_reviewed_by: review.reviewerName,
        admin_reviewed_at: new Date().toISOString(),
        incubator_track_assigned: review.incubatorTrack
      }).eq('id', ideaId);

      if (error) {
        throw new Error(error.message);
      }
    }
  },

  async deleteIdea(ideaId: string): Promise<boolean> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('ideabox_submissions').delete().eq('id', ideaId);
      if (error) throw new Error(error.message);
    }
    return true;
  }
};
