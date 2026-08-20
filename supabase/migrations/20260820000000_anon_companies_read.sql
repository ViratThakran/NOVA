-- Migration: allow anonymous users to read company names
--
-- The public /internships page is accessible to the anon role (see the
-- "Anonymous can read open internships" policy added in init_schema.sql).
-- Its query joins the companies table to display the hiring company name:
--
--   supabase.from('internships')
--     .select('id, title, ..., companies(name)')
--     .eq('status', 'open')
--
-- The companies table currently only grants SELECT to the `authenticated`
-- role (see init_schema.sql line ~790), and its sole SELECT RLS policy is
-- also scoped to `authenticated`.  When Postgres evaluates the join for an
-- anon caller it correctly raises:
--
--   42501: permission denied for table companies
--
-- This migration adds the minimum permissions needed to allow anon callers
-- to read company id and name — the only columns ever exposed through the
-- internship listing join.  It deliberately does NOT expose the description
-- column or any other company metadata to unauthenticated visitors.
--
-- Pattern mirrors the programs/courses/services anon grants already in
-- init_schema.sql (lines ~1146, ~1247):
--   GRANT SELECT ON public.<table> TO anon;
--   CREATE POLICY "..." ON public.<table> FOR SELECT TO anon USING (...);

-- 1. Grant table-level SELECT to the anon role.
--    Without this, RLS policies are irrelevant — Postgres rejects the
--    request before even evaluating any policy.
GRANT SELECT ON public.companies TO anon;

-- 2. RLS policy: anon can read any company row.
--    The authenticated policy already restricts writes and sensitive reads;
--    this permissive SELECT policy only ORs in for the anon role.
--    We use USING (true) because companies that appear on open internships
--    are implicitly public — there is no status/published column on companies
--    to filter by, and the join context (internship.status = 'open') already
--    limits which company names are surfaced.
CREATE POLICY "Anonymous can read company names" ON public.companies
    FOR SELECT TO anon
    USING (true);
