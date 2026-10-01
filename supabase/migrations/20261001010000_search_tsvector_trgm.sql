-- ==============================================================================
-- Migration: 20261001010000_search_tsvector_trgm.sql
-- Description: Full-text and fuzzy search infrastructure for ideas and forum posts:
--              1. Enable pg_trgm extension for trigram fuzzy matching
--              2. Add fts tsvector columns with GIN indexes on ideabox_submissions and forum_discussions
--              3. Add pg_trgm GIN indexes for fast fuzzy string similarity
--              4. Add search_content(query) RPC function for unified ranking
-- ==============================================================================

-- 1. Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add tsvector column and triggers on ideabox_submissions (Ideas)
ALTER TABLE public.ideabox_submissions 
  ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION public.ideabox_submissions_update_fts()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.domain, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.elevator_pitch, '') || ' ' || coalesce(NEW.proposed_solution, '') || ' ' || coalesce(NEW.problem_statement, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.author_name, '')), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ideabox_submissions_fts ON public.ideabox_submissions;
CREATE TRIGGER trg_ideabox_submissions_fts
  BEFORE INSERT OR UPDATE OF title, domain, elevator_pitch, proposed_solution, problem_statement, author_name
  ON public.ideabox_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.ideabox_submissions_update_fts();

-- Backfill existing ideabox_submissions
UPDATE public.ideabox_submissions 
SET fts = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(domain, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(elevator_pitch, '') || ' ' || coalesce(proposed_solution, '') || ' ' || coalesce(problem_statement, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(author_name, '')), 'D')
WHERE fts IS NULL;

-- GIN index on tsvector for ideas
CREATE INDEX IF NOT EXISTS idx_ideabox_fts 
  ON public.ideabox_submissions USING gin(fts);

-- pg_trgm GIN indexes for fuzzy matching on ideas
CREATE INDEX IF NOT EXISTS idx_ideabox_title_trgm 
  ON public.ideabox_submissions USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ideabox_solution_trgm 
  ON public.ideabox_submissions USING gin(proposed_solution gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ideabox_domain_trgm 
  ON public.ideabox_submissions USING gin(domain gin_trgm_ops);

-- 3. Add tsvector column and triggers on forum_discussions (Forum Posts)
ALTER TABLE public.forum_discussions 
  ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION public.forum_discussions_update_fts()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.channel, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.author_name, '')), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_discussions_fts ON public.forum_discussions;
CREATE TRIGGER trg_forum_discussions_fts
  BEFORE INSERT OR UPDATE OF title, channel, excerpt, author_name
  ON public.forum_discussions
  FOR EACH ROW
  EXECUTE FUNCTION public.forum_discussions_update_fts();

-- Backfill existing forum_discussions
UPDATE public.forum_discussions 
SET fts = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(channel, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(author_name, '')), 'D')
WHERE fts IS NULL;

-- GIN index on tsvector for forum posts
CREATE INDEX IF NOT EXISTS idx_forum_discussions_fts 
  ON public.forum_discussions USING gin(fts);

-- pg_trgm GIN indexes for fuzzy matching on forum posts
CREATE INDEX IF NOT EXISTS idx_forum_discussions_title_trgm 
  ON public.forum_discussions USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_forum_discussions_excerpt_trgm 
  ON public.forum_discussions USING gin(excerpt gin_trgm_ops);

-- Convenience compatibility views
CREATE OR REPLACE VIEW public.ideas AS 
  SELECT * FROM public.ideabox_submissions;

CREATE OR REPLACE VIEW public.forum_posts AS 
  SELECT * FROM public.forum_discussions;

-- 4. Unified RPC Function: search_content(query text)
CREATE OR REPLACE FUNCTION public.search_content(query text)
RETURNS TABLE (
  id text,
  type text,
  title text,
  snippet text,
  category text,
  url text,
  author_name text,
  rank real,
  similarity real,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_query text;
  ts_query tsquery;
BEGIN
  clean_query := trim(coalesce(query, ''));
  IF clean_query = '' THEN
    RETURN;
  END IF;

  -- Attempt to construct tsquery; fallback if input has syntax characters
  BEGIN
    ts_query := websearch_to_tsquery('english', clean_query);
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      ts_query := plainto_tsquery('english', clean_query);
    EXCEPTION WHEN OTHERS THEN
      ts_query := NULL;
    END;
  END;

  RETURN QUERY
  WITH idea_matches AS (
    SELECT 
      i.id::text AS id,
      'idea'::text AS type,
      i.title::text AS title,
      coalesce(nullif(i.elevator_pitch, ''), substring(coalesce(i.proposed_solution, '') FROM 1 FOR 140))::text AS snippet,
      coalesce(i.domain, 'Innovation')::text AS category,
      ('/ideabox?idea=' || i.id)::text AS url,
      coalesce(i.author_name, 'Innovator')::text AS author_name,
      (CASE WHEN ts_query IS NOT NULL AND i.fts @@ ts_query THEN ts_rank_cd(i.fts, ts_query) ELSE 0.0 END)::real AS rank,
      greatest(
        similarity(i.title, clean_query),
        similarity(coalesce(i.domain, ''), clean_query),
        similarity(coalesce(i.proposed_solution, ''), clean_query)
      )::real AS similarity,
      i.created_at
    FROM public.ideabox_submissions i
    WHERE 
      (ts_query IS NOT NULL AND i.fts @@ ts_query)
      OR (clean_query % i.title)
      OR (similarity(i.title, clean_query) > 0.15)
      OR (similarity(coalesce(i.proposed_solution, ''), clean_query) > 0.15)
      OR (i.title ILIKE '%' || clean_query || '%')
      OR (coalesce(i.domain, '') ILIKE '%' || clean_query || '%')
  ),
  forum_matches AS (
    SELECT 
      f.id::text AS id,
      'forum_post'::text AS type,
      f.title::text AS title,
      substring(coalesce(f.excerpt, '') FROM 1 FOR 140)::text AS snippet,
      coalesce(f.channel, 'Community')::text AS category,
      ('/forum?thread=' || f.id)::text AS url,
      coalesce(f.author_name, 'Member')::text AS author_name,
      (CASE WHEN ts_query IS NOT NULL AND f.fts @@ ts_query THEN ts_rank_cd(f.fts, ts_query) ELSE 0.0 END)::real AS rank,
      greatest(
        similarity(f.title, clean_query),
        similarity(coalesce(f.channel, ''), clean_query),
        similarity(coalesce(f.excerpt, ''), clean_query)
      )::real AS similarity,
      f.created_at
    FROM public.forum_discussions f
    WHERE 
      (ts_query IS NOT NULL AND f.fts @@ ts_query)
      OR (clean_query % f.title)
      OR (similarity(f.title, clean_query) > 0.15)
      OR (similarity(coalesce(f.excerpt, ''), clean_query) > 0.15)
      OR (f.title ILIKE '%' || clean_query || '%')
      OR (coalesce(f.channel, '') ILIKE '%' || clean_query || '%')
  ),
  combined AS (
    SELECT * FROM idea_matches
    UNION ALL
    SELECT * FROM forum_matches
  )
  SELECT 
    c.id,
    c.type,
    c.title,
    c.snippet,
    c.category,
    c.url,
    c.author_name,
    c.rank,
    c.similarity,
    c.created_at
  FROM combined c
  ORDER BY (c.rank * 2.0 + c.similarity) DESC, c.created_at DESC
  LIMIT 25;
END;
$$;

-- Grant execution to all users
GRANT EXECUTE ON FUNCTION public.search_content(text) TO anon, authenticated;
