-- ==============================================================================
-- IEDC BMCE v3: Phase 2 Core Journey - Problem Bank & Mentor Clinics Schema
-- Migration: 20261002020000_phase2_journey_problem_bank_clinics.sql
-- Description:
--   1. problem_statements table for college & community challenge discovery
--   2. Link ideabox_submissions to problem_statements (problem_id)
--   3. mentor_clinic_slots & mentor_clinic_bookings for scheduled mentor clinics
--   4. Atomic booking RPC book_mentor_clinic_slot()
--   5. Seed verified problem statements and mentor availability
-- ==============================================================================

-- ==============================================================================
-- 1. PROBLEM_STATEMENTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.problem_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  domain text NOT NULL, -- e.g. 'Campus Tech', 'Agriculture & Rural', 'Healthcare', 'Clean Energy', 'Smart Cities', 'Fintech', 'EdTech'
  severity text NOT NULL DEFAULT 'Moderate' CHECK (severity IN ('Critical', 'High', 'Moderate', 'Low')),
  difficulty text NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Beginner', 'Medium', 'Advanced')),
  beneficiary text NOT NULL DEFAULT 'BMCE College & Local Community',
  tags text[] DEFAULT '{}',
  posted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'IEDC BMCE',
  author_role text NOT NULL DEFAULT 'Nodal Officer',
  adopted_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'In Progress', 'Solved', 'Archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;

-- Policies on problem_statements
DROP POLICY IF EXISTS "problem_statements_select" ON public.problem_statements;
CREATE POLICY "problem_statements_select"
  ON public.problem_statements
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "problem_statements_insert" ON public.problem_statements;
CREATE POLICY "problem_statements_insert"
  ON public.problem_statements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    posted_by = auth.uid() 
    OR public.has_role('Admin') 
    OR public.has_role('Execom') 
    OR public.has_role('Faculty')
  );

DROP POLICY IF EXISTS "problem_statements_update" ON public.problem_statements;
CREATE POLICY "problem_statements_update"
  ON public.problem_statements
  FOR UPDATE
  TO authenticated
  USING (
    posted_by = auth.uid() 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  )
  WITH CHECK (
    posted_by = auth.uid() 
    OR public.has_role('Admin') 
    OR public.has_role('Execom')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_problem_statements_domain ON public.problem_statements(domain);
CREATE INDEX IF NOT EXISTS idx_problem_statements_severity ON public.problem_statements(severity);
CREATE INDEX IF NOT EXISTS idx_problem_statements_status ON public.problem_statements(status);
CREATE INDEX IF NOT EXISTS idx_problem_statements_created_at ON public.problem_statements(created_at DESC);

-- ==============================================================================
-- 2. LINK IDEABOX SUBMISSIONS TO PROBLEM BANK
-- ==============================================================================

ALTER TABLE IF EXISTS public.ideabox_submissions 
  ADD COLUMN IF NOT EXISTS problem_id uuid REFERENCES public.problem_statements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ideabox_problem_id ON public.ideabox_submissions(problem_id);

-- Trigger to increment adopted_count on problem_statements when an idea is submitted with a problem_id
CREATE OR REPLACE FUNCTION public.trg_increment_problem_adopted_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.problem_id IS NOT NULL THEN
    UPDATE public.problem_statements
    SET adopted_count = adopted_count + 1,
        status = CASE WHEN status = 'Active' THEN 'In Progress' ELSE status END
    WHERE id = NEW.problem_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_problem_adopted ON public.ideabox_submissions;
CREATE TRIGGER trg_problem_adopted
  AFTER INSERT ON public.ideabox_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_increment_problem_adopted_count();

-- ==============================================================================
-- 3. MENTOR CLINIC SLOTS & BOOKINGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mentor_clinic_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  title text NOT NULL,
  clinic_type text NOT NULL CHECK (clinic_type IN ('Pitch Review', 'Technical Architecture', 'Patent & IP', 'Incubation & Grants', 'General Mentorship')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text NOT NULL DEFAULT 'IEDC BMCE Boardroom / Google Meet',
  meeting_link text,
  max_attendees integer NOT NULL DEFAULT 1,
  is_booked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_clinic_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_slots_select" ON public.mentor_clinic_slots;
CREATE POLICY "clinic_slots_select"
  ON public.mentor_clinic_slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "clinic_slots_manage" ON public.mentor_clinic_slots;
CREATE POLICY "clinic_slots_manage"
  ON public.mentor_clinic_slots
  FOR ALL
  TO authenticated
  USING (
    public.has_role('Admin') 
    OR EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = mentor_clinic_slots.mentor_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role('Admin') 
    OR EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = mentor_clinic_slots.mentor_id AND m.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.mentor_clinic_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.mentor_clinic_slots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id text REFERENCES public.ideabox_submissions(id) ON DELETE SET NULL,
  agenda text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'attended', 'cancelled')),
  mentor_notes text,
  action_items text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_clinic_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_bookings_select" ON public.mentor_clinic_bookings;
CREATE POLICY "clinic_bookings_select"
  ON public.mentor_clinic_bookings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role('Admin')
    OR public.has_role('Execom')
    OR EXISTS (
      SELECT 1 FROM public.mentor_clinic_slots s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.id = mentor_clinic_bookings.slot_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "clinic_bookings_insert" ON public.mentor_clinic_bookings;
CREATE POLICY "clinic_bookings_insert"
  ON public.mentor_clinic_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "clinic_bookings_update" ON public.mentor_clinic_bookings;
CREATE POLICY "clinic_bookings_update"
  ON public.mentor_clinic_bookings
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role('Admin')
    OR EXISTS (
      SELECT 1 FROM public.mentor_clinic_slots s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.id = mentor_clinic_bookings.slot_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role('Admin')
    OR EXISTS (
      SELECT 1 FROM public.mentor_clinic_slots s
      JOIN public.mentors m ON m.id = s.mentor_id
      WHERE s.id = mentor_clinic_bookings.slot_id AND m.user_id = auth.uid()
    )
  );

-- Indexes for clinic slots & bookings
CREATE INDEX IF NOT EXISTS idx_clinic_slots_mentor ON public.mentor_clinic_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_clinic_slots_start ON public.mentor_clinic_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_clinic_slots_booked ON public.mentor_clinic_slots(is_booked);
CREATE INDEX IF NOT EXISTS idx_clinic_bookings_user ON public.mentor_clinic_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_bookings_slot ON public.mentor_clinic_bookings(slot_id);

-- ==============================================================================
-- 4. ATOMIC BOOKING TRANSACTION RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.book_mentor_clinic_slot(
  p_slot_id uuid,
  p_idea_id text,
  p_agenda text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_slot record;
  v_booking_id uuid;
  v_mentor_user_id uuid;
  v_user_name text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to book clinic hours.';
  END IF;

  IF p_agenda IS NULL OR length(trim(p_agenda)) < 5 THEN
    RAISE EXCEPTION 'Validation error: Please provide a specific agenda or questions for the mentorship session.';
  END IF;

  -- 1. Lock slot row for concurrency protection
  SELECT s.*, m.user_id as mentor_user_id 
  INTO v_slot
  FROM public.mentor_clinic_slots s
  JOIN public.mentors m ON m.id = s.mentor_id
  WHERE s.id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Clinic slot not found.';
  END IF;

  IF v_slot.is_booked THEN
    RAISE EXCEPTION 'Slot is no longer available. Please select another time.';
  END IF;

  IF v_slot.start_time <= now() THEN
    RAISE EXCEPTION 'Cannot book a past clinic session.';
  END IF;

  -- 2. Mark slot booked
  UPDATE public.mentor_clinic_slots
  SET is_booked = true
  WHERE id = p_slot_id;

  -- 3. Create booking record
  INSERT INTO public.mentor_clinic_bookings (
    slot_id,
    user_id,
    idea_id,
    agenda,
    status
  ) VALUES (
    p_slot_id,
    v_uid,
    p_idea_id,
    p_agenda,
    'confirmed'
  )
  RETURNING id INTO v_booking_id;

  -- 4. Notify mentor
  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.notifications (
    user_id,
    title,
    body,
    type,
    metadata
  ) VALUES (
    v_slot.mentor_user_id,
    'New Clinic Booking: ' || v_slot.title,
    COALESCE(v_user_name, 'An innovator') || ' booked a ' || v_slot.clinic_type || ' session for ' || to_char(v_slot.start_time, 'DD Mon, HH12:MI AM') || '.',
    'general',
    jsonb_build_object('bookingId', v_booking_id, 'slotId', p_slot_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'bookingId', v_booking_id,
    'title', v_slot.title,
    'startTime', v_slot.start_time,
    'location', v_slot.location,
    'meetingLink', v_slot.meeting_link
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.book_mentor_clinic_slot(uuid, text, text) TO authenticated;

-- ==============================================================================
-- 5. SEED VERIFIED CAMPUS & LOCAL PROBLEM STATEMENTS
-- ==============================================================================

INSERT INTO public.problem_statements (title, description, domain, severity, difficulty, beneficiary, tags, author_name, author_role, status)
VALUES
(
  'KTU Automated Attendance & Lab Equipment Utilization Telemetry',
  'Manual attendance and equipment logbooks in engineering computer labs and workshops cause administrative overhead and resource idling. A real-time IoT/RFID or vision-assisted check-in telemetry system can log lab utilization directly to KTU academic portals.',
  'Campus Tech',
  'High',
  'Medium',
  'BMCE Students & Department Faculty',
  ARRAY['IoT', 'Automation', 'Campus Tech', 'RFID', 'Telemetry'],
  'Prof. Nodal Officer',
  'Faculty Nodal Officer',
  'Active'
),
(
  'Cashew Processing Waste Heat & Shell Liquid (CNSL) Recovery for Kollam Mills',
  'Local cashew processing units in Kollam district release significant roasting waste heat and struggle with eco-friendly cashew nut shell liquid (CNSL) recovery and value addition. A localized thermodynamic or bio-fuel conversion prototype can generate revenue and reduce emissions.',
  'Agriculture & Rural',
  'Critical',
  'Advanced',
  'Kollam District Cashew Workers & Small Mill Operators',
  ARRAY['Agriculture', 'BioEnergy', 'Sustainability', 'Hardware', 'Kollam'],
  'Er. Industry Liaison',
  'IEDC Advisory Board',
  'Active'
),
(
  'Campus Micro-Grid Solar Energy Load Balancing During Peak Hours',
  'BMCE campus generates 80kW solar rooftop energy but suffers from peak imbalances when power electronics and high-load servers run concurrently. An intelligent microcontroller-based load balancer with battery storage telemetry can cut peak grid tariff expenses.',
  'Clean Energy',
  'High',
  'Advanced',
  'College Administration & Energy Sustainability Wing',
  ARRAY['Solar', 'SmartGrid', 'Hardware', 'CleanTech', 'Microcontroller'],
  'Electrical & Electronics Dept',
  'Faculty Mentor',
  'Active'
),
(
  'Offline-First Landslide & Flood Early Warning Mesh for Western Ghats Foothills',
  'Mountainous and foothill regions across eastern Kollam and Pathanamthitta lose cellular reception during severe monsoon cloudbursts. A low-cost solar LoRa mesh network of soil-moisture and tilt sensors can broadcast audible sirens and offline SMS alerts before slope failure.',
  'Disaster Management',
  'Critical',
  'Advanced',
  'Foothill Rural Communities & Panchayath Disaster Teams',
  ARRAY['LoRa', 'Offline', 'Sensors', 'DisasterTech', 'RuralSafety'],
  'Civil & Mechanical Dept',
  'Department Coordinator',
  'Active'
),
(
  'Decentralized Campus Textbook & Scientific Calculator Exchange',
  'Junior students often purchase expensive semester textbooks and scientific calculators that seniors no longer use after passing exams. An escrowed peer-to-peer campus book swap platform can eliminate paper waste and cut textbook expenses by 70%.',
  'EdTech',
  'Moderate',
  'Beginner',
  'BMCE 1st and 2nd Year B.Tech Students',
  ARRAY['EdTech', 'CampusCircularEconomy', 'Web', 'P2P'],
  'Student Executive Lead',
  'Student Lead',
  'Active'
)
ON CONFLICT DO NOTHING;
