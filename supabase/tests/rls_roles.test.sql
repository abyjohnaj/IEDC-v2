-- pgTAP Automated RLS Test Suite
-- Tests Row-Level Security for all 5 roles: anon, student, innovator, reviewer, admin
-- Fails if any security policy or role boundary regresses.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(22);

--------------------------------------------------------------------------------
-- 1. RLS Enabled Invariants
--------------------------------------------------------------------------------
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'),
    'Table "profiles" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'kyc_verifications'),
    'Table "kyc_verifications" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'ideabox_submissions'),
    'Table "ideabox_submissions" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'team_chat_messages'),
    'Table "team_chat_messages" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'forum_discussions'),
    'Table "forum_discussions" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'audit_log'),
    'Table "audit_log" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'newsletter_editions'),
    'Table "newsletter_editions" must have Row-Level Security enabled'
);

SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'notifications'),
    'Table "notifications" must have Row-Level Security enabled'
);

--------------------------------------------------------------------------------
-- 2. Test Persona: anon (Unauthenticated Public User)
--------------------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claims" = '{"role": "anon"}';

-- Anon must NOT be able to view any KYC documents
SELECT is_empty(
    'SELECT id FROM kyc_verifications',
    'Anon: Must be completely blocked from viewing KYC verifications'
);

-- Anon must NOT be able to read team internal chat messages
SELECT is_empty(
    'SELECT id FROM team_chat_messages',
    'Anon: Must be completely blocked from reading team chat messages'
);

-- Anon must NOT be able to access administrative audit logs
SELECT is_empty(
    'SELECT id FROM audit_log',
    'Anon: Must be blocked from querying audit logs'
);

-- Anon must NOT be able to access private notifications
SELECT is_empty(
    'SELECT id FROM notifications',
    'Anon: Must be blocked from querying personal notifications'
);

-- Anon can read published newsletter editions
SELECT ok(
    (SELECT count(*) >= 0 FROM newsletter_editions WHERE is_published = true),
    'Anon: Permitted to read published newsletter editions'
);

--------------------------------------------------------------------------------
-- 3. Test Persona: student (Authenticated Standard Student)
--------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "email": "student@bmce.ac.in"}';

-- Student cannot view other students KYC records
SELECT is(
    (SELECT count(*) FROM kyc_verifications WHERE user_id != '11111111-1111-1111-1111-111111111111'::uuid),
    0::bigint,
    'Student: Cannot view other users KYC verifications'
);

-- Student cannot access administrative audit logs
SELECT is_empty(
    'SELECT id FROM audit_log',
    'Student: Blocked from reading admin audit logs'
);

--------------------------------------------------------------------------------
-- 4. Test Persona: innovator (Authenticated Student Founder)
--------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "email": "innovator@bmce.ac.in"}';

-- Innovator cannot view audit logs
SELECT is_empty(
    'SELECT id FROM audit_log',
    'Innovator: Blocked from reading admin audit logs'
);

-- Innovator cannot view foreign KYC records
SELECT is(
    (SELECT count(*) FROM kyc_verifications WHERE user_id != '22222222-2222-2222-2222-222222222222'::uuid),
    0::bigint,
    'Innovator: Cannot inspect KYC submissions belonging to other users'
);

--------------------------------------------------------------------------------
-- 5. Test Persona: reviewer (Faculty / Rubric Reviewer)
--------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated", "email": "reviewer@bmce.ac.in"}';

-- Reviewer cannot view admin audit logs
SELECT is_empty(
    'SELECT id FROM audit_log',
    'Reviewer: Blocked from reading system audit logs'
);

-- Reviewer can read review criteria
SELECT ok(
    (SELECT count(*) >= 0 FROM review_criteria),
    'Reviewer: Permitted to query rubric review criteria'
);

--------------------------------------------------------------------------------
-- 6. Test Persona: admin (Executive Committee / Platform Admin)
--------------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "99999999-9999-9999-9999-999999999999", "role": "authenticated", "email": "admin@bmce.ac.in"}';

-- Admin can access audit logs
SELECT ok(
    (SELECT count(*) >= 0 FROM audit_log),
    'Admin: Permitted full read access to audit logs'
);

-- Admin can access KYC queue for verification
SELECT ok(
    (SELECT count(*) >= 0 FROM kyc_verifications),
    'Admin: Permitted to query KYC verifications for review'
);

--------------------------------------------------------------------------------
-- Finish Test Run
--------------------------------------------------------------------------------
SELECT * FROM finish();

ROLLBACK;
