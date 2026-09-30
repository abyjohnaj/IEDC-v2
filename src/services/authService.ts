import { User, UserRole, KYCDetails, KYCStatus, KYCDocumentType } from '../types';
import { getSupabase } from './supabaseClient';

const CURRENT_USER_STORAGE_KEY = 'iedc_auth_user';
const USERS_DB_STORAGE_KEY = 'iedc_users_database';
const AUTH_EVENT_NAME = 'iedc_auth_state_changed';

// Initial preloaded mock users
const INITIAL_USERS: User[] = [
  {
    id: 'usr_rahul_01',
    fullName: 'Rahul Verma',
    email: 'rahul@bmce.ac.in',
    phone: '+91 98471 23456',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Innovator',
    department: 'Computer Science & Engineering',
    semester: 'Semester 6',
    collegeId: 'BMCE/22/CS042',
    bio: 'Aspiring IoT & Full-stack dev. Leading the automated drone inspection prototype under BMCE IEDC incubation track.',
    skills: ['IoT & Embedded', 'React & Node.js', 'Python', 'Computer Vision', 'Robotics'],
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 2,
    registeredEvents: ['evt_1', 'evt_2'],
    bookmarkedEditions: ['issue-01', 'issue-03'],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'KTU-BMCE-2022-CS1042',
      docFileName: 'BMCE_Student_ID_Rahul.jpg',
      docFileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      fullName: 'Rahul Verma',
      dob: '2004-05-14',
      institution: 'Baselios Mathews II College of Engineering',
      submittedAt: '2026-01-12T10:30:00Z',
      verifiedAt: '2026-01-14T14:20:00Z',
      adminRemarks: 'Verified by IEDC Nodal Officer against KTU Student Portal enrollment records.'
    },
    createdAt: '2026-01-10T09:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_anjana_02',
    fullName: 'Anjana Pillai',
    email: 'anjana@bmce.ac.in',
    phone: '+91 94470 54321',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Student',
    department: 'Artificial Intelligence & Data Science',
    semester: 'Semester 4',
    collegeId: 'BMCE/23/AI018',
    bio: 'Enthusiastic about NLP and healthcare assistive tech. Active Eureka reader and tech forum contributor.',
    skills: ['Machine Learning', 'Python', 'Data Analytics', 'UI/UX Design'],
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 1,
    registeredEvents: ['evt_3'],
    bookmarkedEditions: ['issue-02'],
    kyc: {
      status: 'pending',
      docType: 'student_id',
      docNumber: 'KTU-BMCE-2023-AI0018',
      docFileName: 'BMCE_College_ID_Card.jpg',
      docFileUrl: 'https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?w=400&auto=format&fit=crop&q=80',
      fullName: 'Anjana Pillai',
      dob: '2005-08-22',
      institution: 'Baselios Mathews II College of Engineering',
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      adminRemarks: 'Verification in progress with BMCE Administrative Office.'
    },
    createdAt: '2026-02-01T11:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_demo_03',
    fullName: 'Aditya Nair',
    email: 'aditya@bmce.ac.in',
    phone: '+91 98950 11223',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Student',
    department: 'Electronics & Communication',
    semester: 'Semester 2',
    collegeId: 'BMCE/24/EC009',
    bio: 'First-year explorer interested in embedded systems and microcontrollers.',
    skills: ['C++', 'Arduino', 'Circuit Design'],
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: [],
    kyc: {
      status: 'unverified',
      docType: 'student_id',
      docNumber: '',
      fullName: 'Aditya Nair',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2026-03-01T15:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_devika_execom',
    fullName: 'Devika Suresh',
    email: 'devika.execom@bmce.ac.in',
    phone: '+91 97455 67890',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'Execom',
    department: 'Computer Science & Engineering',
    semester: 'Semester 7',
    collegeId: 'BMCE/21/CS015',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Student Lead & Technical Coordinator at IEDC BMCE. Managing hackathon operations, mentorship clinics, and incubator intake.',
    skills: ['Hackathon Management', 'React / Next.js', 'System Architecture', 'Community Building'],
    github: 'https://github.com/devikasure',
    linkedin: 'https://linkedin.com/in/devika-suresh-bmce',
    discordHandle: 'devika_iedc#1024',
    whatsappNumber: '+919745567890',
    startupIdeasCount: 3,
    registeredEvents: ['evt-design-thinking', 'evt-idea-forge', 'evt-hackathon-2026'],
    bookmarkedEditions: ['issue-01', 'issue-02', 'issue-03'],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'KTU-BMCE-2021-CS0015',
      docFileName: 'Devika_Execom_ID.pdf',
      fullName: 'Devika Suresh',
      dob: '2003-11-19',
      institution: 'Baselios Mathews II College of Engineering',
      submittedAt: '2025-08-10T10:00:00Z',
      verifiedAt: '2025-08-12T14:00:00Z',
      adminRemarks: 'Execom Leadership Credentials verified by Nodal Officer.'
    },
    createdAt: '2025-08-01T08:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_arun_external',
    fullName: 'Arun Kumar',
    email: 'arun.kumar@tkmce.ac.in',
    phone: '+91 95678 12345',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'ExternalParticipant',
    department: 'Mechanical & Mechatronics',
    semester: 'Semester 6',
    collegeId: 'TKM/22/ME088',
    institution: 'TKM College of Engineering, Kollam',
    bio: 'External hacker passionate about Autonomous Rover prototypes, ROS2, and embedded AI. Registered for BMCE GenAI & Hardware Hackathon 2026.',
    skills: ['ROS 2', 'Embedded C', 'Computer Vision', 'Rapid 3D CAD Prototyping'],
    github: 'https://github.com/arunkumar-tkm',
    linkedin: 'https://linkedin.com/in/arun-kumar-mech',
    discordHandle: 'arun_hacker#4421',
    whatsappNumber: '+919567812345',
    startupIdeasCount: 1,
    registeredEvents: ['evt-hackathon-2026'],
    bookmarkedEditions: ['issue-03'],
    kyc: {
      status: 'verified',
      docType: 'college_admission',
      docNumber: 'TKM-KTU-ME-2022-88',
      docFileName: 'TKMCE_Student_Verification.pdf',
      fullName: 'Arun Kumar',
      institution: 'TKM College of Engineering',
      submittedAt: '2026-02-15T12:00:00Z',
      verifiedAt: '2026-02-16T15:30:00Z',
      adminRemarks: 'External Inter-College Participant Pass Approved.'
    },
    createdAt: '2026-02-15T11:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_admin_nodal',
    fullName: 'Dr. Preetha M.',
    email: 'nodal.officer@bmce.ac.in',
    phone: '+91 94471 99887',
    avatar: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    role: 'Admin',
    department: 'IEDC Nodal Office',
    semester: 'Faculty / Admin',
    collegeId: 'BMCE/FAC/IEDC01',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'IEDC Nodal Officer & Dean of Innovation & Entrepreneurship at BMCE. Overseeing student startups, seed grants, and incubation partnerships.',
    skills: ['Incubation Management', 'Grant Allocation', 'Startup Mentoring', 'IPR & Patents'],
    github: 'https://github.com/bmce-iedc',
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: ['issue-01', 'issue-02', 'issue-03'],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'BMCE-ADMIN-NODAL-01',
      fullName: 'Dr. Preetha M.',
      institution: 'Baselios Mathews II College of Engineering',
      verifiedAt: '2024-01-01T00:00:00Z',
      adminRemarks: 'Nodal Administrator Master Clearance'
    },
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_fac_manoj',
    fullName: 'Prof. Manoj Kumar',
    email: 'manoj.kumar@bmce.ac.in',
    phone: '+91 94471 11223',
    avatar: 'https://iedcwebsite.web.app/assets/manojsir.JPG',
    role: 'Faculty',
    department: 'Mechanical Engineering',
    semester: 'Associate Professor',
    collegeId: 'BMCE/FAC/ME012',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Lead Faculty Nodal Officer guiding patent filing, maker spaces, and student incubation grants.',
    skills: ['Nodal Operations', 'Robotics & CAD', 'Incubation Grants', 'IPR Advisory'],
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: [],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'BMCE-FAC-ME-012',
      fullName: 'Prof. Manoj Kumar',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2024-01-10T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_fac_sreekanth',
    fullName: 'Dr. Sreekanth S.',
    email: 'sreekanth.s@bmce.ac.in',
    phone: '+91 98460 33445',
    avatar: 'https://iedcwebsite.web.app/assets/sreekanthsir.jpeg',
    role: 'Faculty',
    department: 'Electronics & Communication',
    semester: 'Professor & HOD',
    collegeId: 'BMCE/FAC/EC004',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Faculty Nodal Officer mentoring hardware electronics, embedded systems, and IoT prototyping labs.',
    skills: ['IoT Prototyping', 'Hardware Labs', 'Sensor Networks', 'Research Grants'],
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: [],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'BMCE-FAC-EC-004',
      fullName: 'Dr. Sreekanth S.',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2024-01-10T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_fac_sithara',
    fullName: 'Dr. Sithara Gopinath',
    email: 'sithara.g@bmce.ac.in',
    phone: '+91 94472 88990',
    avatar: 'https://iedcwebsite.web.app/assets/sitharamiss.JPG',
    role: 'Faculty',
    department: 'Computer Science & Engineering',
    semester: 'Assistant Professor',
    collegeId: 'BMCE/FAC/CS022',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Department Staff Coordinator overseeing computer science incubation, AI hackathons, and software dev mentors.',
    skills: ['Machine Learning', 'Software Systems', 'Hackathon Jury', 'Curriculum Design'],
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: [],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'BMCE-FAC-CS-022',
      fullName: 'Dr. Sithara Gopinath',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2024-01-15T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_fac_sreekumar',
    fullName: 'Prof. Sreekumar Pillai',
    email: 'sreekumar.p@bmce.ac.in',
    phone: '+91 94950 44556',
    avatar: 'https://iedcwebsite.web.app/assets/sreekumarsir.PNG',
    role: 'Faculty',
    department: 'Electrical & Electronics',
    semester: 'Assistant Professor',
    collegeId: 'BMCE/FAC/EEE008',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Faculty Staff Coordinator advising clean energy innovation, electric vehicle tech, and safety compliance.',
    skills: ['CleanTech', 'Renewable Energy', 'Electrical Systems', 'Startup Mentoring'],
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: [],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'BMCE-FAC-EEE-008',
      fullName: 'Prof. Sreekumar Pillai',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2024-01-15T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_karthik_04',
    fullName: 'Karthik P.',
    email: 'karthik.p@bmce.ac.in',
    phone: '+91 98470 12399',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'Innovator',
    department: 'Computer Science & Engineering',
    semester: 'Semester 5',
    collegeId: 'BMCE/22/CS078',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Full stack developer & cybersecurity researcher. Keen on campus technical lead and event management roles.',
    skills: ['Node.js', 'Cybersecurity', 'React', 'Docker', 'Linux'],
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 1,
    registeredEvents: ['evt_1'],
    bookmarkedEditions: ['issue-02'],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'KTU-BMCE-2022-CS078',
      fullName: 'Karthik P.',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2026-01-15T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'usr_sneha_05',
    fullName: 'Sneha Roy',
    email: 'sneha.roy@bmce.ac.in',
    phone: '+91 97441 55667',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Student',
    department: 'Artificial Intelligence & Data Science',
    semester: 'Semester 3',
    collegeId: 'BMCE/24/AI045',
    institution: 'Baselios Mathews II College of Engineering',
    bio: 'Graphic designer & AI enthusiast interested in Women in Entrepreneurship and creative outreach.',
    skills: ['Figma', 'UI/UX Design', 'Branding', 'Python', 'Social Media'],
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    startupIdeasCount: 1,
    registeredEvents: ['evt_2'],
    bookmarkedEditions: ['issue-01'],
    kyc: {
      status: 'verified',
      docType: 'student_id',
      docNumber: 'KTU-BMCE-2024-AI045',
      fullName: 'Sneha Roy',
      institution: 'Baselios Mathews II College of Engineering'
    },
    createdAt: '2026-02-10T00:00:00Z',
    lastLoginAt: new Date().toISOString()
  }
];

function getUsersDatabase(): User[] {
  try {
    const raw = localStorage.getItem(USERS_DB_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const stored: User[] = JSON.parse(raw);
    // Ensure any newly added initial users are merged into database
    const storedIds = new Set(stored.map(u => u.id));
    let hasNew = false;
    for (const initUser of INITIAL_USERS) {
      if (!storedIds.has(initUser.id)) {
        stored.push(initUser);
        hasNew = true;
      }
    }
    if (hasNew) {
      localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(stored));
    }
    return stored;
  } catch (err) {
    console.error('Error loading users DB from localStorage:', err);
    return INITIAL_USERS;
  }
}

function saveUsersDatabase(users: User[]): void {
  try {
    localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users DB:', err);
  }
}

export function dispatchAuthChange(user: User | null): void {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: { user } }));
}

export function openAuthModal(initialTab: 'login' | 'signup' = 'login'): void {
  window.dispatchEvent(new CustomEvent('iedc_open_auth_modal', { detail: { tab: initialTab } }));
}

export function openKYCModal(): void {
  window.dispatchEvent(new CustomEvent('iedc_open_kyc_modal'));
}

// Helper: map Supabase profile + KYC records to User object
function mapSupabaseUser(profile: any, kycRecord?: any): User {
  return {
    id: profile.id,
    fullName: profile.full_name || 'Student Member',
    email: profile.email,
    phone: profile.phone || '',
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.full_name || profile.email)}`,
    role: profile.role || 'Student',
    department: profile.department || 'Computer Science & Engineering',
    semester: profile.semester || 'Semester 4',
    collegeId: profile.college_id || '',
    bio: profile.bio || '',
    skills: profile.skills || ['Innovation'],
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    startupIdeasCount: 0,
    registeredEvents: [],
    bookmarkedEditions: [],
    kyc: {
      status: kycRecord?.status || 'unverified',
      docType: kycRecord?.doc_type || 'student_id',
      docNumberLast4: kycRecord?.doc_number_last4 || (kycRecord?.doc_number ? kycRecord.doc_number.slice(-4) : undefined),
      docNumber: kycRecord?.doc_number_last4 
        ? `•••• •••• ${kycRecord.doc_number_last4}` 
        : (kycRecord?.doc_number ? `•••• •••• ${kycRecord.doc_number.slice(-4)}` : '•••• •••• 0000'),
      docFileName: kycRecord?.doc_file_name,
      docFilePath: kycRecord?.doc_file_path,
      docFileUrl: undefined, // Always accessed via short-lived signed URL
      fullName: kycRecord?.full_name || profile.full_name || '',
      dob: kycRecord?.dob,
      institution: kycRecord?.institution || 'Baselios Mathews II College of Engineering',
      submittedAt: kycRecord?.submitted_at,
      verifiedAt: kycRecord?.verified_at,
      retentionDeleteAt: kycRecord?.retention_delete_at,
      rejectionReason: kycRecord?.rejection_reason,
      adminRemarks: kycRecord?.admin_remarks
    },
    createdAt: profile.created_at || new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
}

export const authService = {
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: User | null }>;
      callback(customEvent.detail?.user ?? null);
    };
    window.addEventListener(AUTH_EVENT_NAME, handler);
    return () => window.removeEventListener(AUTH_EVENT_NAME, handler);
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
    dispatchAuthChange(user);
  },

  // Login: checks Supabase first, falls back smoothly to local DB
  async login(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO === 'true';

    // Check if it's one of the instant demo shortcuts (only allowed when demo mode is active)
    const localUsers = getUsersDatabase();
    const demoUser = isDemoEnabled ? localUsers.find(u => u.email.toLowerCase() === cleanEmail) : undefined;

    const sb = getSupabase();
    if (sb && password && !demoUser) {
      try {
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!authError && authData.user) {
          // Fetch profile and KYC records from Supabase tables
          const { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          const { data: kycData } = await sb
            .from('kyc_verifications')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (profile) {
            const user = mapSupabaseUser(profile, kycData);
            this.setCurrentUser(user);
            return { success: true, user };
          }
        }
      } catch (err) {
        console.warn('Supabase signIn exception, checking local fallback:', err);
      }
    }

    // Local DB / Demo user fallback (strictly blocked in production)
    if (isDemoEnabled && demoUser) {
      demoUser.lastLoginAt = new Date().toISOString();
      const updated = localUsers.map(u => u.id === demoUser.id ? demoUser : u);
      saveUsersDatabase(updated);
      this.setCurrentUser(demoUser);
      return { success: true, user: demoUser };
    }

    // Try finding by prefix match (strictly in demo mode)
    if (isDemoEnabled) {
      const matched = localUsers.find(u => u.email.toLowerCase().startsWith(cleanEmail));
      if (matched) {
        this.setCurrentUser(matched);
        return { success: true, user: matched };
      }
    }

    return {
      success: false,
      error: 'No account found with this email. Please check your credentials or create a new account.'
    };
  },

  // Signup: registers with Supabase and sets up profile & KYC record
  async signup(data: {
    fullName: string;
    email: string;
    phone: string;
    department: string;
    semester: string;
    collegeId: string;
    password?: string;
    role?: 'Student' | 'Innovator';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const sb = getSupabase();

    if (sb && data.password) {
      try {
        const { data: authData, error: authErr } = await sb.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName.trim(),
              phone: data.phone.trim(),
              department: data.department,
              semester: data.semester,
              college_id: data.collegeId.trim().toUpperCase(),
              role: data.role || 'Student'
            }
          }
        });

        if (!authErr && authData.user) {
          // If trigger created profile, fetch it; otherwise insert
          let { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (!profile) {
            const { data: insertedProfile } = await sb
              .from('profiles')
              .insert([{
                id: authData.user.id,
                full_name: data.fullName.trim(),
                email: cleanEmail,
                phone: data.phone.trim(),
                department: data.department,
                semester: data.semester,
                college_id: data.collegeId.trim().toUpperCase(),
                role: data.role || 'Student',
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.fullName)}`
              }])
              .select()
              .single();
            profile = insertedProfile;
          }

          const { data: kycData } = await sb
            .from('kyc_verifications')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (profile) {
            const user = mapSupabaseUser(profile, kycData);
            this.setCurrentUser(user);
            return { success: true, user };
          }
        } else if (authErr) {
          console.warn('Supabase auth signup notice:', authErr.message);
        }
      } catch (err) {
        console.warn('Supabase signup exception, falling back to local DB:', err);
      }
    }

    // Local DB fallback
    const users = getUsersDatabase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.'
      };
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.fullName)}`,
      role: data.role || 'Student',
      department: data.department,
      semester: data.semester,
      collegeId: data.collegeId.trim().toUpperCase(),
      bio: `Student at Baselios Mathews II College of Engineering, ${data.department}.`,
      skills: ['Ideation', 'Problem Solving'],
      startupIdeasCount: 0,
      registeredEvents: [],
      bookmarkedEditions: [],
      kyc: {
        status: 'unverified',
        docType: 'student_id',
        docNumber: '',
        fullName: data.fullName.trim(),
        institution: 'Baselios Mathews II College of Engineering'
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsersDatabase(users);
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  logout(): void {
    const sb = getSupabase();
    if (sb) {
      try {
        sb.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    this.setCurrentUser(null);
  },

  // Update profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const sb = getSupabase();
    if (sb && !userId.startsWith('usr_')) {
      try {
        await sb.from('profiles').update({
          full_name: updates.fullName,
          phone: updates.phone,
          department: updates.department,
          semester: updates.semester,
          college_id: updates.collegeId,
          bio: updates.bio,
          skills: updates.skills,
          github: updates.github,
          linkedin: updates.linkedin,
          avatar_url: updates.avatar,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase update profile error:', err);
      }
    }

    // Local DB sync
    const users = getUsersDatabase();
    const index = users.findIndex(u => u.id === userId);
    let updated: User;

    if (index !== -1) {
      updated = {
        ...users[index],
        ...updates,
        kyc: updates.kyc ? { ...users[index].kyc, ...updates.kyc } : users[index].kyc
      };
      users[index] = updated;
      saveUsersDatabase(users);
    } else {
      const current = this.getCurrentUser();
      updated = {
        ...(current || INITIAL_USERS[0]),
        ...updates,
        id: userId
      };
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(updated);
    }

    return updated;
  },

  // Submit KYC verification document (Invokes Edge Function kyc-submit)
  async submitKYC(userId: string, kycData: {
    docType: KYCDocumentType;
    docNumber: string;
    fullName: string;
    institution?: string;
    file?: File;
    dob?: string;
  }): Promise<User> {
    const sb = getSupabase();
    let docNumberLast4 = kycData.docNumber.trim().slice(-4);
    let docFilePath: string | undefined = undefined;

    if (sb && !userId.startsWith('usr_')) {
      try {
        if (kycData.file) {
          const formData = new FormData();
          formData.append('fullName', kycData.fullName.trim());
          formData.append('docType', kycData.docType);
          formData.append('docNumber', kycData.docNumber.trim());
          formData.append('institution', kycData.institution || 'Baselios Mathews II College of Engineering');
          formData.append('file', kycData.file);

          const { data: resData, error: fnError } = await sb.functions.invoke('kyc-submit', {
            body: formData
          });

          if (!fnError && resData) {
            docNumberLast4 = resData.docNumberLast4 || docNumberLast4;
          } else {
            console.warn('kyc-submit function notice, attempting direct storage upload fallback:', fnError);
            // Fallback direct storage upload to user's folder
            const cleanName = kycData.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${userId}/${Date.now()}_${cleanName}`;
            const { error: upErr } = await sb.storage.from('kyc-docs').upload(path, kycData.file, { upsert: true });
            if (!upErr) docFilePath = path;

            await sb.from('kyc_verifications').upsert({
              user_id: userId,
              status: 'pending',
              doc_type: kycData.docType,
              doc_number_last4: docNumberLast4,
              doc_file_path: docFilePath,
              full_name: kycData.fullName.trim(),
              institution: kycData.institution || 'Baselios Mathews II College of Engineering',
              submitted_at: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn('Supabase submit KYC error:', err);
      }
    }

    // Local DB sync with masked number
    const users = getUsersDatabase();
    const index = users.findIndex(u => u.id === userId);
    const existing = index !== -1 ? users[index] : (this.getCurrentUser() || INITIAL_USERS[0]);

    const updatedKYC: KYCDetails = {
      ...existing.kyc,
      status: 'pending',
      docType: kycData.docType,
      docNumberLast4,
      docNumber: `•••• •••• ${docNumberLast4}`,
      docFileName: kycData.file?.name || 'student_id_document.pdf',
      docFilePath: docFilePath || `${userId}/student_id_${Date.now()}.pdf`,
      docFileUrl: undefined,
      fullName: kycData.fullName.trim() || existing.fullName,
      dob: kycData.dob,
      institution: kycData.institution || 'Baselios Mathews II College of Engineering',
      submittedAt: new Date().toISOString(),
      rejectionReason: undefined,
      adminRemarks: 'Document submitted for administrative review by IEDC Nodal Office.'
    };

    const updatedUser: User = {
      ...existing,
      kyc: updatedKYC
    };

    if (index !== -1) {
      users[index] = updatedUser;
      saveUsersDatabase(users);
    }

    this.setCurrentUser(updatedUser);
    return updatedUser;
  },

  // Admin KYC Decision via Edge Function kyc-decide
  async decideKYC(
    userId: string,
    decision: 'verified' | 'rejected' | 'pending',
    rejectionReason?: string,
    remarks?: string
  ): Promise<boolean> {
    const sb = getSupabase();
    if (sb && !userId.startsWith('usr_')) {
      try {
        const { data, error } = await sb.functions.invoke('kyc-decide', {
          body: {
            userId,
            decision,
            rejection_reason: rejectionReason,
            remarks
          }
        });

        if (error || !data?.success) {
          // Direct RPC fallback if edge function not running
          await sb.rpc('exec_kyc_decision', {
            p_admin_id: (await sb.auth.getUser()).data.user?.id,
            p_user_id: userId,
            p_decision: decision,
            p_rejection_reason: rejectionReason || null,
            p_remarks: remarks || null
          });
        }
      } catch (err) {
        console.warn('Error invoking kyc-decide:', err);
      }
    }

    // Local DB sync
    const users = getUsersDatabase();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const u = users[index];
      u.kyc.status = decision;
      u.kyc.verifiedAt = decision === 'verified' ? new Date().toISOString() : undefined;
      u.kyc.rejectionReason = decision === 'rejected' ? rejectionReason : undefined;
      u.kyc.adminRemarks = remarks;
      u.kyc.retentionDeleteAt = decision === 'verified'
        ? new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
        : undefined;

      if (decision === 'verified' && u.role === 'Student') {
        u.role = 'Innovator';
      }
      saveUsersDatabase(users);
      dispatchAuthChange(u);
    }
    return true;
  },

  // Retrieve 60-second short-lived signed URL for admin document viewing
  async getKYCDocSignedUrl(docFilePath: string): Promise<string | null> {
    if (!docFilePath) return null;
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.storage
          .from('kyc-docs')
          .createSignedUrl(docFilePath, 60);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err) {
        console.warn('Error generating KYC signed URL:', err);
      }
    }
    return null;
  },

  // Admin or Demo test simulation: Approve / Reject KYC (Dev Only)
  async simulateKYCReview(userId: string, status: 'verified' | 'rejected', reasonOrRemarks?: string): Promise<User> {
    if (import.meta.env.VITE_ENABLE_DEMO !== 'true') {
      throw new Error('KYC review simulation is disabled in production.');
    }

    const sb = getSupabase();
    if (sb && !userId.startsWith('usr_')) {
      try {
        await sb.from('kyc_verifications').update({
          status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          rejection_reason: status === 'rejected' ? (reasonOrRemarks || 'Document verification failed.') : null,
          admin_remarks: reasonOrRemarks || (status === 'verified' ? 'Approved by BMCE IEDC Nodal Center.' : 'Rejected during verification.')
        }).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase simulate KYC review error:', err);
      }
    }

    const users = getUsersDatabase();
    const index = users.findIndex(u => u.id === userId);
    const existing = index !== -1 ? users[index] : (this.getCurrentUser() || INITIAL_USERS[0]);

    const updatedKYC: KYCDetails = {
      ...existing.kyc,
      status,
      verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
      rejectionReason: status === 'rejected' ? (reasonOrRemarks || 'Document illegible or roll number mismatch.') : undefined,
      adminRemarks: status === 'verified' 
        ? (reasonOrRemarks || 'Approved by BMCE IEDC Nodal Center. Member granted Full Innovation Pass.') 
        : (reasonOrRemarks || 'Rejected during verification.')
    };

    const updatedUser: User = {
      ...existing,
      role: status === 'verified' && existing.role === 'Student' ? 'Innovator' : existing.role,
      kyc: updatedKYC
    };

    if (index !== -1) {
      users[index] = updatedUser;
      saveUsersDatabase(users);
    }

    this.setCurrentUser(updatedUser);
    return updatedUser;
  },

  getAllUsers(): User[] {
    return getUsersDatabase();
  },

  adminCreateUser(data: {
    fullName: string;
    email: string;
    phone?: string;
    role: UserRole;
    department: string;
    semester?: string;
    collegeId?: string;
    institution?: string;
    bio?: string;
    skills?: string[];
    linkedin?: string;
  }): User {
    const users = getUsersDatabase();
    const newUser: User = {
      id: `usr_${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '+91 94470 00000',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.fullName)}`,
      role: data.role,
      department: data.department,
      semester: data.semester || (data.role === 'Faculty' ? 'Faculty / Coordinator' : 'Semester 5'),
      collegeId: data.collegeId || (data.role === 'Faculty' ? `BMCE/FAC/${Math.floor(100 + Math.random() * 900)}` : `BMCE/23/CS${Math.floor(10 + Math.random() * 90)}`),
      institution: data.institution || 'Baselios Mathews II College of Engineering',
      bio: data.bio || `Active member of IEDC BMCE in ${data.department}.`,
      skills: data.skills || ['Innovation', 'Leadership', 'IEDC BMCE'],
      linkedin: data.linkedin || '',
      startupIdeasCount: 0,
      registeredEvents: [],
      bookmarkedEditions: [],
      kyc: {
        status: 'verified',
        docType: 'student_id',
        docNumber: data.collegeId || 'VERIFIED-MEMBER',
        fullName: data.fullName,
        institution: data.institution || 'Baselios Mathews II College of Engineering',
        verifiedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsersDatabase(users);
    dispatchAuthChange(null);
    return newUser;
  },

  quickLoginDemo(demoKey: 'rahul' | 'anjana' | 'aditya' | 'devika' | 'arun' | 'admin'): User {
    if (import.meta.env.VITE_ENABLE_DEMO !== 'true') {
      throw new Error('Demo instant logins are disabled in this environment.');
    }

    const emailMap: Record<string, string> = {
      rahul: 'rahul@bmce.ac.in',
      anjana: 'anjana@bmce.ac.in',
      aditya: 'aditya@bmce.ac.in',
      devika: 'devika.execom@bmce.ac.in',
      arun: 'arun.kumar@tkmce.ac.in',
      admin: 'nodal.officer@bmce.ac.in'
    };
    const targetEmail = emailMap[demoKey];
    const users = getUsersDatabase();
    let user = users.find(u => u.email.toLowerCase() === targetEmail);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === targetEmail) || INITIAL_USERS[0];
      // ensure it's in local DB
      users.push(user);
      saveUsersDatabase(users);
    }
    this.setCurrentUser(user);
    return user;
  }
};
