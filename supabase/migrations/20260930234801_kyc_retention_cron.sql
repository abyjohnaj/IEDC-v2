-- ==============================================================================
-- IEDC BMCE v3: Automated 90-Day KYC Document Purge Cron Job
-- Migration: 20260930234801_kyc_retention_cron.sql
-- ==============================================================================

-- 1. PURGE EXPIRED KYC DOCUMENTS FUNCTION
CREATE OR REPLACE FUNCTION public.purge_expired_kyc_documents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, auth, pg_temp
AS $$
DECLARE
  v_rec record;
  v_count integer := 0;
BEGIN
  -- Loop through verified records whose retention period has expired
  FOR v_rec IN 
    SELECT user_id, doc_file_path 
    FROM public.kyc_verifications
    WHERE status = 'verified' 
      AND retention_delete_at IS NOT NULL 
      AND retention_delete_at <= now()
      AND doc_file_path IS NOT NULL
  LOOP
    -- 1. Delete physical object from storage.objects
    DELETE FROM storage.objects
    WHERE bucket_id = 'kyc-docs' 
      AND name = v_rec.doc_file_path;

    -- 2. Nullify file path on kyc_verifications to prove document is wiped
    UPDATE public.kyc_verifications
    SET doc_file_path = NULL
    WHERE user_id = v_rec.user_id;

    -- 3. Log compliance event in audit_log
    INSERT INTO public.audit_log (
      action,
      actor_id,
      target_id,
      target_table,
      details
    ) VALUES (
      'KYC_RETENTION_PURGED',
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_rec.user_id,
      'kyc_verifications',
      jsonb_build_object(
        'purgedFilePath', v_rec.doc_file_path,
        'reason', 'Purged automatically 90 days after verification'
      )
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 2. ACTIVATE PG_CRON EXTENSION & SCHEDULE DAILY PURGE JOB
-- Only schedule if pg_cron is enabled in the database
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if already scheduled
    PERFORM cron.unschedule('purge-kyc-docs-daily');
    
    -- Schedule daily run at 03:00 UTC
    PERFORM cron.schedule(
      'purge-kyc-docs-daily',
      '0 3 * * *',
      'SELECT public.purge_expired_kyc_documents();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- In environments where pg_cron is restricted, log notice without failing migration
  RAISE NOTICE 'pg_cron not enabled or restricted; purge_expired_kyc_documents function is created and ready for manual or external triggering.';
END $$;
