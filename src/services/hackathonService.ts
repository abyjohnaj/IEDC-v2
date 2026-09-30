import {
  HackathonEvent,
  HackathonTeam,
  TeamMember,
  JoinRequest,
  ProjectSubmission,
  TeamChatMessage,
  HackathonRole,
  User
} from '../types';
import { getSupabase } from './supabaseClient';

const HACKATHONS_STORAGE_KEY = 'iedc_hackathon_events';
const TEAMS_STORAGE_KEY = 'iedc_hackathon_teams';
const CHAT_STORAGE_PREFIX = 'iedc_team_chat_';
const TEAMS_CHANGE_EVENT = 'iedc_teams_updated';
const CHAT_CHANGE_EVENT = 'iedc_team_chat_updated';

// Featured Live Hackathon Events
export const INITIAL_HACKATHONS: HackathonEvent[] = [
  {
    id: 'evt-hackathon-2026',
    title: 'BMCE GENAI & HARDWARE HACKATHON 2026',
    subtitle: '36-Hour National Level Hybrid Buildathon for Groundbreaking Prototypes',
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    category: 'National Hackathon',
    startDate: '2026-03-28T09:00:00Z',
    // Set endDate ~28 hours from current local mock time so live countdown runs realistically
    endDate: new Date(Date.now() + 28 * 3600 * 1000 + 42 * 60 * 1000).toISOString(),
    status: 'Live',
    location: 'BMCE Innovation Hub & Virtual Hybrid Metaverse',
    tracks: [
      'Generative AI & LLMs',
      'Robotics & Hardware Prototyping',
      'CleanTech & Climate Resilience',
      'Assistive & HealthTech',
      'Smart Kerala Public Governance'
    ],
    prizePool: '₹1,50,000 + Incubation Grant Support',
    maxTeamSize: 4,
    totalTeamsCount: 16,
    totalParticipants: 64,
    description: 'A high-octane 36-hour sprint where software developers, embedded engineers, and product designers unite to build functional MVPs with hardware lab access, cloud GPU credits, and direct investor evaluation.',
    rules: [
      'Teams can consist of 2 to 4 members from any affiliated college or institution.',
      'All code and CAD designs must be freshly built during the hackathon sprint.',
      'Active team chat and periodic check-in commits to GitHub are mandatory.',
      'Live demonstration, working repository, and pitch presentation required for jury evaluation.'
    ]
  },
  {
    id: 'evt-ideathon-kerala',
    title: 'SMART KERALA SUSTAINABILITY IDEATHON',
    subtitle: 'State-Level Solutions for Disaster Resilience, Waste Management & Renewable Power',
    bannerImage: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80',
    category: 'Ideathon & Pitch',
    startDate: '2026-04-15T10:00:00Z',
    endDate: '2026-04-16T18:00:00Z',
    status: 'Upcoming',
    location: 'BMCE Main Auditorium, Kollam',
    tracks: ['Renewable Energy', 'Flood Mitigation', 'Decentralized Waste Upcycling'],
    prizePool: '₹50,000 + KSUM Seed Nomination',
    maxTeamSize: 3,
    totalTeamsCount: 8,
    totalParticipants: 24,
    description: 'Focusing on actionable climate-adaptation tech for Kerala backwaters, coastal belts, and high-range terrains.',
    rules: ['Open to all university students across Kerala.', 'Requires an empirical problem assessment and feasibility blueprint.']
  }
];

export const INITIAL_TEAMS: HackathonTeam[] = [
  {
    id: 'team-neuralnova',
    hackathonId: 'evt-hackathon-2026',
    hackathonTitle: 'BMCE GENAI & HARDWARE HACKATHON 2026',
    name: 'NeuralNova Systems',
    tagline: 'Edge AI Drone Vision for Automated Plantation Blight Early-Warning',
    track: 'Generative AI & LLMs',
    maxMembers: 4,
    isOpen: true,
    rolesNeeded: ['UI / UX Designer', 'Pitch Presenter'],
    members: [
      {
        userId: 'usr_rahul_01',
        name: 'Rahul Verma',
        email: 'rahul@bmce.ac.in',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roleInTeam: 'Team Lead',
        isLeader: true,
        department: 'Computer Science & Engineering',
        college: 'Baselios Mathews II College of Engineering',
        joinedAt: '2026-03-28T09:15:00Z'
      },
      {
        userId: 'usr_anjana_02',
        name: 'Anjana Pillai',
        email: 'anjana@bmce.ac.in',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        roleInTeam: 'AI / ML Engineer',
        isLeader: false,
        department: 'Artificial Intelligence & Data Science',
        college: 'Baselios Mathews II College of Engineering',
        joinedAt: '2026-03-28T09:30:00Z'
      },
      {
        userId: 'usr_arun_external',
        name: 'Arun Kumar',
        email: 'arun.kumar@tkmce.ac.in',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        roleInTeam: 'Hardware / IoT',
        isLeader: false,
        department: 'Mechanical & Mechatronics',
        college: 'TKM College of Engineering',
        joinedAt: '2026-03-28T10:00:00Z'
      }
    ],
    joinRequests: [
      {
        id: 'req-aditya-1',
        userId: 'usr_demo_03',
        userName: 'Aditya Nair',
        userEmail: 'aditya@bmce.ac.in',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        userCollege: 'Baselios Mathews II College of Engineering',
        requestedRole: 'UI / UX Designer',
        message: 'Hey team! I have built Figma wireframes and mobile dashboards for IoT projects and would love to polish your app pitch deck!',
        status: 'pending',
        createdAt: '2026-03-28T11:45:00Z'
      }
    ],
    discordInviteUrl: 'https://discord.gg/iedc-bmce-hackathon',
    whatsappGroupUrl: 'https://chat.whatsapp.com/iedc-neuralnova-sprint',
    githubOrgUrl: 'https://github.com/iedc-bmce/neuralnova-ai',
    projectSubmission: {
      projectTitle: 'AgriVision Jetson Sentinel',
      tagline: 'Multispectral Jetson Nano camera rig that maps rubber fungal decay in real-time',
      track: 'Generative AI & LLMs',
      overview: 'We built an onboard edge classification pipeline that operates in offline plantation environments. When the drone flies over rows of rubber trees, a tuned YOLOv9-Edge model flags leaf necrosis and transmits annotated GPS coordinates directly to a local farm mesh display.',
      techStack: ['PyTorch', 'NVIDIA Jetson', 'PX4 Autopilot', 'FastAPI', 'React Native'],
      githubUrl: 'https://github.com/iedc-bmce/neuralnova-ai',
      demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      liveDemoUrl: 'https://agrivision-demo.web.app',
      pitchDeckUrl: 'https://slides.google.com/presentation/d/agrivision-pitch',
      submittedAt: '2026-03-28T14:30:00Z',
      status: 'submitted',
      score: {
        innovation: 24,
        technical: 23,
        presentation: 22,
        feasibility: 24,
        total: 93
      },
      adminFeedback: 'Outstanding hardware integration and clear local agricultural impact. The offline inference on Jetson Orin performed seamlessly during the midpoint check-in.',
      reviewedBy: 'Dr. Preetha M. (IEDC Nodal Officer)',
      reviewedAt: '2026-03-28T16:00:00Z'
    },
    createdAt: '2026-03-28T09:00:00Z',
    inviteCode: 'NOVA-7492'
  },
  {
    id: 'team-ecovolt',
    hackathonId: 'evt-hackathon-2026',
    hackathonTitle: 'BMCE GENAI & HARDWARE HACKATHON 2026',
    name: 'EcoVolt Kinetic Mesh',
    tagline: 'Piezoelectric & Micro-Hydro Harvesting for Remote Backwater Sensor Buoys',
    track: 'CleanTech & Climate Resilience',
    maxMembers: 4,
    isOpen: true,
    rolesNeeded: ['Frontend Dev', 'AI / ML Engineer'],
    members: [
      {
        userId: 'usr_devika_execom',
        name: 'Devika Suresh',
        email: 'devika.execom@bmce.ac.in',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        roleInTeam: 'Team Lead',
        isLeader: true,
        department: 'Computer Science & Engineering',
        college: 'Baselios Mathews II College of Engineering',
        joinedAt: '2026-03-28T09:10:00Z'
      }
    ],
    joinRequests: [],
    discordInviteUrl: 'https://discord.gg/ecovolt-sprint',
    whatsappGroupUrl: 'https://chat.whatsapp.com/ecovolt-team-connect',
    githubOrgUrl: 'https://github.com/iedc-bmce/ecovolt-mesh',
    projectSubmission: {
      projectTitle: 'EcoVolt Kinetic Harvester',
      tagline: 'Self-powered river velocity hydro-generators with LoRaWAN telemetry',
      track: 'CleanTech & Climate Resilience',
      overview: 'Designing an ultra-low-friction water vortex micro-turbine that charges Supercapacitors in slow-moving canals to power continuous flood and salinity telemetry.',
      techStack: ['ESP32-S3', 'Supercapacitors', 'LoRaWAN', 'FreeRTOS', 'Grafana'],
      githubUrl: 'https://github.com/iedc-bmce/ecovolt-mesh',
      status: 'draft'
    },
    createdAt: '2026-03-28T09:10:00Z',
    inviteCode: 'VOLT-3180'
  },
  {
    id: 'team-bionix',
    hackathonId: 'evt-hackathon-2026',
    hackathonTitle: 'BMCE GENAI & HARDWARE HACKATHON 2026',
    name: 'Project Bionix Assist',
    tagline: 'Sub-$150 Multi-Grip Robotic Myoelectric Hand for Rural Amputees',
    track: 'Assistive & HealthTech',
    maxMembers: 4,
    isOpen: false, // Invite only / full
    rolesNeeded: [],
    members: [
      {
        userId: 'usr_bionix_lead',
        name: 'Siddharth Menon',
        email: 'siddharth.m@bmce.ac.in',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        roleInTeam: 'Team Lead',
        isLeader: true,
        department: 'Mechanical Engineering',
        college: 'Baselios Mathews II College of Engineering',
        joinedAt: '2026-03-28T09:05:00Z'
      },
      {
        userId: 'usr_bionix_dev',
        name: 'Sneha Jacob',
        email: 'sneha.j@bmce.ac.in',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        roleInTeam: 'Hardware / IoT',
        isLeader: false,
        department: 'Electronics & Communication',
        college: 'Baselios Mathews II College of Engineering',
        joinedAt: '2026-03-28T09:20:00Z'
      }
    ],
    joinRequests: [],
    discordInviteUrl: 'https://discord.gg/bionix-lab',
    whatsappGroupUrl: 'https://chat.whatsapp.com/bionix-hackathon',
    githubOrgUrl: 'https://github.com/iedc-bmce/bionix-prosthetics',
    projectSubmission: {
      projectTitle: 'Bionix Hand v2',
      tagline: 'Surface EMG 3D printed bionic hand with compliant TPU finger joints',
      track: 'Assistive & HealthTech',
      overview: 'Engineered with compliant flexure hinges printed in TPU 95A, cutting servo motor count from 5 to 2 while retaining precision pinch and power grip.',
      techStack: ['STM32', 'Surface EMG', 'TPU 3D Print', 'Bluetooth LE', 'Web Bluetooth'],
      githubUrl: 'https://github.com/iedc-bmce/bionix-prosthetics',
      demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      liveDemoUrl: 'https://bionix-assist.web.app',
      pitchDeckUrl: 'https://slides.google.com/presentation/d/bionix-deck',
      submittedAt: '2026-03-28T15:10:00Z',
      status: 'submitted',
      score: {
        innovation: 25,
        technical: 24,
        presentation: 23,
        feasibility: 23,
        total: 95
      },
      adminFeedback: 'Phenomenal mechanical engineering and biomechatronics craft. Compliant TPU flexure significantly reduces assembly bill of materials.',
      reviewedBy: 'Dr. Preetha M. (IEDC Nodal Officer)',
      reviewedAt: '2026-03-28T16:20:00Z'
    },
    createdAt: '2026-03-28T09:05:00Z',
    inviteCode: 'BION-9011'
  }
];

// Initial mock chat messages for team-neuralnova
const INITIAL_CHAT_MESSAGES: Record<string, TeamChatMessage[]> = {
  'team-neuralnova': [
    {
      id: 'msg-1',
      teamId: 'team-neuralnova',
      senderId: 'sys-announcement',
      senderName: 'IEDC Hackathon System',
      senderAvatar: '/assets/iedc_brand_logo.png',
      senderRole: 'System Bot',
      text: '🚀 Welcome to BMCE Hackathon 2026! Your team workspace is live. Hackathon deadline is set. Coordinate via this channel till the event wraps up!',
      timestamp: '2026-03-28T09:00:00Z',
      isAnnouncement: true
    },
    {
      id: 'msg-2',
      teamId: 'team-neuralnova',
      senderId: 'usr_rahul_01',
      senderName: 'Rahul Verma',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      senderRole: 'Team Lead',
      text: 'Hey team! I have set up our GitHub repo and flashed the Jetson Orin Nano with the JetPack 6 image in the hardware lab.',
      timestamp: '2026-03-28T09:20:00Z'
    },
    {
      id: 'msg-3',
      teamId: 'team-neuralnova',
      senderId: 'usr_anjana_02',
      senderName: 'Anjana Pillai',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      senderRole: 'AI / ML Engineer',
      text: 'Awesome Rahul! I just finished quantizing the YOLOv9 model using TensorRT. Inference latency dropped from 85ms down to 18ms on edge!',
      timestamp: '2026-03-28T10:15:00Z'
    },
    {
      id: 'msg-4',
      teamId: 'team-neuralnova',
      senderId: 'usr_arun_external',
      senderName: 'Arun Kumar',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      senderRole: 'Hardware / IoT',
      text: 'Just calibrated the PX4 optical flow sensor bracket. Testing gimbal vibration damping now. Should have physical video feed ready by lunch.',
      timestamp: '2026-03-28T11:05:00Z'
    }
  ]
};

function getStoredTeams(): HackathonTeam[] {
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEAMS;
  }
}

function saveTeams(teams: HackathonTeam[]): void {
  try {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    window.dispatchEvent(new CustomEvent(TEAMS_CHANGE_EVENT, { detail: { count: teams.length } }));
  } catch (err) {
    console.error('Failed to save teams:', err);
  }
}

function getStoredChat(teamId: string): TeamChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_PREFIX + teamId);
    if (!raw) {
      const initial = INITIAL_CHAT_MESSAGES[teamId] || [];
      localStorage.setItem(CHAT_STORAGE_PREFIX + teamId, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CHAT_MESSAGES[teamId] || [];
  }
}

function saveChat(teamId: string, messages: TeamChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_PREFIX + teamId, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(CHAT_CHANGE_EVENT, { detail: { teamId, count: messages.length } }));
  } catch (err) {
    console.error('Failed to save chat:', err);
  }
}

export const hackathonService = {
  subscribeTeams(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(TEAMS_CHANGE_EVENT, handler);
    return () => window.removeEventListener(TEAMS_CHANGE_EVENT, handler);
  },

  subscribeChat(callback: (teamId: string) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ teamId: string }>;
      callback(customEvent.detail?.teamId);
    };
    window.addEventListener(CHAT_CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHAT_CHANGE_EVENT, handler);
  },

  getHackathons(): HackathonEvent[] {
    return INITIAL_HACKATHONS;
  },

  getActiveHackathon(hackathonId?: string): HackathonEvent {
    if (hackathonId) {
      const found = INITIAL_HACKATHONS.find(h => h.id === hackathonId);
      if (found) return found;
    }
    return INITIAL_HACKATHONS[0];
  },

  getAllTeams(hackathonId?: string): HackathonTeam[] {
    const teams = getStoredTeams();
    if (hackathonId) {
      return teams.filter(t => t.hackathonId === hackathonId);
    }
    return teams;
  },

  getTeamById(teamId: string): HackathonTeam | null {
    const teams = getStoredTeams();
    return teams.find(t => t.id === teamId) || null;
  },

  getUserTeam(userId: string, hackathonId?: string): HackathonTeam | null {
    const teams = getStoredTeams();
    return teams.find(t => {
      const matchesHackathon = !hackathonId || t.hackathonId === hackathonId;
      const isMember = t.members.some(m => m.userId === userId);
      return matchesHackathon && isMember;
    }) || null;
  },

  createTeam(data: {
    hackathonId: string;
    hackathonTitle: string;
    name: string;
    tagline: string;
    track: string;
    maxMembers?: number;
    isOpen: boolean;
    rolesNeeded: HackathonRole[];
    leader: User;
    leaderRole?: HackathonRole;
    discordInviteUrl?: string;
    whatsappGroupUrl?: string;
  }): HackathonTeam {
    const teams = getStoredTeams();
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const inviteCode = `${data.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const leaderMember: TeamMember = {
      userId: data.leader.id,
      name: data.leader.fullName,
      email: data.leader.email,
      avatar: data.leader.avatar,
      roleInTeam: data.leaderRole || 'Team Lead',
      isLeader: true,
      department: data.leader.department,
      college: data.leader.institution || 'Baselios Mathews II College of Engineering',
      joinedAt: new Date().toISOString()
    };

    const newTeam: HackathonTeam = {
      id: teamId,
      hackathonId: data.hackathonId,
      hackathonTitle: data.hackathonTitle,
      name: data.name.trim(),
      tagline: data.tagline.trim(),
      track: data.track,
      maxMembers: data.maxMembers || 4,
      isOpen: data.isOpen,
      rolesNeeded: data.rolesNeeded,
      members: [leaderMember],
      joinRequests: [],
      discordInviteUrl: data.discordInviteUrl,
      whatsappGroupUrl: data.whatsappGroupUrl,
      createdAt: new Date().toISOString(),
      inviteCode
    };

    const updated = [newTeam, ...teams];
    saveTeams(updated);

    const sb = getSupabase();
    if (sb) {
      try {
        sb.from('hackathon_teams').insert([{
          id: teamId,
          hackathon_id: data.hackathonId,
          hackathon_title: data.hackathonTitle,
          name: newTeam.name,
          tagline: newTeam.tagline,
          track: newTeam.track,
          max_members: newTeam.maxMembers,
          is_open: newTeam.isOpen,
          roles_needed: newTeam.rolesNeeded,
          discord_invite_url: newTeam.discordInviteUrl,
          whatsapp_group_url: newTeam.whatsappGroupUrl,
          invite_code: newTeam.inviteCode,
          created_at: newTeam.createdAt
        }]).then(() => {
          if (!data.leader.id.startsWith('usr_')) {
            sb.from('team_members').insert([{
              team_id: teamId,
              user_id: data.leader.id,
              name: leaderMember.name,
              email: leaderMember.email,
              avatar: leaderMember.avatar,
              role_in_team: leaderMember.roleInTeam,
              is_leader: true,
              department: leaderMember.department,
              college: leaderMember.college,
              joined_at: leaderMember.joinedAt
            }]).then(() => {});
          }
        });
      } catch (err) {
        console.warn('Supabase hackathon relational team insert error:', err);
      }
    }

    // Initial welcome message in chat
    const initialMsg: TeamChatMessage = {
      id: `msg_init_${Date.now()}`,
      teamId,
      senderId: 'sys',
      senderName: 'IEDC LabLab Portal',
      senderAvatar: '/assets/iedc_brand_logo.png',
      senderRole: 'System',
      text: `🚀 Team "${newTeam.name}" has entered the Hackathon arena! Invite teammates, sync Discord & WhatsApp links, and start building!`,
      timestamp: new Date().toISOString(),
      isAnnouncement: true
    };
    saveChat(teamId, [initialMsg]);

    return newTeam;
  },

  async joinTeam(teamId: string, user: User, role: HackathonRole, note?: string): Promise<{ joined: boolean; pending: boolean; error?: string }> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) return { joined: false, pending: false, error: 'Team not found' };

    const team = teams[index];

    // Check if already in team
    if (team.members.some(m => m.userId === user.id)) {
      return { joined: true, pending: false, error: 'You are already a member of this team.' };
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return { joined: false, pending: false, error: 'This team has reached its maximum size limit.' };
    }

    if (team.isOpen) {
      // Direct open join
      const newMember: TeamMember = {
        userId: user.id,
        name: user.fullName,
        email: user.email,
        avatar: user.avatar,
        roleInTeam: role,
        isLeader: false,
        department: user.department,
        college: user.institution || 'Baselios Mathews II College of Engineering',
        joinedAt: new Date().toISOString()
      };

      const updatedRolesNeeded = team.rolesNeeded.filter(r => r !== role);

      teams[index] = {
        ...team,
        members: [...team.members, newMember],
        rolesNeeded: updatedRolesNeeded
      };
      saveTeams(teams);

      // Announce in chat
      this.sendTeamChatMessage(teamId, {
        senderId: 'sys',
        senderName: 'System',
        senderAvatar: '/assets/iedc_brand_logo.png',
        senderRole: 'System',
        text: `🎉 ${user.fullName} has joined the team as ${role}!`
      });

      return { joined: true, pending: false };
    } else {
      // Pending request to leader
      const existingReq = team.joinRequests.find(r => r.userId === user.id && r.status === 'pending');
      if (existingReq) {
        return { joined: false, pending: true, error: 'You already have a pending join request with this team.' };
      }

      const req: JoinRequest = {
        id: `req_${Date.now()}`,
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        userAvatar: user.avatar,
        userCollege: user.institution || 'BMCE',
        requestedRole: role,
        message: note || 'I would love to contribute to this hackathon project!',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      teams[index] = {
        ...team,
        joinRequests: [...team.joinRequests, req]
      };
      saveTeams(teams);

      return { joined: false, pending: true };
    }
  },

  async respondToJoinRequest(teamId: string, requestId: string, decision: 'accepted' | 'declined'): Promise<HackathonTeam> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    const req = team.joinRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    let updatedMembers = [...team.members];
    let updatedRolesNeeded = [...team.rolesNeeded];

    if (decision === 'accepted' && team.members.length < team.maxMembers) {
      updatedMembers.push({
        userId: req.userId,
        name: req.userName,
        email: req.userEmail,
        avatar: req.userAvatar,
        roleInTeam: req.requestedRole,
        isLeader: false,
        college: req.userCollege,
        joinedAt: new Date().toISOString()
      });
      updatedRolesNeeded = updatedRolesNeeded.filter(r => r !== req.requestedRole);

      // Announce in chat
      this.sendTeamChatMessage(teamId, {
        senderId: 'sys',
        senderName: 'System',
        senderAvatar: '/assets/iedc_brand_logo.png',
        senderRole: 'System',
        text: `🤝 Welcome ${req.userName}! Team Lead accepted their join request for role: ${req.requestedRole}.`
      });
    }

    const updatedRequests = team.joinRequests.map(r => r.id === requestId ? { ...r, status: decision } : r);

    teams[index] = {
      ...team,
      members: updatedMembers,
      rolesNeeded: updatedRolesNeeded,
      joinRequests: updatedRequests
    };

    saveTeams(teams);
    return teams[index];
  },

  async assignMemberRole(teamId: string, memberUserId: string, newRole: HackathonRole): Promise<HackathonTeam> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    const updatedMembers = team.members.map(m => m.userId === memberUserId ? { ...m, roleInTeam: newRole } : m);

    teams[index] = { ...team, members: updatedMembers };
    saveTeams(teams);

    this.sendTeamChatMessage(teamId, {
      senderId: 'sys',
      senderName: 'System',
      senderAvatar: '/assets/iedc_brand_logo.png',
      senderRole: 'System',
      text: `🔄 Role updated: Member role updated to "${newRole}".`
    });

    return teams[index];
  },

  async removeMember(teamId: string, memberUserId: string): Promise<HackathonTeam> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    const removedMember = team.members.find(m => m.userId === memberUserId);
    const updatedMembers = team.members.filter(m => m.userId !== memberUserId);

    teams[index] = { ...team, members: updatedMembers };
    saveTeams(teams);

    if (removedMember) {
      this.sendTeamChatMessage(teamId, {
        senderId: 'sys',
        senderName: 'System',
        senderAvatar: '/assets/iedc_brand_logo.png',
        senderRole: 'System',
        text: `👋 ${removedMember.name} is no longer in the team roster.`
      });
    }

    return teams[index];
  },

  async updateSocialLinks(teamId: string, links: {
    discordInviteUrl?: string;
    whatsappGroupUrl?: string;
    githubOrgUrl?: string;
    isOpen?: boolean;
    rolesNeeded?: HackathonRole[];
  }): Promise<HackathonTeam> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    teams[index] = {
      ...teams[index],
      discordInviteUrl: links.discordInviteUrl ?? teams[index].discordInviteUrl,
      whatsappGroupUrl: links.whatsappGroupUrl ?? teams[index].whatsappGroupUrl,
      githubOrgUrl: links.githubOrgUrl ?? teams[index].githubOrgUrl,
      isOpen: links.isOpen ?? teams[index].isOpen,
      rolesNeeded: links.rolesNeeded ?? teams[index].rolesNeeded
    };

    saveTeams(teams);
    return teams[index];
  },

  // Team Live Chat Methods
  getTeamChatMessages(teamId: string): TeamChatMessage[] {
    return getStoredChat(teamId);
  },

  sendTeamChatMessage(teamId: string, msg: {
    senderId: string;
    senderName: string;
    senderAvatar: string;
    senderRole: string;
    text: string;
    attachments?: { name: string; url: string; type: 'link' | 'image' | 'code' }[];
  }): TeamChatMessage {
    const current = getStoredChat(teamId);
    const newMsg: TeamChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      teamId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      senderRole: msg.senderRole,
      text: msg.text.trim(),
      attachments: msg.attachments,
      timestamp: new Date().toISOString()
    };

    const updated = [...current, newMsg];
    saveChat(teamId, updated);
    return newMsg;
  },

  // Project Submission Methods
  async saveProjectSubmission(teamId: string, submission: ProjectSubmission): Promise<HackathonTeam> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const updatedSub: ProjectSubmission = {
      ...submission,
      submittedAt: submission.status === 'submitted' ? new Date().toISOString() : submission.submittedAt
    };

    teams[index] = {
      ...teams[index],
      projectSubmission: updatedSub
    };

    saveTeams(teams);

    const sb = getSupabase();
    if (sb) {
      try {
        sb.from('team_submissions').upsert({
          team_id: teamId,
          project_title: updatedSub.projectTitle,
          tagline: updatedSub.tagline,
          track: updatedSub.track,
          overview: updatedSub.overview,
          tech_stack: updatedSub.techStack,
          github_url: updatedSub.githubUrl,
          demo_video_url: updatedSub.demoVideoUrl,
          live_demo_url: updatedSub.liveDemoUrl,
          pitch_deck_url: updatedSub.pitchDeckUrl,
          status: updatedSub.status,
          score: updatedSub.score,
          admin_feedback: updatedSub.adminFeedback,
          reviewed_by: updatedSub.reviewedBy,
          reviewed_at: updatedSub.reviewedAt,
          submitted_at: updatedSub.submittedAt
        }, { onConflict: 'team_id' }).then(() => {});
      } catch (err) {
        console.warn('Supabase team_submissions upsert error:', err);
      }
    }

    if (submission.status === 'submitted') {
      this.sendTeamChatMessage(teamId, {
        senderId: 'sys',
        senderName: 'System',
        senderAvatar: '/assets/iedc_brand_logo.png',
        senderRole: 'System',
        text: `🏆 PROJECT SUBMITTED! "${submission.projectTitle}" has been officially finalized and submitted to the Hackathon Jury! Best of luck!`
      });
    }

    return teams[index];
  },

  // Admin scoring & feedback
  async adminGradeSubmission(teamId: string, score: {
    innovation: number;
    technical: number;
    presentation: number;
    feasibility: number;
    total: number;
  }, feedback: string, reviewerName: string): Promise<HackathonTeam> {
    const teams = getStoredTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    if (!team.projectSubmission) throw new Error('No submission found to grade');

    const updatedSub: ProjectSubmission = {
      ...team.projectSubmission,
      score,
      adminFeedback: feedback,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString()
    };

    teams[index] = {
      ...team,
      projectSubmission: updatedSub
    };

    saveTeams(teams);

    const sb = getSupabase();
    if (sb) {
      try {
        sb.from('team_submissions').update({
          score,
          admin_feedback: feedback,
          reviewed_by: reviewerName,
          reviewed_at: updatedSub.reviewedAt
        }).eq('team_id', teamId).then(() => {});
      } catch (err) {
        console.warn('Supabase team_submissions grading update error:', err);
      }
    }

    this.sendTeamChatMessage(teamId, {
      senderId: 'sys',
      senderName: 'Jury Evaluation',
      senderAvatar: '/assets/iedc_brand_logo.png',
      senderRole: 'Judge / Admin',
      text: `⭐ Official Evaluation Received from ${reviewerName}: Total Score: ${score.total}/100. Check the Submission tab for detailed jury feedback!`
    });

    return teams[index];
  }
};
