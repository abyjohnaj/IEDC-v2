-- ==============================================================================
-- IEDC BMCE v3: Relational Tables & Integrity Refactor
-- Migration: 20261001000600_relational_schema_refactor.sql
-- ==============================================================================

-- 1. ENUMS (idea_status, hackathon_status, stage)
DO $$ BEGIN
  CREATE TYPE public.idea_status AS ENUM (
    'Pending',
    'Under Review',
    'Shortlisted',
    'Incubation Approved',
    'Mentorship Assigned',
    'Needs Revision',
    'Rejected'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stage AS ENUM (
    'Ideation',
    'Prototype',
    'Validation',
    'Incubation Ready',
    'Funded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.hackathon_status AS ENUM (
    'Upcoming',
    'Live',
    'Judging',
    'Completed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. Drop policy depending on status column before altering type
DROP POLICY IF EXISTS "ideabox_select_published_or_author" ON public.ideabox_submissions;

-- Convert existing free-text columns to enums safely by dropping text defaults first
ALTER TABLE public.ideabox_submissions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.ideabox_submissions 
  ALTER COLUMN status TYPE public.idea_status 
  USING (
    CASE 
      WHEN status::text IN ('Pending', 'Under Review', 'Shortlisted', 'Incubation Approved', 'Mentorship Assigned', 'Needs Revision', 'Rejected') 
        THEN status::text::public.idea_status 
      ELSE 'Pending'::public.idea_status 
    END
  );
ALTER TABLE public.ideabox_submissions ALTER COLUMN status SET DEFAULT 'Pending'::public.idea_status;

-- Re-create policy with typed enum status
CREATE POLICY "ideabox_select_published_or_author"
  ON public.ideabox_submissions
  FOR SELECT
  TO anon, authenticated
  USING (
    status IN ('Under Review'::public.idea_status, 'Shortlisted'::public.idea_status, 'Incubation Approved'::public.idea_status, 'Mentorship Assigned'::public.idea_status)
    OR author_id = auth.uid()::text
    OR public.has_role('Admin')
    OR public.has_role('Execom')
  );

ALTER TABLE public.ideabox_submissions ALTER COLUMN stage DROP DEFAULT;
ALTER TABLE public.ideabox_submissions 
  ALTER COLUMN stage TYPE public.stage 
  USING (
    CASE 
      WHEN stage::text IN ('Ideation', 'Prototype', 'Validation', 'Incubation Ready', 'Funded') 
        THEN stage::text::public.stage 
      ELSE 'Ideation'::public.stage 
    END
  );
ALTER TABLE public.ideabox_submissions ALTER COLUMN stage SET DEFAULT 'Ideation'::public.stage;

ALTER TABLE public.hackathon_events ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.hackathon_events 
  ALTER COLUMN status TYPE public.hackathon_status 
  USING (
    CASE 
      WHEN status::text IN ('Upcoming', 'Live', 'Judging', 'Completed') 
        THEN status::text::public.hackathon_status 
      ELSE 'Upcoming'::public.hackathon_status 
    END
  );
ALTER TABLE public.hackathon_events ALTER COLUMN status SET DEFAULT 'Upcoming'::public.hackathon_status;

-- ==============================================================================
-- 2. IDEA_VOTES TABLE, TRIGGER & BACKFILL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.idea_votes (
  idea_id text NOT NULL REFERENCES public.ideabox_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (idea_id, user_id)
);

ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;

-- Backfill from existing upvoters array if present
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ideabox_submissions' AND column_name = 'upvoters'
  ) THEN
    INSERT INTO public.idea_votes (idea_id, user_id, created_at)
    SELECT s.id, u::uuid, COALESCE(s.created_at, now())
    FROM public.ideabox_submissions s,
         LATERAL unnest(s.upvoters) u
    WHERE u IS NOT NULL 
      AND length(u) = 36 
      AND u ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = u::uuid)
    ON CONFLICT (idea_id, user_id) DO NOTHING;

    ALTER TABLE public.ideabox_submissions DROP COLUMN upvoters;

    -- Update trigger to no longer reference dropped upvoters column
    CREATE OR REPLACE FUNCTION public.trg_check_ideabox_update_permissions()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth, pg_temp
    AS $trg$
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

      RETURN NEW;
    END;
    $trg$;
  END IF;
END $$;

-- Trigger to keep ideabox_submissions.upvotes count in sync
CREATE OR REPLACE FUNCTION public.trg_sync_idea_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_target_id := OLD.idea_id;
  ELSE
    v_target_id := NEW.idea_id;
  END IF;

  UPDATE public.ideabox_submissions
  SET upvotes = (
    SELECT COUNT(*) FROM public.idea_votes WHERE idea_id = v_target_id
  )
  WHERE id = v_target_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_idea_votes_count ON public.idea_votes;
CREATE TRIGGER trg_sync_idea_votes_count
  AFTER INSERT OR DELETE ON public.idea_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_idea_votes_count();

DROP POLICY IF EXISTS "idea_votes_select" ON public.idea_votes;
CREATE POLICY "idea_votes_select"
  ON public.idea_votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "idea_votes_insert_owner" ON public.idea_votes;
CREATE POLICY "idea_votes_insert_owner"
  ON public.idea_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "idea_votes_delete_owner" ON public.idea_votes;
CREATE POLICY "idea_votes_delete_owner"
  ON public.idea_votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Rewrite public.upvote_idea RPC
CREATE OR REPLACE FUNCTION public.upvote_idea(p_idea_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_has_voted boolean;
  v_count integer;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to upvote.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.idea_votes 
    WHERE idea_id = p_idea_id AND user_id = v_uid
  ) INTO v_has_voted;

  IF v_has_voted THEN
    DELETE FROM public.idea_votes WHERE idea_id = p_idea_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.idea_votes (idea_id, user_id) 
    VALUES (p_idea_id, v_uid)
    ON CONFLICT (idea_id, user_id) DO NOTHING;
  END IF;

  SELECT upvotes INTO v_count FROM public.ideabox_submissions WHERE id = p_idea_id;

  RETURN jsonb_build_object(
    'id', p_idea_id,
    'upvotes', COALESCE(v_count, 0),
    'hasVoted', NOT v_has_voted
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.upvote_idea(text) TO authenticated;

-- ==============================================================================
-- 3. USER_ROLES TABLE, has_role() REWRITE & ROLE POLICIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  scope text NOT NULL DEFAULT 'global',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_user_role_scope UNIQUE (user_id, role, scope)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Backfill user_roles from existing profiles
INSERT INTO public.user_roles (user_id, role, scope)
SELECT id, role, COALESCE(department, 'global')
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role, scope) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, scope)
SELECT id, role, 'global'
FROM public.profiles
WHERE role IN ('Admin', 'Execom')
ON CONFLICT (user_id, role, scope) DO NOTHING;

-- Drop 2-argument has_role overload if created with a default parameter to prevent ambiguous function call errors
DROP FUNCTION IF EXISTS public.has_role(text, text);

-- Rewrite 1-argument has_role(text) in-place using user_roles table
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
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role = required_role
  );
END;
$$;

-- Provide 2-argument has_role(text, text) for scoped role checks without default parameter
CREATE OR REPLACE FUNCTION public.has_role(required_role text, required_scope text)
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
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role = required_role
      AND (required_scope IS NULL OR scope = required_scope OR scope = 'global')
  );
END;
$$;

-- Keep profiles.role as a display field synced from user_roles
CREATE OR REPLACE FUNCTION public.trg_sync_profile_display_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_user uuid;
  v_primary_role text;
BEGIN
  v_target_user := COALESCE(NEW.user_id, OLD.user_id);

  SELECT role INTO v_primary_role
  FROM public.user_roles
  WHERE user_id = v_target_user
  ORDER BY 
    CASE role
      WHEN 'Admin' THEN 1
      WHEN 'Execom' THEN 2
      WHEN 'Faculty' THEN 3
      WHEN 'Innovator' THEN 4
      WHEN 'Alumni' THEN 5
      WHEN 'ExternalParticipant' THEN 6
      ELSE 7
    END
  LIMIT 1;

  UPDATE public.profiles
  SET role = COALESCE(v_primary_role, 'Student')
  WHERE id = v_target_user;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_display_role ON public.user_roles;
CREATE TRIGGER trg_sync_profile_display_role
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_profile_display_role();

-- RLS on user_roles
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role('Admin')
    OR public.has_role('Execom')
  );

DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
CREATE POLICY "user_roles_admin_write"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

-- Admin RPC: admin_set_user_role
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id uuid, 
  p_new_role text,
  p_scope text DEFAULT 'global'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'Access Denied: Only Administrators can modify user roles.';
  END IF;

  INSERT INTO public.user_roles (user_id, role, scope)
  VALUES (p_target_user_id, p_new_role, COALESCE(p_scope, 'global'))
  ON CONFLICT (user_id, role, scope) DO UPDATE
  SET role = p_new_role;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text, text) TO authenticated;

-- ==============================================================================
-- 4. APPEND-ONLY AUDIT_LOG & TRIGGERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz DEFAULT now()
);

-- Ensure all requested columns exist if table previously existed
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS before jsonb,
  ADD COLUMN IF NOT EXISTS after jsonb;

ALTER TABLE public.audit_log ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Strict Append-Only: No UPDATE or DELETE policies
DROP POLICY IF EXISTS "audit_log_select_admins" ON public.audit_log;
CREATE POLICY "audit_log_select_admins"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'));

DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
CREATE POLICY "audit_log_insert"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "audit_log_update" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_delete" ON public.audit_log;

-- Universal Audit Logger Trigger Function
CREATE OR REPLACE FUNCTION public.trg_record_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id uuid;
  v_entity_id text;
  v_before jsonb := NULL;
  v_after jsonb := NULL;
BEGIN
  v_actor_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_entity_id := COALESCE(NEW.id::text, NEW.user_id::text);
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := COALESCE(NEW.id::text, NEW.user_id::text, OLD.id::text, OLD.user_id::text);
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_entity_id := COALESCE(OLD.id::text, OLD.user_id::text);
    v_before := to_jsonb(OLD);
  END IF;

  -- Scrub sensitive PII for KYC verifications (Rule 6 compliance)
  IF TG_TABLE_NAME = 'kyc_verifications' THEN
    IF v_before IS NOT NULL THEN
      v_before := v_before - 'doc_number' - 'doc_number_encrypted';
    END IF;
    IF v_after IS NOT NULL THEN
      v_after := v_after - 'doc_number' - 'doc_number_encrypted';
    END IF;
  END IF;

  INSERT INTO public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before,
    after,
    created_at
  ) VALUES (
    v_actor_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(v_entity_id, 'unknown'),
    v_before,
    v_after,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_kyc ON public.kyc_verifications;
CREATE TRIGGER trg_audit_kyc
  AFTER INSERT OR UPDATE OR DELETE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_record_audit_event();

DROP TRIGGER IF EXISTS trg_audit_ideabox ON public.ideabox_submissions;
CREATE TRIGGER trg_audit_ideabox
  AFTER INSERT OR UPDATE OR DELETE ON public.ideabox_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_record_audit_event();

DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_record_audit_event();

DROP TRIGGER IF EXISTS trg_audit_hackathon_teams ON public.hackathon_teams;
CREATE TRIGGER trg_audit_hackathon_teams
  AFTER INSERT OR UPDATE OR DELETE ON public.hackathon_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_record_audit_event();

-- ==============================================================================
-- 5. STATUS_HISTORY TABLE FOR IDEAS AND KYC
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('idea', 'kyc')),
  entity_id text NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_history_select" ON public.status_history;
CREATE POLICY "status_history_select"
  ON public.status_history
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('Admin') 
    OR public.has_role('Execom')
    OR (entity_type = 'kyc' AND entity_id = auth.uid()::text)
    OR (entity_type = 'idea' AND EXISTS (
      SELECT 1 FROM public.ideabox_submissions 
      WHERE id = entity_id AND author_id = auth.uid()::text
    ))
  );

CREATE OR REPLACE FUNCTION public.trg_track_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'ideabox_submissions' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.status_history (
        entity_type,
        entity_id,
        old_status,
        new_status,
        changed_by,
        reason,
        created_at
      ) VALUES (
        'idea',
        NEW.id,
        OLD.status::text,
        NEW.status::text,
        auth.uid(),
        COALESCE(NEW.admin_feedback, 'Idea review status updated'),
        now()
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'kyc_verifications' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.status_history (
        entity_type,
        entity_id,
        old_status,
        new_status,
        changed_by,
        reason,
        created_at
      ) VALUES (
        'kyc',
        NEW.user_id::text,
        OLD.status::text,
        NEW.status::text,
        auth.uid(),
        COALESCE(NEW.rejection_reason::text, NEW.admin_remarks, 'KYC verification status updated'),
        now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_status_history_ideabox ON public.ideabox_submissions;
CREATE TRIGGER trg_status_history_ideabox
  AFTER UPDATE OF status ON public.ideabox_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_track_status_history();

DROP TRIGGER IF EXISTS trg_status_history_kyc ON public.kyc_verifications;
CREATE TRIGGER trg_status_history_kyc
  AFTER UPDATE OF status ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_track_status_history();

-- ==============================================================================
-- 6. SPLIT HACKATHON_TEAMS INTO RELATIONAL TABLES
-- ==============================================================================

-- A. team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  avatar text,
  role_in_team text NOT NULL,
  is_leader boolean DEFAULT false,
  department text,
  college text,
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT uq_team_members_team_user UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- B. team_join_requests
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_avatar text,
  user_college text,
  requested_role text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_team_join_request UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- C. team_submissions
CREATE TABLE IF NOT EXISTS public.team_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text UNIQUE NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  project_title text NOT NULL,
  tagline text,
  track text NOT NULL,
  overview text,
  tech_stack text[] DEFAULT '{}',
  github_url text,
  demo_video_url text,
  live_demo_url text,
  pitch_deck_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  score jsonb,
  admin_feedback text,
  reviewed_by text,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;

-- D. Helper Functions for Membership & Leadership via relational tables
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id text, p_check_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_check_uid IS NULL OR p_team_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_check_uid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_team_leader(p_team_id text, p_check_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_check_uid IS NULL OR p_team_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_check_uid AND is_leader = true
  );
END;
$$;

-- Backfill from JSONB columns
DO $$
BEGIN
  -- Backfill team_members
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'members'
  ) THEN
    INSERT INTO public.team_members (team_id, user_id, name, email, avatar, role_in_team, is_leader, department, college, joined_at)
    SELECT 
      t.id,
      (m->>'userId')::uuid,
      COALESCE(m->>'name', 'Team Member'),
      COALESCE(m->>'email', 'member@bmce.ac.in'),
      m->>'avatar',
      COALESCE(m->>'roleInTeam', 'Developer'),
      COALESCE((m->>'isLeader')::boolean, false),
      m->>'department',
      m->>'college',
      COALESCE((m->>'joinedAt')::timestamptz, now())
    FROM public.hackathon_teams t,
         LATERAL jsonb_array_elements(t.members) m
    WHERE (m->>'userId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (m->>'userId')::uuid)
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  -- Backfill team_join_requests
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'join_requests'
  ) THEN
    INSERT INTO public.team_join_requests (team_id, user_id, user_name, user_email, user_avatar, user_college, requested_role, message, status, created_at)
    SELECT 
      t.id,
      (jr->>'userId')::uuid,
      COALESCE(jr->>'userName', 'Applicant'),
      COALESCE(jr->>'userEmail', 'applicant@bmce.ac.in'),
      jr->>'userAvatar',
      jr->>'userCollege',
      COALESCE(jr->>'requestedRole', 'Developer'),
      jr->>'message',
      COALESCE(jr->>'status', 'pending'),
      COALESCE((jr->>'createdAt')::timestamptz, now())
    FROM public.hackathon_teams t,
         LATERAL jsonb_array_elements(t.join_requests) jr
    WHERE (jr->>'userId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (jr->>'userId')::uuid)
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  -- Backfill team_submissions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hackathon_teams' AND column_name = 'project_submission'
  ) THEN
    INSERT INTO public.team_submissions (
      team_id, project_title, tagline, track, overview, tech_stack, github_url, 
      demo_video_url, live_demo_url, pitch_deck_url, status, score, admin_feedback, 
      reviewed_by, reviewed_at, submitted_at, created_at
    )
    SELECT 
      t.id,
      COALESCE(t.project_submission->>'projectTitle', t.name || ' Submission'),
      t.project_submission->>'tagline',
      COALESCE(t.project_submission->>'track', t.track),
      t.project_submission->>'overview',
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(t.project_submission->'techStack')), '{}'::text[]),
      COALESCE(t.project_submission->>'githubUrl', ''),
      t.project_submission->>'demoVideoUrl',
      t.project_submission->>'liveDemoUrl',
      t.project_submission->>'pitchDeckUrl',
      COALESCE(t.project_submission->>'status', 'draft'),
      t.project_submission->'score',
      t.project_submission->>'adminFeedback',
      t.project_submission->>'reviewedBy',
      (t.project_submission->>'reviewedAt')::timestamptz,
      (t.project_submission->>'submittedAt')::timestamptz,
      now()
    FROM public.hackathon_teams t
    WHERE t.project_submission IS NOT NULL AND t.project_submission != 'null'::jsonb
    ON CONFLICT (team_id) DO NOTHING;
  END IF;
END $$;

-- Policies on relational team tables
-- team_members
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
CREATE POLICY "team_members_select"
  ON public.team_members
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "team_members_write" ON public.team_members;
CREATE POLICY "team_members_write"
  ON public.team_members
  FOR ALL
  TO authenticated
  USING (
    public.is_team_leader(team_id, auth.uid()) 
    OR public.has_role('Admin')
    OR (NOT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id))
  )
  WITH CHECK (
    public.is_team_leader(team_id, auth.uid()) 
    OR public.has_role('Admin')
    OR (NOT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id))
  );

-- team_join_requests
DROP POLICY IF EXISTS "team_join_requests_select" ON public.team_join_requests;
CREATE POLICY "team_join_requests_select"
  ON public.team_join_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_team_member(team_id, auth.uid()) 
    OR public.has_role('Admin')
  );

DROP POLICY IF EXISTS "team_join_requests_insert" ON public.team_join_requests;
CREATE POLICY "team_join_requests_insert"
  ON public.team_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "team_join_requests_update_leader" ON public.team_join_requests;
CREATE POLICY "team_join_requests_update_leader"
  ON public.team_join_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_team_leader(team_id, auth.uid()) OR public.has_role('Admin'))
  WITH CHECK (public.is_team_leader(team_id, auth.uid()) OR public.has_role('Admin'));

DROP POLICY IF EXISTS "team_join_requests_delete" ON public.team_join_requests;
CREATE POLICY "team_join_requests_delete"
  ON public.team_join_requests
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_team_leader(team_id, auth.uid()) OR public.has_role('Admin'));

-- team_submissions
DROP POLICY IF EXISTS "team_submissions_select" ON public.team_submissions;
CREATE POLICY "team_submissions_select"
  ON public.team_submissions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "team_submissions_write_leader" ON public.team_submissions;
CREATE POLICY "team_submissions_write_leader"
  ON public.team_submissions
  FOR ALL
  TO authenticated
  USING (
    public.is_team_leader(team_id, auth.uid()) 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  )
  WITH CHECK (
    public.is_team_leader(team_id, auth.uid()) 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  );

-- Trigger to guard jury scoring on team_submissions
CREATE OR REPLACE FUNCTION public.trg_check_team_submissions_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF (NEW.score IS DISTINCT FROM OLD.score OR NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback) THEN
    IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
      RAISE EXCEPTION 'Access Denied: Hackathon jury scores and feedback can only be modified by evaluators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_team_submissions ON public.team_submissions;
CREATE TRIGGER trg_guard_team_submissions
  BEFORE UPDATE ON public.team_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_team_submissions_guard();

-- ==============================================================================
-- 7. PERFORMANCE INDEXES FOR FOREIGN KEYS & WHERE CLAUSES
-- ==============================================================================

-- idea_votes
CREATE INDEX IF NOT EXISTS idx_idea_votes_idea_id ON public.idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user_id ON public.idea_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_created_at ON public.idea_votes(created_at);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_scope ON public.user_roles(scope);
CREATE INDEX IF NOT EXISTS idx_user_roles_composite ON public.user_roles(user_id, role, scope);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- status_history
CREATE INDEX IF NOT EXISTS idx_status_history_entity ON public.status_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_by ON public.status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON public.status_history(created_at DESC);

-- team_members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_leader ON public.team_members(team_id, is_leader);

-- team_join_requests
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON public.team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user_id ON public.team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON public.team_join_requests(status);

-- team_submissions
CREATE INDEX IF NOT EXISTS idx_team_submissions_team_id ON public.team_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_status ON public.team_submissions(status);

-- hackathon_teams
CREATE INDEX IF NOT EXISTS idx_hackathon_teams_hackathon_id ON public.hackathon_teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_teams_is_open ON public.hackathon_teams(is_open);

-- ideabox_submissions
CREATE INDEX IF NOT EXISTS idx_ideabox_author_id ON public.ideabox_submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_ideabox_status ON public.ideabox_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ideabox_stage ON public.ideabox_submissions(stage);
CREATE INDEX IF NOT EXISTS idx_ideabox_created_at ON public.ideabox_submissions(created_at DESC);

-- kyc_verifications
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON public.kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_retention_delete_at ON public.kyc_verifications(retention_delete_at) WHERE retention_delete_at IS NOT NULL;

-- registrations
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_type ON public.registrations(type);

-- forum_comments & forum_discussions
CREATE INDEX IF NOT EXISTS idx_forum_comments_discussion_id ON public.forum_comments(discussion_id);
ALTER TABLE IF EXISTS public.forum_discussions ADD COLUMN IF NOT EXISTS channel text DEFAULT 'General';
CREATE INDEX IF NOT EXISTS idx_forum_discussions_channel ON public.forum_discussions(channel);

-- events
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- ==============================================================================
-- 8. UPDATE EXEC_KYC_DECISION TO SYNC USER_ROLES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.exec_kyc_decision(
  p_admin_id uuid,
  p_user_id uuid,
  p_decision text,
  p_rejection_reason text DEFAULT NULL,
  p_remarks text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_retention_date timestamptz;
  v_prev_role text;
  v_user_email text;
  v_result jsonb;
BEGIN
  IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins or Execom members can evaluate KYC submissions.';
  END IF;

  IF p_decision NOT IN ('verified', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  IF p_decision = 'verified' THEN
    v_retention_date := now() + interval '90 days';
  ELSE
    v_retention_date := NULL;
  END IF;

  -- 1. Update kyc_verifications
  UPDATE public.kyc_verifications
  SET status = p_decision,
      verified_at = CASE WHEN p_decision = 'verified' THEN now() ELSE NULL END,
      rejection_reason = p_rejection_reason,
      admin_remarks = p_remarks,
      retention_delete_at = v_retention_date
  WHERE user_id = p_user_id;

  -- 2. Elevate role if verified (Student -> Innovator) in user_roles and profiles
  SELECT role, email INTO v_prev_role, v_user_email 
  FROM public.profiles 
  WHERE id = p_user_id;

  IF p_decision = 'verified' AND v_prev_role = 'Student' THEN
    INSERT INTO public.user_roles (user_id, role, scope)
    VALUES (p_user_id, 'Innovator', 'global')
    ON CONFLICT (user_id, role, scope) DO UPDATE SET role = 'Innovator';

    UPDATE public.profiles
    SET role = 'Innovator'
    WHERE id = p_user_id;
  END IF;

  -- 3. Record in audit_log
  INSERT INTO public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before,
    after,
    created_at
  ) VALUES (
    p_admin_id,
    'KYC_' || upper(p_decision),
    'kyc_verifications',
    p_user_id::text,
    jsonb_build_object('status', 'pending', 'previousRole', v_prev_role),
    jsonb_build_object('status', p_decision, 'rejectionReason', p_rejection_reason, 'remarks', p_remarks, 'retentionDeleteAt', v_retention_date),
    now()
  );

  -- 4. Queue user notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    p_user_id,
    CASE 
      WHEN p_decision = 'verified' THEN 'KYC Verification Approved 🎉'
      WHEN p_decision = 'rejected' THEN 'KYC Action Required ⚠️'
      ELSE 'KYC Status Update'
    END,
    CASE 
      WHEN p_decision = 'verified' THEN 'Congratulations! Your student verification was approved. You have been granted the Innovator Pass.'
      WHEN p_decision = 'rejected' THEN 'Your verification document was rejected: ' || COALESCE(p_rejection_reason, p_remarks, 'Please check your portal to resubmit.')
      ELSE 'Your KYC document is under review.'
    END,
    'kyc'
  );

  v_result := jsonb_build_object(
    'success', true,
    'decision', p_decision,
    'userId', p_user_id,
    'promotedToInnovator', (p_decision = 'verified' AND v_prev_role = 'Student'),
    'retentionDeleteAt', v_retention_date
  );

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.exec_kyc_decision(uuid, uuid, text, text, text) TO authenticated;

