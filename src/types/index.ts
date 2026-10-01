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
  pageWebpUrls?: string[];
  totalPages?: number;
  conversionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  pages: NewsletterPageContent[];
}

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type KYCDocumentType = 'student_id' | 'aadhaar' | 'college_admission' | 'pan';
export type KYCRejectionReason = 
  | 'illegible_document'
  | 'expired_id'
  | 'mismatched_name'
  | 'invalid_institution'
  | 'roll_number_mismatch'
  | 'tampered_document'
  | 'other';

export interface KYCDetails {
  status: KYCStatus;
  docType: KYCDocumentType;
  docNumber?: string; // Masked display value e.g. "**** **** 1234"
  docNumberLast4?: string; // Exactly last 4 characters
  docFileName?: string;
  docFileUrl?: string; // Short-lived signed URL for viewer (never stored data URL)
  docFilePath?: string; // Secure path in kyc-docs bucket (<user_id>/...)
  fullName: string;
  dob?: string;
  institution: string;
  submittedAt?: string;
  verifiedAt?: string;
  retentionDeleteAt?: string;
  rejectionReason?: KYCRejectionReason | string;
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
  kycStatus?: KYCStatus;
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

export interface ReviewCriterion {
  id: string;
  name: string;
  weight: number;
  description?: string;
}

export interface IdeaReviewScore {
  id?: string;
  reviewId: string;
  criterionId: string;
  criterionName?: string;
  criterionWeight?: number;
  score: number; // 1-5
  comment?: string;
}

export interface IdeaReview {
  id: string;
  ideaId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  reviewerDepartment?: string;
  assignedBy?: string;
  assignedAt: string;
  submittedAt?: string;
  overallFeedback?: string;
  scores?: IdeaReviewScore[];
}

export interface IdeaAggregateScore {
  ideaId: string;
  totalAssignedReviews: number;
  completedReviews: number;
  aggregateScore: number;
  roundedScore: number;
}

export interface Mentor {
  id: string;
  userId: string;
  fullName: string;
  avatar: string;
  department?: string;
  expertise: string[];
  designation?: string;
  organization?: string;
  bio?: string;
  maxActiveIdeas: number;
  isActive: boolean;
}

export interface MentorAssignment {
  id: string;
  ideaId: string;
  mentorId: string;
  mentor?: Mentor;
  assignedBy?: string;
  assignedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  responseNotes?: string;
  respondedAt?: string;
}

export interface IdeaMilestone {
  id: string;
  ideaId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  fundingTranche: number;
  completedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface IdeaDraftData {
  authorId?: string;
  title?: string;
  domain?: string;
  stage?: IdeaStage;
  elevatorPitch?: string;
  problemStatement?: string;
  proposedSolution?: string;
  techStackInput?: string;
  targetAudience?: string;
  estimatedBudget?: string;
}

export interface IdeaDraft {
  id?: string;
  userId: string;
  draftData: IdeaDraftData;
  updatedAt: string;
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

export type HackathonStatus = 'Upcoming' | 'Live' | 'Judging' | 'Completed';

// ==========================================
// Relational v3 Core Data Models
// ==========================================
export interface IdeaVote {
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  scope: string; // e.g. department name or 'global'
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  created_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  entity_type: 'idea' | 'kyc';
  entity_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface TeamInvite {
  id: string;
  code: string;
  teamId: string;
  createdBy?: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
}

export interface TeamSubmissionSnapshot {
  id: string;
  teamId: string;
  submissionId?: string;
  projectTitle: string;
  repoUrl: string;
  commitSha?: string;
  demoUrl?: string;
  snapshotTime: string;
  submittedBy?: string;
  isLocked: boolean;
}

export interface HackathonCriterion {
  id: string;
  name: string;
  weight: number;
  description?: string;
}

export interface HackathonJudge {
  id: string;
  userId: string;
  fullName?: string;
  avatar?: string;
  organization?: string;
  isActive: boolean;
  conflictOfInterest: boolean;
}

export interface JudgeAssignment {
  id: string;
  judgeId: string;
  track: string;
  hackathonId?: string;
  assignedAt: string;
}

export interface JudgeScore {
  id?: string;
  teamId: string;
  judgeId: string;
  criterionId: string;
  score: number;
  feedback?: string;
  createdAt?: string;
}

export interface HackathonLeaderboardRow {
  teamId: string;
  teamName: string;
  track: string;
  projectTitle?: string;
  totalScore: number;
  judgesCount: number;
  rank: number;
}

export interface TeamMatchSuggestion {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  department?: string;
  skills: string[];
  matchingSkills: string[];
  overlapCount: number;
  suggestedRole: string;
}

// ==========================================
// Unified Notification System Types
// ==========================================

export type NotificationType =
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'idea_status_changed'
  | 'team_join_request'
  | 'hackathon_deadline_24h'
  | 'results_published';

export type NotificationChannel = 'in_app' | 'email';
export type NotificationCategory = 'kyc' | 'idea' | 'team' | 'hackathon' | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationPreference {
  id?: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationCategory;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendNotificationPayload {
  userId: string;
  type: NotificationType;
  title?: string;
  body?: string;
  link?: string;
  email?: string;
  recipientName?: string;
  metadata?: Record<string, any>;
}



