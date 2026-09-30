-- ==============================================================================
-- Migration: 20261001005500_unified_notification_system.sql
-- Description: Unified Notification System for the whole IEDC platform:
--              1. notifications table (in-app alerts with read state & RLS)
--              2. notification_preferences table (channel + type toggles)
--              3. notification_jobs table (pgmq-style queue for retries)
--              4. pg_cron scheduled jobs for 24h deadline reminders
--              5. Atomic notification RPCs (mark read, preferences, batching)
--              6. Realtime publication integration
-- ==============================================================================

-- ==============================================================================
-- 1. NOTIFICATIONS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, read_at) 
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications:
-- Users can only read their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only update (mark as read) their own notifications
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins and system processes can insert notifications
DROP POLICY IF EXISTS "notifications_insert_authorized" ON public.notifications;
CREATE POLICY "notifications_insert_authorized"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  );


-- ==============================================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')),
  type text NOT NULL, -- e.g. 'kyc', 'idea', 'team', 'hackathon', 'general'
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_notification_preferences UNIQUE(user_id, channel, type)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user 
  ON public.notification_preferences(user_id);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_prefs_select_own" ON public.notification_preferences;
CREATE POLICY "notification_prefs_select_own"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_prefs_insert_own" ON public.notification_preferences;
CREATE POLICY "notification_prefs_insert_own"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_prefs_update_own" ON public.notification_preferences;
CREATE POLICY "notification_prefs_update_own"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 3. NOTIFICATION JOBS TABLE (RETRY QUEUE FOR ASYNC / EMAIL DELIVERY)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_jobs_status_scheduled 
  ON public.notification_jobs(status, scheduled_at) 
  WHERE status = 'pending';

-- Enable RLS (Service role & Admins only)
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_jobs_admin" ON public.notification_jobs;
CREATE POLICY "notification_jobs_admin"
  ON public.notification_jobs
  FOR ALL
  TO authenticated
  USING (public.has_role('Admin') OR public.has_role('Execom'))
  WITH CHECK (public.has_role('Admin') OR public.has_role('Execom'));


-- ==============================================================================
-- 4. ATOMIC NOTIFICATION HELPER FUNCTIONS & RPCS
-- ==============================================================================

-- Check if user has enabled a specific notification channel & category
CREATE OR REPLACE FUNCTION public.is_notification_enabled(
  p_user_id uuid,
  p_channel text,
  p_type text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_category text;
  v_enabled boolean;
BEGIN
  -- Map specific event types to preference categories
  IF p_type LIKE 'kyc%' THEN
    v_category := 'kyc';
  ELSIF p_type LIKE 'idea%' THEN
    v_category := 'idea';
  ELSIF p_type LIKE 'team%' THEN
    v_category := 'team';
  ELSIF p_type LIKE 'hackathon%' OR p_type = 'results_published' THEN
    v_category := 'hackathon';
  ELSE
    v_category := 'general';
  END IF;

  SELECT enabled INTO v_enabled
  FROM public.notification_preferences
  WHERE user_id = p_user_id AND channel = p_channel AND type = v_category;

  -- Default to true if user hasn't set an explicit override
  RETURN COALESCE(v_enabled, true);
END;
$$;

-- Create an in-app notification respecting user preferences
CREATE OR REPLACE FUNCTION public.create_in_app_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notif_id uuid;
  v_in_app_enabled boolean;
BEGIN
  v_in_app_enabled := public.is_notification_enabled(p_user_id, 'in_app', p_type);

  IF v_in_app_enabled THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      link,
      metadata,
      created_at
    ) VALUES (
      p_user_id,
      p_type,
      p_title,
      p_body,
      p_link,
      p_metadata,
      now()
    )
    RETURNING id INTO v_notif_id;

    RETURN v_notif_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Mark a single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid() AND read_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Mark all notifications as read for current user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE user_id = auth.uid() AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Get unread count for current user
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*)::int INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;


-- ==============================================================================
-- 5. PG_CRON DEADLINE REMINDERS (24H REMINDER & RETRY PROCESSOR)
-- ==============================================================================

-- Evaluates live hackathons expiring within ~24 hours and creates reminders
CREATE OR REPLACE FUNCTION public.check_hackathon_deadline_reminders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
  v_member RECORD;
  v_created_count int := 0;
  v_notif_title text;
  v_notif_body text;
  v_notif_link text;
BEGIN
  -- Look for hackathons ending within 24 hours
  FOR v_rec IN
    SELECT id, title, end_date
    FROM public.hackathon_events
    WHERE end_date IS NOT NULL
      AND end_date > now()
      AND end_date <= (now() + interval '24 hours')
      AND status = 'Live'
  LOOP
    v_notif_title := '⚠️ 24 Hours Left: ' || v_rec.title;
    v_notif_body := 'Submissions strictly lock in 24 hours (' || to_char(v_rec.end_date, 'Mon DD, HH24:MI TZ') || '). Finalize your repository, commit SHA, and demo URL!';
    v_notif_link := '/hackathons';

    -- Find all members participating in teams for this hackathon
    FOR v_member IN
      SELECT DISTINCT tm.user_id, p.full_name, p.email
      FROM public.team_members tm
      JOIN public.hackathon_teams ht ON ht.id = tm.team_id
      LEFT JOIN public.profiles p ON p.id = tm.user_id
      WHERE ht.hackathon_id = v_rec.id
    LOOP
      -- Verify we haven't already sent a 24h reminder to this user for this hackathon
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = v_member.user_id
          AND type = 'hackathon_deadline_24h'
          AND link LIKE '%' || v_rec.id || '%'
      ) THEN
        -- Insert in-app notification
        PERFORM public.create_in_app_notification(
          v_member.user_id,
          'hackathon_deadline_24h',
          v_notif_title,
          v_notif_body,
          v_notif_link || '?hackathon=' || v_rec.id,
          jsonb_build_object('hackathon_id', v_rec.id, 'end_date', v_rec.end_date)
        );

        -- Queue async email notification in notification_jobs
        INSERT INTO public.notification_jobs (payload, scheduled_at)
        VALUES (
          jsonb_build_object(
            'userId', v_member.user_id,
            'type', 'hackathon_deadline_24h',
            'email', v_member.email,
            'fullName', v_member.full_name,
            'title', v_notif_title,
            'body', v_notif_body,
            'link', v_notif_link,
            'metadata', jsonb_build_object('hackathonTitle', v_rec.title, 'endDate', v_rec.end_date)
          ),
          now()
        );

        v_created_count := v_created_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_created_count;
END;
$$;

-- Register pg_cron schedule if pg_cron is enabled in Supabase
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Check every hour on the hour
    PERFORM cron.schedule(
      'hackathon-deadline-reminder-job',
      '0 * * * *',
      'SELECT public.check_hackathon_deadline_reminders();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Safe fallback if cron extension not enabled or already exists
    RAISE NOTICE 'pg_cron job schedule skipped: %', SQLERRM;
END $$;


-- ==============================================================================
-- 6. REALTIME PUBLICATION
-- ==============================================================================

-- Enable realtime broadcasts for notifications so Navbar instantly updates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add notifications to supabase_realtime publication: %', SQLERRM;
END $$;

-- Grant permissions to authenticated role
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_notification_enabled(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_in_app_notification(uuid, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count() TO authenticated;
