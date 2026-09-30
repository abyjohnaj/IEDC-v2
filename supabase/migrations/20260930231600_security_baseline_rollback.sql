-- ==============================================================================
-- IEDC BMCE v3 Security Baseline ROLLBACK
-- Migration: 20260930231600_security_baseline_rollback.sql
-- ==============================================================================

-- 1. DROP TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_role_guard ON public.profiles;
DROP TRIGGER IF EXISTS trg_ideabox_guard ON public.ideabox_submissions;
DROP TRIGGER IF EXISTS trg_hackathon_teams_guard ON public.hackathon_teams;

-- 2. DROP FUNCTIONS
DROP FUNCTION IF EXISTS public.trg_prevent_role_escalation();
DROP FUNCTION IF EXISTS public.trg_check_ideabox_update_permissions();
DROP FUNCTION IF EXISTS public.trg_check_hackathon_teams_update();
DROP FUNCTION IF EXISTS public.upvote_idea(text);
DROP FUNCTION IF EXISTS public.admin_review_kyc(text, text, text);
DROP FUNCTION IF EXISTS public.admin_set_user_role(text, text);
DROP FUNCTION IF EXISTS public.admin_grade_team(text, jsonb, text);
DROP FUNCTION IF EXISTS public.get_registration_status(text);
DROP FUNCTION IF EXISTS public.check_team_leader_count(jsonb);
DROP FUNCTION IF EXISTS public.is_team_leader(jsonb, uuid);
DROP FUNCTION IF EXISTS public.is_team_member(text, uuid);
DROP FUNCTION IF EXISTS public.has_role(text);

-- 3. DROP VIEW
DROP VIEW IF EXISTS public.public_profiles;

-- 4. DROP POLICIES
DROP POLICY IF EXISTS "profiles_select_owner_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_owner_or_admin" ON public.profiles;

DROP POLICY IF EXISTS "kyc_select_owner_or_evaluator" ON public.kyc_verifications;
DROP POLICY IF EXISTS "kyc_insert_pending_owner" ON public.kyc_verifications;
DROP POLICY IF EXISTS "kyc_update_admin_or_execom" ON public.kyc_verifications;

DROP POLICY IF EXISTS "ideabox_select_published_or_author" ON public.ideabox_submissions;
DROP POLICY IF EXISTS "ideabox_insert_author" ON public.ideabox_submissions;
DROP POLICY IF EXISTS "ideabox_update_author_or_admin" ON public.ideabox_submissions;
DROP POLICY IF EXISTS "ideabox_delete_author_or_admin" ON public.ideabox_submissions;
DROP POLICY IF EXISTS "ideabox_comments_select" ON public.ideabox_comments;
DROP POLICY IF EXISTS "ideabox_comments_insert" ON public.ideabox_comments;

DROP POLICY IF EXISTS "hackathon_events_select" ON public.hackathon_events;
DROP POLICY IF EXISTS "hackathon_events_write_evaluators" ON public.hackathon_events;
DROP POLICY IF EXISTS "hackathon_teams_select" ON public.hackathon_teams;
DROP POLICY IF EXISTS "hackathon_teams_insert" ON public.hackathon_teams;
DROP POLICY IF EXISTS "hackathon_teams_update" ON public.hackathon_teams;
DROP POLICY IF EXISTS "team_chat_select" ON public.team_chat_messages;
DROP POLICY IF EXISTS "team_chat_insert" ON public.team_chat_messages;

DROP POLICY IF EXISTS "forum_discussions_select" ON public.forum_discussions;
DROP POLICY IF EXISTS "forum_discussions_insert" ON public.forum_discussions;
DROP POLICY IF EXISTS "forum_discussions_update_delete" ON public.forum_discussions;
DROP POLICY IF EXISTS "forum_comments_select" ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_insert" ON public.forum_comments;

DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_write_evaluators" ON public.events;

DROP POLICY IF EXISTS "registrations_insert_dropbox" ON public.registrations;
DROP POLICY IF EXISTS "registrations_select_owner_or_evaluator" ON public.registrations;
DROP POLICY IF EXISTS "registrations_update_evaluators" ON public.registrations;

-- 5. DISABLE RLS
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kyc_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ideabox_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ideabox_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hackathon_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hackathon_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_discussions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registrations DISABLE ROW LEVEL SECURITY;
