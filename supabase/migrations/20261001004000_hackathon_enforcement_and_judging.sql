-- ==============================================================================
-- Migration: 20261001004000_hackathon_enforcement_and_judging.sql
-- Description: Enforce KYC verification on team/registration inserts,
--              team invites with expiry and size limits, deadline locking with snapshots,
--              judging rubric with conflict of interest guard, leaderboard access control,
--              and applicant skill overlap matching function.
-- ==============================================================================

-- ==============================================================================
-- 1. KYC VERIFICATION ENFORCEMENT HELPER & POLICIES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_kyc_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.kyc_verifications
    WHERE user_id = p_user_id AND status = 'verified'
  );
END;
$$;

-- Enforce KYC verification in RLS on team_members
DROP POLICY IF EXISTS "team_members_insert_kyc" ON public.team_members;
CREATE POLICY "team_members_insert_kyc"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_kyc_verified(user_id)
    AND (
      public.is_team_leader(team_id, auth.uid()) 
      OR user_id = auth.uid() 
      OR public.has_role('Admin')
    )
  );

-- Database Trigger enforcing KYC verification on team_members
CREATE OR REPLACE FUNCTION public.check_team_member_kyc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_kyc_verified(NEW.user_id) AND NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'KYC verification required: User % must have verified KYC status to join a hackathon team.', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_team_member_kyc ON public.team_members;
CREATE TRIGGER trg_check_team_member_kyc
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_team_member_kyc();

-- Enforce KYC verification on registrations
DROP POLICY IF EXISTS "registrations_insert_kyc" ON public.registrations;
CREATE POLICY "registrations_insert_kyc"
  ON public.registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_kyc_verified(auth.uid()) 
    OR public.has_role('Admin')
  );

CREATE OR REPLACE FUNCTION public.check_registration_kyc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_kyc_verified(auth.uid()) AND NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'KYC verification required: You must complete KYC verification before registering for hackathons.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_registration_kyc ON public.registrations;
CREATE TRIGGER trg_check_registration_kyc
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_registration_kyc();

-- ==============================================================================
-- 2. TEAM INVITES TABLE & JOIN RPC
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  team_id text NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  max_uses integer NOT NULL DEFAULT 4 CHECK (max_uses > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_invites_code ON public.team_invites(code);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON public.team_invites(team_id);

DROP POLICY IF EXISTS "team_invites_select" ON public.team_invites;
CREATE POLICY "team_invites_select"
  ON public.team_invites
  FOR SELECT
  TO authenticated
  USING (
    public.is_team_member(team_id, auth.uid())
    OR public.has_role('Admin')
  );

DROP POLICY IF EXISTS "team_invites_manage" ON public.team_invites;
CREATE POLICY "team_invites_manage"
  ON public.team_invites
  FOR ALL
  TO authenticated
  USING (
    public.is_team_leader(team_id, auth.uid())
    OR public.has_role('Admin')
  )
  WITH CHECK (
    public.is_team_leader(team_id, auth.uid())
    OR public.has_role('Admin')
  );

-- RPC: create_team_invite
CREATE OR REPLACE FUNCTION public.create_team_invite(
  p_team_id text,
  p_hours_valid integer DEFAULT 48,
  p_max_uses integer DEFAULT 4
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_code text;
  v_expires timestamptz;
BEGIN
  IF NOT (public.is_team_leader(p_team_id, auth.uid()) OR public.has_role('Admin')) THEN
    RAISE EXCEPTION 'Only the team leader or an admin can generate invite codes.';
  END IF;

  v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  v_expires := now() + (p_hours_valid || ' hours')::interval;

  INSERT INTO public.team_invites (code, team_id, created_by, expires_at, max_uses)
  VALUES (v_code, p_team_id, auth.uid(), v_expires, p_max_uses);

  RETURN jsonb_build_object(
    'code', v_code,
    'team_id', p_team_id,
    'expires_at', v_expires,
    'max_uses', p_max_uses
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_team_invite(text, integer, integer) TO authenticated;

-- RPC: join_team_with_invite
CREATE OR REPLACE FUNCTION public.join_team_with_invite(
  p_code text,
  p_role_in_team text DEFAULT 'Developer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_invite record;
  v_team record;
  v_event record;
  v_profile record;
  v_member_count integer;
  v_max_team_size integer;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to join team.';
  END IF;

  -- 1. Check KYC verification
  IF NOT public.is_kyc_verified(v_uid) THEN
    RAISE EXCEPTION 'KYC verification required: You must have verified KYC status to join a hackathon team.';
  END IF;

  -- 2. Lookup invite
  SELECT * INTO v_invite
  FROM public.team_invites
  WHERE code = upper(trim(p_code));

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code: No active invite matches "%"', p_code;
  END IF;

  IF now() > v_invite.expires_at THEN
    RAISE EXCEPTION 'Invite code has expired on %', v_invite.expires_at;
  END IF;

  IF v_invite.used_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'Invite code usage limit reached (% uses).', v_invite.max_uses;
  END IF;

  -- 3. Lookup team & event
  SELECT * INTO v_team FROM public.hackathon_teams WHERE id = v_invite.team_id;
  IF v_team IS NULL THEN
    RAISE EXCEPTION 'Team no longer exists.';
  END IF;

  SELECT * INTO v_event FROM public.hackathon_events WHERE id = v_team.hackathon_id;
  v_max_team_size := COALESCE(v_event.max_team_size, 4);

  -- 4. Check user not already in this team
  IF public.is_team_member(v_team.id, v_uid) THEN
    RAISE EXCEPTION 'You are already a member of this team.';
  END IF;

  -- 5. Check user not in another team for the same hackathon
  IF EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.hackathon_teams ht ON ht.id = tm.team_id
    WHERE tm.user_id = v_uid AND ht.hackathon_id = v_team.hackathon_id
  ) THEN
    RAISE EXCEPTION 'You are already registered with another team in this hackathon.';
  END IF;

  -- 6. Check team size limit
  SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team.id;
  IF v_member_count >= v_max_team_size THEN
    RAISE EXCEPTION 'Team is full (maximum % members allowed).', v_max_team_size;
  END IF;

  -- 7. Insert member
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.team_members (
    team_id,
    user_id,
    name,
    email,
    avatar,
    role_in_team,
    is_leader,
    department,
    college
  ) VALUES (
    v_team.id,
    v_uid,
    COALESCE(v_profile.full_name, 'Team Member'),
    COALESCE(v_profile.email, 'member@bmce.ac.in'),
    v_profile.avatar_url,
    p_role_in_team,
    false,
    v_profile.department,
    v_profile.institution
  );

  -- 8. Increment used count
  UPDATE public.team_invites
  SET used_count = used_count + 1
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'team_id', v_team.id,
    'team_name', v_team.name,
    'role', p_role_in_team
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_team_with_invite(text, text) TO authenticated;

-- ==============================================================================
-- 3. SUBMISSION DEADLINE CHECK & SNAPSHOTS TABLE
-- ==============================================================================

-- Schema updates on hackathon_events
ALTER TABLE public.hackathon_events
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS max_team_size integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS results_published boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.team_submission_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.team_submissions(id) ON DELETE SET NULL,
  project_title text NOT NULL,
  repo_url text NOT NULL,
  commit_sha text,
  demo_url text,
  snapshot_time timestamptz DEFAULT now(),
  submitted_by uuid REFERENCES public.profiles(id),
  is_locked boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.team_submission_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_submission_snapshots_select" ON public.team_submission_snapshots;
CREATE POLICY "team_submission_snapshots_select"
  ON public.team_submission_snapshots
  FOR SELECT
  TO authenticated
  USING (
    public.is_team_member(team_id, auth.uid()) 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  );

-- RPC: submit_hackathon_project (Enforces deadline check & creates snapshot)
CREATE OR REPLACE FUNCTION public.submit_hackathon_project(
  p_team_id text,
  p_project_title text,
  p_tagline text,
  p_track text,
  p_overview text,
  p_tech_stack text[],
  p_github_url text,
  p_commit_sha text DEFAULT NULL,
  p_demo_video_url text DEFAULT NULL,
  p_live_demo_url text DEFAULT NULL,
  p_pitch_deck_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_team record;
  v_event record;
  v_sub_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit hackathon project.';
  END IF;

  -- 1. Verify caller is a team member or leader
  IF NOT (public.is_team_member(p_team_id, v_uid) OR public.has_role('Admin')) THEN
    RAISE EXCEPTION 'Unauthorized: Only team members can submit projects.';
  END IF;

  SELECT * INTO v_team FROM public.hackathon_teams WHERE id = p_team_id;
  IF v_team IS NULL THEN
    RAISE EXCEPTION 'Team not found: %', p_team_id;
  END IF;

  SELECT * INTO v_event FROM public.hackathon_events WHERE id = v_team.hackathon_id;

  -- 2. Check submission deadline
  IF v_event.end_date IS NOT NULL AND now() > v_event.end_date THEN
    RAISE EXCEPTION 'Submission deadline passed at %. Submissions are strictly locked.', v_event.end_date;
  END IF;

  -- 3. Upsert into team_submissions
  INSERT INTO public.team_submissions (
    team_id,
    project_title,
    tagline,
    track,
    overview,
    tech_stack,
    github_url,
    demo_video_url,
    live_demo_url,
    pitch_deck_url,
    status,
    submitted_at
  ) VALUES (
    p_team_id,
    p_project_title,
    p_tagline,
    p_track,
    p_overview,
    COALESCE(p_tech_stack, '{}'::text[]),
    p_github_url,
    p_demo_video_url,
    p_live_demo_url,
    p_pitch_deck_url,
    'submitted',
    now()
  )
  ON CONFLICT (team_id) DO UPDATE SET
    project_title = EXCLUDED.project_title,
    tagline = EXCLUDED.tagline,
    track = EXCLUDED.track,
    overview = EXCLUDED.overview,
    tech_stack = EXCLUDED.tech_stack,
    github_url = EXCLUDED.github_url,
    demo_video_url = EXCLUDED.demo_video_url,
    live_demo_url = EXCLUDED.live_demo_url,
    pitch_deck_url = EXCLUDED.pitch_deck_url,
    status = 'submitted',
    submitted_at = now()
  RETURNING id INTO v_sub_id;

  -- 4. Lock immutable snapshot
  INSERT INTO public.team_submission_snapshots (
    team_id,
    submission_id,
    project_title,
    repo_url,
    commit_sha,
    demo_url,
    snapshot_time,
    submitted_by,
    is_locked
  ) VALUES (
    p_team_id,
    v_sub_id,
    p_project_title,
    p_github_url,
    p_commit_sha,
    p_live_demo_url,
    now(),
    v_uid,
    true
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_sub_id,
    'submitted_at', now(),
    'commit_sha', p_commit_sha
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_hackathon_project(text, text, text, text, text, text[], text, text, text, text, text) TO authenticated;

-- ==============================================================================
-- 4. JUDGING TABLES, CRITERIA & CONFLICT OF INTEREST
-- ==============================================================================

-- A. hackathon_criteria
CREATE TABLE IF NOT EXISTS public.hackathon_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  weight numeric NOT NULL DEFAULT 1.0 CHECK (weight > 0),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hackathon_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hackathon_criteria_select" ON public.hackathon_criteria;
CREATE POLICY "hackathon_criteria_select"
  ON public.hackathon_criteria
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "hackathon_criteria_admin_manage" ON public.hackathon_criteria;
CREATE POLICY "hackathon_criteria_admin_manage"
  ON public.hackathon_criteria
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

INSERT INTO public.hackathon_criteria (name, weight, description)
VALUES 
  ('Innovation & Originality', 1.5, 'Novelty of approach, creativity, and addressing unmet needs'),
  ('Technical Complexity', 1.5, 'Architecture depth, algorithms, hardware integration, and code quality'),
  ('UI/UX & Execution', 1.0, 'Working prototype quality, polish, usability, and design elegance'),
  ('Pitch & Practical Impact', 1.0, 'Business viability, societal benefit, and presentation clarity')
ON CONFLICT (name) DO UPDATE 
  SET weight = EXCLUDED.weight, description = EXCLUDED.description;

-- B. judges
CREATE TABLE IF NOT EXISTS public.judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  organization text,
  is_active boolean DEFAULT true,
  conflict_of_interest boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "judges_select" ON public.judges;
CREATE POLICY "judges_select"
  ON public.judges
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "judges_admin_manage" ON public.judges;
CREATE POLICY "judges_admin_manage"
  ON public.judges
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

-- C. judge_assignments
CREATE TABLE IF NOT EXISTS public.judge_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  track text NOT NULL,
  hackathon_id text REFERENCES public.hackathon_events(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  CONSTRAINT uq_judge_track UNIQUE (judge_id, track, hackathon_id)
);

ALTER TABLE public.judge_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "judge_assignments_select" ON public.judge_assignments;
CREATE POLICY "judge_assignments_select"
  ON public.judge_assignments
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('Admin')
    OR judge_id IN (SELECT id FROM public.judges WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "judge_assignments_admin_manage" ON public.judge_assignments;
CREATE POLICY "judge_assignments_admin_manage"
  ON public.judge_assignments
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

-- D. judge_scores
CREATE TABLE IF NOT EXISTS public.judge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.hackathon_criteria(id) ON DELETE RESTRICT,
  score numeric NOT NULL CHECK (score >= 1 AND score <= 10),
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_team_judge_criterion UNIQUE (team_id, judge_id, criterion_id)
);

ALTER TABLE public.judge_scores ENABLE ROW LEVEL SECURITY;

-- Trigger enforcing Conflict of Interest on judge_scores
CREATE OR REPLACE FUNCTION public.check_judge_scoring_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_is_conflicted boolean;
  v_judge_uid uuid;
BEGIN
  SELECT conflict_of_interest, user_id INTO v_is_conflicted, v_judge_uid
  FROM public.judges
  WHERE id = NEW.judge_id;

  IF v_is_conflicted THEN
    RAISE EXCEPTION 'Scoring blocked: Judge has an active conflict of interest flag.';
  END IF;

  -- Block if judge is a member of the team being scored
  IF public.is_team_member(NEW.team_id, v_judge_uid) THEN
    RAISE EXCEPTION 'Conflict of Interest: A judge cannot score their own hackathon team.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_judge_scoring_conflict ON public.judge_scores;
CREATE TRIGGER trg_check_judge_scoring_conflict
  BEFORE INSERT OR UPDATE ON public.judge_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_judge_scoring_conflict();

DROP POLICY IF EXISTS "judge_scores_select" ON public.judge_scores;
CREATE POLICY "judge_scores_select"
  ON public.judge_scores
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('Admin')
    OR judge_id IN (SELECT id FROM public.judges WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "judge_scores_write" ON public.judge_scores;
CREATE POLICY "judge_scores_write"
  ON public.judge_scores
  FOR ALL
  TO authenticated
  USING (
    public.has_role('Admin')
    OR judge_id IN (SELECT id FROM public.judges WHERE user_id = auth.uid() AND conflict_of_interest = false)
  )
  WITH CHECK (
    public.has_role('Admin')
    OR judge_id IN (SELECT id FROM public.judges WHERE user_id = auth.uid() AND conflict_of_interest = false)
  );

-- ==============================================================================
-- 5. LEADERBOARD VIEW & AUDITABLE ACCESS FUNCTION
-- ==============================================================================

CREATE OR REPLACE VIEW public.hackathon_leaderboard AS
WITH weighted_scores AS (
  SELECT 
    js.team_id,
    js.judge_id,
    js.criterion_id,
    c.weight,
    js.score,
    (js.score * c.weight) AS weighted_score
  FROM public.judge_scores js
  JOIN public.hackathon_criteria c ON c.id = js.criterion_id
  JOIN public.judges j ON j.id = js.judge_id
  WHERE j.conflict_of_interest = false
),
team_totals AS (
  SELECT 
    team_id,
    SUM(weighted_score) / NULLIF(SUM(weight), 0) AS average_weighted_score,
    COUNT(DISTINCT judge_id) AS judges_count
  FROM weighted_scores
  GROUP BY team_id
)
SELECT 
  t.id AS team_id,
  t.hackathon_id,
  t.name AS team_name,
  t.track,
  e.title AS hackathon_title,
  e.status AS event_status,
  COALESCE(e.results_published, false) AS results_published,
  sub.project_title,
  COALESCE(tt.average_weighted_score, 0) AS total_score,
  COALESCE(tt.judges_count, 0) AS judges_count,
  DENSE_RANK() OVER (
    PARTITION BY t.hackathon_id 
    ORDER BY COALESCE(tt.average_weighted_score, 0) DESC
  ) AS rank
FROM public.hackathon_teams t
JOIN public.hackathon_events e ON e.id = t.hackathon_id
LEFT JOIN public.team_submissions sub ON sub.team_id = t.id
LEFT JOIN team_totals tt ON tt.team_id = t.id;

-- RPC: get_hackathon_leaderboard
-- Restricted to Admins until Event is 'Completed' AND results_published is true
CREATE OR REPLACE FUNCTION public.get_hackathon_leaderboard(p_hackathon_id text)
RETURNS TABLE (
  team_id text,
  team_name text,
  track text,
  project_title text,
  total_score numeric,
  judges_count bigint,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_status text;
  v_published boolean;
BEGIN
  SELECT status, COALESCE(results_published, false)
  INTO v_status, v_published
  FROM public.hackathon_events
  WHERE id = p_hackathon_id;

  IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
    IF v_status <> 'Completed' OR NOT v_published THEN
      RAISE EXCEPTION 'Confidential: Hackathon leaderboard is hidden until results are officially declared by the evaluation committee.';
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    l.team_id,
    l.team_name,
    l.track,
    l.project_title,
    ROUND(l.total_score, 2),
    l.judges_count,
    l.rank
  FROM public.hackathon_leaderboard l
  WHERE l.hackathon_id = p_hackathon_id
  ORDER BY l.rank ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_hackathon_leaderboard(text) TO authenticated, anon;

-- ==============================================================================
-- 6. TEAM MATCHING SUGGESTIONS FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.suggest_team_matches(
  p_team_id text,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  department text,
  skills text[],
  matching_skills text[],
  overlap_count integer,
  suggested_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_team record;
  v_needed text[];
BEGIN
  SELECT * INTO v_team FROM public.hackathon_teams WHERE id = p_team_id;
  IF v_team IS NULL THEN
    RAISE EXCEPTION 'Team not found: %', p_team_id;
  END IF;

  v_needed := COALESCE(v_team.roles_needed, '{}'::text[]);

  RETURN QUERY
  WITH candidate_skills AS (
    SELECT 
      p.id AS c_uid,
      p.full_name AS c_name,
      p.avatar_url AS c_avatar,
      p.department AS c_dept,
      p.skills AS c_skills,
      ARRAY(
        SELECT unnest(p.skills)
        INTERSECT
        SELECT unnest(v_needed)
      ) AS c_overlap
    FROM public.profiles p
    WHERE public.is_kyc_verified(p.id)
      AND NOT public.is_team_member(p_team_id, p.id)
      -- Exclude users already registered in another team for this event
      AND NOT EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.hackathon_teams ht ON ht.id = tm.team_id
        WHERE tm.user_id = p.id AND ht.hackathon_id = v_team.hackathon_id
      )
  )
  SELECT 
    c.c_uid,
    c.c_name,
    c.c_avatar,
    c.c_dept,
    c.c_skills,
    c.c_overlap,
    COALESCE(cardinality(c.c_overlap), 0) AS overlap_count,
    COALESCE(c.c_overlap[1], 'Developer') AS suggested_role
  FROM candidate_skills c
  ORDER BY cardinality(c.c_overlap) DESC, c.c_name ASC
  LIMIT p_limit;
END;
$$;
GRANT EXECUTE ON FUNCTION public.suggest_team_matches(text, integer) TO authenticated;
