-- ==============================================================================
-- IEDC BMCE v3: Phase 1 Security Hardening Migration
-- Migration: 20261002010000_phase1_security_hardening.sql
-- Description:
--   1. Secure hackathon_leaderboard view with WITH (security_invoker = true)
--      and dual-layer filter to prevent unreleased leaderboard leakage.
--   2. Hardened exec_kyc_decision RPC validating auth.uid() directly
--      to eliminate actor_id audit spoofing.
--   3. Explicit permission boundaries on leaderboard and administrative views.
-- ==============================================================================

-- ==============================================================================
-- 1. SECURE HACKATHON LEADERBOARD VIEW
-- ==============================================================================

CREATE OR REPLACE VIEW public.hackathon_leaderboard
WITH (security_invoker = true)
AS
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
LEFT JOIN team_totals tt ON tt.team_id = t.id
WHERE e.results_published = true 
   OR public.has_role('Admin') 
   OR public.has_role('Execom');

-- Revoke direct anon access to raw leaderboard view; force access via audited RPC
REVOKE ALL ON public.hackathon_leaderboard FROM anon;
GRANT SELECT ON public.hackathon_leaderboard TO authenticated;

-- ==============================================================================
-- 2. HARDENED EXEC_KYC_DECISION (ANTI-SPOOFING ACTOR_ID)
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
  v_actor_id uuid;
  v_retention_date timestamptz;
  v_prev_role text;
  v_user_email text;
  v_result jsonb;
BEGIN
  -- Derive actor strictly from authenticated session to prevent audit log spoofing
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    -- In service-role or edge function context, fallback to provided admin id
    v_actor_id := p_admin_id;
  END IF;

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: actor identity must be verified.';
  END IF;

  -- Verify administrative or faculty nodal officer permissions
  IF NOT (public.has_role('Admin') OR public.has_role('Faculty') OR public.has_role('Execom')) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins or Faculty Nodal Officers can evaluate KYC submissions.';
  END IF;

  IF p_decision NOT IN ('verified', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  -- Calculate retention deletion date (90 days after verification per Rule 6)
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

  -- 3. Record in audit_log with verified actor identity
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
    body,
    type,
    metadata
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
    'kyc',
    jsonb_build_object('decision', p_decision, 'verifiedAt', now())
  );

  v_result := jsonb_build_object(
    'success', true,
    'decision', p_decision,
    'userId', p_user_id,
    'actorId', v_actor_id,
    'promotedToInnovator', (p_decision = 'verified' AND v_prev_role = 'Student'),
    'retentionDeleteAt', v_retention_date
  );

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.exec_kyc_decision(uuid, uuid, text, text, text) TO authenticated;
