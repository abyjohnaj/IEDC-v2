export interface EventItem {
  id: string;
  title: string;
  category: 'Workshops' | 'Bootcamps' | 'Fests' | 'Orientation' | string;
  date: string;
  status: 'Upcoming' | 'Featured' | 'Completed' | string;
  assetImage: string;
  fallbackImage: string;
  description: string;
  details: string;
  location: string;
}

export interface ExecomMember {
  name: string;
  role: string;
  department: string;
  avatar: string;
  fallbackAvatar: string;
  bio?: string;
  linkedin?: string;
}

export interface ExecomStructure {
  nodalOfficers: ExecomMember[];
  studentLeads: ExecomMember[];
  departmentCoordinators: ExecomMember[];
}

export interface ForumComment {
  id?: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
}

export interface ForumDiscussion {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  fallbackAvatar?: string;
  channel: 'TeamUp' | 'IdeaPitch' | 'TechQA' | 'Grants' | 'Showcase' | string;
  title: string;
  excerpt: string;
  rolesNeeded: string[];
  timestamp: string;
  upvotes: number;
  comments: ForumComment[];
}

export interface RegistrationSubmission {
  id?: string;
  type: 'Idea' | 'Event';
  eventName?: string | null;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  semester: string;
  overviewReason: string;
  status?: 'Pending' | 'Approved' | 'In Review' | 'Rejected';
  created_at?: string;
}

export interface NewsletterPageContent {
  pageNumber: number;
  title: string;
  headline: string;
  body: string[];
  callout?: string;
  author?: string;
}

export interface NewsletterEdition {
  id: string;
  issue?: number | string;
  issueNo: string;
  title: string;
  subtitle?: string;
  date: string;
  month: string;
  year: string;
  category?: string;
  tier?: number; // 1 to 4
  angleIndex?: number; // 0 to 5
  readTime?: string;
  author?: string;
  theme: string;
  icon: string;
  color: string;
  accent: string;
  spineColor?: string;
  coverStyle?: 'crimson' | 'navy' | 'emerald' | 'amber' | 'obsidian' | 'plum' | string;
  coverImage?: string;
  summary: string;
  excerpt?: string;
  content?: string;
  highlights: string[];
  pdfUrl: string;
  flipHtmlUrl?: string;
  pages: NewsletterPageContent[];
}

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type KYCDocumentType = 'student_id' | 'aadhaar' | 'college_admission' | 'pan';

export interface KYCDetails {
  status: KYCStatus;
  docType: KYCDocumentType;
  docNumber: string;
  docFileName?: string;
  docFileUrl?: string;
  fullName: string;
  dob?: string;
  institution: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  adminRemarks?: string;
}

export type UserRole = 'Student' | 'Innovator' | 'Faculty' | 'Alumni' | 'Execom' | 'ExternalParticipant' | 'Admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  department: string;
  semester: string;
  collegeId: string;
  institution?: string; // e.g. "Baselios Mathews II College of Engineering" or other college for external participants
  bio: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  discordHandle?: string;
  whatsappNumber?: string;
  startupIdeasCount: number;
  registeredEvents: string[];
  bookmarkedEditions: string[];
  activeTeamId?: string;
  kyc: KYCDetails;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}

// ==========================================
// IdeaBox System
// ==========================================
export type IdeaStatus = 
  | 'Pending' 
  | 'Under Review' 
  | 'Shortlisted' 
  | 'Incubation Approved' 
  | 'Mentorship Assigned' 
  | 'Needs Revision' 
  | 'Rejected';

export type IdeaStage = 
  | 'Ideation' 
  | 'Prototype' 
  | 'Validation' 
  | 'Incubation Ready' 
  | 'Funded';

export interface IdeaComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface IdeaBoxSubmission {
  id: string;
  title: string;
  domain: string;
  elevatorPitch: string;
  problemStatement: string;
  proposedSolution: string;
  techStack: string[];
  stage: IdeaStage;
  targetAudience: string;
  estimatedBudget?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  authorRole: UserRole | string;
  authorDepartment?: string;
  upvotes: number;
  upvoters: string[];
  commentsCount: number;
  comments: IdeaComment[];
  status: IdeaStatus;
  adminRating?: number; // 1-5
  adminFeedback?: string;
  adminReviewedBy?: string;
  adminReviewedAt?: string;
  incubatorTrackAssigned?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// Hackathon & Lablab-style Team Management
// ==========================================
export type HackathonRole = 
  | 'Team Lead' 
  | 'Frontend Dev' 
  | 'Backend Dev' 
  | 'AI / ML Engineer' 
  | 'UI / UX Designer' 
  | 'Hardware / IoT' 
  | 'Pitch Presenter'
  | 'Fullstack Dev';

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  roleInTeam: HackathonRole;
  isLeader: boolean;
  department?: string;
  college?: string;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  userCollege?: string;
  requestedRole: HackathonRole;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ProjectSubmission {
  projectTitle: string;
  tagline: string;
  track: string;
  overview: string;
  techStack: string[];
  githubUrl: string;
  demoVideoUrl?: string; // YouTube or Loom
  liveDemoUrl?: string;
  pitchDeckUrl?: string;
  submittedAt?: string;
  status: 'draft' | 'submitted';
  score?: {
    innovation: number;
    technical: number;
    presentation: number;
    feasibility: number;
    total: number;
  };
  adminFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface TeamChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  text: string;
  attachments?: {
    name: string;
    url: string;
    type: 'link' | 'image' | 'code';
  }[];
  timestamp: string;
  isAnnouncement?: boolean;
}

export interface HackathonTeam {
  id: string;
  hackathonId: string;
  hackathonTitle: string;
  name: string;
  tagline: string;
  track: string;
  maxMembers: number;
  isOpen: boolean; // open for direct or requested join
  rolesNeeded: HackathonRole[];
  members: TeamMember[];
  joinRequests: JoinRequest[];
  discordInviteUrl?: string;
  whatsappGroupUrl?: string;
  githubOrgUrl?: string;
  projectSubmission?: ProjectSubmission;
  createdAt: string;
  inviteCode: string;
}

export interface HackathonEvent {
  id: string;
  title: string;
  subtitle: string;
  bannerImage: string;
  category: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Live' | 'Judging' | 'Completed';
  location: string;
  tracks: string[];
  prizePool: string;
  maxTeamSize: number;
  totalTeamsCount?: number;
  totalParticipants?: number;
  description: string;
  rules: string[];
}

