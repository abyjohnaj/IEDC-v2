-- ==============================================================================
-- 20261001012000_newsletter_webp_pages.sql
-- Storage buckets, database schema, and RPCs for converting uploaded PDFs 
-- to WebP pages for lazy flipbook loading.
-- ==============================================================================

-- 1. Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('newsletters', 'newsletters', true, 52428800, ARRAY['application/pdf']::text[]),
  ('newsletter-pages', 'newsletter-pages', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for Public Reading and Authorized Uploads
DROP POLICY IF EXISTS "Public Read on newsletter-pages" ON storage.objects;
CREATE POLICY "Public Read on newsletter-pages"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'newsletter-pages');

DROP POLICY IF EXISTS "Public Read on newsletters" ON storage.objects;
CREATE POLICY "Public Read on newsletters"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'newsletters');

DROP POLICY IF EXISTS "Allow authenticated and anon uploads to newsletters" ON storage.objects;
CREATE POLICY "Allow authenticated and anon uploads to newsletters"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('newsletters', 'newsletter-pages'));

DROP POLICY IF EXISTS "Allow updates on newsletter buckets" ON storage.objects;
CREATE POLICY "Allow updates on newsletter buckets"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('newsletters', 'newsletter-pages'));

-- 3. Newsletter Editions Table
CREATE TABLE IF NOT EXISTS public.newsletter_editions (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  issue_no text NOT NULL,
  date text,
  category text DEFAULT 'Innovation',
  pdf_url text NOT NULL,
  page_webp_urls text[] NOT NULL DEFAULT '{}',
  total_pages int NOT NULL DEFAULT 0,
  conversion_status text NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  cover_image text,
  summary text,
  highlights text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_issue ON public.newsletter_editions (issue_no);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_status ON public.newsletter_editions (conversion_status);

-- Enable RLS
ALTER TABLE public.newsletter_editions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view newsletter editions" ON public.newsletter_editions;
CREATE POLICY "Public can view newsletter editions"
  ON public.newsletter_editions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins and service role can modify newsletter editions" ON public.newsletter_editions;
CREATE POLICY "Admins and service role can modify newsletter editions"
  ON public.newsletter_editions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Stored Procedure to Register / Update Newsletter PDF & WebP Pages
CREATE OR REPLACE FUNCTION public.upsert_newsletter_edition(
  p_id text,
  p_title text,
  p_subtitle text,
  p_issue_no text,
  p_date text,
  p_category text,
  p_pdf_url text,
  p_page_webp_urls text[] DEFAULT '{}',
  p_total_pages int DEFAULT 0,
  p_conversion_status text DEFAULT 'completed',
  p_summary text DEFAULT '',
  p_highlights text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.newsletter_editions (
    id, title, subtitle, issue_no, date, category, pdf_url, 
    page_webp_urls, total_pages, conversion_status, summary, highlights, updated_at
  )
  VALUES (
    p_id, p_title, p_subtitle, p_issue_no, p_date, p_category, p_pdf_url,
    p_page_webp_urls, p_total_pages, p_conversion_status, p_summary, p_highlights, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    issue_no = EXCLUDED.issue_no,
    date = EXCLUDED.date,
    category = EXCLUDED.category,
    pdf_url = EXCLUDED.pdf_url,
    page_webp_urls = CASE 
      WHEN array_length(EXCLUDED.page_webp_urls, 1) > 0 THEN EXCLUDED.page_webp_urls 
      ELSE public.newsletter_editions.page_webp_urls 
    END,
    total_pages = CASE 
      WHEN EXCLUDED.total_pages > 0 THEN EXCLUDED.total_pages 
      ELSE public.newsletter_editions.total_pages 
    END,
    conversion_status = EXCLUDED.conversion_status,
    summary = EXCLUDED.summary,
    highlights = EXCLUDED.highlights,
    updated_at = now()
  RETURNING to_jsonb(public.newsletter_editions.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. Stored Procedure to Update WebP pages array once converted
CREATE OR REPLACE FUNCTION public.update_newsletter_webp_pages(
  p_id text,
  p_page_webp_urls text[],
  p_total_pages int,
  p_status text DEFAULT 'completed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record jsonb;
BEGIN
  UPDATE public.newsletter_editions
  SET 
    page_webp_urls = p_page_webp_urls,
    total_pages = p_total_pages,
    conversion_status = p_status,
    updated_at = now()
  WHERE id = p_id
  RETURNING to_jsonb(public.newsletter_editions.*) INTO v_record;

  RETURN v_record;
END;
$$;
