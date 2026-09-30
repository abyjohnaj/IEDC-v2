-- ==============================================================================
-- IEDC BMCE v3: Protected KYC Schema & Storage Migration
-- Migration: 20260930234800_kyc_protection_schema.sql
-- ==============================================================================

-- 1. ENUMS FOR KYC & AUDIT
DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_doc_type AS ENUM ('student_id', 'aadhaar', 'college_admission', 'pan');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_rejection_reason AS ENUM (
    'illegible_document',
    'expired_id',
    'mismatched_name',
    'invalid_institution',
    'roll_number_mismatch',
    'tampered_document',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. AUDIT LOG & NOTIFICATIONS TABLES (For single-transaction KYC decisions)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid NOT NULL,
  target_id uuid,
  target_table text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_owner_select" ON public.notifications;
CREATE POLICY "notifications_owner_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. SCHEMA UPDATES ON kyc_verifications
-- Add doc_number_last4, doc_number_encrypted, doc_file_path, retention_delete_at
ALTER TABLE public.kyc_verifications 
  ADD COLUMN IF NOT EXISTS doc_number_last4 varchar(4),
  ADD COLUMN IF NOT EXISTS doc_number_encrypted bytea,
  ADD COLUMN IF NOT EXISTS doc_file_path text,
  ADD COLUMN IF NOT EXISTS retention_delete_at timestamptz;

-- Populate doc_number_last4 from existing unmasked numbers if any exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kyc_verifications' AND column_name = 'doc_number'
  ) THEN
    UPDATE public.kyc_verifications
    SET doc_number_last4 = right(doc_number, 4)
    WHERE doc_number_last4 IS NULL AND doc_number IS NOT NULL AND length(doc_number) >= 4;
  END IF;
END $$;

-- Add check constraint to ensure doc_number_last4 has at most 4 characters
ALTER TABLE public.kyc_verifications
  DROP CONSTRAINT IF EXISTS chk_doc_number_last4_len;
ALTER TABLE public.kyc_verifications
  ADD CONSTRAINT chk_doc_number_last4_len CHECK (doc_number_last4 IS NULL OR length(doc_number_last4) <= 4);

-- 4. PRIVATE STORAGE BUCKET: kyc-docs
-- Ensure storage bucket exists and is strictly private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-docs',
  'kyc-docs',
  false,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- 5. STORAGE RLS POLICIES FOR kyc-docs
-- A. Upload: User can upload ONLY to their own folder: <user_id>/...
DROP POLICY IF EXISTS "kyc_docs_upload_own_folder" ON storage.objects;
CREATE POLICY "kyc_docs_upload_own_folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-docs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- B. Read: Only owner OR Admins/Execom can read
DROP POLICY IF EXISTS "kyc_docs_read_owner_or_admin" ON storage.objects;
CREATE POLICY "kyc_docs_read_owner_or_admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role('Admin')
      OR public.has_role('Execom')
    )
  );

-- C. Delete: Owner can delete their own documents or Admins
DROP POLICY IF EXISTS "kyc_docs_delete_owner_or_admin" ON storage.objects;
CREATE POLICY "kyc_docs_delete_owner_or_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kyc-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role('Admin')
    )
  );

-- 6. ATOMIC KYC DECISION TRANSACTION RPC
-- Executed inside a single transaction: updates status, elevates role, writes audit log, queues notification
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
  -- 1. Authorization check
  IF NOT (public.has_role('Admin') OR public.has_role('Execom')) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins or Execom members can evaluate KYC submissions.';
  END IF;

  IF p_decision NOT IN ('verified', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  -- 2. Calculate retention deletion date (90 days after verification)
  IF p_decision = 'verified' THEN
    v_retention_date := now() + interval '90 days';
  ELSE
    v_retention_date := NULL;
  END IF;

  -- 3. Update kyc_verifications
  UPDATE public.kyc_verifications
  SET status = p_decision,
      verified_at = CASE WHEN p_decision = 'verified' THEN now() ELSE NULL END,
      rejection_reason = p_rejection_reason,
      admin_remarks = p_remarks,
      retention_delete_at = v_retention_date
  WHERE user_id = p_user_id;

  -- 4. Elevate role if verified (Student -> Innovator)
  SELECT role, email INTO v_prev_role, v_user_email 
  FROM public.profiles 
  WHERE id = p_user_id;

  IF p_decision = 'verified' AND v_prev_role = 'Student' THEN
    UPDATE public.profiles
    SET role = 'Innovator'
    WHERE id = p_user_id;
  END IF;

  -- 5. Record immutable audit log entry
  INSERT INTO public.audit_log (
    action,
    actor_id,
    target_id,
    target_table,
    details
  ) VALUES (
    'KYC_' || upper(p_decision),
    p_admin_id,
    p_user_id,
    'kyc_verifications',
    jsonb_build_object(
      'decision', p_decision,
      'rejectionReason', p_rejection_reason,
      'remarks', p_remarks,
      'previousRole', v_prev_role,
      'retentionDeleteAt', v_retention_date
    )
  );

  -- 6. Queue user notification
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
    'userId', p_user_id,
    'status', p_decision,
    'retentionDeleteAt', v_retention_date
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_kyc_decision(uuid, uuid, text, text, text) TO authenticated;
