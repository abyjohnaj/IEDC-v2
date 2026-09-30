/**
 * Supabase Database Schema Definitions for IEDC BMCE v3
 * 
 * Auto-compatible with `supabase gen types typescript`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type IdeaStatusEnum =
  | 'Pending'
  | 'Under Review'
  | 'Shortlisted'
  | 'Incubation Approved'
  | 'Mentorship Assigned'
  | 'Needs Revision'
  | 'Rejected';

export type IdeaStageEnum =
  | 'Ideation'
  | 'Prototype'
  | 'Validation'
  | 'Incubation Ready'
  | 'Funded';

export type HackathonStatusEnum =
  | 'Upcoming'
  | 'Live'
  | 'Judging'
  | 'Completed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: string;
          department: string | null;
          semester: string | null;
          college_id: string | null;
          bio: string | null;
          skills: string[] | null;
          github: string | null;
          linkedin: string | null;
          discord_handle: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          scope: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          scope?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_roles']['Row']>;
      };
      idea_votes: {
        Row: {
          idea_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          idea_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['idea_votes']['Row']>;
      };
      ideabox_submissions: {
        Row: {
          id: string;
          title: string;
          domain: string;
          elevator_pitch: string | null;
          problem_statement: string | null;
          proposed_solution: string | null;
          tech_stack: string[] | null;
          stage: IdeaStageEnum;
          target_audience: string | null;
          estimated_budget: string | null;
          author_id: string;
          author_name: string;
          author_email: string;
          author_avatar: string | null;
          author_role: string | null;
          author_department: string | null;
          upvotes: number;
          comments_count: number;
          status: IdeaStatusEnum;
          admin_rating: number | null;
          admin_feedback: string | null;
          admin_reviewed_by: string | null;
          admin_reviewed_at: string | null;
          incubator_track_assigned: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['ideabox_submissions']['Row']> & {
          id: string;
          title: string;
          author_id: string;
          author_name: string;
          author_email: string;
        };
        Update: Partial<Database['public']['Tables']['ideabox_submissions']['Row']>;
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      status_history: {
        Row: {
          id: string;
          entity_type: 'idea' | 'kyc';
          entity_id: string;
          old_status: string | null;
          new_status: string;
          changed_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: 'idea' | 'kyc';
          entity_id: string;
          old_status?: string | null;
          new_status: string;
          changed_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['status_history']['Row']>;
      };
      kyc_verifications: {
        Row: {
          id: string;
          user_id: string;
          status: 'unverified' | 'pending' | 'verified' | 'rejected';
          doc_type: 'student_id' | 'aadhaar' | 'college_admission' | 'pan';
          doc_number_last4: string | null;
          doc_number_encrypted: string | null;
          doc_file_path: string | null;
          doc_file_name: string | null;
          full_name: string | null;
          dob: string | null;
          institution: string | null;
          submitted_at: string | null;
          verified_at: string | null;
          retention_delete_at: string | null;
          rejection_reason: string | null;
          admin_remarks: string | null;
        };
        Insert: Partial<Database['public']['Tables']['kyc_verifications']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['kyc_verifications']['Row']>;
      };
      hackathon_events: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          banner_image: string | null;
          category: string | null;
          start_date: string;
          end_date: string;
          status: HackathonStatusEnum;
          location: string | null;
          tracks: string[] | null;
          prize_pool: string | null;
          max_team_size: number | null;
          description: string | null;
          rules: string[] | null;
        };
        Insert: Partial<Database['public']['Tables']['hackathon_events']['Row']> & {
          id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['hackathon_events']['Row']>;
      };
      hackathon_teams: {
        Row: {
          id: string;
          hackathon_id: string;
          hackathon_title: string;
          name: string;
          tagline: string | null;
          track: string;
          max_members: number;
          is_open: boolean;
          roles_needed: string[] | null;
          discord_invite_url: string | null;
          whatsapp_group_url: string | null;
          github_org_url: string | null;
          invite_code: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['hackathon_teams']['Row']> & {
          id: string;
          hackathon_id: string;
          hackathon_title: string;
          name: string;
          track: string;
        };
        Update: Partial<Database['public']['Tables']['hackathon_teams']['Row']>;
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          name: string;
          email: string;
          avatar: string | null;
          role_in_team: string;
          is_leader: boolean;
          department: string | null;
          college: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          name: string;
          email: string;
          avatar?: string | null;
          role_in_team: string;
          is_leader?: boolean;
          department?: string | null;
          college?: string | null;
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_members']['Row']>;
      };
      team_join_requests: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          user_name: string;
          user_email: string;
          user_avatar: string | null;
          user_college: string | null;
          requested_role: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          user_name: string;
          user_email: string;
          user_avatar?: string | null;
          user_college?: string | null;
          requested_role: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_join_requests']['Row']>;
      };
      team_submissions: {
        Row: {
          id: string;
          team_id: string;
          project_title: string;
          tagline: string | null;
          track: string;
          overview: string | null;
          tech_stack: string[] | null;
          github_url: string | null;
          demo_video_url: string | null;
          live_demo_url: string | null;
          pitch_deck_url: string | null;
          status: 'draft' | 'submitted';
          score: Json | null;
          admin_feedback: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          project_title: string;
          tagline?: string | null;
          track: string;
          overview?: string | null;
          tech_stack?: string[] | null;
          github_url?: string | null;
          demo_video_url?: string | null;
          live_demo_url?: string | null;
          pitch_deck_url?: string | null;
          status?: 'draft' | 'submitted';
          score?: Json | null;
          admin_feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_submissions']['Row']>;
      };
    };
    Functions: {
      has_role: {
        Args: { required_role: string; required_scope?: string };
        Returns: boolean;
      };
      upvote_idea: {
        Args: { p_idea_id: string };
        Returns: { id: string; upvotes: number; hasVoted: boolean };
      };
      admin_set_user_role: {
        Args: { p_target_user_id: string; p_new_role: string; p_scope?: string };
        Returns: boolean;
      };
    };
  };
}
