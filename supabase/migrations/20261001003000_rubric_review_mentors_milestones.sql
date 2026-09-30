-- ==============================================================================
-- Migration: 20261001003000_rubric_review_mentors_milestones.sql
-- Description: Rubric-based multi-reviewer evaluation, transition rules,
--              mentorship tracking, idea milestones, and server-side drafts.
-- ==============================================================================

-- ==============================================================================
-- 1. REVIEW CRITERIA TABLE & SEED DATA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.review_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  weight numeric NOT NULL DEFAULT 1.0 CHECK (weight > 0),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_criteria_select" ON public.review_criteria;
CREATE POLICY "review_criteria_select"
  ON public.review_criteria
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "review_criteria_admin_write" ON public.review_criteria;
CREATE POLICY "review_criteria_admin_write"
  ON public.review_criteria
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

-- Seed default rubric criteria: Problem, Feasibility, Impact, Team
INSERT INTO public.review_criteria (name, weight, description)
VALUES 
  ('Problem', 1.0, 'Clarity, severity, and urgency of the problem addressed'),
  ('Feasibility', 1.0, 'Technical feasibility, architecture, and realistic execution plan'),
  ('Impact', 1.0, 'Market potential, scalability, and societal/economic impact'),
  ('Team', 1.0, 'Team capability, domain knowledge, and execution bandwidth')
ON CONFLICT (name) DO UPDATE 
  SET weight = EXCLUDED.weight, description = EXCLUDED.description;

-- ==============================================================================
-- 2. IDEA REVIEWS & SCORES TABLES WITH RLS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.idea_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id text NOT NULL REFERENCES public.ideabox_submissions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id),
  assigned_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  overall_feedback text,
  CONSTRAINT uq_idea_reviewer UNIQUE (idea_id, reviewer_id)
);

ALTER TABLE public.idea_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.idea_review_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.idea_reviews(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.review_criteria(id) ON DELETE RESTRICT,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_review_criterion UNIQUE (review_id, criterion_id)
);

ALTER TABLE public.idea_review_scores ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_reviews_idea_id ON public.idea_reviews(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_reviews_reviewer_id ON public.idea_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_idea_review_scores_review_id ON public.idea_review_scores(review_id);
CREATE INDEX IF NOT EXISTS idx_idea_review_scores_criterion ON public.idea_review_scores(criterion_id);

-- Enforce: Reviewers cannot review their own or their team's ideas
CREATE OR REPLACE FUNCTION public.check_reviewer_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_author_id text;
  v_conflict boolean := false;
BEGIN
  SELECT author_id INTO v_author_id 
  FROM public.ideabox_submissions 
  WHERE id = NEW.idea_id;
  
  IF v_author_id IS NOT NULL AND (NEW.reviewer_id::text = v_author_id) THEN
    RAISE EXCEPTION 'Conflict of interest: A user cannot review their own startup idea.';
  END IF;

  -- Check if reviewer and author are teammates in any hackathon team
  IF v_author_id IS NOT NULL AND v_author_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.team_members tm1
      JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = NEW.reviewer_id
        AND tm2.user_id = v_author_id::uuid
    ) INTO v_conflict;

    IF v_conflict THEN
      RAISE EXCEPTION 'Conflict of interest: Reviewer cannot review an idea pitched by their teammate.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_reviewer_conflict ON public.idea_reviews;
CREATE TRIGGER trg_check_reviewer_conflict
  BEFORE INSERT OR UPDATE ON public.idea_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_reviewer_conflict();

-- RLS for idea_reviews:
-- Reviewer sees their own assignment; Admins/Execom see all; Idea author sees only after submitted.
DROP POLICY IF EXISTS "idea_reviews_select" ON public.idea_reviews;
CREATE POLICY "idea_reviews_select"
  ON public.idea_reviews
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('Admin') 
    OR public.has_role('Execom')
    OR reviewer_id = auth.uid()
    OR (
      submitted_at IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.ideabox_submissions i
        WHERE i.id = idea_reviews.idea_id AND i.author_id = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "idea_reviews_admin_manage" ON public.idea_reviews;
CREATE POLICY "idea_reviews_admin_manage"
  ON public.idea_reviews
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

DROP POLICY IF EXISTS "idea_reviews_reviewer_update" ON public.idea_reviews;
CREATE POLICY "idea_reviews_reviewer_update"
  ON public.idea_reviews
  FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid() AND submitted_at IS NULL)
  WITH CHECK (reviewer_id = auth.uid());

-- RLS for idea_review_scores:
-- Reviewer sees only their own scores until they submit; Admins see all.
DROP POLICY IF EXISTS "idea_review_scores_select" ON public.idea_review_scores;
CREATE POLICY "idea_review_scores_select"
  ON public.idea_review_scores
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('Admin')
    OR EXISTS (
      SELECT 1 FROM public.idea_reviews r
      WHERE r.id = idea_review_scores.review_id
        AND (
          r.reviewer_id = auth.uid()
          OR (
            -- Once submitted, other submitted reviewers on the same idea can see each other's rubric breakdown
            r.submitted_at IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.idea_reviews my_rev
              WHERE my_rev.idea_id = r.idea_id
                AND my_rev.reviewer_id = auth.uid()
                AND my_rev.submitted_at IS NOT NULL
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "idea_review_scores_reviewer_insert" ON public.idea_review_scores;
CREATE POLICY "idea_review_scores_reviewer_insert"
  ON public.idea_review_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role('Admin')
    OR EXISTS (
      SELECT 1 FROM public.idea_reviews r
      WHERE r.id = review_id
        AND r.reviewer_id = auth.uid()
        AND r.submitted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "idea_review_scores_reviewer_update" ON public.idea_review_scores;
CREATE POLICY "idea_review_scores_reviewer_update"
  ON public.idea_review_scores
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role('Admin')
    OR EXISTS (
      SELECT 1 FROM public.idea_reviews r
      WHERE r.id = idea_review_scores.review_id
        AND r.reviewer_id = auth.uid()
        AND r.submitted_at IS NULL
    )
  )
  WITH CHECK (
    public.has_role('Admin')
    OR EXISTS (
      SELECT 1 FROM public.idea_reviews r
      WHERE r.id = idea_review_scores.review_id
        AND r.reviewer_id = auth.uid()
        AND r.submitted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "idea_review_scores_admin_delete" ON public.idea_review_scores;
CREATE POLICY "idea_review_scores_admin_delete"
  ON public.idea_review_scores
  FOR DELETE
  TO authenticated
  USING (public.has_role('Admin'));

-- ==============================================================================
-- 3. RPC assign_reviewers & VIEWS FOR AGGREGATE SCORES
-- ==============================================================================

-- RPC: assign_reviewers(idea_id, reviewer_ids[]) (Admin only)
CREATE OR REPLACE FUNCTION public.assign_reviewers(
  p_idea_id text,
  p_reviewer_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_reviewer_id uuid;
  v_assigned_count integer := 0;
  v_author_id text;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'Only administrators can assign idea reviewers.';
  END IF;

  SELECT author_id INTO v_author_id
  FROM public.ideabox_submissions
  WHERE id = p_idea_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Idea not found: %', p_idea_id;
  END IF;

  -- Validate none of the reviewers is author
  FOREACH v_reviewer_id IN ARRAY p_reviewer_ids
  LOOP
    IF v_reviewer_id::text = v_author_id THEN
      RAISE EXCEPTION 'Cannot assign author as reviewer for their own idea.';
    END IF;
  END LOOP;

  -- Insert new reviewer assignments
  FOREACH v_reviewer_id IN ARRAY p_reviewer_ids
  LOOP
    INSERT INTO public.idea_reviews (idea_id, reviewer_id, assigned_by)
    VALUES (p_idea_id, v_reviewer_id, v_caller)
    ON CONFLICT (idea_id, reviewer_id) DO NOTHING;
    v_assigned_count := v_assigned_count + 1;
  END LOOP;

  -- Remove unsubmitted reviews that are no longer in the assigned list
  DELETE FROM public.idea_reviews
  WHERE idea_id = p_idea_id
    AND submitted_at IS NULL
    AND NOT (reviewer_id = ANY(p_reviewer_ids));

  -- Update idea status to 'Under Review' if currently 'Pending'
  UPDATE public.ideabox_submissions
  SET status = 'Under Review'
  WHERE id = p_idea_id AND status = 'Pending';

  RETURN jsonb_build_object(
    'idea_id', p_idea_id,
    'assigned_count', v_assigned_count,
    'reviewers', p_reviewer_ids
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_reviewers(text, uuid[]) TO authenticated;

-- RPC: submit_idea_review (Reviewer submits their rubric evaluation)
CREATE OR REPLACE FUNCTION public.submit_idea_review(
  p_review_id uuid,
  p_overall_feedback text,
  p_scores jsonb -- array of { criterion_id: uuid, score: 1..5, comment: text }
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_review record;
  v_item jsonb;
  v_criterion_id uuid;
  v_score integer;
  v_comment text;
  v_new_avg numeric;
BEGIN
  SELECT * INTO v_review 
  FROM public.idea_reviews 
  WHERE id = p_review_id;

  IF v_review IS NULL THEN
    RAISE EXCEPTION 'Review record not found.';
  END IF;

  IF v_review.reviewer_id <> auth.uid() AND NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'Unauthorized: you can only submit your own assigned review.';
  END IF;

  -- Upsert each score
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_scores)
  LOOP
    v_criterion_id := (v_item->>'criterion_id')::uuid;
    v_score := (v_item->>'score')::integer;
    v_comment := v_item->>'comment';

    IF v_score < 1 OR v_score > 5 THEN
      RAISE EXCEPTION 'Scores must be integers between 1 and 5.';
    END IF;

    INSERT INTO public.idea_review_scores (review_id, criterion_id, score, comment, updated_at)
    VALUES (p_review_id, v_criterion_id, v_score, v_comment, now())
    ON CONFLICT (review_id, criterion_id) DO UPDATE 
      SET score = EXCLUDED.score,
          comment = EXCLUDED.comment,
          updated_at = now();
  END LOOP;

  -- Mark review as submitted
  UPDATE public.idea_reviews
  SET submitted_at = now(),
      overall_feedback = p_overall_feedback
  WHERE id = p_review_id;

  -- Update aggregate rating in ideabox_submissions
  SELECT aggregate_score INTO v_new_avg
  FROM public.idea_aggregate_scores
  WHERE idea_id = v_review.idea_id;

  IF v_new_avg IS NOT NULL THEN
    UPDATE public.ideabox_submissions
    SET admin_rating = ROUND(v_new_avg)::integer
    WHERE id = v_review.idea_id;
  END IF;

  RETURN jsonb_build_object(
    'review_id', p_review_id,
    'submitted_at', now(),
    'aggregate_score', v_new_avg
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_idea_review(uuid, text, jsonb) TO authenticated;

-- VIEW: idea_aggregate_scores (Weighted average of criteria for submitted reviews)
CREATE OR REPLACE VIEW public.idea_aggregate_scores AS
WITH weighted_review_scores AS (
  SELECT 
    r.idea_id,
    r.id AS review_id,
    r.reviewer_id,
    c.id AS criterion_id,
    c.name AS criterion_name,
    c.weight,
    s.score,
    (s.score * c.weight) AS weighted_score
  FROM public.idea_reviews r
  JOIN public.idea_review_scores s ON s.review_id = r.id
  JOIN public.review_criteria c ON c.id = s.criterion_id
  WHERE r.submitted_at IS NOT NULL
),
reviewer_aggregates AS (
  SELECT 
    idea_id,
    review_id,
    reviewer_id,
    SUM(weighted_score) / NULLIF(SUM(weight), 0) AS reviewer_weighted_average
  FROM weighted_review_scores
  GROUP BY idea_id, review_id, reviewer_id
)
SELECT 
  i.id AS idea_id,
  COUNT(DISTINCT r.id) AS total_assigned_reviews,
  COUNT(DISTINCT CASE WHEN r.submitted_at IS NOT NULL THEN r.id END) AS completed_reviews,
  ROUND(COALESCE(AVG(ra.reviewer_weighted_average), 0), 2) AS aggregate_score,
  ROUND(COALESCE(AVG(ra.reviewer_weighted_average), 0), 1) AS rounded_score
FROM public.ideabox_submissions i
LEFT JOIN public.idea_reviews r ON r.idea_id = i.id
LEFT JOIN reviewer_aggregates ra ON ra.idea_id = i.id AND ra.review_id = r.id
GROUP BY i.id;

-- VIEW: idea_criterion_breakdown
CREATE OR REPLACE VIEW public.idea_criterion_breakdown AS
SELECT 
  r.idea_id,
  c.id AS criterion_id,
  c.name AS criterion_name,
  c.weight,
  ROUND(AVG(s.score)::numeric, 2) AS avg_score,
  COUNT(s.score) AS review_count
FROM public.idea_reviews r
JOIN public.idea_review_scores s ON s.review_id = r.id
JOIN public.review_criteria c ON c.id = s.criterion_id
WHERE r.submitted_at IS NOT NULL
GROUP BY r.idea_id, c.id, c.name, c.weight;

-- ==============================================================================
-- 4. RPC set_idea_status WITH VALIDATED TRANSITION RULES & STATUS HISTORY
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_idea_status(
  p_idea_id text,
  p_new_status text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_old_status text;
  v_valid_transition boolean := false;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
    RAISE EXCEPTION 'Permission denied: Only Admin or Execom members can change idea status.';
  END IF;

  SELECT status INTO v_old_status
  FROM public.ideabox_submissions
  WHERE id = p_idea_id;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Idea not found with id %', p_idea_id;
  END IF;

  IF v_old_status = p_new_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'idea_id', p_idea_id,
      'old_status', v_old_status,
      'new_status', p_new_status,
      'message', 'Status unchanged'
    );
  END IF;

  -- Validate allowed state machine transitions:
  -- Allowed progression: Pending -> Under Review -> Shortlisted -> Incubation Approved
  -- Allowed rejection: from Pending, Under Review, Shortlisted, Needs Revision -> Rejected
  -- Allowed feedback/revision: Under Review, Shortlisted -> Needs Revision
  -- Allowed resubmission: Needs Revision -> Under Review
  -- Mentorship assignment: Incubation Approved -> Mentorship Assigned
  IF v_old_status = 'Pending' AND p_new_status IN ('Under Review', 'Rejected') THEN
    v_valid_transition := true;
  ELSIF v_old_status = 'Under Review' AND p_new_status IN ('Shortlisted', 'Needs Revision', 'Rejected') THEN
    v_valid_transition := true;
  ELSIF v_old_status = 'Needs Revision' AND p_new_status IN ('Under Review', 'Pending', 'Rejected') THEN
    v_valid_transition := true;
  ELSIF v_old_status = 'Shortlisted' AND p_new_status IN ('Incubation Approved', 'Needs Revision', 'Rejected') THEN
    v_valid_transition := true;
  ELSIF v_old_status = 'Incubation Approved' AND p_new_status IN ('Mentorship Assigned', 'Rejected') THEN
    v_valid_transition := true;
  ELSIF v_old_status = 'Mentorship Assigned' AND p_new_status IN ('Incubation Approved', 'Rejected') THEN
    v_valid_transition := true;
  END IF;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition: Cannot transition idea from "%" to "%".', v_old_status, p_new_status;
  END IF;

  -- Update idea
  UPDATE public.ideabox_submissions
  SET status = p_new_status,
      admin_feedback = COALESCE(p_reason, admin_feedback),
      admin_reviewed_at = now()
  WHERE id = p_idea_id;

  -- Write to status_history
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
    p_idea_id,
    v_old_status,
    p_new_status,
    v_caller,
    COALESCE(p_reason, 'Status updated via set_idea_status'),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'idea_id', p_idea_id,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_idea_status(text, text, text) TO authenticated;

-- ==============================================================================
-- 5. MENTORS, MENTOR ASSIGNMENTS & MILESTONES TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expertise text[] NOT NULL DEFAULT '{}',
  designation text,
  organization text,
  bio text,
  max_active_ideas integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_mentor_user UNIQUE (user_id)
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentors_select" ON public.mentors;
CREATE POLICY "mentors_select"
  ON public.mentors
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "mentors_admin_manage" ON public.mentors;
CREATE POLICY "mentors_admin_manage"
  ON public.mentors
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

DROP POLICY IF EXISTS "mentors_self_update" ON public.mentors;
CREATE POLICY "mentors_self_update"
  ON public.mentors
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id text NOT NULL REFERENCES public.ideabox_submissions(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id),
  assigned_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  response_notes text,
  responded_at timestamptz,
  CONSTRAINT uq_idea_mentor UNIQUE (idea_id, mentor_id)
);

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentor_assignments_select" ON public.mentor_assignments;
CREATE POLICY "mentor_assignments_select"
  ON public.mentor_assignments
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('Admin') 
    OR public.has_role('Execom')
    OR EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = mentor_assignments.mentor_id AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.ideabox_submissions i
      WHERE i.id = mentor_assignments.idea_id AND i.author_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "mentor_assignments_admin_manage" ON public.mentor_assignments;
CREATE POLICY "mentor_assignments_admin_manage"
  ON public.mentor_assignments
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin'))
  WITH CHECK (public.has_role('Admin'));

-- RPC: respond_mentor_assignment (Mentor accepts/declines)
CREATE OR REPLACE FUNCTION public.respond_mentor_assignment(
  p_assignment_id uuid,
  p_decision text, -- 'accepted' or 'declined'
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_assign record;
  v_mentor record;
BEGIN
  IF p_decision NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid decision: Must be accepted or declined.';
  END IF;

  SELECT * INTO v_assign
  FROM public.mentor_assignments
  WHERE id = p_assignment_id;

  IF v_assign IS NULL THEN
    RAISE EXCEPTION 'Mentor assignment not found.';
  END IF;

  SELECT * INTO v_mentor
  FROM public.mentors
  WHERE id = v_assign.mentor_id;

  IF v_mentor.user_id <> auth.uid() AND NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'Unauthorized: only the assigned mentor can respond.';
  END IF;

  UPDATE public.mentor_assignments
  SET status = p_decision,
      response_notes = p_notes,
      responded_at = now()
  WHERE id = p_assignment_id;

  IF p_decision = 'accepted' THEN
    UPDATE public.ideabox_submissions
    SET status = 'Mentorship Assigned'
    WHERE id = v_assign.idea_id;
  END IF;

  RETURN jsonb_build_object(
    'assignment_id', p_assignment_id,
    'status', p_decision,
    'responded_at', now()
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.respond_mentor_assignment(uuid, text, text) TO authenticated;

-- MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.idea_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id text NOT NULL REFERENCES public.ideabox_submissions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  funding_tranche numeric DEFAULT 0 CHECK (funding_tranche >= 0),
  completed_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.idea_milestones ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_milestones_idea_id ON public.idea_milestones(idea_id);

DROP POLICY IF EXISTS "idea_milestones_select" ON public.idea_milestones;
CREATE POLICY "idea_milestones_select"
  ON public.idea_milestones
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "idea_milestones_manage" ON public.idea_milestones;
CREATE POLICY "idea_milestones_manage"
  ON public.idea_milestones
  FOR ALL
  TO authenticated
  USING (
    public.has_role('Admin') 
    OR EXISTS (
      SELECT 1 FROM public.ideabox_submissions i
      WHERE i.id = idea_milestones.idea_id AND i.author_id = auth.uid()::text
    )
  )
  WITH CHECK (
    public.has_role('Admin') 
    OR EXISTS (
      SELECT 1 FROM public.ideabox_submissions i
      WHERE i.id = idea_milestones.idea_id AND i.author_id = auth.uid()::text
    )
  );

-- ==============================================================================
-- 6. SERVER-SIDE DRAFTS TABLE (REPLACING LOCALSTORAGE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.idea_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_idea_drafts_user UNIQUE (user_id)
);

ALTER TABLE public.idea_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "idea_drafts_owner_access" ON public.idea_drafts;
CREATE POLICY "idea_drafts_owner_access"
  ON public.idea_drafts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC: autosave_idea_draft
CREATE OR REPLACE FUNCTION public.autosave_idea_draft(p_draft_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to save draft.';
  END IF;

  INSERT INTO public.idea_drafts (user_id, draft_data, updated_at)
  VALUES (v_uid, p_draft_data, now())
  ON CONFLICT (user_id) DO UPDATE
    SET draft_data = EXCLUDED.draft_data,
        updated_at = now();

  RETURN jsonb_build_object('saved', true, 'updated_at', now());
END;
$$;
GRANT EXECUTE ON FUNCTION public.autosave_idea_draft(jsonb) TO authenticated;
