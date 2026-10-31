-- ==============================================================================
-- IEDC BMCE v3 Security Baseline Migration
-- Migration: 20260930231600_security_baseline.sql
-- ==============================================================================

-- 1. HELPER FUNCTION: public.has_role()
-- Checks user role safely using SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$;

-- 2. TEAM MEMBERSHIP & LEADER HELPERS FOR HACKATHONS
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id text, p_check_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_members jsonb;
BEGIN
  IF p_check_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT members INTO v_members FROM public.hackathon_teams WHERE id = p_team_id;

  IF v_members IS NULL OR jsonb_typeof(v_members) != 'array' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_members) m
    WHERE (m->>'userId') = p_check_uid::text
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_leader(team_members jsonb, check_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF check_uid IS NULL OR team_members IS NULL OR jsonb_typeof(team_members) != 'array' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM jsonb_array_elements(team_members) m
    WHERE (m->>'userId') = check_uid::text 
      AND (m->>'isLeader')::boolean = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_team_leader_count(p_members jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_leader_count integer;
BEGIN
  IF p_members IS NULL OR jsonb_typeof(p_members) != 'array' THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_leader_count
  FROM jsonb_array_elements(p_members) m
  WHERE (m->>'isLeader')::boolean = true;

  RETURN (v_leader_count = 1);
END;
$$;

-- 2b. CORE BASE TABLES INITIALIZATION (IF NOT ALREADY CREATED)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'Student',
  department text,
  semester text,
  college_id text,
  bio text,
  skills text[] DEFAULT '{}',
  github text,
  linkedin text,
  discord_handle text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  doc_type text NOT NULL DEFAULT 'student_id',
  doc_number text,
  doc_number_last4 varchar(4),
  doc_number_encrypted bytea,
  doc_file_path text,
  doc_file_name text,
  full_name text,
  dob date,
  institution text,
  submitted_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  retention_delete_at timestamptz,
  rejection_reason text,
  admin_remarks text,
  CONSTRAINT uq_kyc_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.ideabox_submissions (
  id text PRIMARY KEY,
  title text NOT NULL,
  domain text NOT NULL,
  elevator_pitch text,
  problem_statement text,
  proposed_solution text,
  tech_stack text[] DEFAULT '{}',
  stage text NOT NULL DEFAULT 'Ideation',
  target_audience text,
  estimated_budget text,
  author_id text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  author_avatar text,
  author_role text,
  author_department text,
  upvotes integer DEFAULT 0,
  upvoters text[] DEFAULT '{}',
  comments_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  admin_rating integer,
  admin_feedback text,
  admin_reviewed_by text,
  admin_reviewed_at timestamptz,
  incubator_track_assigned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ideabox_comments (
  id text PRIMARY KEY,
  idea_id text NOT NULL REFERENCES public.ideabox_submissions(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  author_name text NOT NULL,
  author_avatar text,
  author_role text,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hackathon_events (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  banner_image text,
  category text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'Upcoming',
  location text,
  tracks text[] DEFAULT '{}',
  prize_pool text,
  max_team_size integer DEFAULT 4,
  description text,
  rules text[] DEFAULT '{}',
  results_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hackathon_teams (
  id text PRIMARY KEY,
  hackathon_id text NOT NULL REFERENCES public.hackathon_events(id) ON DELETE CASCADE,
  hackathon_title text NOT NULL,
  name text NOT NULL,
  tagline text,
  track text NOT NULL,
  max_members integer DEFAULT 4,
  is_open boolean DEFAULT true,
  roles_needed text[] DEFAULT '{}',
  members jsonb DEFAULT '[]'::jsonb,
  discord_invite_url text,
  whatsapp_group_url text,
  github_org_url text,
  invite_code text,
  project_submission jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_chat_messages (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  sender_avatar text,
  sender_role text,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_discussions (
  id text PRIMARY KEY DEFAULT ('disc_' || gen_random_uuid()),
  title text NOT NULL,
  channel text NOT NULL,
  excerpt text NOT NULL,
  author_name text NOT NULL,
  author_role text NOT NULL,
  author_avatar text,
  roles_needed text[] DEFAULT '{}',
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id text PRIMARY KEY DEFAULT ('fcom_' || gen_random_uuid()),
  discussion_id text NOT NULL REFERENCES public.forum_discussions(id) ON DELETE CASCADE,
  author text NOT NULL,
  avatar text,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  date text NOT NULL,
  status text NOT NULL DEFAULT 'Upcoming',
  asset_image text,
  fallback_image text,
  description text,
  details text,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  event_name text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  department text,
  semester text,
  overview_reason text,
  status text NOT NULL DEFAULT 'Pending',
  confirmation_token text,
  created_at timestamptz DEFAULT now()
);

-- 2c. ENSURE ALL COLUMNS EXIST IF TABLES WERE PRE-EXISTING
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'Student',
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS college_id text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS discord_handle text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.kyc_verifications
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS doc_type text DEFAULT 'student_id',
  ADD COLUMN IF NOT EXISTS doc_number text,
  ADD COLUMN IF NOT EXISTS doc_number_last4 varchar(4),
  ADD COLUMN IF NOT EXISTS doc_number_encrypted bytea,
  ADD COLUMN IF NOT EXISTS doc_file_path text,
  ADD COLUMN IF NOT EXISTS doc_file_name text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS retention_delete_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS admin_remarks text;

ALTER TABLE IF EXISTS public.ideabox_submissions
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS elevator_pitch text,
  ADD COLUMN IF NOT EXISTS problem_statement text,
  ADD COLUMN IF NOT EXISTS proposed_solution text,
  ADD COLUMN IF NOT EXISTS tech_stack text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'Ideation',
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS estimated_budget text,
  ADD COLUMN IF NOT EXISTS author_id text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_email text,
  ADD COLUMN IF NOT EXISTS author_avatar text,
  ADD COLUMN IF NOT EXISTS author_role text,
  ADD COLUMN IF NOT EXISTS author_department text,
  ADD COLUMN IF NOT EXISTS upvotes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upvoters text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS admin_rating integer,
  ADD COLUMN IF NOT EXISTS admin_feedback text,
  ADD COLUMN IF NOT EXISTS admin_reviewed_by text,
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS incubator_track_assigned text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.ideabox_comments
  ADD COLUMN IF NOT EXISTS idea_id text,
  ADD COLUMN IF NOT EXISTS author_id text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_avatar text,
  ADD COLUMN IF NOT EXISTS author_role text,
  ADD COLUMN IF NOT EXISTS text text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.hackathon_events
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS banner_image text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS start_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_date timestamptz DEFAULT now() + interval '3 days',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Upcoming',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS tracks text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prize_pool text,
  ADD COLUMN IF NOT EXISTS max_team_size integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rules text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS results_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.hackathon_teams
  ADD COLUMN IF NOT EXISTS hackathon_id text,
  ADD COLUMN IF NOT EXISTS hackathon_title text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS track text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS max_members integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS is_open boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS roles_needed text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS members jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discord_invite_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_group_url text,
  ADD COLUMN IF NOT EXISTS github_org_url text,
  ADD COLUMN IF NOT EXISTS invite_code text,
  ADD COLUMN IF NOT EXISTS project_submission jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.team_chat_messages
  ADD COLUMN IF NOT EXISTS team_id text,
  ADD COLUMN IF NOT EXISTS sender_id text,
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_avatar text,
  ADD COLUMN IF NOT EXISTS sender_role text,
  ADD COLUMN IF NOT EXISTS text text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.forum_discussions
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_role text,
  ADD COLUMN IF NOT EXISTS author_avatar text,
  ADD COLUMN IF NOT EXISTS roles_needed text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS upvotes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.forum_comments
  ADD COLUMN IF NOT EXISTS discussion_id text,
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS avatar text,
  ADD COLUMN IF NOT EXISTS text text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.events
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS date text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Upcoming',
  ADD COLUMN IF NOT EXISTS asset_image text,
  ADD COLUMN IF NOT EXISTS fallback_image text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.registrations
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'Event',
  ADD COLUMN IF NOT EXISTS event_name text,
  ADD COLUMN IF NOT EXISTS full_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS overview_reason text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS confirmation_token text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. ENABLE RLS ON ALL 11 TABLES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ideabox_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ideabox_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hackathon_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. BASE TABLE POLICIES: profiles
DROP POLICY IF EXISTS "profiles_select_owner_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_owner_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_role('Admin'));

DROP POLICY IF EXISTS "profiles_insert_owner" ON public.profiles;
CREATE POLICY "profiles_insert_owner"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_owner_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_owner_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.has_role('Admin'))
  WITH CHECK (id = auth.uid() OR public.has_role('Admin'));

-- 5. PUBLIC_PROFILES VIEW (Standard view owned by postgres)
-- Ensure profiles table has all expected columns
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'Student',
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS college_id text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS skills text[],
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS discord_handle text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT 
    id, 
    full_name, 
    avatar_url, 
    department, 
    skills, 
    bio, 
    github, 
    linkedin, 
    discord_handle
  FROM public.profiles
  WHERE role IN ('Student', 'Innovator', 'Faculty', 'Alumni', 'ExternalParticipant');

-- 6. ROLE ESCALATION TRIGGER ON profiles
CREATE OR REPLACE FUNCTION public.trg_prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NULL THEN
      NEW.role := 'Student';
    END IF;

    IF NEW.role IN ('Admin', 'Execom', 'Faculty') AND NOT public.has_role('Admin') THEN
      NEW.role := 'Student';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.has_role('Admin') THEN
      RAISE EXCEPTION 'Access Denied: Only Administrators can modify user roles (attempted % -> %)', OLD.role, NEW.role;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_guard ON public.profiles;
CREATE TRIGGER trg_profiles_role_guard
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_role_escalation();

-- 7. POLICIES: kyc_verifications
DROP POLICY IF EXISTS "kyc_select_owner_or_evaluator" ON public.kyc_verifications;
CREATE POLICY "kyc_select_owner_or_evaluator"
  ON public.kyc_verifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  );

DROP POLICY IF EXISTS "kyc_insert_pending_owner" ON public.kyc_verifications;
CREATE POLICY "kyc_insert_pending_owner"
  ON public.kyc_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "kyc_update_admin_or_execom" ON public.kyc_verifications;
CREATE POLICY "kyc_update_admin_or_execom"
  ON public.kyc_verifications
  FOR UPDATE
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (public.has_role('Admin') OR public.has_role('Execom'));

-- 8. POLICIES & TRIGGERS: ideabox_submissions & comments
DROP POLICY IF EXISTS "ideabox_select_published_or_author" ON public.ideabox_submissions;
CREATE POLICY "ideabox_select_published_or_author"
  ON public.ideabox_submissions
  FOR SELECT
  TO anon, authenticated
  USING (
    status IN ('Under Review', 'Shortlisted', 'Incubation Approved', 'Mentorship Assigned')
    OR author_id = auth.uid()::text
    OR public.has_role('Admin')
    OR public.has_role('Execom')
  );

DROP POLICY IF EXISTS "ideabox_insert_author" ON public.ideabox_submissions;
CREATE POLICY "ideabox_insert_author"
  ON public.ideabox_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid()::text);

DROP POLICY IF EXISTS "ideabox_update_author_or_admin" ON public.ideabox_submissions;
CREATE POLICY "ideabox_update_author_or_admin"
  ON public.ideabox_submissions
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid()::text OR public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (author_id = auth.uid()::text OR public.has_role('Admin') OR public.has_role('Execom'));

DROP POLICY IF EXISTS "ideabox_delete_author_or_admin" ON public.ideabox_submissions;
CREATE POLICY "ideabox_delete_author_or_admin"
  ON public.ideabox_submissions
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid()::text OR public.has_role('Admin'));

-- Comments
DROP POLICY IF EXISTS "ideabox_comments_select" ON public.ideabox_comments;
CREATE POLICY "ideabox_comments_select"
  ON public.ideabox_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "ideabox_comments_insert" ON public.ideabox_comments;
CREATE POLICY "ideabox_comments_insert"
  ON public.ideabox_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid()::text);

-- Trigger for ideabox admin-only fields & upvote session flag
-- ==============================================================================
-- TRANSACTION SESSION FLAG PATTERN: 'iedc.rpc_voting'
-- Table-level RLS & triggers intentionally prevent direct client UPDATE of 
-- 'upvotes' and 'upvoters' to stop vote spoofing and decrement attacks.
-- The RPC public.upvote_idea() sets a local flag: set_config('iedc.rpc_voting', 'active', true).
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.trg_check_ideabox_update_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  is_evaluator boolean;
BEGIN
  is_evaluator := public.has_role('Admin') OR public.has_role('Execom');

  -- 1. Lock administrative review columns from non-evaluators
  IF NOT is_evaluator THEN
    IF NEW.status IS DISTINCT FROM OLD.status OR
       NEW.admin_rating IS DISTINCT FROM OLD.admin_rating OR
       NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback OR
       NEW.admin_reviewed_by IS DISTINCT FROM OLD.admin_reviewed_by OR
       NEW.admin_reviewed_at IS DISTINCT FROM OLD.admin_reviewed_at OR
       NEW.incubator_track_assigned IS DISTINCT FROM OLD.incubator_track_assigned THEN
      RAISE EXCEPTION 'Access Denied: Submission status and incubator evaluations can only be modified by IEDC Admins/Execom.';
    END IF;
  END IF;

  -- 2. Lock upvotes/upvoters from direct client table update (must use public.upvote_idea RPC)
  IF (NEW.upvotes IS DISTINCT FROM OLD.upvotes OR NEW.upvoters IS DISTINCT FROM OLD.upvoters) 
     AND current_setting('iedc.rpc_voting', true) IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Access Denied: Upvotes cannot be updated directly; use public.upvote_idea() RPC.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ideabox_guard ON public.ideabox_submissions;
CREATE TRIGGER trg_ideabox_guard
  BEFORE UPDATE ON public.ideabox_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_ideabox_update_permissions();

-- 9. POLICIES & TRIGGERS: hackathon_events, teams, chat
DROP POLICY IF EXISTS "hackathon_events_select" ON public.hackathon_events;
CREATE POLICY "hackathon_events_select"
  ON public.hackathon_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hackathon_events_write_evaluators" ON public.hackathon_events;
CREATE POLICY "hackathon_events_write_evaluators"
  ON public.hackathon_events
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (public.has_role('Admin') OR public.has_role('Execom'));

DROP POLICY IF EXISTS "hackathon_teams_select" ON public.hackathon_teams;
CREATE POLICY "hackathon_teams_select"
  ON public.hackathon_teams
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hackathon_teams_insert" ON public.hackathon_teams;
CREATE POLICY "hackathon_teams_insert"
  ON public.hackathon_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (public.check_team_leader_count(members));

DROP POLICY IF EXISTS "hackathon_teams_update" ON public.hackathon_teams;
CREATE POLICY "hackathon_teams_update"
  ON public.hackathon_teams
  FOR UPDATE
  TO authenticated
  USING (
    public.is_team_leader(members, auth.uid()) 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  )
  WITH CHECK (
    public.is_team_leader(members, auth.uid()) 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  );

-- Trigger to lock scoring from non-evaluators and enforce single leader
CREATE OR REPLACE FUNCTION public.trg_check_hackathon_teams_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  is_admin boolean;
  is_leader boolean;
BEGIN
  is_admin := public.has_role('Admin') OR public.has_role('Execom');
  is_leader := public.is_team_leader(OLD.members, auth.uid());

  -- 1. Jury scoring: only Admins and Execom can grade
  IF (NEW.project_submission->'score') IS DISTINCT FROM (OLD.project_submission->'score') 
     OR (NEW.project_submission->'adminFeedback') IS DISTINCT FROM (OLD.project_submission->'adminFeedback') THEN
    IF NOT is_admin THEN
      RAISE EXCEPTION 'Access Denied: Hackathon jury scores and feedback can only be submitted by evaluators.';
    END IF;
  END IF;

  -- 2. Team membership & roster lock: only current leader or Admin can modify members
  IF NEW.members IS DISTINCT FROM OLD.members THEN
    IF NOT (is_leader OR is_admin) THEN
      RAISE EXCEPTION 'Access Denied: Only the verified Team Leader can modify team members.';
    END IF;

    -- Enforce exactly one leader
    IF NOT public.check_team_leader_count(NEW.members) THEN
      RAISE EXCEPTION 'Invalid Team Roster: A hackathon team must have exactly one designated Team Lead.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hackathon_teams_guard ON public.hackathon_teams;
CREATE TRIGGER trg_hackathon_teams_guard
  BEFORE UPDATE ON public.hackathon_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_hackathon_teams_update();

-- Team Chat Messages (Scoped strictly to team members & Admins)
DROP POLICY IF EXISTS "team_chat_select" ON public.team_chat_messages;
CREATE POLICY "team_chat_select"
  ON public.team_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_team_member(team_id, auth.uid()) 
    OR public.has_role('Admin')
  );

DROP POLICY IF EXISTS "team_chat_insert" ON public.team_chat_messages;
CREATE POLICY "team_chat_insert"
  ON public.team_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_team_member(team_id, auth.uid()) 
    AND sender_id = auth.uid()::text
  );

-- 10. POLICIES: forum_discussions & forum_comments
DROP POLICY IF EXISTS "forum_discussions_select" ON public.forum_discussions;
CREATE POLICY "forum_discussions_select"
  ON public.forum_discussions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "forum_discussions_insert" ON public.forum_discussions;
CREATE POLICY "forum_discussions_insert"
  ON public.forum_discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "forum_discussions_update_delete" ON public.forum_discussions;
CREATE POLICY "forum_discussions_update_delete"
  ON public.forum_discussions
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (public.has_role('Admin') OR public.has_role('Execom'));

DROP POLICY IF EXISTS "forum_comments_select" ON public.forum_comments;
CREATE POLICY "forum_comments_select"
  ON public.forum_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "forum_comments_insert" ON public.forum_comments;
CREATE POLICY "forum_comments_insert"
  ON public.forum_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 11. POLICIES: events
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select"
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "events_write_evaluators" ON public.events;
CREATE POLICY "events_write_evaluators"
  ON public.events
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (public.has_role('Admin') OR public.has_role('Execom'));

-- 12. POLICIES: registrations (Drop-box pattern for guests, private lookup)
DROP POLICY IF EXISTS "registrations_insert_dropbox" ON public.registrations;
CREATE POLICY "registrations_insert_dropbox"
  ON public.registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'Pending' OR status IS NULL);

DROP POLICY IF EXISTS "registrations_select_owner_or_evaluator" ON public.registrations;
CREATE POLICY "registrations_select_owner_or_evaluator"
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt()->>'email')
    OR public.has_role('Admin')
    OR public.has_role('Execom')
  );

DROP POLICY IF EXISTS "registrations_update_evaluators" ON public.registrations;
CREATE POLICY "registrations_update_evaluators"
  ON public.registrations
  FOR UPDATE
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (public.has_role('Admin') OR public.has_role('Execom'));

-- 13. HARDENED PRIVILEGES (REVOKE ALL FROM anon ON SENSITIVE TABLES)
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.kyc_verifications FROM anon;
REVOKE ALL ON TABLE public.team_chat_messages FROM anon;
REVOKE ALL ON TABLE public.registrations FROM anon;

-- Grant minimal necessary rights to anon
GRANT SELECT ON TABLE public.public_profiles TO anon, authenticated;
GRANT SELECT ON TABLE public.events, public.hackathon_events, public.ideabox_submissions, public.ideabox_comments, public.forum_discussions, public.forum_comments, public.hackathon_teams TO anon, authenticated;
GRANT INSERT ON TABLE public.registrations TO anon;

-- 14. PRIVILEGED RPC FUNCTIONS (SECURITY DEFINER)

-- A. Upvote Idea
CREATE OR REPLACE FUNCTION public.upvote_idea(p_idea_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid text;
  v_upvoters jsonb;
  v_has_voted boolean;
  v_result jsonb;
BEGIN
  v_uid := auth.uid()::text;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to upvote.';
  END IF;

  PERFORM set_config('iedc.rpc_voting', 'active', true);

  SELECT COALESCE(to_jsonb(upvoters), '[]'::jsonb) INTO v_upvoters
  FROM public.ideabox_submissions WHERE id = p_idea_id;

  v_has_voted := v_upvoters ? v_uid;

  IF v_has_voted THEN
    UPDATE public.ideabox_submissions
    SET upvotes = GREATEST(0, upvotes - 1),
        upvoters = ARRAY(SELECT jsonb_array_elements_text(v_upvoters - v_uid))
    WHERE id = p_idea_id
    RETURNING jsonb_build_object('id', id, 'upvotes', upvotes, 'hasVoted', false) INTO v_result;
  ELSE
    UPDATE public.ideabox_submissions
    SET upvotes = upvotes + 1,
        upvoters = array_append(upvoters, v_uid)
    WHERE id = p_idea_id
    RETURNING jsonb_build_object('id', id, 'upvotes', upvotes, 'hasVoted', true) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upvote_idea(text) TO authenticated;

-- B. Admin KYC Review
CREATE OR REPLACE FUNCTION public.admin_review_kyc(
  p_target_user_id text, 
  p_new_status text, 
  p_remarks text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins or Execom can review KYC.';
  END IF;

  UPDATE public.kyc_verifications
  SET status = p_new_status,
      verified_at = CASE WHEN p_new_status = 'verified' THEN now() ELSE NULL END,
      rejection_reason = CASE WHEN p_new_status = 'rejected' THEN COALESCE(p_remarks, 'Document verification failed.') ELSE NULL END,
      admin_remarks = p_remarks
  WHERE user_id = p_target_user_id;

  IF p_new_status = 'verified' THEN
    UPDATE public.profiles
    SET role = 'Innovator'
    WHERE id = p_target_user_id AND role = 'Student';
  END IF;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_review_kyc(text, text, text) TO authenticated;

-- C. Admin Set User Role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id text, 
  p_new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'Access Denied: Only Administrators can promote or reassign user roles.';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_target_user_id;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(text, text) TO authenticated;

-- D. Admin Grade Hackathon Team
CREATE OR REPLACE FUNCTION public.admin_grade_team(
  p_team_id text, 
  p_score_data jsonb, 
  p_feedback text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
    RAISE EXCEPTION 'Access Denied: Only evaluators can grade hackathon submissions.';
  END IF;

  UPDATE public.hackathon_teams
  SET project_submission = jsonb_set(
    jsonb_set(
      COALESCE(project_submission, '{}'::jsonb),
      '{score}',
      p_score_data
    ),
    '{adminFeedback}',
    to_jsonb(COALESCE(p_feedback, ''))
  )
  WHERE id = p_team_id;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_grade_team(text, jsonb, text) TO authenticated;

-- E. Public Registration Status Lookup
CREATE OR REPLACE FUNCTION public.get_registration_status(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'eventName', event_name,
    'status', status,
    'createdAt', created_at,
    'attendeeMasked', substring(full_name from 1 for 1) || '***' || substring(full_name from length(full_name))
  ) INTO v_result
  FROM public.registrations
  WHERE confirmation_token = upper(trim(p_token));

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Registration reference not found.';
  END IF;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_registration_status(text) TO anon, authenticated;
