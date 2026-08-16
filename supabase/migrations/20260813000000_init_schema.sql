-- Required extension: pgcrypto provides crypt()/gen_salt() used for password hashing
-- (e.g. local auth.users seeding) and other cryptographic helpers relied on by this schema.
-- Installed into the `extensions` schema per Supabase convention (not on default search_path,
-- so callers must schema-qualify: extensions.crypt(...), extensions.gen_salt(...)).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Disable default public execution privileges on new functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    first_name text,
    last_name text,
    onboarded boolean NOT NULL DEFAULT false,
    deactivated_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. User Roles Table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('student', 'mentor', 'employee', 'project_manager', 'tech_lead', 'recruiter', 'finance_user', 'support_user', 'company_admin', 'company_member', 'admin', 'super_admin')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 3. Student Profiles Table
CREATE TABLE public.student_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE RESTRICT,
    education_info jsonb NOT NULL DEFAULT '{}'::jsonb,
    skills text[] NOT NULL DEFAULT '{}'::text[],
    resume_path text,
    resume_size integer,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Internships Table
CREATE TABLE public.internships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    requirements text NOT NULL,
    eligibility text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_internships_status ON public.internships(status);

-- 5. Applications Table
CREATE TABLE public.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected')),
    cover_letter text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_internship UNIQUE (student_id, internship_id)
);

CREATE INDEX idx_applications_student_id ON public.applications(student_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- 6. Enrollments Table
CREATE TABLE public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE RESTRICT,
    application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);

-- 7. Notifications Table
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- 8. Audit Logs Table (Write-only through internal helpers; no direct client mutations)
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid NOT NULL,
    changes jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- SECURITY FUNCTIONS & TRIGGERS
-- =========================================================================

-- 1. Helper: Check if current authenticated user is Admin/Super Admin
--
-- search_path is pinned via the function's own SET clause (not a runtime
-- `SET search_path = ...;` statement inside the body). A runtime SET
-- changes it for the rest of the session/connection, not just this call —
-- on a pooled connection (e.g. GoTrue's), that leaks into whatever query
-- runs next on the same connection. The SET-clause form is scoped to this
-- function's execution only and is Postgres's documented safe pattern for
-- SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- 2. Helper: Check if current authenticated user has specific Role
CREATE OR REPLACE FUNCTION public.has_current_user_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.has_current_user_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_current_user_role(text) TO authenticated;

-- 3. Audit Log Generator Helper (RESTRICTED EXECUTION: internal DB triggers/functions only)
CREATE OR REPLACE FUNCTION public.write_audit_log(
    action_name text,
    res_type text,
    res_uuid uuid,
    payload jsonb
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
    actor_uuid uuid;
BEGIN
    actor_uuid := auth.uid();

    INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, changes)
    VALUES (actor_uuid, action_name, res_type, res_uuid, payload)
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.write_audit_log(text, text, uuid, jsonb) FROM authenticated;

-- 4. Transactional Function: Review Application (invoked by admins, or by a
-- company owner/admin reviewing an application against their own company's
-- internship — see can_review_company_application() below, added in
-- Phase 5B-3). The state machine, locking, enrollment/notification/audit-log
-- behavior is unchanged from Phase 4B; only the authorization check grew a
-- second, OR'd condition.
CREATE OR REPLACE FUNCTION public.review_application(
    app_uuid uuid,
    review_status text,
    feedback text
)
RETURNS boolean AS $$
DECLARE
    app_record public.applications%ROWTYPE;
BEGIN
    -- Verify actor is a platform admin OR the owner/admin of the company that
    -- owns this application's internship.
    IF NOT public.is_current_user_admin() AND NOT public.can_review_company_application(app_uuid) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to review this application.';
    END IF;

    -- Fetch and lock the application record to prevent race conditions
    SELECT * INTO app_record FROM public.applications 
    WHERE id = app_uuid FOR UPDATE;

    IF app_record.id IS NULL THEN
        RAISE EXCEPTION 'Application not found.';
    END IF;

    -- Verify application current status is pending or under_review
    IF app_record.status NOT IN ('pending', 'under_review') THEN
        RAISE EXCEPTION 'Invalid State: Application has already been processed.';
    END IF;

    -- Validate input status
    IF review_status NOT IN ('accepted', 'rejected') THEN
        RAISE EXCEPTION 'Invalid Status: Review state must be accepted or rejected.';
    END IF;

    -- Update Application Status
    UPDATE public.applications 
    SET status = review_status, updated_at = timezone('utc'::text, now())
    WHERE id = app_uuid;

    -- If accepted, create enrollment record
    IF review_status = 'accepted' THEN
        INSERT INTO public.enrollments (student_id, internship_id, application_id, status)
        VALUES (app_record.student_id, app_record.internship_id, app_record.id, 'active');
        
        -- Create Notification
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (
            app_record.student_id,
            'Internship Application Accepted',
            'Congratulations! Your application has been accepted.'
        );
    ELSE
        -- Create Notification for Rejection
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (
            app_record.student_id,
            'Internship Application Reviewed',
            'Thank you for your interest. Unfortunately, your application was not selected.'
        );
    END IF;

    -- Generate Audit Log Record (Runs safely internally under owner permissions)
    PERFORM public.write_audit_log(
        'application_review_' || review_status,
        'application',
        app_uuid,
        jsonb_build_object('previous_status', app_record.status, 'new_status', review_status, 'feedback', feedback)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.review_application(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_application(uuid, text, text) TO authenticated;

-- 4b. Transactional Function: Mark Application Under Review (invoked by
-- admins, or by a company owner/admin — same authorization rule as
-- review_application() above, added in Phase 5B-3)
-- Companion to review_application() above: transitions pending -> under_review
-- only. No decision has been made yet, so it deliberately creates no
-- enrollment/notification — it only records that a reviewer has started
-- looking at the application. Follows the exact same conventions as
-- review_application(): SECURITY DEFINER with a function-level search_path
-- SET clause, an authorization check, a row lock, and a write_audit_log() call.
CREATE OR REPLACE FUNCTION public.mark_application_under_review(
    app_uuid uuid
)
RETURNS boolean AS $$
DECLARE
    app_record public.applications%ROWTYPE;
BEGIN
    -- Verify actor is a platform admin OR the owner/admin of the company that
    -- owns this application's internship.
    IF NOT public.is_current_user_admin() AND NOT public.can_review_company_application(app_uuid) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to review this application.';
    END IF;

    -- Fetch and lock the application record to prevent race conditions
    SELECT * INTO app_record FROM public.applications
    WHERE id = app_uuid FOR UPDATE;

    IF app_record.id IS NULL THEN
        RAISE EXCEPTION 'Application not found.';
    END IF;

    -- Only a freshly submitted application can be marked under review
    IF app_record.status != 'pending' THEN
        RAISE EXCEPTION 'Invalid State: Only pending applications can be marked under review.';
    END IF;

    UPDATE public.applications
    SET status = 'under_review', updated_at = timezone('utc'::text, now())
    WHERE id = app_uuid;

    -- Generate Audit Log Record (Runs safely internally under owner permissions)
    PERFORM public.write_audit_log(
        'application_marked_under_review',
        'application',
        app_uuid,
        jsonb_build_object('previous_status', app_record.status, 'new_status', 'under_review')
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.mark_application_under_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_application_under_review(uuid) TO authenticated;

-- 5. Trigger for modified column timestamp helper
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_student_profiles_modtime BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_internships_modtime BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_applications_modtime BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_enrollments_modtime BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 6. Trigger: Handle auth user creation
--
-- This one matters most of all five: it's an AFTER INSERT trigger that
-- fires *inside* GoTrue's own signup transaction, on GoTrue's own pooled
-- connection. A runtime `SET search_path = ...;` here doesn't just affect
-- this function — it silently changes search_path for the rest of that
-- connection, breaking GoTrue's own next query on it (observed directly:
-- signup failed with `relation "users" does not exist`, because `auth` had
-- been dropped from search_path). The function-level SET clause is scoped
-- to just this call and is restored automatically on exit.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, first_name, last_name, onboarded)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    false
  );

  -- Public signups always default to student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. profiles RLS policies
CREATE POLICY "Users can read own profile OR admin can read all" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_current_user_admin());

CREATE POLICY "Users can update own profile fields" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. user_roles RLS policies
CREATE POLICY "Users can read own roles OR admin can read all" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_current_user_admin());

-- 3. student_profiles RLS policies
CREATE POLICY "Users can read own student profile OR admin can read all" ON public.student_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.is_current_user_admin());

CREATE POLICY "Users can insert own student profile" ON public.student_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own student profile" ON public.student_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. internships RLS policies
CREATE POLICY "Anyone can read open internships OR admin can read all" ON public.internships
    FOR SELECT TO authenticated
    USING (status = 'open' OR public.is_current_user_admin());

CREATE POLICY "Admins can insert internships" ON public.internships
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update internships" ON public.internships
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 5. applications RLS policies (Note: Status changes are blocked on UPDATE since no update policies are granted to students)
CREATE POLICY "Users can read own applications OR admin can read all" ON public.applications
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR public.is_current_user_admin());

CREATE POLICY "Students can insert applications" ON public.applications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id AND public.has_current_user_role('student'));

-- 6. enrollments RLS policies (Created via RPC review function)
CREATE POLICY "Users can read own enrollments OR admin can read all" ON public.enrollments
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR public.is_current_user_admin());

CREATE POLICY "Admins can update enrollments" ON public.enrollments
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 7. notifications RLS policies
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification read flag" ON public.notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. audit_logs RLS policies (Write-only by database trigger/function, read-only for admins)
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

-- =========================================================================
-- TABLE-LEVEL PRIVILEGES (authenticated role)
-- =========================================================================
-- RLS policies alone grant nothing: Postgres checks the base table GRANT
-- before RLS is even evaluated, so without these the policies above are
-- unreachable and every query fails with 42501 (permission denied), not
-- with an RLS-driven access decision.
--
-- Each grant below covers exactly the commands that have a matching RLS
-- policy for `authenticated` on that table, no more:
--   - profiles:          SELECT, UPDATE   (own row; INSERT is trigger-only via handle_new_user)
--   - user_roles:        SELECT           (own rows; no INSERT/UPDATE/DELETE policy exists —
--                                          role assignment is trigger-only, so authenticated
--                                          can never modify roles, matching the no-escalation rule)
--   - student_profiles:  SELECT, INSERT, UPDATE   (own row)
--   - internships:       SELECT, INSERT, UPDATE   (open listing / admin-only write, enforced by RLS)
--   - applications:      SELECT, INSERT   (own rows; no UPDATE policy exists anywhere — status
--                                          changes only happen inside review_application(), so
--                                          authenticated never gets a direct UPDATE path)
--   - enrollments:       SELECT, UPDATE   (no INSERT policy — enrollments are only ever created
--                                          inside review_application(), never directly by a client)
--   - notifications:     SELECT, UPDATE (read) only   (own rows; UPDATE is column-restricted to
--                                          `read` — see the column-level GRANT below — so an
--                                          owner can flip their own read flag but cannot change
--                                          title/message/user_id/created_at even via a raw direct
--                                          client update, not just through the Server Action.
--                                          INSERT is RPC-only)
--   - audit_logs:        SELECT           (admin-only read; INSERT is RPC-only via write_audit_log(),
--                                          and no UPDATE/DELETE policy exists anywhere — immutable)
--
-- SECURITY DEFINER functions (handle_new_user, write_audit_log, review_application)
-- execute with their owner's privileges, so they are unaffected by — and do not
-- require — any of the grants below.
--
-- No grants are given to `anon`: every RLS policy in this schema is `TO authenticated`
-- only, so anonymous access has no legitimate path and needs no base privilege either.
--
-- Explicit per-table grants are used instead of `GRANT ... ON ALL TABLES IN SCHEMA
-- public` so each table's privilege set stays a deliberate, auditable decision tied
-- to its actual RLS policies rather than a blanket default. For the same reason, no
-- ALTER DEFAULT PRIVILEGES rule is added for future tables — each new table should
-- have its own minimal grant chosen alongside its own RLS policies when it's created.

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.internships TO authenticated;
GRANT SELECT, INSERT ON public.applications TO authenticated;
GRANT SELECT, UPDATE ON public.enrollments TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
-- Column-restricted on purpose (Phase 4E security hardening): the RLS policy
-- below only checks row ownership, not which columns changed, so without
-- this an owner could update title/message/user_id/created_at on their own
-- notification via a raw direct client call. Postgres enforces column-level
-- UPDATE privileges independently of RLS — any UPDATE naming a column other
-- than `read` in its SET clause is rejected with 42501 before RLS even runs.
GRANT UPDATE (read) ON public.notifications TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- =========================================================================
-- COMPANY PLATFORM FOUNDATION (Phase 5B-1)
-- =========================================================================
-- Schema + RLS foundation only. No company UI, no company Server Actions,
-- no changes to review_application()/mark_application_under_review() — a
-- company user's ability to review applications is explicitly deferred to
-- a later phase. Everything below is additive: no existing table, function,
-- policy, or GRANT above this line is modified.

-- 9. Companies Table
CREATE TABLE public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Company Members Table — the sole, authoritative source of
-- company-scoped membership/role. user_roles.role's existing
-- 'company_admin'/'company_member' enum values are deliberately left
-- unpopulated; they carry no company_id and cannot represent "admin of
-- which company" without overloading a column whose meaning is otherwise
-- uniform ("this user globally holds this role") across every other row.
CREATE TABLE public.company_members (
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    company_role text NOT NULL CHECK (company_role IN ('owner', 'admin', 'member')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (company_id, user_id)
);

CREATE INDEX idx_company_members_user_id ON public.company_members(user_id);

CREATE TRIGGER update_companies_modtime BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_company_members_modtime BEFORE UPDATE ON public.company_members FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Internship ownership: nullable by design. NULL means platform-owned —
-- every existing internship (and every internship Phase 5A's admin CRUD
-- creates going forward) simply keeps company_id NULL, permanently valid,
-- with no backfill and no synthetic "Platform" company row.
ALTER TABLE public.internships
    ADD COLUMN company_id uuid NULL REFERENCES public.companies(id) ON DELETE RESTRICT;

CREATE INDEX idx_internships_company_id ON public.internships(company_id);

-- 11. Company Authorization Helpers
--
-- Same hardened pattern as is_current_user_admin()/has_current_user_role():
-- SECURITY DEFINER with a function-level search_path SET clause (never a
-- runtime SET), REVOKE FROM PUBLIC + GRANT TO authenticated, and the user
-- is always auth.uid() — never a caller-supplied parameter. Only
-- company_id is ever a parameter, so an arbitrary/nonexistent company_id
-- just yields false; it can never be used to probe or affect another
-- company's data, since these functions return only a boolean.
--
-- SECURITY DEFINER is not optional here: a policy on company_members can
-- itself call these helpers to check membership, and if the helpers were
-- plain functions their internal SELECT ... FROM company_members would be
-- subject to company_members' own RLS — which may itself depend on the
-- same helper, a genuine recursion risk. Running as SECURITY DEFINER means
-- the helper's internal lookup bypasses RLS entirely (the same reason
-- write_audit_log() runs as its owner), so only the *calling* policy is
-- ever RLS-gated.
CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id AND user_id = auth.uid() AND company_role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.is_company_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid) TO authenticated;

-- Same predicate as is_company_member() today, kept as its own name so RLS
-- policies read with intent-appropriate naming ("is_company_user" for
-- broad read access to internships/applications vs "is_company_member" for
-- membership-table semantics) without duplicating the underlying query.
CREATE OR REPLACE FUNCTION public.is_company_user(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.is_company_member(target_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.is_company_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_user(uuid) TO authenticated;

-- 12. Transactional Function: Create Company (invoked by any authenticated user)
--
-- A direct client INSERT into companies followed by a separate INSERT into
-- company_members would be two non-atomic statements — if the second failed
-- or the client never ran it, the result is an orphaned company with zero
-- members that no one (short of a platform admin) could ever access or
-- manage. This RPC does both inserts in one function body, which Postgres
-- guarantees is one transaction, the same atomicity guarantee
-- review_application() already relies on for its own multi-table writes.
CREATE OR REPLACE FUNCTION public.create_company(
    company_name text,
    company_description text
)
RETURNS uuid AS $$
DECLARE
    new_company_id uuid;
    actor_uuid uuid;
BEGIN
    actor_uuid := auth.uid();

    IF actor_uuid IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    IF company_name IS NULL OR btrim(company_name) = '' THEN
        RAISE EXCEPTION 'Invalid Input: Company name is required.';
    END IF;

    INSERT INTO public.companies (name, description)
    VALUES (company_name, company_description)
    RETURNING id INTO new_company_id;

    INSERT INTO public.company_members (company_id, user_id, company_role)
    VALUES (new_company_id, actor_uuid, 'owner');

    PERFORM public.write_audit_log(
        'company_created',
        'company',
        new_company_id,
        jsonb_build_object('name', company_name)
    );

    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.create_company(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_company(text, text) TO authenticated;

-- 13. Trigger: Prevent internship company_id reassignment
--
-- RLS's WITH CHECK on UPDATE only validates the proposed new row, so a
-- policy of the shape USING(is_company_admin(company_id))
-- WITH CHECK(is_company_admin(company_id)) is NOT sufficient on its own: a
-- user who administers both Company A and Company B could move an
-- internship from A to B, since both the old and new company_id would
-- independently satisfy is_company_admin(). company_id must be completely
-- immutable for any non-platform-admin actor, so this is enforced as an
-- explicit BEFORE UPDATE trigger (which has OLD/NEW directly, no
-- self-referential subquery needed) rather than folded into RLS text.
-- Platform admins are exempt — they already have unrestricted UPDATE via
-- the existing "Admins can update internships" policy below, unchanged
-- since Phase 4B; this trigger only closes a NEW gap the company_id column
-- introduces, it does not add a new restriction on existing admin behavior.
CREATE OR REPLACE FUNCTION public.prevent_internship_company_reassignment()
RETURNS trigger AS $$
BEGIN
    IF NEW.company_id IS DISTINCT FROM OLD.company_id AND NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Invalid Operation: company_id cannot be changed.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_internship_company_reassignment_trigger
  BEFORE UPDATE ON public.internships
  FOR EACH ROW EXECUTE FUNCTION public.prevent_internship_company_reassignment();

-- 14. companies RLS policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read own company OR admin can read all" ON public.companies
    FOR SELECT TO authenticated
    USING (public.is_company_member(id) OR public.is_current_user_admin());

CREATE POLICY "Company admins can update own company OR platform admin" ON public.companies
    FOR UPDATE TO authenticated
    USING (public.is_company_admin(id) OR public.is_current_user_admin())
    WITH CHECK (public.is_company_admin(id) OR public.is_current_user_admin());

-- No INSERT policy: company creation is exclusively via create_company()
-- above (SECURITY DEFINER, bypasses RLS internally), the same "no direct
-- client INSERT path" pattern already used for enrollments and audit_logs.
-- No DELETE policy: matches the existing schema's soft-state-only model —
-- nothing in this schema is hard-deletable by a client, not even by admins.

-- 15. company_members RLS policies
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read own company's membership OR admin can read all" ON public.company_members
    FOR SELECT TO authenticated
    USING (public.is_company_member(company_id) OR public.is_current_user_admin());

-- A plain member fails is_company_admin() entirely, so they have zero
-- INSERT/UPDATE/DELETE path here regardless of which row they target —
-- self-escalation from member to admin/owner is structurally impossible,
-- not just discouraged. 'owner' rows can only ever be created by
-- create_company()'s own SECURITY-DEFINER-bypassing insert; no policy
-- below ever permits company_role = 'owner' in a client-supplied INSERT or
-- UPDATE, and no policy permits touching a row whose CURRENT role is
-- 'owner' at all — ownership transfer/second-owner support is explicitly
-- out of scope for this foundation phase.
CREATE POLICY "Company admins can add non-owner members OR platform admin" ON public.company_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_current_user_admin()
        OR (public.is_company_admin(company_id) AND company_role IN ('admin', 'member'))
    );

CREATE POLICY "Company admins can update non-owner members OR platform admin" ON public.company_members
    FOR UPDATE TO authenticated
    USING (
        public.is_current_user_admin()
        OR (public.is_company_admin(company_id) AND company_role != 'owner')
    )
    WITH CHECK (
        public.is_current_user_admin()
        OR (public.is_company_admin(company_id) AND company_role IN ('admin', 'member'))
    );

CREATE POLICY "Company admins can remove non-owner members OR platform admin" ON public.company_members
    FOR DELETE TO authenticated
    USING (
        public.is_current_user_admin()
        OR (public.is_company_admin(company_id) AND company_role != 'owner')
    );

-- 16. internships RLS — additive company policies only.
-- Postgres combines multiple PERMISSIVE policies for the same command with
-- OR, so these are added as new, separate policies rather than editing the
-- existing "Anyone can read open internships OR admin can read all" /
-- "Admins can insert internships" / "Admins can update internships"
-- policies from Phase 4B — those three are untouched, byte-for-byte, by
-- this migration.

CREATE POLICY "Company users can read own company's internships regardless of status" ON public.internships
    FOR SELECT TO authenticated
    USING (company_id IS NOT NULL AND public.is_company_user(company_id));

CREATE POLICY "Company admins can insert internships for their own company" ON public.internships
    FOR INSERT TO authenticated
    WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(company_id));

CREATE POLICY "Company admins can update their own company's internships" ON public.internships
    FOR UPDATE TO authenticated
    USING (company_id IS NOT NULL AND public.is_company_admin(company_id))
    WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(company_id));

-- 17. applications RLS — additive company policy only.
-- Company application REVIEW (mutating status) is explicitly deferred;
-- this is read-only, and review_application()/mark_application_under_review()
-- are not modified by this migration.
CREATE POLICY "Company users can read applications for their own company's internships" ON public.applications
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = applications.internship_id
              AND i.company_id IS NOT NULL
              AND public.is_company_user(i.company_id)
        )
    );

-- 18. Company platform GRANTs
-- companies: SELECT, UPDATE only — INSERT is RPC-only (create_company()),
-- DELETE is intentionally absent (see the soft-state note above).
GRANT SELECT, UPDATE ON public.companies TO authenticated;
-- company_members: RLS is the actual restriction on all four commands.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
-- internships/applications table-level GRANTs are unchanged from Phase 4B —
-- the new company capability comes entirely from the RLS policies above,
-- not from a wider base grant.

-- =========================================================================
-- COMPANY PLATFORM: APPLICATION REVIEW + IDENTITY LOOKUP (Phase 5B-3)
-- =========================================================================
-- Closes the three blockers reported at the end of Phase 5B-2: company
-- reviewers could not call review_application()/mark_application_under_review()
-- (both are extended above, in place, to also accept
-- can_review_company_application() below), company admins could not resolve
-- a user by email to add them as a member, and company users could not see
-- applicant/fellow-member names because profiles RLS has no company branch.
-- None of these are solved by widening profiles RLS — every read here goes
-- through a narrowly-scoped SECURITY DEFINER function that independently
-- re-verifies the caller's own company relationship via the existing
-- is_company_member()/is_company_admin() helpers, the same "recheck inside
-- the function, never trust the parameter" pattern is_company_admin() itself
-- already established.

-- 19. Authorization helper: can the caller review this specific application?
-- Used by review_application()/mark_application_under_review() above (which
-- are defined earlier in this file — plpgsql function bodies are only
-- resolved at call time, so this forward reference is safe). Derives the
-- actor from auth.uid() only (via is_company_admin(), never a parameter),
-- and requires the application's internship to belong to a company (NULL
-- company_id — platform-owned — always returns false here; platform admins
-- reach those through the separate is_current_user_admin() branch instead).
CREATE OR REPLACE FUNCTION public.can_review_company_application(application_id uuid)
RETURNS boolean AS $$
DECLARE
    target_company_id uuid;
BEGIN
    SELECT i.company_id INTO target_company_id
    FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    WHERE a.id = application_id;

    IF target_company_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN public.is_company_admin(target_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.can_review_company_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_company_application(uuid) TO authenticated;

-- 20. Secure identity lookup: resolve a user by exact email for company
-- membership invites. Gated to "caller is owner/admin of at least one
-- company" (not all authenticated users, and not scoped to a specific
-- company_id — this function returns no company-membership information,
-- only identity, so which company the caller administers is irrelevant to
-- what it's safe to return). Exact, case-insensitive match only; returns
-- zero or one row. No pattern/partial search, so it cannot be used to
-- enumerate the user base beyond confirming/denying one exact address at a
-- time — the same minimal exposure any "invite by email" feature has.
CREATE OR REPLACE FUNCTION public.find_user_for_company_membership(lookup_email text)
RETURNS TABLE (user_id uuid, email text, first_name text, last_name text) AS $$
BEGIN
    -- Table-qualified column reference: this function's own RETURNS TABLE
    -- OUT parameter is also named user_id, which plpgsql would otherwise
    -- treat as ambiguous against company_members.user_id.
    IF NOT EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid() AND cm.company_role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to look up users.';
    END IF;

    IF lookup_email IS NULL OR btrim(lookup_email) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.id, p.email, p.first_name, p.last_name
    FROM public.profiles p
    WHERE lower(p.email) = lower(btrim(lookup_email))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.find_user_for_company_membership(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_for_company_membership(text) TO authenticated;

-- 21. Company-scoped identity reads. Each independently re-verifies the
-- caller's own relationship to target_company_id (never trusts it blindly)
-- via the exact same helpers RLS itself uses, so these can never expose more
-- than the equivalent RLS-guarded row-set already visible to the caller.

-- Fellow company members' identities — any member (owner/admin/member) may
-- see who else is on their own company's roster.
CREATE OR REPLACE FUNCTION public.company_member_profiles(target_company_id uuid)
RETURNS TABLE (user_id uuid, email text, first_name text, last_name text) AS $$
BEGIN
    IF NOT public.is_company_member(target_company_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.id, p.email, p.first_name, p.last_name
    FROM public.company_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.company_id = target_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.company_member_profiles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_member_profiles(uuid) TO authenticated;

-- Applicant identities for the caller's own company's internships — any
-- company user (read-only members included) may see who applied, mirroring
-- the existing "Company users can read applications for their own company's
-- internships" RLS policy's own reach, never wider.
CREATE OR REPLACE FUNCTION public.company_applicant_profiles(target_company_id uuid)
RETURNS TABLE (application_id uuid, user_id uuid, email text, first_name text, last_name text) AS $$
BEGIN
    IF NOT public.is_company_user(target_company_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT a.id, p.id, p.email, p.first_name, p.last_name
    FROM public.applications a
    JOIN public.internships i ON i.id = a.internship_id
    JOIN public.profiles p ON p.id = a.student_id
    WHERE i.company_id = target_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.company_applicant_profiles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_applicant_profiles(uuid) TO authenticated;

-- =========================================================================
-- CONTENT CATALOG: PROGRAMS, COURSES, SKILLS (Phase 7)
-- =========================================================================
-- Establishes NOVA's learning-content catalog — flagship programs, the
-- courses inside each, and a normalized, reusable skill vocabulary. This is
-- catalog/reference data (like a course listing), not a full LMS: no video
-- hosting, quizzes, certificates, progress tracking, or payments live here.
--
-- These are the FIRST tables in this schema readable by the `anon` role.
-- Every other table in this file is `TO authenticated` only, by deliberate,
-- consistent design (public marketing pages have always been fully static —
-- see src/components/marketing/content.ts). Published catalog content is
-- different in kind from every existing table: it holds no user data, no
-- business-sensitive data, and is meant to be publicly browsable without a
-- login (a course catalog page). Granting `anon` SELECT on PUBLISHED rows
-- only, on these five new tables only, is a narrow, additive expansion —
-- nothing existing changes, and drafts remain invisible to anon and to
-- authenticated non-admins alike.

-- 22. Programs Table — flagship, admin-curated learning tracks.
CREATE TABLE public.programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    short_description text NOT NULL,
    long_description text NOT NULL,
    category text NOT NULL CHECK (category IN (
        'ai_ml', 'data_analytics', 'software_development', 'cybersecurity',
        'cloud_devops', 'design', 'emerging_tech'
    )),
    difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks integer NOT NULL CHECK (duration_weeks > 0),
    -- Career outcomes are simple role-title strings, not a separate Career
    -- Paths table — see the Phase 7 report's "career-path decision": a
    -- program's own outcomes list already represents this cleanly without
    -- a redundant entity.
    career_outcomes text[] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_programs_status ON public.programs(status);

CREATE TRIGGER update_programs_modtime BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 23. Courses Table — ordered content units within a program.
-- No `prerequisites` column: sequencing is already fully expressed by
-- (program_id, display_order); a separate prerequisite graph would be
-- redundant complexity for a catalog with no enrollment/progress tracking.
CREATE TABLE public.courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    level text NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_hours integer NOT NULL CHECK (duration_hours > 0),
    display_order integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (program_id, slug)
);

CREATE INDEX idx_courses_program_id ON public.courses(program_id);
CREATE INDEX idx_courses_status ON public.courses(status);

CREATE TRIGGER update_courses_modtime BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 24. Skills Table — a normalized, reusable vocabulary (not a full taxonomy
-- service). No `status`/draft-publish lifecycle: a skill is either part of
-- the vocabulary or it isn't, unlike programs/courses which are genuine
-- editorial content with a draft state.
CREATE TABLE public.skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN (
        'language', 'data_ai', 'web', 'cloud_devops', 'security', 'design',
        'analytics_tools', 'emerging_tech', 'soft_skills'
    )),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_skills_category ON public.skills(category);

-- 25. Join tables connecting programs/courses to skills. Internships are
-- deliberately NOT connected to skills in this phase — see the Phase 7
-- report's internship field classification; there is no existing consumer
-- (filter/display) for internship-skill data yet, so adding it now would be
-- speculative schema, not a genuine current requirement.
CREATE TABLE public.program_skills (
    program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (program_id, skill_id)
);

CREATE INDEX idx_program_skills_skill_id ON public.program_skills(skill_id);

CREATE TABLE public.course_skills (
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, skill_id)
);

CREATE INDEX idx_course_skills_skill_id ON public.course_skills(skill_id);

-- 26. Content catalog RLS.
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;

-- programs: published rows are public; admins see and manage everything.
-- Two separate SELECT policies (rather than one `OR is_current_user_admin()`
-- clause) because that function is only GRANTed to `authenticated` — an
-- `anon` caller would get a permission error, not `false`, if a policy it's
-- subject to tried to call it. Postgres ORs multiple PERMISSIVE policies for
-- the same command, so `authenticated` still gets "published OR admin".
CREATE POLICY "Anyone can read published programs" ON public.programs
    FOR SELECT TO anon, authenticated
    USING (status = 'published');

CREATE POLICY "Admins can read all programs" ON public.programs
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert programs" ON public.programs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update programs" ON public.programs
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- No DELETE policy: matches internships/companies — archive via status,
-- nothing here is hard-deletable.

-- courses: a course is public only when BOTH it and its parent program are
-- published, so a course can never leak ahead of its program's own launch.
CREATE POLICY "Anyone can read published courses of published programs" ON public.courses
    FOR SELECT TO anon, authenticated
    USING (
        status = 'published'
        AND EXISTS (SELECT 1 FROM public.programs p WHERE p.id = courses.program_id AND p.status = 'published')
    );

CREATE POLICY "Admins can read all courses" ON public.courses
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert courses" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update courses" ON public.courses
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- skills: pure reference vocabulary, always readable, admin-managed.
CREATE POLICY "Anyone can read skills" ON public.skills
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can insert skills" ON public.skills
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update skills" ON public.skills
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete skills" ON public.skills
    FOR DELETE TO authenticated
    USING (public.is_current_user_admin());

-- program_skills / course_skills: visible whenever the parent content is
-- visible; otherwise admin-only. FOR ALL covers every write command with a
-- single admin-only policy, matching these tables' pure-junction shape (no
-- content of their own beyond the two foreign keys).
CREATE POLICY "Anyone can read skills for published programs" ON public.program_skills
    FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_skills.program_id AND p.status = 'published'));

CREATE POLICY "Admins can read all program_skills" ON public.program_skills
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage program_skills" ON public.program_skills
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Anyone can read skills for published courses" ON public.course_skills
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            JOIN public.programs p ON p.id = c.program_id
            WHERE c.id = course_skills.course_id AND c.status = 'published' AND p.status = 'published'
        )
    );

CREATE POLICY "Admins can read all course_skills" ON public.course_skills
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage course_skills" ON public.course_skills
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 27. Content catalog GRANTs.
GRANT SELECT ON public.programs, public.courses, public.skills, public.program_skills, public.course_skills TO anon;
GRANT SELECT, INSERT, UPDATE ON public.programs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_skills TO authenticated;

-- =========================================================================
-- SERVICE CATALOG (Phase 8A)
-- =========================================================================
-- The public services catalog NOVA will eventually operate AI-first — this
-- phase is the catalog foundation only (categories + services + an
-- automation_level field describing how autonomously each can run later).
-- No request/project/execution/AI-agent tables exist yet; those are later
-- phases. Follows the exact published-content pattern Phase 7 established
-- for programs/courses: a simple `published boolean` here rather than
-- Phase 7's draft/published/archived status enum, matching this phase's own
-- schema spec (services have no "archived" concept yet — just on or off).

-- 28. Service Categories Table — a small, fixed taxonomy (8 rows, seeded
-- below). No admin UI manages this table in Phase 8A ("keep category
-- management out of this phase" per the spec); the RLS/GRANTs below still
-- give admins full CRUD capability at the database level for when a
-- category-management UI is genuinely needed later.
CREATE TABLE public.service_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    display_order integer NOT NULL DEFAULT 0,
    published boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_service_categories_published ON public.service_categories(published);

CREATE TRIGGER update_service_categories_modtime BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 29. Services Table.
CREATE TABLE public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    short_description text NOT NULL,
    description text NOT NULL,
    -- Two levels only, deliberately no "human_required": a service that
    -- needs a human to do the actual work doesn't belong in an AI-first
    -- catalog at all (see the Phase 8A report's category selection).
    automation_level text NOT NULL CHECK (automation_level IN ('autonomous', 'approval_required')),
    published boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_services_category_id ON public.services(category_id);
CREATE INDEX idx_services_published ON public.services(published);

CREATE TRIGGER update_services_modtime BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 30. Service catalog RLS. Same two-policy-per-role split as Phase 7's
-- programs/courses: `anon` has no EXECUTE grant on is_current_user_admin(),
-- so the anon-scoped policy never calls it, and Postgres ORs the two
-- SELECT policies together for `authenticated`.
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published service categories" ON public.service_categories
    FOR SELECT TO anon, authenticated
    USING (published = true);

CREATE POLICY "Admins can read all service categories" ON public.service_categories
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage service categories" ON public.service_categories
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- A service is public only when BOTH it and its parent category are
-- published, mirroring Phase 7's courses-require-published-program rule.
CREATE POLICY "Anyone can read published services in published categories" ON public.services
    FOR SELECT TO anon, authenticated
    USING (
        published = true
        AND EXISTS (SELECT 1 FROM public.service_categories sc WHERE sc.id = services.category_id AND sc.published = true)
    );

CREATE POLICY "Admins can read all services" ON public.services
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 31. Service catalog GRANTs.
GRANT SELECT ON public.service_categories, public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

-- =========================================================================
-- SERVICE REQUESTS (Phase 8B)
-- =========================================================================
-- The minimum production-capable workflow for a student or company to
-- actually request a catalog service and track it through to delivery.
-- Deliberately ONE table, not a separate "projects" table: nothing yet
-- (agent execution, QA, artifacts — Phase 8C/8D/8E) needs a distinct
-- project entity with its own ownership model, so a second table today
-- would be speculative schema. If a genuinely separate concept emerges in
-- a later phase, it can reference service_requests.id by foreign key then.
--
-- Ownership: requester_id is always auth.uid() (never client-supplied,
-- enforced by the INSERT policy's WITH CHECK). company_id is nullable —
-- NULL means a personal/student request, non-NULL means the request was
-- filed on behalf of a company the requester is a member of, mirroring the
-- internships.company_id NULL-means-platform-owned convention from Phase
-- 5B-1. Company members share visibility into their own company's
-- requests, the same "any member can see, admin/owner can act" split
-- already established for company internships/applications.
--
-- No direct UPDATE/DELETE RLS policy exists on this table at all — every
-- status transition goes through one of the three RPCs below, the exact
-- same "no direct mutation, RPC is the only path" pattern applications
-- already uses for review_application()/mark_application_under_review().
CREATE TABLE public.service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
    details text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'accepted', 'rejected', 'in_progress', 'delivered', 'completed', 'cancelled'
    )),
    deliverable_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_service_requests_requester_id ON public.service_requests(requester_id);
CREATE INDEX idx_service_requests_company_id ON public.service_requests(company_id);
CREATE INDEX idx_service_requests_service_id ON public.service_requests(service_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);

CREATE TRIGGER update_service_requests_modtime BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 32. service_requests RLS.
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters, company members, and admin can read relevant requests" ON public.service_requests
    FOR SELECT TO authenticated
    USING (
        requester_id = auth.uid()
        OR (company_id IS NOT NULL AND public.is_company_member(company_id))
        OR public.is_current_user_admin()
    );

CREATE POLICY "Authenticated users can create their own service requests" ON public.service_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        requester_id = auth.uid()
        AND (company_id IS NULL OR public.is_company_member(company_id))
    );

-- 33. Transactional Function: Review Service Request (invoked by admins).
-- Mirrors review_application()'s own shape exactly: SECURITY DEFINER, a
-- function-level search_path, an upfront admin check, a row lock, a single
-- pending -> accepted|rejected transition, and an audit log entry.
CREATE OR REPLACE FUNCTION public.review_service_request(
    request_id uuid,
    decision text
)
RETURNS boolean AS $$
DECLARE
    req_record public.service_requests%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO req_record FROM public.service_requests WHERE id = request_id FOR UPDATE;

    IF req_record.id IS NULL THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;

    IF req_record.status != 'pending' THEN
        RAISE EXCEPTION 'Invalid State: Request has already been reviewed.';
    END IF;

    IF decision NOT IN ('accepted', 'rejected') THEN
        RAISE EXCEPTION 'Invalid Status: Decision must be accepted or rejected.';
    END IF;

    UPDATE public.service_requests SET status = decision WHERE id = request_id;

    PERFORM public.write_audit_log(
        'service_request_' || decision,
        'service_request',
        request_id,
        jsonb_build_object('previous_status', req_record.status, 'new_status', decision)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.review_service_request(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_service_request(uuid, text) TO authenticated;

-- 34. Transactional Function: Advance Service Request (invoked by admins).
-- Moves an accepted request exactly one step forward through the delivery
-- lifecycle: accepted -> in_progress -> delivered -> completed. Any other
-- requested transition (skipping a step, moving backward) is rejected —
-- this is the actual state-machine enforcement the Phase 8B spec asks for,
-- not just a free-form status column. Delivery notes are required at the
-- 'delivered' step (this is where "final delivery can be recorded" lives)
-- and are stored on the row itself, visible to the requester via RLS.
CREATE OR REPLACE FUNCTION public.advance_service_request(
    request_id uuid,
    new_status text,
    notes text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    req_record public.service_requests%ROWTYPE;
    expected_next text;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO req_record FROM public.service_requests WHERE id = request_id FOR UPDATE;

    IF req_record.id IS NULL THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;

    expected_next := CASE req_record.status
        WHEN 'accepted' THEN 'in_progress'
        WHEN 'in_progress' THEN 'delivered'
        WHEN 'delivered' THEN 'completed'
        ELSE NULL
    END;

    IF expected_next IS NULL OR new_status != expected_next THEN
        RAISE EXCEPTION 'Invalid State: Cannot move from % to %.', req_record.status, new_status;
    END IF;

    IF new_status = 'delivered' AND (notes IS NULL OR btrim(notes) = '') THEN
        RAISE EXCEPTION 'Invalid Input: Delivery notes are required when marking a request delivered.';
    END IF;

    UPDATE public.service_requests
    SET status = new_status, deliverable_notes = COALESCE(notes, deliverable_notes)
    WHERE id = request_id;

    PERFORM public.write_audit_log(
        'service_request_advanced_to_' || new_status,
        'service_request',
        request_id,
        jsonb_build_object('previous_status', req_record.status, 'new_status', new_status)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.advance_service_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_service_request(uuid, text, text) TO authenticated;

-- 35. Transactional Function: Cancel Service Request.
-- Unlike the two RPCs above, this has three possible authorized callers
-- (the original requester, the requesting company's owner/admin, or a
-- platform admin) so the row must be fetched BEFORE the authorization
-- check can be evaluated — the same reason can_review_company_application()
-- exists as its own helper in Phase 5B-3, just inlined here since it's
-- only used once.
CREATE OR REPLACE FUNCTION public.cancel_service_request(
    request_id uuid
)
RETURNS boolean AS $$
DECLARE
    req_record public.service_requests%ROWTYPE;
BEGIN
    SELECT * INTO req_record FROM public.service_requests WHERE id = request_id FOR UPDATE;

    IF req_record.id IS NULL THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;

    IF NOT (
        req_record.requester_id = auth.uid()
        OR (req_record.company_id IS NOT NULL AND public.is_company_admin(req_record.company_id))
        OR public.is_current_user_admin()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to cancel this request.';
    END IF;

    IF req_record.status != 'pending' THEN
        RAISE EXCEPTION 'Invalid State: Only a pending request can be cancelled.';
    END IF;

    UPDATE public.service_requests SET status = 'cancelled' WHERE id = request_id;

    PERFORM public.write_audit_log(
        'service_request_cancelled',
        'service_request',
        request_id,
        jsonb_build_object('previous_status', req_record.status)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.cancel_service_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_service_request(uuid) TO authenticated;

-- 36. service_requests GRANTs. No UPDATE/DELETE grant at all — every
-- mutation goes through the three SECURITY DEFINER RPCs above, which bypass
-- table grants entirely (the same reason applications has no UPDATE grant).
GRANT SELECT, INSERT ON public.service_requests TO authenticated;

-- =========================================================================
-- AI WORKFORCE ARCHITECTURE (Phase 8C) — CONTROL PLANE ONLY
-- =========================================================================
-- This is the persistent model and RLS/RPC security boundary that Phase 8D
-- will actually execute against. Nothing here calls a real AI provider,
-- runs code, deploys anything, or sends anything external — every RPC below
-- only records state (task/run/approval bookkeeping). All lifecycle RPCs
-- are admin-only for now: there is no live agent runtime yet to hold its
-- own identity, so a human operator is the only real actor who can move
-- anything through this pipeline until Phase 8D exists. That restriction is
-- easy to loosen later; it is not safe to loosen by accident, so it starts
-- as tight as possible.
--
-- Six tables, chosen to be the smallest model that can represent the full
-- vision without duplicating anything:
--   agent_definitions              the AI workforce roster
--   ai_capabilities                the fixed capability vocabulary, each
--                                   tagged with whether it requires approval
--                                   (the authoritative safety classification
--                                   lives in data, not scattered app code)
--   agent_definition_capabilities  which agent has which capability
--   ai_tasks                       one row per unit of AI work, always tied
--                                   to a service_request
--   agent_runs                     one row per execution ATTEMPT of a task —
--                                   deliberately separate from ai_tasks so a
--                                   failed run followed by a successful retry
--                                   never overwrites history
--   ai_approvals                   a first-class approval record, never a
--                                   client-supplied boolean
--
-- No separate "ai_task_assignments" table: a task has exactly one current
-- assigned agent, so agent_definition_id is just a column on ai_tasks — a
-- join table would only be justified by a many-agents-per-task requirement
-- this phase doesn't have. No separate "ai_execution_logs" table:
-- agent_runs already IS the execution log (start/complete/fail/summary),
-- and the higher-level event trail (task_created, approval_granted, ...)
-- reuses the existing audit_logs table below, not a second audit system.
--
-- Ownership for RLS purposes is never duplicated onto these tables — a
-- task's visibility is derived from its service_request's own
-- requester_id/company_id via EXISTS, the exact same ownership predicate
-- service_requests' own SELECT policy already uses. This means there is
-- exactly one place that decides "who owns this work," and every table in
-- this subsystem defers to it instead of re-implementing it.

-- 37. Agent Definitions Table — the AI workforce roster.
CREATE TABLE public.agent_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER update_agent_definitions_modtime BEFORE UPDATE ON public.agent_definitions FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 38. AI Capabilities Table — the fixed, admin-managed vocabulary of
-- actions an agent can be granted. requires_approval is read by
-- request_ai_task_approval() below to decide whether a task attempting
-- this capability must stop and wait for a human — the classification is
-- data an admin curates here, not a hardcoded branch in application code.
CREATE TABLE public.ai_capabilities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    requires_approval boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 39. Agent <-> Capability join table.
CREATE TABLE public.agent_definition_capabilities (
    agent_definition_id uuid NOT NULL REFERENCES public.agent_definitions(id) ON DELETE CASCADE,
    capability_id uuid NOT NULL REFERENCES public.ai_capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (agent_definition_id, capability_id)
);

CREATE INDEX idx_agent_definition_capabilities_capability_id ON public.agent_definition_capabilities(capability_id);

-- 40. AI Tasks Table — one row per unit of AI work. Always tied to a
-- service_request (Phase 8B); parent_task_id supports the AI Project
-- Manager decomposing one request into several subtasks (research, design,
-- development, QA, deployment) without inventing a second hierarchy
-- concept. agent_definition_id is nullable because a task can genuinely
-- exist before an agent is picked for it (status = 'pending').
CREATE TABLE public.ai_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    parent_task_id uuid REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
    agent_definition_id uuid REFERENCES public.agent_definitions(id) ON DELETE RESTRICT,
    title text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'running', 'waiting_for_approval', 'blocked', 'failed', 'completed', 'cancelled'
    )),
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    input jsonb NOT NULL DEFAULT '{}'::jsonb,
    output jsonb,
    error text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_ai_tasks_service_request_id ON public.ai_tasks(service_request_id);
CREATE INDEX idx_ai_tasks_parent_task_id ON public.ai_tasks(parent_task_id);
CREATE INDEX idx_ai_tasks_agent_definition_id ON public.ai_tasks(agent_definition_id);
CREATE INDEX idx_ai_tasks_status ON public.ai_tasks(status);

CREATE TRIGGER update_ai_tasks_modtime BEFORE UPDATE ON public.ai_tasks FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 41. Agent Runs Table — one row per execution ATTEMPT of a task, not per
-- task. A failed run followed by a successful retry produces two rows;
-- neither is ever overwritten, so execution history stays fully auditable.
-- `summary` is explicitly for safe, human-readable text only — never raw
-- secrets, API keys, or credentials (enforced by convention/code review,
-- the same way write_audit_log()'s `changes` payload already is).
CREATE TABLE public.agent_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_task_id uuid NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
    agent_definition_id uuid NOT NULL REFERENCES public.agent_definitions(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed')),
    summary text,
    started_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_agent_runs_ai_task_id ON public.agent_runs(ai_task_id);
CREATE INDEX idx_agent_runs_agent_definition_id ON public.agent_runs(agent_definition_id);

-- 42. AI Approvals Table — a first-class approval record. Never trust an
-- `approved` boolean supplied by a client; this row, and only this row
-- (decided exclusively through decide_ai_approval() below), is the
-- authoritative record of what was requested, why, by which agent, against
-- which resource, and who ultimately decided it.
CREATE TABLE public.ai_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_task_id uuid NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
    capability_id uuid REFERENCES public.ai_capabilities(id) ON DELETE RESTRICT,
    requested_by_agent_id uuid REFERENCES public.agent_definitions(id) ON DELETE RESTRICT,
    reason text NOT NULL,
    resource_description text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    decided_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_ai_approvals_ai_task_id ON public.ai_approvals(ai_task_id);
CREATE INDEX idx_ai_approvals_status ON public.ai_approvals(status);

-- 43. RLS. agent_definitions/ai_capabilities/agent_definition_capabilities
-- are an open-read, admin-managed vocabulary — the same "anyone can read,
-- only admin can write" shape as skills (Phase 7). None of these three are
-- ever exposed to `anon`: unlike programs/services, this is internal
-- operational data with no public-catalog purpose.
ALTER TABLE public.agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_definition_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read agent definitions" ON public.agent_definitions
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agent definitions" ON public.agent_definitions
    FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Authenticated users can read AI capabilities" ON public.ai_capabilities
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage AI capabilities" ON public.ai_capabilities
    FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Authenticated users can read agent capability assignments" ON public.agent_definition_capabilities
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agent capability assignments" ON public.agent_definition_capabilities
    FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

-- ai_tasks: visible to admin, or to whoever can already see the underlying
-- service_request (its own requester, or a member of the company it was
-- filed under) — re-deriving that exact predicate via EXISTS rather than
-- duplicating requester_id/company_id columns onto this table. No direct
-- UPDATE/DELETE policy at all: every status change goes through the RPCs
-- below, the same "RPC-only mutation" shape service_requests already uses.
CREATE POLICY "Task owners and admin can read AI tasks" ON public.ai_tasks
    FOR SELECT TO authenticated
    USING (
        public.is_current_user_admin()
        OR EXISTS (
            SELECT 1 FROM public.service_requests sr
            WHERE sr.id = ai_tasks.service_request_id
              AND (sr.requester_id = auth.uid() OR (sr.company_id IS NOT NULL AND public.is_company_member(sr.company_id)))
        )
    );

CREATE POLICY "Admins can create AI tasks" ON public.ai_tasks
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

-- agent_runs: same owner-or-admin visibility, derived one hop further
-- through ai_tasks -> service_requests. No INSERT/UPDATE policy at all —
-- even creation happens only via start_agent_run()/complete_agent_run()
-- below, unlike ai_tasks which allows a direct admin INSERT.
CREATE POLICY "Task owners and admin can read agent runs" ON public.agent_runs
    FOR SELECT TO authenticated
    USING (
        public.is_current_user_admin()
        OR EXISTS (
            SELECT 1 FROM public.ai_tasks t
            JOIN public.service_requests sr ON sr.id = t.service_request_id
            WHERE t.id = agent_runs.ai_task_id
              AND (sr.requester_id = auth.uid() OR (sr.company_id IS NOT NULL AND public.is_company_member(sr.company_id)))
        )
    );

-- ai_approvals: same owner-or-admin visibility. No INSERT/UPDATE policy —
-- request_ai_task_approval() and decide_ai_approval() are the only paths.
CREATE POLICY "Task owners and admin can read AI approvals" ON public.ai_approvals
    FOR SELECT TO authenticated
    USING (
        public.is_current_user_admin()
        OR EXISTS (
            SELECT 1 FROM public.ai_tasks t
            JOIN public.service_requests sr ON sr.id = t.service_request_id
            WHERE t.id = ai_approvals.ai_task_id
              AND (sr.requester_id = auth.uid() OR (sr.company_id IS NOT NULL AND public.is_company_member(sr.company_id)))
        )
    );

-- 44. GRANTs. ai_tasks allows a direct admin INSERT (task creation has no
-- multi-table side effect requiring RPC atomicity); everything else in this
-- subsystem is SELECT-only at the grant level — every mutation happens
-- inside a SECURITY DEFINER RPC, which bypasses table grants entirely.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_capabilities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_definition_capabilities TO authenticated;
GRANT SELECT, INSERT ON public.ai_tasks TO authenticated;
GRANT SELECT ON public.agent_runs TO authenticated;
GRANT SELECT ON public.ai_approvals TO authenticated;

-- 45. Transactional Function: Assign AI Task. pending -> assigned only.
CREATE OR REPLACE FUNCTION public.assign_ai_task(
    task_id uuid,
    agent_definition_id uuid
)
RETURNS boolean AS $$
DECLARE
    task_record public.ai_tasks%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = task_id FOR UPDATE;
    IF task_record.id IS NULL THEN
        RAISE EXCEPTION 'Task not found.';
    END IF;
    IF task_record.status != 'pending' THEN
        RAISE EXCEPTION 'Invalid State: Only a pending task can be assigned.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.agent_definitions a WHERE a.id = assign_ai_task.agent_definition_id AND a.status = 'active') THEN
        RAISE EXCEPTION 'Invalid Input: Agent is not active.';
    END IF;

    UPDATE public.ai_tasks
    SET status = 'assigned', agent_definition_id = assign_ai_task.agent_definition_id
    WHERE id = task_id;

    PERFORM public.write_audit_log('ai_task_assigned', 'ai_task', task_id, jsonb_build_object('agent_definition_id', agent_definition_id));

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.assign_ai_task(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_ai_task(uuid, uuid) TO authenticated;

-- 46. Transactional Function: Start Agent Run. assigned -> running.
-- Requires the run's agent to match the task's currently assigned agent —
-- a task cannot be "started" by an agent it was never assigned to, closing
-- an obvious identity-confusion gap for when Phase 8D introduces real
-- agent-initiated calls.
CREATE OR REPLACE FUNCTION public.start_agent_run(
    task_id uuid,
    agent_definition_id uuid
)
RETURNS uuid AS $$
DECLARE
    task_record public.ai_tasks%ROWTYPE;
    new_run_id uuid;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = task_id FOR UPDATE;
    IF task_record.id IS NULL THEN
        RAISE EXCEPTION 'Task not found.';
    END IF;
    IF task_record.status != 'assigned' THEN
        RAISE EXCEPTION 'Invalid State: Only an assigned task can start running.';
    END IF;
    IF task_record.agent_definition_id IS DISTINCT FROM start_agent_run.agent_definition_id THEN
        RAISE EXCEPTION 'Invalid Input: Agent does not match the task''s assigned agent.';
    END IF;

    INSERT INTO public.agent_runs (ai_task_id, agent_definition_id, status)
    VALUES (task_id, agent_definition_id, 'running')
    RETURNING id INTO new_run_id;

    UPDATE public.ai_tasks SET status = 'running', started_at = timezone('utc'::text, now()) WHERE id = task_id;

    PERFORM public.write_audit_log('agent_run_started', 'ai_task', task_id, jsonb_build_object('run_id', new_run_id, 'agent_definition_id', agent_definition_id));

    RETURN new_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.start_agent_run(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_agent_run(uuid, uuid) TO authenticated;

-- 47. Transactional Function: Complete Agent Run. running -> completed|failed.
CREATE OR REPLACE FUNCTION public.complete_agent_run(
    run_id uuid,
    outcome text,
    summary text DEFAULT NULL,
    output jsonb DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    run_record public.agent_runs%ROWTYPE;
    task_record public.ai_tasks%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    IF outcome NOT IN ('succeeded', 'failed') THEN
        RAISE EXCEPTION 'Invalid Status: Outcome must be succeeded or failed.';
    END IF;

    SELECT * INTO run_record FROM public.agent_runs WHERE id = run_id FOR UPDATE;
    IF run_record.id IS NULL THEN
        RAISE EXCEPTION 'Run not found.';
    END IF;
    IF run_record.status != 'running' THEN
        RAISE EXCEPTION 'Invalid State: This run has already finished.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = run_record.ai_task_id FOR UPDATE;
    IF task_record.status != 'running' THEN
        RAISE EXCEPTION 'Invalid State: Task is no longer running.';
    END IF;

    UPDATE public.agent_runs
    SET status = outcome, summary = complete_agent_run.summary, completed_at = timezone('utc'::text, now())
    WHERE id = run_id;

    IF outcome = 'succeeded' THEN
        UPDATE public.ai_tasks
        SET status = 'completed', output = complete_agent_run.output, completed_at = timezone('utc'::text, now())
        WHERE id = task_record.id;
    ELSE
        UPDATE public.ai_tasks
        SET status = 'failed', error = complete_agent_run.summary, completed_at = timezone('utc'::text, now())
        WHERE id = task_record.id;
    END IF;

    PERFORM public.write_audit_log(
        CASE WHEN outcome = 'succeeded' THEN 'agent_run_completed' ELSE 'agent_run_failed' END,
        'ai_task', task_record.id,
        jsonb_build_object('run_id', run_id, 'outcome', outcome)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.complete_agent_run(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_agent_run(uuid, text, text, jsonb) TO authenticated;

-- 48. Transactional Function: Request AI Task Approval. running ->
-- waiting_for_approval. Only meaningful for a capability actually flagged
-- requires_approval — this is where that flag is enforced, not merely
-- documented.
CREATE OR REPLACE FUNCTION public.request_ai_task_approval(
    task_id uuid,
    capability_id uuid,
    reason text,
    resource_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    task_record public.ai_tasks%ROWTYPE;
    cap_record public.ai_capabilities%ROWTYPE;
    new_approval_id uuid;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = task_id FOR UPDATE;
    IF task_record.id IS NULL THEN
        RAISE EXCEPTION 'Task not found.';
    END IF;
    IF task_record.status != 'running' THEN
        RAISE EXCEPTION 'Invalid State: Only a running task can request approval.';
    END IF;

    SELECT * INTO cap_record FROM public.ai_capabilities WHERE id = capability_id;
    IF cap_record.id IS NULL THEN
        RAISE EXCEPTION 'Invalid Input: Unknown capability.';
    END IF;
    IF NOT cap_record.requires_approval THEN
        RAISE EXCEPTION 'Invalid Input: This capability does not require approval.';
    END IF;
    IF reason IS NULL OR btrim(reason) = '' THEN
        RAISE EXCEPTION 'Invalid Input: A reason is required.';
    END IF;

    INSERT INTO public.ai_approvals (ai_task_id, capability_id, requested_by_agent_id, reason, resource_description)
    VALUES (task_id, capability_id, task_record.agent_definition_id, reason, resource_description)
    RETURNING id INTO new_approval_id;

    UPDATE public.ai_tasks SET status = 'waiting_for_approval' WHERE id = task_id;

    PERFORM public.write_audit_log('approval_requested', 'ai_task', task_id, jsonb_build_object('approval_id', new_approval_id, 'capability_id', capability_id));

    RETURN new_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.request_ai_task_approval(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_ai_task_approval(uuid, uuid, text, text) TO authenticated;

-- 49. Transactional Function: Decide AI Approval. The ONLY path that can
-- ever change an approval's status — never a client-supplied boolean.
-- approved -> task resumes to 'running'; rejected -> task moves to
-- 'cancelled' (mirrors the exact "waiting_for_approval -> cancelled"
-- transition the Phase 8C spec itself calls out).
CREATE OR REPLACE FUNCTION public.decide_ai_approval(
    approval_id uuid,
    decision text
)
RETURNS boolean AS $$
DECLARE
    approval_record public.ai_approvals%ROWTYPE;
    task_record public.ai_tasks%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    IF decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid Status: Decision must be approved or rejected.';
    END IF;

    SELECT * INTO approval_record FROM public.ai_approvals WHERE id = approval_id FOR UPDATE;
    IF approval_record.id IS NULL THEN
        RAISE EXCEPTION 'Approval not found.';
    END IF;
    IF approval_record.status != 'pending' THEN
        RAISE EXCEPTION 'Invalid State: This approval has already been decided.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = approval_record.ai_task_id FOR UPDATE;
    IF task_record.status != 'waiting_for_approval' THEN
        RAISE EXCEPTION 'Invalid State: Task is no longer waiting for approval.';
    END IF;

    UPDATE public.ai_approvals
    SET status = decision, decided_by = auth.uid(), decided_at = timezone('utc'::text, now())
    WHERE id = approval_id;

    UPDATE public.ai_tasks
    SET status = (CASE WHEN decision = 'approved' THEN 'running' ELSE 'cancelled' END)
    WHERE id = task_record.id;

    PERFORM public.write_audit_log(
        CASE WHEN decision = 'approved' THEN 'approval_granted' ELSE 'approval_rejected' END,
        'ai_task', task_record.id,
        jsonb_build_object('approval_id', approval_id)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.decide_ai_approval(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_ai_approval(uuid, text) TO authenticated;

-- 50. Transactional Function: Cancel AI Task. Any non-terminal state except
-- 'running' (a running task must fail, complete, or request approval — it
-- cannot simply be yanked away mid-execution) can move to 'cancelled'.
CREATE OR REPLACE FUNCTION public.cancel_ai_task(
    task_id uuid
)
RETURNS boolean AS $$
DECLARE
    task_record public.ai_tasks%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = task_id FOR UPDATE;
    IF task_record.id IS NULL THEN
        RAISE EXCEPTION 'Task not found.';
    END IF;
    IF task_record.status NOT IN ('pending', 'assigned', 'blocked', 'waiting_for_approval') THEN
        RAISE EXCEPTION 'Invalid State: A task in status % cannot be cancelled.', task_record.status;
    END IF;

    UPDATE public.ai_tasks SET status = 'cancelled' WHERE id = task_id;

    PERFORM public.write_audit_log('ai_task_cancelled', 'ai_task', task_id, jsonb_build_object('previous_status', task_record.status));

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.cancel_ai_task(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_ai_task(uuid) TO authenticated;

-- =========================================================================
-- STORAGE: RESUME BUCKET
-- =========================================================================
-- Private bucket for student resumes. `file_size_limit` and `allowed_mime_types`
-- are enforced by the Storage API itself before any object row is written, so a
-- >5MB or non-PDF upload is rejected up front regardless of RLS. Objects are keyed
-- as "<student_id>/<filename>.pdf" (owner-folder structure); storage.objects
-- already has RLS enabled by default with no policies, so nothing is accessible
-- until the policies below exist. `authenticated` already holds full base table
-- grants on storage.objects/storage.buckets from Supabase's own platform setup —
-- only the missing RLS policies need to be added here.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Students can read own resume" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins can read any resume" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'resumes'
        AND public.is_current_user_admin()
    );

CREATE POLICY "Students can upload own resume as PDF" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND storage.extension(name) = 'pdf'
    );

CREATE POLICY "Students can replace own resume as PDF" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND storage.extension(name) = 'pdf'
    );

CREATE POLICY "Students can delete own resume" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =========================================================================
-- INITIAL CONTENT DATA (Phase 7)
-- =========================================================================
-- Real, production catalog content (not test fixtures — those live in
-- supabase/seed.sql, which is explicitly local-dev/test-only and never runs
-- outside `supabase start`). Taxonomy synthesized from Skill India/MeitY's
-- FutureSkills PRIME (10 emerging-tech categories), AICTE's emerging-areas
-- curriculum focus, and current industry demand data — see the Phase 7
-- report for exact sources. All copy below is NOVA-original, not copied
-- from any source. Every INSERT is idempotent (ON CONFLICT DO NOTHING) so
-- re-running this migration on a database that already has this content is
-- a no-op rather than a duplicate-key error.

-- Skills vocabulary (56 rows across 9 categories).
INSERT INTO public.skills (slug, name, category) VALUES
    ('python', 'Python', 'language'),
    ('javascript', 'JavaScript', 'language'),
    ('typescript', 'TypeScript', 'language'),
    ('sql', 'SQL', 'language'),
    ('java', 'Java', 'language'),
    ('cpp', 'C++', 'language'),
    ('go', 'Go', 'language'),
    ('machine-learning', 'Machine Learning', 'data_ai'),
    ('deep-learning', 'Deep Learning', 'data_ai'),
    ('generative-ai', 'Generative AI', 'data_ai'),
    ('llms', 'Large Language Models', 'data_ai'),
    ('nlp', 'Natural Language Processing', 'data_ai'),
    ('computer-vision', 'Computer Vision', 'data_ai'),
    ('data-analysis', 'Data Analysis', 'data_ai'),
    ('data-visualization', 'Data Visualization', 'data_ai'),
    ('statistics', 'Statistics', 'data_ai'),
    ('pandas', 'Pandas', 'data_ai'),
    ('numpy', 'NumPy', 'data_ai'),
    ('tensorflow', 'TensorFlow', 'data_ai'),
    ('pytorch', 'PyTorch', 'data_ai'),
    ('scikit-learn', 'Scikit-learn', 'data_ai'),
    ('react', 'React', 'web'),
    ('nextjs', 'Next.js', 'web'),
    ('nodejs', 'Node.js', 'web'),
    ('rest-apis', 'REST APIs', 'web'),
    ('html-css', 'HTML & CSS', 'web'),
    ('git-github', 'Git & GitHub', 'web'),
    ('system-design', 'System Design', 'web'),
    ('aws', 'AWS', 'cloud_devops'),
    ('azure', 'Azure', 'cloud_devops'),
    ('docker', 'Docker', 'cloud_devops'),
    ('kubernetes', 'Kubernetes', 'cloud_devops'),
    ('ci-cd', 'CI/CD', 'cloud_devops'),
    ('linux', 'Linux', 'cloud_devops'),
    ('cloud-architecture', 'Cloud Architecture', 'cloud_devops'),
    ('terraform', 'Terraform', 'cloud_devops'),
    ('cybersecurity-fundamentals', 'Cybersecurity Fundamentals', 'security'),
    ('network-security', 'Network Security', 'security'),
    ('ethical-hacking', 'Ethical Hacking', 'security'),
    ('cloud-security', 'Cloud Security', 'security'),
    ('application-security', 'Application Security', 'security'),
    ('incident-response', 'Incident Response', 'security'),
    ('figma', 'Figma', 'design'),
    ('ui-design', 'UI Design', 'design'),
    ('ux-research', 'UX Research', 'design'),
    ('design-systems', 'Design Systems', 'design'),
    ('prototyping', 'Prototyping', 'design'),
    ('power-bi', 'Power BI', 'analytics_tools'),
    ('tableau', 'Tableau', 'analytics_tools'),
    ('excel', 'Excel', 'analytics_tools'),
    ('apache-spark', 'Apache Spark', 'analytics_tools'),
    ('blockchain', 'Blockchain', 'emerging_tech'),
    ('iot', 'Internet of Things', 'emerging_tech'),
    ('ar-vr', 'AR/VR', 'emerging_tech'),
    ('technical-communication', 'Technical Communication', 'soft_skills'),
    ('problem-solving', 'Problem Solving', 'soft_skills')
ON CONFLICT (slug) DO NOTHING;

-- Flagship programs (7 rows).
INSERT INTO public.programs (slug, name, short_description, long_description, category, difficulty, duration_weeks, career_outcomes, status, display_order) VALUES
    (
        'ai-machine-learning',
        'Artificial Intelligence & Machine Learning',
        'Learn to build, train, and deploy machine learning and generative AI systems from first principles.',
        'This program takes you from Python fundamentals through classical machine learning into deep learning and generative AI. You''ll work with real datasets and models, building the practical judgment to apply AI responsibly to real problems, not just run pre-built notebooks.',
        'ai_ml', 'intermediate', 16,
        ARRAY['Machine Learning Engineer', 'AI Engineer', 'Data Scientist', 'Applied AI Developer'],
        'published', 1
    ),
    (
        'data-analytics-data-science',
        'Data Analytics & Data Science',
        'Turn raw data into decisions using SQL, Python, statistics, and modern BI tools.',
        'A practical path through the data stack: querying and cleaning data, applying statistics, visualizing findings, and building predictive models. Built around real analysis workflows so you leave able to answer real business questions with data, not just describe techniques.',
        'data_analytics', 'intermediate', 14,
        ARRAY['Data Analyst', 'Business Intelligence Analyst', 'Junior Data Scientist', 'Analytics Associate'],
        'published', 2
    ),
    (
        'software-development',
        'Software Development',
        'Build production-grade full-stack web applications from the ground up.',
        'Covers the core discipline of modern software engineering: version control, frontend and backend development, APIs, and system design, through the lens of shipping real, working applications rather than isolated exercises.',
        'software_development', 'intermediate', 16,
        ARRAY['Software Engineer', 'Full-Stack Developer', 'Frontend Developer', 'Backend Developer'],
        'published', 3
    ),
    (
        'cybersecurity',
        'Cybersecurity',
        'Learn to secure systems, networks, and applications against real-world threats.',
        'Covers the foundations of networking and systems security, ethical hacking methodology, and application/cloud security practices, building toward the ability to assess, defend, and respond to real security incidents.',
        'cybersecurity', 'intermediate', 14,
        ARRAY['Security Analyst', 'SOC Analyst', 'Penetration Tester', 'Cloud Security Associate'],
        'published', 4
    ),
    (
        'cloud-devops',
        'Cloud & DevOps',
        'Deploy, scale, and operate modern applications using cloud infrastructure and DevOps practices.',
        'Focuses on the operational side of software: containers, orchestration, CI/CD pipelines, and infrastructure as code, so you can take an application from a developer''s laptop to a reliable production environment.',
        'cloud_devops', 'intermediate', 12,
        ARRAY['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
        'published', 5
    ),
    (
        'ui-ux-product-design',
        'UI/UX & Product Design',
        'Design usable, well-researched digital products from research through high-fidelity prototypes.',
        'Covers design thinking, user research, interface design, and systematic design practice: the full path from understanding a user problem to a polished, testable product design.',
        'design', 'beginner', 10,
        ARRAY['UI/UX Designer', 'Product Designer', 'Design Associate'],
        'published', 6
    ),
    (
        'emerging-technologies',
        'Emerging Technologies',
        'Explore blockchain, IoT, and AR/VR: the technologies reshaping what''s next.',
        'A survey-and-build program across the emerging technology landscape identified by national digital-skilling initiatives, giving you working exposure to blockchain, connected devices, and spatial computing rather than just conceptual familiarity.',
        'emerging_tech', 'intermediate', 10,
        ARRAY['Blockchain Developer', 'IoT Engineer', 'AR/VR Developer'],
        'published', 7
    )
ON CONFLICT (slug) DO NOTHING;

-- Program-level curated skill highlights (not the full course-skill union —
-- a shorter, representative list for program cards/summaries).
INSERT INTO public.program_skills (program_id, skill_id)
SELECT p.id, s.id FROM (VALUES
    ('ai-machine-learning', 'python'), ('ai-machine-learning', 'machine-learning'),
    ('ai-machine-learning', 'deep-learning'), ('ai-machine-learning', 'generative-ai'),
    ('ai-machine-learning', 'llms'), ('ai-machine-learning', 'pytorch'),
    ('ai-machine-learning', 'tensorflow'), ('ai-machine-learning', 'statistics'),
    ('data-analytics-data-science', 'sql'), ('data-analytics-data-science', 'python'),
    ('data-analytics-data-science', 'statistics'), ('data-analytics-data-science', 'data-analysis'),
    ('data-analytics-data-science', 'data-visualization'), ('data-analytics-data-science', 'power-bi'),
    ('data-analytics-data-science', 'tableau'), ('data-analytics-data-science', 'excel'),
    ('software-development', 'javascript'), ('software-development', 'typescript'),
    ('software-development', 'react'), ('software-development', 'nodejs'),
    ('software-development', 'git-github'), ('software-development', 'system-design'),
    ('software-development', 'rest-apis'),
    ('cybersecurity', 'cybersecurity-fundamentals'), ('cybersecurity', 'network-security'),
    ('cybersecurity', 'ethical-hacking'), ('cybersecurity', 'cloud-security'),
    ('cybersecurity', 'linux'), ('cybersecurity', 'incident-response'),
    ('cloud-devops', 'aws'), ('cloud-devops', 'docker'),
    ('cloud-devops', 'kubernetes'), ('cloud-devops', 'ci-cd'),
    ('cloud-devops', 'linux'), ('cloud-devops', 'terraform'),
    ('cloud-devops', 'cloud-architecture'),
    ('ui-ux-product-design', 'figma'), ('ui-ux-product-design', 'ui-design'),
    ('ui-ux-product-design', 'ux-research'), ('ui-ux-product-design', 'design-systems'),
    ('ui-ux-product-design', 'prototyping'),
    ('emerging-technologies', 'blockchain'), ('emerging-technologies', 'iot'),
    ('emerging-technologies', 'ar-vr'), ('emerging-technologies', 'python')
) AS v(program_slug, skill_slug)
JOIN public.programs p ON p.slug = v.program_slug
JOIN public.skills s ON s.slug = v.skill_slug
ON CONFLICT DO NOTHING;

-- Courses (38 rows across the 7 flagship programs).
INSERT INTO public.courses (program_id, slug, title, description, level, duration_hours, display_order, status)
SELECT p.id, v.slug, v.title, v.description, v.level, v.duration_hours, v.display_order, 'published'
FROM (VALUES
    ('ai-machine-learning', 'python-for-ai-data', 'Python for AI & Data', 'Core Python programming and the NumPy/Pandas foundations used throughout the rest of the program.', 'beginner', 20, 1),
    ('ai-machine-learning', 'math-foundations-ml', 'Mathematical Foundations for ML', 'The linear algebra, calculus, and probability concepts that make ML algorithms make sense.', 'beginner', 16, 2),
    ('ai-machine-learning', 'ml-fundamentals', 'Machine Learning Fundamentals', 'Supervised and unsupervised learning with scikit-learn, from regression to clustering.', 'intermediate', 30, 3),
    ('ai-machine-learning', 'deep-learning-neural-networks', 'Deep Learning with Neural Networks', 'Building and training neural networks with TensorFlow and PyTorch.', 'intermediate', 30, 4),
    ('ai-machine-learning', 'generative-ai-llms', 'Generative AI & LLMs', 'How large language models work and how to build applications on top of them.', 'advanced', 24, 5),
    ('ai-machine-learning', 'ai-systems-capstone', 'AI Systems Capstone Project', 'A self-directed project applying the full ML pipeline to a real dataset.', 'advanced', 20, 6),
    ('data-analytics-data-science', 'sql-for-data-analysis', 'SQL for Data Analysis', 'Querying, joining, and aggregating relational data to answer real questions.', 'beginner', 16, 1),
    ('data-analytics-data-science', 'python-for-data-analysis', 'Python for Data Analysis', 'Using Python and Pandas to clean, transform, and explore datasets.', 'beginner', 20, 2),
    ('data-analytics-data-science', 'statistics-for-data-science', 'Statistics for Data Science', 'The statistical reasoning behind confident, defensible data conclusions.', 'intermediate', 20, 3),
    ('data-analytics-data-science', 'data-viz-powerbi-tableau', 'Data Visualization with Power BI & Tableau', 'Turning analysis into dashboards and visuals that communicate clearly.', 'intermediate', 18, 4),
    ('data-analytics-data-science', 'applied-ml-for-analysts', 'Applied Machine Learning for Analysts', 'Practical predictive modeling techniques for analysts, not just data scientists.', 'advanced', 24, 5),
    ('data-analytics-data-science', 'data-science-capstone', 'Data Science Capstone Project', 'An end-to-end analysis project from raw data to a decision-ready report.', 'advanced', 20, 6),
    ('software-development', 'programming-foundations-js', 'Programming Foundations with JavaScript', 'Core programming concepts and JavaScript fundamentals for the web.', 'beginner', 20, 1),
    ('software-development', 'git-github-workflow', 'Git, GitHub & Developer Workflow', 'Version control and collaborative development practices used on every real team.', 'beginner', 10, 2),
    ('software-development', 'frontend-react', 'Frontend Development with React', 'Building interactive user interfaces with React and TypeScript.', 'intermediate', 30, 3),
    ('software-development', 'backend-nodejs', 'Backend Development with Node.js', 'Building APIs and server-side logic with Node.js and SQL databases.', 'intermediate', 30, 4),
    ('software-development', 'system-design-fundamentals', 'System Design Fundamentals', 'How to reason about scale, reliability, and architecture in real systems.', 'advanced', 20, 5),
    ('software-development', 'fullstack-capstone', 'Full-Stack Capstone Project', 'Designing and building a complete full-stack application from scratch.', 'advanced', 24, 6),
    ('cybersecurity', 'cybersecurity-foundations-course', 'Cybersecurity Fundamentals', 'Core security principles: threats, vulnerabilities, and defense-in-depth.', 'beginner', 16, 1),
    ('cybersecurity', 'networking-linux-essentials', 'Networking & Linux Essentials', 'The networking and Linux systems knowledge every security role depends on.', 'beginner', 18, 2),
    ('cybersecurity', 'ethical-hacking-pentest', 'Ethical Hacking & Penetration Testing', 'Offensive security methodology used to find and responsibly report vulnerabilities.', 'intermediate', 30, 3),
    ('cybersecurity', 'app-cloud-security', 'Application & Cloud Security', 'Securing modern applications and cloud infrastructure against common attack paths.', 'intermediate', 24, 4),
    ('cybersecurity', 'security-ops-incident-response', 'Security Operations & Incident Response', 'Monitoring, detecting, and responding to real security incidents.', 'advanced', 20, 5),
    ('cloud-devops', 'cloud-computing-fundamentals', 'Cloud Computing Fundamentals', 'Core cloud concepts and services using AWS as the primary reference platform.', 'beginner', 16, 1),
    ('cloud-devops', 'linux-shell-scripting', 'Linux & Shell Scripting', 'The command-line and scripting skills behind every DevOps workflow.', 'beginner', 14, 2),
    ('cloud-devops', 'containers-docker-kubernetes', 'Containers with Docker & Kubernetes', 'Packaging and orchestrating applications with containers at scale.', 'intermediate', 26, 3),
    ('cloud-devops', 'cicd-infra-as-code', 'CI/CD & Infrastructure as Code', 'Automating delivery pipelines and provisioning infrastructure with Terraform.', 'intermediate', 24, 4),
    ('cloud-devops', 'cloud-devops-capstone', 'Cloud DevOps Capstone Project', 'Deploying and operating a real application on cloud infrastructure end-to-end.', 'advanced', 20, 5),
    ('ui-ux-product-design', 'design-fundamentals-thinking', 'Design Fundamentals & Design Thinking', 'The core principles and problem-framing process behind good product design.', 'beginner', 14, 1),
    ('ui-ux-product-design', 'ux-research-methods', 'UX Research Methods', 'Techniques for understanding real user needs before designing solutions.', 'beginner', 16, 2),
    ('ui-ux-product-design', 'ui-design-figma', 'UI Design with Figma', 'Visual interface design and hands-on Figma craft.', 'intermediate', 22, 3),
    ('ui-ux-product-design', 'design-systems-prototyping', 'Design Systems & Prototyping', 'Building reusable design systems and interactive prototypes.', 'intermediate', 20, 4),
    ('ui-ux-product-design', 'product-design-capstone', 'Product Design Capstone Project', 'Taking a product problem from research through a polished, testable prototype.', 'advanced', 18, 5),
    ('emerging-technologies', 'intro-emerging-tech', 'Introduction to Emerging Tech Landscape', 'An orientation to blockchain, IoT, and AR/VR and where each is headed.', 'beginner', 10, 1),
    ('emerging-technologies', 'blockchain-web3-fundamentals', 'Blockchain & Web3 Fundamentals', 'How blockchain systems work and the basics of building on them.', 'intermediate', 18, 2),
    ('emerging-technologies', 'iot-embedded-systems', 'IoT & Embedded Systems', 'Connecting physical devices and sensors into working IoT systems.', 'intermediate', 20, 3),
    ('emerging-technologies', 'ar-vr-spatial-computing', 'AR/VR & Spatial Computing', 'The fundamentals of building augmented and virtual reality experiences.', 'intermediate', 18, 4),
    ('emerging-technologies', 'emerging-tech-applied-project', 'Emerging Tech Applied Project', 'A self-directed project combining blockchain, IoT, or AR/VR into a working demo.', 'advanced', 16, 5)
) AS v(program_slug, slug, title, description, level, duration_hours, display_order)
JOIN public.programs p ON p.slug = v.program_slug
ON CONFLICT (program_id, slug) DO NOTHING;

-- Course-level skills (2-3 per course).
INSERT INTO public.course_skills (course_id, skill_id)
SELECT c.id, s.id FROM (VALUES
    ('ai-machine-learning', 'python-for-ai-data', 'python'), ('ai-machine-learning', 'python-for-ai-data', 'numpy'), ('ai-machine-learning', 'python-for-ai-data', 'pandas'),
    ('ai-machine-learning', 'math-foundations-ml', 'statistics'), ('ai-machine-learning', 'math-foundations-ml', 'machine-learning'),
    ('ai-machine-learning', 'ml-fundamentals', 'machine-learning'), ('ai-machine-learning', 'ml-fundamentals', 'scikit-learn'), ('ai-machine-learning', 'ml-fundamentals', 'python'),
    ('ai-machine-learning', 'deep-learning-neural-networks', 'deep-learning'), ('ai-machine-learning', 'deep-learning-neural-networks', 'tensorflow'), ('ai-machine-learning', 'deep-learning-neural-networks', 'pytorch'),
    ('ai-machine-learning', 'generative-ai-llms', 'generative-ai'), ('ai-machine-learning', 'generative-ai-llms', 'llms'), ('ai-machine-learning', 'generative-ai-llms', 'nlp'),
    ('ai-machine-learning', 'ai-systems-capstone', 'machine-learning'), ('ai-machine-learning', 'ai-systems-capstone', 'deep-learning'), ('ai-machine-learning', 'ai-systems-capstone', 'python'),
    ('data-analytics-data-science', 'sql-for-data-analysis', 'sql'), ('data-analytics-data-science', 'sql-for-data-analysis', 'data-analysis'),
    ('data-analytics-data-science', 'python-for-data-analysis', 'python'), ('data-analytics-data-science', 'python-for-data-analysis', 'pandas'), ('data-analytics-data-science', 'python-for-data-analysis', 'data-analysis'),
    ('data-analytics-data-science', 'statistics-for-data-science', 'statistics'), ('data-analytics-data-science', 'statistics-for-data-science', 'data-analysis'),
    ('data-analytics-data-science', 'data-viz-powerbi-tableau', 'power-bi'), ('data-analytics-data-science', 'data-viz-powerbi-tableau', 'tableau'), ('data-analytics-data-science', 'data-viz-powerbi-tableau', 'data-visualization'),
    ('data-analytics-data-science', 'applied-ml-for-analysts', 'machine-learning'), ('data-analytics-data-science', 'applied-ml-for-analysts', 'scikit-learn'), ('data-analytics-data-science', 'applied-ml-for-analysts', 'python'),
    ('data-analytics-data-science', 'data-science-capstone', 'sql'), ('data-analytics-data-science', 'data-science-capstone', 'python'), ('data-analytics-data-science', 'data-science-capstone', 'data-analysis'),
    ('software-development', 'programming-foundations-js', 'javascript'), ('software-development', 'programming-foundations-js', 'html-css'),
    ('software-development', 'git-github-workflow', 'git-github'),
    ('software-development', 'frontend-react', 'react'), ('software-development', 'frontend-react', 'javascript'), ('software-development', 'frontend-react', 'typescript'),
    ('software-development', 'backend-nodejs', 'nodejs'), ('software-development', 'backend-nodejs', 'rest-apis'), ('software-development', 'backend-nodejs', 'sql'),
    ('software-development', 'system-design-fundamentals', 'system-design'),
    ('software-development', 'fullstack-capstone', 'react'), ('software-development', 'fullstack-capstone', 'nodejs'), ('software-development', 'fullstack-capstone', 'system-design'),
    ('cybersecurity', 'cybersecurity-foundations-course', 'cybersecurity-fundamentals'), ('cybersecurity', 'cybersecurity-foundations-course', 'network-security'),
    ('cybersecurity', 'networking-linux-essentials', 'linux'), ('cybersecurity', 'networking-linux-essentials', 'network-security'),
    ('cybersecurity', 'ethical-hacking-pentest', 'ethical-hacking'), ('cybersecurity', 'ethical-hacking-pentest', 'network-security'),
    ('cybersecurity', 'app-cloud-security', 'application-security'), ('cybersecurity', 'app-cloud-security', 'cloud-security'),
    ('cybersecurity', 'security-ops-incident-response', 'incident-response'), ('cybersecurity', 'security-ops-incident-response', 'network-security'),
    ('cloud-devops', 'cloud-computing-fundamentals', 'aws'), ('cloud-devops', 'cloud-computing-fundamentals', 'cloud-architecture'),
    ('cloud-devops', 'linux-shell-scripting', 'linux'),
    ('cloud-devops', 'containers-docker-kubernetes', 'docker'), ('cloud-devops', 'containers-docker-kubernetes', 'kubernetes'),
    ('cloud-devops', 'cicd-infra-as-code', 'ci-cd'), ('cloud-devops', 'cicd-infra-as-code', 'terraform'),
    ('cloud-devops', 'cloud-devops-capstone', 'docker'), ('cloud-devops', 'cloud-devops-capstone', 'kubernetes'), ('cloud-devops', 'cloud-devops-capstone', 'ci-cd'),
    ('ui-ux-product-design', 'design-fundamentals-thinking', 'ui-design'), ('ui-ux-product-design', 'design-fundamentals-thinking', 'ux-research'),
    ('ui-ux-product-design', 'ux-research-methods', 'ux-research'),
    ('ui-ux-product-design', 'ui-design-figma', 'figma'), ('ui-ux-product-design', 'ui-design-figma', 'ui-design'),
    ('ui-ux-product-design', 'design-systems-prototyping', 'design-systems'), ('ui-ux-product-design', 'design-systems-prototyping', 'prototyping'),
    ('ui-ux-product-design', 'product-design-capstone', 'figma'), ('ui-ux-product-design', 'product-design-capstone', 'design-systems'), ('ui-ux-product-design', 'product-design-capstone', 'prototyping'),
    ('emerging-technologies', 'intro-emerging-tech', 'blockchain'), ('emerging-technologies', 'intro-emerging-tech', 'iot'), ('emerging-technologies', 'intro-emerging-tech', 'ar-vr'),
    ('emerging-technologies', 'blockchain-web3-fundamentals', 'blockchain'),
    ('emerging-technologies', 'iot-embedded-systems', 'iot'),
    ('emerging-technologies', 'ar-vr-spatial-computing', 'ar-vr'),
    ('emerging-technologies', 'emerging-tech-applied-project', 'blockchain'), ('emerging-technologies', 'emerging-tech-applied-project', 'iot'), ('emerging-technologies', 'emerging-tech-applied-project', 'ar-vr')
) AS v(program_slug, course_slug, skill_slug)
JOIN public.programs p ON p.slug = v.program_slug
JOIN public.courses c ON c.program_id = p.id AND c.slug = v.course_slug
JOIN public.skills s ON s.slug = v.skill_slug
ON CONFLICT DO NOTHING;

-- =========================================================================
-- INITIAL SERVICE CATALOG DATA (Phase 8A)
-- =========================================================================
-- 8 fixed categories and 40 services. Every service is one NOVA AI can
-- realistically perform the majority of the digital work for — no physical
-- services, no offensive security, nothing that inherently requires a human
-- professional. automation_level reflects today's honest capability, not
-- an aspiration: anything touching live production systems, real customer
-- interactions, or external sends is 'approval_required'.

INSERT INTO public.service_categories (slug, name, description, display_order, published) VALUES
    ('websites-web', 'Websites & Web', 'Full websites, landing pages, and web content, designed, written, and shipped by NOVA AI.', 1, true),
    ('ai-automation', 'AI & Automation', 'Chatbots, workflow automation, and AI systems that take real work off your team''s plate.', 2, true),
    ('digital-marketing', 'Digital Marketing', 'SEO, content, and campaign work grounded in real research, not guesswork.', 3, true),
    ('design-creative', 'Design & Creative', 'Interfaces, presentations, and brand content generated to a professional standard.', 4, true),
    ('data-business', 'Data & Business', 'Turning raw data and documents into clean, decision-ready outputs.', 5, true),
    ('software-development', 'Software Development', 'Real applications, APIs, and internal tools, built and shipped end-to-end.', 6, true),
    ('cloud-infrastructure', 'Cloud & Infrastructure', 'Deployment, containers, and infrastructure operated reliably and securely.', 7, true),
    ('defensive-cybersecurity', 'Defensive Cybersecurity', 'Hardening, scanning, and auditing your systems against real-world threats.', 8, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (category_id, slug, name, short_description, description, automation_level, published, display_order)
SELECT sc.id, v.slug, v.name, v.short_description, v.description, v.automation_level, true, v.display_order
FROM (VALUES
    ('websites-web', 'ai-website-creation', 'AI Website Creation', 'A complete, production-ready website generated from a brief.', 'NOVA AI turns a project brief into a full website: structure, copy, and visual design assembled together. You review the finished site before it goes live; the build itself runs without step-by-step supervision.', 'autonomous', 1),
    ('websites-web', 'landing-page-creation', 'Landing Page Creation', 'A focused, conversion-oriented landing page ready to publish.', 'A single, purpose-built page designed around one goal, such as signups, sales, or bookings, generated end-to-end from your product details and target audience.', 'autonomous', 2),
    ('websites-web', 'website-redesign', 'Website Redesign', 'A modernized version of an existing site, reviewed before launch.', 'NOVA AI rebuilds an existing website''s design and structure while preserving your content and SEO equity. Because this replaces something already live, the redesign is reviewed against your brand before it is deployed.', 'approval_required', 3),
    ('websites-web', 'website-content-generation', 'Website Content Generation', 'On-brand page copy and product content generated from what you already have.', 'Existing brochures, docs, or notes become polished website copy: page content, product descriptions, and section text written to match your brand voice.', 'autonomous', 4),
    ('websites-web', 'website-seo-optimization', 'Website SEO Optimization', 'Technical and on-page SEO improvements applied to an existing site.', 'NOVA AI audits page structure, metadata, and content for search visibility, then applies the improvements directly rather than just producing an audit report.', 'autonomous', 5),
    ('ai-automation', 'ai-chatbot-development', 'AI Chatbot Development', 'A trained AI chatbot for your website or product.', 'A conversational assistant built on your own content and FAQs, ready to answer real customer questions on your site or app.', 'autonomous', 1),
    ('ai-automation', 'ai-customer-support-agents', 'AI Customer Support Agents', 'An AI agent that handles support conversations across your channels.', 'NOVA AI builds and trains a support agent that can resolve common tickets directly. Because it interacts with real customers, initial responses are reviewed before the agent operates unsupervised.', 'approval_required', 2),
    ('ai-automation', 'workflow-automation', 'Workflow Automation (n8n)', 'Business workflows automated end-to-end with n8n.', 'Repetitive multi-step processes such as data syncing, notifications, and approvals are automated into a single reliable workflow, built and tested by NOVA AI.', 'autonomous', 3),
    ('ai-automation', 'ai-document-processing', 'AI Document Processing', 'Automated extraction and structuring of information from documents.', 'Invoices, forms, and reports converted into structured, usable data automatically, removing manual data entry from the process.', 'autonomous', 4),
    ('ai-automation', 'ai-knowledge-base-rag', 'AI Knowledge Base & RAG Systems', 'A searchable AI assistant trained on your own documentation.', 'Your internal docs, wikis, or product content become a retrieval-augmented AI system that answers questions grounded in your real material, not generic web knowledge.', 'autonomous', 5),
    ('digital-marketing', 'seo-audit-strategy', 'SEO Audit & Strategy', 'A full technical and content SEO audit with a prioritized action plan.', 'NOVA AI reviews site structure, content, and technical SEO factors, then produces a clear, prioritized plan for what to fix first.', 'autonomous', 1),
    ('digital-marketing', 'keyword-competitor-research', 'Keyword & Competitor Research', 'Real keyword and competitor data to ground your content strategy.', 'Structured research into what your audience searches for and how competitors rank for it, delivered as a usable reference rather than a raw data dump.', 'autonomous', 2),
    ('digital-marketing', 'blog-article-generation', 'Blog & Article Generation', 'SEO-aware articles written from a topic brief.', 'Well-researched, on-brand articles generated from a topic and target keyword, ready for publishing or light editorial review.', 'autonomous', 3),
    ('digital-marketing', 'social-media-content-generation', 'Social Media Content Generation', 'A batch of on-brand social posts generated from your content calendar.', 'Captions, post copy, and content ideas generated across platforms to match your brand voice and posting cadence.', 'autonomous', 4),
    ('digital-marketing', 'email-campaign-automation', 'Email Campaign Automation', 'A written and scheduled email campaign, reviewed before it sends.', 'NOVA AI drafts and sequences a full email campaign. Because sending reaches real recipients, the final campaign is reviewed before it goes out.', 'approval_required', 5),
    ('design-creative', 'ui-ux-wireframes', 'UI/UX Wireframes', 'Structured wireframes for a product or website from a feature brief.', 'Low-to-mid fidelity wireframes that map out layout and user flow before visual design begins, generated directly from your feature requirements.', 'autonomous', 1),
    ('design-creative', 'figma-design-generation', 'Figma Design Generation', 'A working Figma design file generated from a brief or wireframe.', 'A structured, editable Figma file with real components and layouts, ready for your team to refine or hand off to development.', 'autonomous', 2),
    ('design-creative', 'presentation-generation', 'Presentation Generation', 'A polished slide deck generated from your content and outline.', 'Pitch decks, reports, or internal presentations built from your talking points into a structured, visually consistent deck.', 'autonomous', 3),
    ('design-creative', 'social-media-graphics', 'Social Media Graphics', 'On-brand graphics generated for social posts and campaigns.', 'A batch of visual assets sized and styled for your platforms, generated to match your brand''s existing visual identity.', 'autonomous', 4),
    ('design-creative', 'brand-content-generation', 'Brand Content Generation', 'Consistent brand copy and messaging generated across formats.', 'Taglines, descriptions, and brand messaging generated to a consistent voice, usable across your website, marketing, and product.', 'autonomous', 5),
    ('data-business', 'data-cleaning-transformation', 'Data Cleaning & Transformation', 'Messy datasets cleaned, structured, and made analysis-ready.', 'Duplicate, inconsistent, or malformed data cleaned and transformed into a structured dataset ready for analysis or reporting.', 'autonomous', 1),
    ('data-business', 'sql-data-analysis', 'SQL Data Analysis', 'Structured analysis of your data with real, queryable answers.', 'NOVA AI writes and runs the SQL needed to answer specific business questions against your data, delivering findings rather than just queries.', 'autonomous', 2),
    ('data-business', 'power-bi-dashboards', 'Power BI Dashboards', 'A working Power BI dashboard built from your data source.', 'Your data connected into a structured, readable Power BI dashboard with the metrics and views your team actually needs.', 'autonomous', 3),
    ('data-business', 'automated-business-reports', 'Automated Business Reports', 'Recurring reports generated automatically from your data.', 'A defined report, such as sales, performance, or operations, generated on a schedule from your live data source with no manual compilation required.', 'autonomous', 4),
    ('data-business', 'competitive-market-research', 'Competitive & Market Research', 'Structured research into your market and competitors.', 'A synthesized view of competitor positioning, pricing, and market trends, built from real public sources into a usable reference document.', 'autonomous', 5),
    ('software-development', 'mvp-development', 'MVP Development', 'A working MVP built from your product requirements.', 'A functional first version of your product, built end-to-end by NOVA AI. Given the scope and cost of a full build, milestones are reviewed with you along the way.', 'approval_required', 1),
    ('software-development', 'api-development', 'API Development', 'A working API built to your specification.', 'A REST API implemented and tested against your defined endpoints and data model, ready to integrate into your application.', 'autonomous', 2),
    ('software-development', 'internal-tool-development', 'Internal Business Tool Development', 'A small internal tool built to solve a specific operational need.', 'Admin panels, internal dashboards, or workflow tools built and deployed to solve a specific, well-defined internal problem.', 'autonomous', 3),
    ('software-development', 'bug-fixing-code-refactoring', 'Bug Fixing & Code Refactoring', 'Existing code diagnosed, fixed, and cleaned up.', 'NOVA AI investigates a reported bug or code-quality issue, implements the fix, and verifies it against your existing tests.', 'autonomous', 4),
    ('software-development', 'automated-testing-setup', 'Automated Testing Setup', 'A real test suite added to an existing codebase.', 'Unit and integration tests written for your existing application, giving you a safety net for future changes.', 'autonomous', 5),
    ('cloud-infrastructure', 'website-deployment', 'Website Deployment', 'Your website deployed to a production environment.', 'NOVA AI configures hosting, domains, and deployment for your site. Because this affects a live production environment, the final deployment step is reviewed before it goes live.', 'approval_required', 1),
    ('cloud-infrastructure', 'docker-containerization', 'Docker Containerization', 'Your application packaged into a working Docker setup.', 'A Dockerfile and container configuration built and tested for your application, ready to run consistently anywhere.', 'autonomous', 2),
    ('cloud-infrastructure', 'ci-cd-pipeline-setup', 'CI/CD Pipeline Setup', 'An automated build-and-deploy pipeline for your repository.', 'A working CI/CD pipeline configured to test and deploy your application automatically on every change.', 'autonomous', 3),
    ('cloud-infrastructure', 'server-monitoring-setup', 'Server Monitoring Setup', 'Monitoring and alerting configured for your infrastructure.', 'Uptime, performance, and error monitoring set up and connected to real alerts, so issues are visible before they become outages.', 'autonomous', 4),
    ('cloud-infrastructure', 'backup-configuration', 'Backup Configuration', 'Automated backups configured for your data and infrastructure.', 'A scheduled backup system configured for your database or files. Because backup and restore touch production data directly, the configuration is reviewed before activation.', 'approval_required', 5),
    ('defensive-cybersecurity', 'security-header-configuration', 'Security Header Configuration', 'Standard security headers configured for your website.', 'HTTP security headers, including CSP and HSTS, reviewed and configured to current best practice for your site.', 'autonomous', 1),
    ('defensive-cybersecurity', 'ssl-security-configuration', 'SSL & Security Configuration', 'SSL and core security settings configured for your domain.', 'Certificate and transport security configured correctly for your domain. Because this affects live traffic to a production site, changes are reviewed before they go live.', 'approval_required', 2),
    ('defensive-cybersecurity', 'dependency-vulnerability-scanning', 'Dependency & Vulnerability Scanning', 'Your project''s dependencies scanned for known vulnerabilities.', 'An automated scan of your project''s dependencies against known vulnerability databases, with a clear report of what needs updating.', 'autonomous', 3),
    ('defensive-cybersecurity', 'configuration-security-audit', 'Configuration Security Audit', 'A review of your infrastructure and app configuration for security gaps.', 'NOVA AI reviews server, application, and access configuration against common security misconfigurations and reports what it finds.', 'autonomous', 4),
    ('defensive-cybersecurity', 'wordpress-security-hardening', 'WordPress Security Hardening', 'A WordPress site hardened against common attack vectors.', 'Plugin, permission, and configuration hardening applied to an existing WordPress site. Because this modifies a live site''s security posture, changes are reviewed before being applied.', 'approval_required', 5)
) AS v(category_slug, slug, name, short_description, description, automation_level, display_order)
JOIN public.service_categories sc ON sc.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;

-- =========================================================================
-- INITIAL AI WORKFORCE DATA (Phase 8C)
-- =========================================================================
-- A small, deliberately general-purpose roster (7 agents) and a fixed
-- capability vocabulary (16 capabilities) — not dozens of narrow agents.
-- Each agent's assigned capabilities are chosen to make the
-- safe/approval-required split concrete: Operations Agent, for example, is
-- almost entirely approval-gated, while Research/QA are almost entirely
-- autonomous.

INSERT INTO public.agent_definitions (slug, name, description, status) VALUES
    ('ai-project-manager', 'AI Project Manager', 'Receives a service request, breaks it into tasks, assigns the right agents, and tracks progress to delivery.', 'active'),
    ('research-agent', 'Research Agent', 'Performs web, market, competitor, and technical research to ground a task in real information.', 'active'),
    ('developer-agent', 'Developer Agent', 'Builds and debugs websites, frontend/backend code, and APIs.', 'active'),
    ('content-marketing-agent', 'Content & Marketing Agent', 'Produces SEO research, content drafts, marketing copy, and campaign material.', 'active'),
    ('data-analytics-agent', 'Data & Analytics Agent', 'Cleans data, runs analysis, and produces reports and dashboards.', 'active'),
    ('qa-agent', 'QA Agent', 'Validates outputs against requirements, runs tests, and checks deliverables before they ship.', 'active'),
    ('operations-agent', 'Operations Agent', 'Coordinates operational and infrastructure tasks, always respecting approval requirements for sensitive actions.', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.ai_capabilities (slug, name, description, requires_approval) VALUES
    ('research', 'Research', 'Conduct structured research on a topic.', false),
    ('read_public_web', 'Read Public Web', 'Read publicly available web content.', false),
    ('read_service_request', 'Read Service Request', 'Read the details of the service request a task belongs to.', false),
    ('write_draft', 'Write Draft', 'Produce a draft document, page, or piece of content.', false),
    ('create_task', 'Create Task', 'Create a new AI task.', false),
    ('update_task', 'Update Task', 'Update an existing AI task''s metadata.', false),
    ('generate_code', 'Generate Code', 'Write or modify source code.', false),
    ('run_tests', 'Run Tests', 'Execute automated tests against generated work.', false),
    ('create_artifact', 'Create Artifact', 'Produce a stored output artifact for a task.', false),
    ('request_approval', 'Request Approval', 'Request human approval for a sensitive action.', false),
    ('deploy', 'Deploy', 'Deploy an application to a production environment.', true),
    ('send_email', 'Send Email', 'Send an email to a customer or external party.', true),
    ('publish_content', 'Publish Content', 'Publish content externally (site, social, blog).', true),
    ('modify_production', 'Modify Production', 'Modify a live production system or its data.', true),
    ('change_dns', 'Change DNS', 'Modify DNS configuration for a domain.', true),
    ('delete_production_data', 'Delete Production Data', 'Permanently delete data from a production system.', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.agent_definition_capabilities (agent_definition_id, capability_id)
SELECT a.id, c.id FROM (VALUES
    ('ai-project-manager', 'read_service_request'), ('ai-project-manager', 'create_task'),
    ('ai-project-manager', 'update_task'), ('ai-project-manager', 'request_approval'),
    ('research-agent', 'research'), ('research-agent', 'read_public_web'),
    ('research-agent', 'write_draft'), ('research-agent', 'create_artifact'),
    ('developer-agent', 'generate_code'), ('developer-agent', 'run_tests'),
    ('developer-agent', 'create_artifact'), ('developer-agent', 'deploy'),
    ('developer-agent', 'modify_production'),
    ('content-marketing-agent', 'research'), ('content-marketing-agent', 'write_draft'),
    ('content-marketing-agent', 'create_artifact'), ('content-marketing-agent', 'publish_content'),
    ('data-analytics-agent', 'research'), ('data-analytics-agent', 'create_artifact'),
    ('data-analytics-agent', 'run_tests'),
    ('qa-agent', 'run_tests'), ('qa-agent', 'read_service_request'), ('qa-agent', 'create_artifact'),
    ('operations-agent', 'deploy'), ('operations-agent', 'change_dns'),
    ('operations-agent', 'modify_production'), ('operations-agent', 'delete_production_data'),
    ('operations-agent', 'request_approval')
) AS v(agent_slug, capability_slug)
JOIN public.agent_definitions a ON a.slug = v.agent_slug
JOIN public.ai_capabilities c ON c.slug = v.capability_slug
ON CONFLICT DO NOTHING;

-- =========================================================================
-- PHASE 8E: PRODUCTION AI WORKFLOWS + CONTROLLED AUTONOMY
-- =========================================================================
-- Extends the 8C/8D control plane with exactly what a real, complete,
-- auto-advancing workflow needs and nothing more: bounded retries (loop
-- protection), single-use approval consumption (closes the gap where 8D
-- could request approval but never actually had a way to safely execute
-- after it was granted), and one small artifacts table. No duplicate
-- agent/task/approval/audit system is introduced.

-- 51. Loop protection: every task carries its own bounded retry budget.
-- retry_ai_task() below is the only path that increments retry_count, and
-- it refuses once the budget is exhausted — this is what stops "Developer
-- fails -> retry -> fails -> retry -> ..." from ever becoming unbounded.
ALTER TABLE public.ai_tasks ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.ai_tasks ADD COLUMN max_retries integer NOT NULL DEFAULT 3;

-- 52. Approval consumption: a granted approval must be usable exactly once.
-- Without this, decide_ai_approval() flipping a task back to 'running' gave
-- no safe way to actually perform the sensitive action — re-asking
-- authorizeToolUse() would (correctly, per Phase 8D's own test) just create
-- ANOTHER pending approval, forever. consume_ai_approval() is the missing
-- single-use gate: exactly one execution per granted approval, blocking
-- replay.
ALTER TABLE public.ai_approvals ADD COLUMN consumed_at timestamp with time zone;

-- 53. AI Artifacts Table — re-evaluated against the Phase 8D decision to
-- reuse ai_tasks.output for a single-task, single-consumer result. That no
-- longer holds once a workflow has MULTIPLE tasks producing deliverables
-- that OTHER tasks and the service request as a whole need to reference by
-- type (a QA task inspecting the Developer task's actual output; an admin
-- wanting "every file this request produced" without knowing which task
-- made which). ai_tasks.output stays as each run's own result; ai_artifacts
-- is the addressable, typed, service-request-scoped record of what was
-- produced. Content is jsonb only (no storage bucket) — every artifact type
-- in this phase (research reports, generated website source, QA reports,
-- deployment records) is text/JSON-representable; a storage_path column can
-- be added later if a binary artifact type is ever needed.
CREATE TABLE public.ai_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    ai_task_id uuid NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
    created_by_agent_id uuid REFERENCES public.agent_definitions(id) ON DELETE RESTRICT,
    type text NOT NULL CHECK (type IN ('research_report', 'website_source', 'qa_report', 'content_draft', 'deployment_record')),
    title text NOT NULL,
    content jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_ai_artifacts_service_request_id ON public.ai_artifacts(service_request_id);
CREATE INDEX idx_ai_artifacts_ai_task_id ON public.ai_artifacts(ai_task_id);

ALTER TABLE public.ai_artifacts ENABLE ROW LEVEL SECURITY;

-- Same owner-or-admin shape as ai_tasks/agent_runs/ai_approvals. No direct
-- UPDATE/DELETE — artifacts are immutable once created.
CREATE POLICY "Task owners and admin can read AI artifacts" ON public.ai_artifacts
    FOR SELECT TO authenticated
    USING (
        public.is_current_user_admin()
        OR EXISTS (
            SELECT 1 FROM public.service_requests sr
            WHERE sr.id = ai_artifacts.service_request_id
              AND (sr.requester_id = auth.uid() OR (sr.company_id IS NOT NULL AND public.is_company_member(sr.company_id)))
        )
    );

CREATE POLICY "Admins can create AI artifacts" ON public.ai_artifacts
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

GRANT SELECT, INSERT ON public.ai_artifacts TO authenticated;

-- 54. Transactional Function: Retry AI Task. failed -> assigned, bounded by
-- max_retries. Keeps failure recovery inside the same state machine every
-- other transition uses — there is no separate "requeue" concept.
CREATE OR REPLACE FUNCTION public.retry_ai_task(
    task_id uuid
)
RETURNS boolean AS $$
DECLARE
    task_record public.ai_tasks%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO task_record FROM public.ai_tasks WHERE id = task_id FOR UPDATE;
    IF task_record.id IS NULL THEN
        RAISE EXCEPTION 'Task not found.';
    END IF;
    IF task_record.status != 'failed' THEN
        RAISE EXCEPTION 'Invalid State: Only a failed task can be retried.';
    END IF;
    IF task_record.retry_count >= task_record.max_retries THEN
        RAISE EXCEPTION 'Invalid State: This task has reached its retry limit.';
    END IF;
    IF task_record.agent_definition_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.agent_definitions a WHERE a.id = task_record.agent_definition_id AND a.status = 'active') THEN
        RAISE EXCEPTION 'Invalid State: Task has no active agent to retry with.';
    END IF;

    UPDATE public.ai_tasks
    SET status = 'assigned', retry_count = retry_count + 1, error = NULL, completed_at = NULL
    WHERE id = task_id;

    PERFORM public.write_audit_log('ai_task_retried', 'ai_task', task_id, jsonb_build_object('retry_count', task_record.retry_count + 1));

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.retry_ai_task(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retry_ai_task(uuid) TO authenticated;

-- 55. Transactional Function: Consume AI Approval. The ONLY path that can
-- ever mark a granted approval as used. authorizeToolUse() calls this
-- immediately before treating an approval-required tool as authorized —
-- exactly once per approval, ever. A second attempt to consume the same
-- approval (replay) fails here, not by convention.
CREATE OR REPLACE FUNCTION public.consume_ai_approval(
    approval_id uuid
)
RETURNS boolean AS $$
DECLARE
    approval_record public.ai_approvals%ROWTYPE;
BEGIN
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
    END IF;

    SELECT * INTO approval_record FROM public.ai_approvals WHERE id = approval_id FOR UPDATE;
    IF approval_record.id IS NULL THEN
        RAISE EXCEPTION 'Approval not found.';
    END IF;
    IF approval_record.status != 'approved' THEN
        RAISE EXCEPTION 'Invalid State: Only an approved approval can be consumed.';
    END IF;
    IF approval_record.consumed_at IS NOT NULL THEN
        RAISE EXCEPTION 'Invalid State: This approval has already been used.';
    END IF;

    UPDATE public.ai_approvals SET consumed_at = timezone('utc'::text, now()) WHERE id = approval_id;

    PERFORM public.write_audit_log('approval_consumed', 'ai_task', approval_record.ai_task_id, jsonb_build_object('approval_id', approval_id));

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.consume_ai_approval(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_approval(uuid) TO authenticated;

-- =========================================================================
-- PHASE 9: FUNCTIONAL PRODUCT COMPLETION
-- =========================================================================

-- 56. Public internship discovery. The existing "Anyone can read open
-- internships OR admin can read all" policy is TO authenticated only — an
-- anonymous visitor genuinely has no way to read internships at all today,
-- despite the policy's name. This adds the missing anon-scoped policy
-- alongside (never replacing) the existing one, the same two-policy-per-role
-- split already used for programs/courses/services: an anon policy that
-- never calls is_current_user_admin() (anon has no EXECUTE grant on it),
-- Postgres ORs the two together for whichever role actually applies.
CREATE POLICY "Anonymous can read open internships" ON public.internships
    FOR SELECT TO anon
    USING (status = 'open');

GRANT SELECT ON public.internships TO anon;

-- 57. Contact Submissions Table — the minimal persistent backing /contact
-- genuinely needs to be a real (not fake) form: anon can only ever INSERT,
-- never read back its own or anyone else's submission; only an admin can
-- read/triage them. No email delivery is implemented here (no email
-- provider exists in this codebase) — a submission is durably recorded for
-- an admin to act on, which is honest about what's actually implemented.
CREATE TABLE public.contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    company text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message" ON public.contact_submissions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" ON public.contact_submissions
    FOR SELECT TO authenticated
    USING (public.is_current_user_admin());

CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- INSERT-only for anon (and authenticated non-admins by the same policy) —
-- no SELECT/UPDATE/DELETE grant at all for either, so even a crafted
-- request can never read back submissions; only the grant below (scoped to
-- authenticated, gated further by the admin-only policies above) allows
-- reading/triaging.
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_submissions TO authenticated;

-- =========================================================================
-- PHASE 10A: CONTENT DEPTH FOUNDATION
-- =========================================================================
-- Additive structured-depth columns for programs/courses/services, plus a
-- full backfill of every existing row. No new tables: every field here is
-- a plain column on an existing table, matching "prefer the smallest
-- schema" — a related_services/related_courses/related_programs join table
-- was deliberately NOT added; category already provides a natural
-- same-category relation at read time, and no product behavior yet
-- requires a persisted, manually-curated relationship beyond that.
--
-- courses.short_description was deliberately NOT added as a new column:
-- the existing `description` column is already a single, short, specific
-- sentence (see the Phase 7 seed data below) — it already serves that
-- role. Adding a second short-form column would just duplicate it, which
-- the same "smallest schema" principle argues against. `overview` below
-- is the genuinely new, longer-form field.

ALTER TABLE public.programs ADD COLUMN overview text NOT NULL DEFAULT '';
ALTER TABLE public.programs ADD COLUMN prerequisites text NOT NULL DEFAULT '';

ALTER TABLE public.courses ADD COLUMN overview text NOT NULL DEFAULT '';
ALTER TABLE public.courses ADD COLUMN prerequisites text NOT NULL DEFAULT '';
ALTER TABLE public.courses ADD COLUMN learning_outcomes text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.services ADD COLUMN capabilities text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN deliverables text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN technologies text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN process text[] NOT NULL DEFAULT '{}';
-- "industries" describes plausible category fit (what kind of
-- organization this service suits), never past clients or served
-- industries — NOVA has no verified client history to report (see the
-- Phase 10 audit's Category C list). Named `suited_industries` rather
-- than `industries` specifically to keep that distinction visible in the
-- schema itself, not just in a comment.
ALTER TABLE public.services ADD COLUMN suited_industries text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN faqs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- -------------------------------------------------------------------
-- Programs: overview + prerequisites (7 rows)
-- -------------------------------------------------------------------
UPDATE public.programs p SET overview = v.overview, prerequisites = v.prerequisites
FROM (VALUES
    ('ai-machine-learning',
     'Structured in four stages: Python and math foundations, classical machine learning with scikit-learn, deep learning with TensorFlow and PyTorch, and generative AI/LLMs, closing with a self-directed capstone applying the full pipeline to a real dataset.',
     'Comfort with basic programming logic. No prior machine learning or advanced math background required — the program builds both from the ground up.'),
    ('data-analytics-data-science',
     'Progresses from SQL and Python data handling through statistics and Power BI/Tableau visualization into applied machine learning for analysts, ending with an end-to-end capstone analysis project.',
     'Basic spreadsheet or data familiarity is helpful but not required. No prior SQL, Python, or statistics background needed.'),
    ('software-development',
     'Takes a developer from core JavaScript/TypeScript programming and Git workflow through frontend development with React and backend development with Node.js, into system design and a full-stack capstone built and shipped end-to-end.',
     'No prior programming experience required. Basic comfort using a computer is helpful.'),
    ('cybersecurity',
     'Builds from networking and Linux fundamentals through ethical hacking methodology and application/cloud security into security operations and incident response.',
     'Basic familiarity with how computers and networks operate is helpful. No prior security experience required.'),
    ('cloud-devops',
     'Covers core cloud concepts on AWS, Linux and shell scripting, containerization with Docker and Kubernetes, and CI/CD with Terraform-based infrastructure as code, closing with a capstone deploying a real application to production infrastructure.',
     'Basic command-line comfort is helpful. No prior cloud or DevOps experience required.'),
    ('ui-ux-product-design',
     'Moves from design thinking and user research through visual UI design in Figma into design systems and prototyping, closing with a full product design capstone from research to a testable prototype.',
     'No prior design experience or design-tool knowledge required.'),
    ('emerging-technologies',
     'A survey-and-build path across blockchain/Web3 fundamentals, IoT and embedded systems, and AR/VR spatial computing, closing with a self-directed applied project combining one or more of these areas.',
     'Basic programming familiarity is helpful. No prior experience with blockchain, IoT, or AR/VR required.')
) AS v(slug, overview, prerequisites)
WHERE p.slug = v.slug;

-- -------------------------------------------------------------------
-- Courses: overview + prerequisites + learning_outcomes (38 rows)
-- -------------------------------------------------------------------
UPDATE public.courses c SET overview = v.overview, prerequisites = v.prerequisites, learning_outcomes = v.learning_outcomes
FROM (VALUES
    ('ai-machine-learning', 'python-for-ai-data',
     'Covers Python syntax, control flow, and functions, then applies them through NumPy arrays and Pandas DataFrames for the data manipulation used throughout the rest of the program.',
     'None — this is the entry point to the program.',
     ARRAY['Write and debug Python programs using core language constructs', 'Manipulate arrays and numerical data with NumPy', 'Load, clean, and transform tabular data with Pandas']),
    ('ai-machine-learning', 'math-foundations-ml',
     'Covers the linear algebra, calculus, and probability/statistics concepts that make machine learning algorithms interpretable rather than a black box.',
     'Python for AI & Data, or equivalent basic Python proficiency.',
     ARRAY['Perform vector and matrix operations relevant to ML models', 'Explain gradient descent using derivatives', 'Apply core probability and statistics concepts to model behavior']),
    ('ai-machine-learning', 'ml-fundamentals',
     'Covers supervised learning (regression, classification) and unsupervised learning (clustering) using scikit-learn, including model evaluation and common pitfalls like overfitting.',
     'Mathematical Foundations for ML.',
     ARRAY['Train and evaluate regression and classification models with scikit-learn', 'Apply clustering algorithms to unlabeled data', 'Diagnose overfitting and apply cross-validation']),
    ('ai-machine-learning', 'deep-learning-neural-networks',
     'Covers neural network architecture and backpropagation, building and training models with both TensorFlow and PyTorch.',
     'Machine Learning Fundamentals.',
     ARRAY['Build and train a neural network from scratch', 'Implement models using TensorFlow and PyTorch', 'Tune hyperparameters to improve model performance']),
    ('ai-machine-learning', 'generative-ai-llms',
     'Covers transformer architecture at a conceptual level, prompt engineering, and building applications on top of large language models via API.',
     'Deep Learning with Neural Networks.',
     ARRAY['Explain how large language models generate text', 'Design effective prompts for LLM-based applications', 'Build a working application that integrates an LLM API']),
    ('ai-machine-learning', 'ai-systems-capstone',
     'A self-directed project where the student selects a real dataset or problem and applies the full ML pipeline: data preparation, model training, evaluation, and a working demo.',
     'All prior courses in the AI & Machine Learning program.',
     ARRAY['Scope and plan an end-to-end ML project', 'Apply the full ML pipeline to a self-selected dataset', 'Present and defend model results and limitations']),

    ('data-analytics-data-science', 'sql-for-data-analysis',
     'Covers SELECT queries, joins, aggregations, and window functions used to answer real business questions directly against relational data.',
     'None — this is the entry point to the program.',
     ARRAY['Write SQL queries using joins and aggregations', 'Use window functions for ranking and running calculations', 'Translate a business question into a SQL query']),
    ('data-analytics-data-science', 'python-for-data-analysis',
     'Covers Python fundamentals and Pandas for cleaning, transforming, and exploring datasets that arrive messy or incomplete.',
     'SQL for Data Analysis, or equivalent basic SQL proficiency.',
     ARRAY['Clean and transform datasets with Pandas', 'Handle missing and inconsistent data', 'Perform exploratory data analysis in Python']),
    ('data-analytics-data-science', 'statistics-for-data-science',
     'Covers descriptive statistics, hypothesis testing, and confidence intervals — the reasoning that separates a defensible conclusion from a guess.',
     'Python for Data Analysis.',
     ARRAY['Apply descriptive statistics to summarize a dataset', 'Run and interpret hypothesis tests', 'Communicate statistical uncertainty using confidence intervals']),
    ('data-analytics-data-science', 'data-viz-powerbi-tableau',
     'Covers building interactive dashboards and visuals in both Power BI and Tableau, focused on communicating findings clearly to a non-technical audience.',
     'Statistics for Data Science.',
     ARRAY['Build interactive dashboards in Power BI', 'Build interactive dashboards in Tableau', 'Choose the right visualization for a given dataset and audience']),
    ('data-analytics-data-science', 'applied-ml-for-analysts',
     'Covers practical predictive modeling techniques aimed at analysts who need to add prediction to existing reporting, not become full-time data scientists.',
     'Data Visualization with Power BI & Tableau.',
     ARRAY['Build a basic predictive model using scikit-learn', 'Evaluate model accuracy in business terms', 'Decide when a predictive model is (and isn''t) the right tool']),
    ('data-analytics-data-science', 'data-science-capstone',
     'An end-to-end analysis project: pulling raw data with SQL, cleaning and analyzing it in Python, and delivering a decision-ready report.',
     'All prior courses in the Data Analytics & Data Science program.',
     ARRAY['Scope a real analysis question end-to-end', 'Combine SQL, Python, and visualization in one project', 'Deliver a decision-ready report to a non-technical stakeholder']),

    ('software-development', 'programming-foundations-js',
     'Covers variables, control flow, functions, and objects in JavaScript, plus the HTML/CSS needed to build a real web page.',
     'None — this is the entry point to the program.',
     ARRAY['Write JavaScript programs using core language constructs', 'Structure a web page with semantic HTML and CSS', 'Debug JavaScript code using browser developer tools']),
    ('software-development', 'git-github-workflow',
     'Covers commits, branches, merges, and pull requests — the collaborative development workflow used on every real engineering team.',
     'Programming Foundations with JavaScript.',
     ARRAY['Use Git for version control on a real project', 'Collaborate through branches and pull requests on GitHub', 'Resolve merge conflicts']),
    ('software-development', 'frontend-react',
     'Covers components, state, props, and hooks in React, using TypeScript for type safety, to build interactive user interfaces.',
     'Git, GitHub & Developer Workflow.',
     ARRAY['Build interactive UIs with React components and hooks', 'Manage application state effectively', 'Write type-safe React code with TypeScript']),
    ('software-development', 'backend-nodejs',
     'Covers building REST APIs with Node.js, connecting to a SQL database, and handling authentication and error cases.',
     'Frontend Development with React.',
     ARRAY['Build a REST API with Node.js', 'Connect an API to a SQL database', 'Implement basic authentication and error handling']),
    ('software-development', 'system-design-fundamentals',
     'Covers reasoning about scale, reliability, and architecture trade-offs — how to design a system that survives real load and failure, not just a demo.',
     'Backend Development with Node.js.',
     ARRAY['Reason about scalability and reliability trade-offs', 'Design a basic system architecture diagram', 'Identify single points of failure in a system design']),
    ('software-development', 'fullstack-capstone',
     'A self-directed project designing and building a complete full-stack application from scratch, applying frontend, backend, and system design skills together.',
     'All prior courses in the Software Development program.',
     ARRAY['Design and build a complete full-stack application', 'Integrate a React frontend with a Node.js backend', 'Apply system design principles to a real project']),

    ('cybersecurity', 'cybersecurity-foundations-course',
     'Covers core security principles: the CIA triad, common threat types, vulnerabilities, and the defense-in-depth mindset that shapes every later course.',
     'None — this is the entry point to the program.',
     ARRAY['Explain core security principles including the CIA triad', 'Identify common threat and vulnerability types', 'Apply a defense-in-depth mindset to a basic system']),
    ('cybersecurity', 'networking-linux-essentials',
     'Covers the networking fundamentals (TCP/IP, DNS, routing) and Linux command-line skills that every later security topic assumes.',
     'Cybersecurity Fundamentals.',
     ARRAY['Explain core networking concepts (TCP/IP, DNS, routing)', 'Navigate and administer a Linux system from the command line', 'Use Linux tools to inspect network activity']),
    ('cybersecurity', 'ethical-hacking-pentest',
     'Covers offensive security methodology used to find and responsibly report vulnerabilities, following a structured reconnaissance-to-reporting process.',
     'Networking & Linux Essentials.',
     ARRAY['Follow a structured penetration testing methodology', 'Identify common web and network vulnerabilities', 'Write a professional, responsible vulnerability report']),
    ('cybersecurity', 'app-cloud-security',
     'Covers securing modern applications and cloud infrastructure against common misconfiguration and attack paths.',
     'Ethical Hacking & Penetration Testing.',
     ARRAY['Identify common application security vulnerabilities', 'Apply secure coding and configuration practices', 'Recognize common cloud security misconfigurations']),
    ('cybersecurity', 'security-ops-incident-response',
     'Covers monitoring for and detecting security incidents, and the structured response process used to contain and recover from a real incident.',
     'Application & Cloud Security.',
     ARRAY['Monitor systems for signs of a security incident', 'Follow a structured incident response process', 'Document and communicate an incident post-mortem']),

    ('cloud-devops', 'cloud-computing-fundamentals',
     'Covers core cloud concepts — compute, storage, networking — using AWS as the primary reference platform.',
     'None — this is the entry point to the program.',
     ARRAY['Explain core cloud computing concepts', 'Provision basic compute and storage resources on AWS', 'Navigate the AWS console and CLI']),
    ('cloud-devops', 'linux-shell-scripting',
     'Covers the Linux command line and shell scripting skills behind every DevOps workflow, from file management to automating repetitive tasks.',
     'Cloud Computing Fundamentals.',
     ARRAY['Navigate and administer a Linux system from the command line', 'Write shell scripts to automate repetitive tasks', 'Manage processes and permissions on Linux']),
    ('cloud-devops', 'containers-docker-kubernetes',
     'Covers packaging applications into Docker containers and orchestrating them at scale with Kubernetes.',
     'Linux & Shell Scripting.',
     ARRAY['Package an application as a Docker container', 'Deploy and manage containers with Kubernetes', 'Debug a failing containerized application']),
    ('cloud-devops', 'cicd-infra-as-code',
     'Covers automating build-and-deploy pipelines and provisioning infrastructure as code with Terraform, rather than manual server configuration.',
     'Containers with Docker & Kubernetes.',
     ARRAY['Build a CI/CD pipeline that tests and deploys automatically', 'Provision infrastructure using Terraform', 'Apply infrastructure-as-code principles to a real project']),
    ('cloud-devops', 'cloud-devops-capstone',
     'A capstone project deploying and operating a real application on cloud infrastructure end-to-end, from container build through CI/CD to a live environment.',
     'All prior courses in the Cloud & DevOps program.',
     ARRAY['Deploy a real application to cloud infrastructure', 'Operate a CI/CD pipeline for continuous delivery', 'Apply infrastructure-as-code and container orchestration together']),

    ('ui-ux-product-design', 'design-fundamentals-thinking',
     'Covers core design principles and the design-thinking process for framing a real user problem before jumping to a solution.',
     'None — this is the entry point to the program.',
     ARRAY['Apply core visual design principles', 'Follow a design-thinking process to frame a problem', 'Critique a design against usability heuristics']),
    ('ui-ux-product-design', 'ux-research-methods',
     'Covers techniques for understanding real user needs — interviews, surveys, and usability testing — before designing a solution.',
     'Design Fundamentals & Design Thinking.',
     ARRAY['Plan and conduct a user interview', 'Synthesize research findings into actionable insights', 'Run a basic usability test']),
    ('ui-ux-product-design', 'ui-design-figma',
     'Covers visual interface design and hands-on Figma craft: layout, typography, color, and component-based design.',
     'UX Research Methods.',
     ARRAY['Design a high-fidelity interface in Figma', 'Apply typography, color, and layout principles', 'Build reusable Figma components']),
    ('ui-ux-product-design', 'design-systems-prototyping',
     'Covers building reusable design systems and interactive prototypes that communicate real product behavior, not just static screens.',
     'UI Design with Figma.',
     ARRAY['Build a small, reusable design system', 'Create an interactive prototype in Figma', 'Document design system components for handoff to developers']),
    ('ui-ux-product-design', 'product-design-capstone',
     'A capstone project taking a real product problem from user research through a polished, testable high-fidelity prototype.',
     'All prior courses in the UI/UX & Product Design program.',
     ARRAY['Take a product problem from research to prototype', 'Apply UX research findings to design decisions', 'Present and defend design decisions to stakeholders']),

    ('emerging-technologies', 'intro-emerging-tech',
     'An orientation to blockchain, IoT, and AR/VR — what each technology actually does and where it''s genuinely being applied today.',
     'None — this is the entry point to the program.',
     ARRAY['Explain the core concepts behind blockchain, IoT, and AR/VR', 'Identify realistic current applications of each technology', 'Choose which area to specialize in for the rest of the program']),
    ('emerging-technologies', 'blockchain-web3-fundamentals',
     'Covers how blockchain systems work — consensus, transactions, smart contracts — and the basics of building on them.',
     'Introduction to Emerging Tech Landscape.',
     ARRAY['Explain how blockchain consensus and transactions work', 'Write and deploy a basic smart contract', 'Identify common blockchain use cases and limitations']),
    ('emerging-technologies', 'iot-embedded-systems',
     'Covers connecting physical devices and sensors into working IoT systems, from hardware basics to sending sensor data to the cloud.',
     'Introduction to Emerging Tech Landscape.',
     ARRAY['Connect a sensor to a microcontroller and read data', 'Send device data to a cloud endpoint', 'Design a basic IoT system architecture']),
    ('emerging-technologies', 'ar-vr-spatial-computing',
     'Covers the fundamentals of building augmented and virtual reality experiences, including spatial interaction design.',
     'Introduction to Emerging Tech Landscape.',
     ARRAY['Build a basic AR or VR experience', 'Apply spatial interaction design principles', 'Identify hardware and platform constraints for AR/VR projects']),
    ('emerging-technologies', 'emerging-tech-applied-project',
     'A self-directed project combining blockchain, IoT, or AR/VR into a working demo that reflects the student''s chosen specialization.',
     'At least one of Blockchain & Web3 Fundamentals, IoT & Embedded Systems, or AR/VR & Spatial Computing.',
     ARRAY['Scope and plan an applied project in a chosen emerging-tech area', 'Build a working demo of the chosen technology', 'Present the project and its real-world relevance'])
) AS v(program_slug, course_slug, overview, prerequisites, learning_outcomes)
JOIN public.programs p ON p.slug = v.program_slug
WHERE c.program_id = p.id AND c.slug = v.course_slug;

-- -------------------------------------------------------------------
-- Services: capabilities, deliverables, technologies, process,
-- suited_industries, faqs (40 rows)
--
-- "process" describes NOVA's real, already-built AI Engine pipeline
-- (research/requirements -> AI-driven build or drafting -> automated QA
-- -> a human approval step ONLY when automation_level is
-- approval_required -> delivery). It varies by category (build/design
-- work vs. content/marketing drafting vs. infrastructure/ops
-- configuration vs. research/analysis) because that is what the engine
-- actually does differently for each, not as decorative variation.
--
-- "suited_industries" intentionally describes forward-looking category
-- fit ("suited for", "typical fit"), never claimed past clients or
-- served industries — NOVA has no verified client history to report.
--
-- Every approval_required service's faqs includes the same
-- automation_level-derived question ("Does a human review this before it
-- goes live?"), answered honestly from the real approval-gated
-- architecture, paired with one genuinely service-specific question.
-- -------------------------------------------------------------------
UPDATE public.services s SET
    capabilities = v.capabilities,
    deliverables = v.deliverables,
    technologies = v.technologies,
    process = v.process,
    suited_industries = v.suited_industries,
    faqs = v.faqs
FROM (VALUES
    ('ai-website-creation',
     ARRAY['Site structure and information architecture', 'On-brand copywriting for every page', 'Responsive visual design and layout'],
     ARRAY['A complete, deployed-ready website', 'All page copy and content', 'A short walkthrough of the site structure'],
     ARRAY['Next.js', 'Tailwind CSS', 'Responsive design'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Small businesses and startups launching a first website', 'Service businesses needing an online presence', 'Product teams needing a fast marketing site'],
     '[{"question":"Do I need to provide design assets to get started?","answer":"No, a project brief describing your business, goals, and audience is enough. NOVA AI produces the copy and visual design together."},{"question":"Can I request changes after the site is generated?","answer":"Yes. You review the finished site before anything is considered final, and can request specific revisions."}]'::jsonb),
    ('landing-page-creation',
     ARRAY['Conversion-focused page structure', 'Persuasive, goal-specific copywriting', 'Responsive layout and visual design'],
     ARRAY['One complete, publish-ready landing page', 'Page copy aligned to your stated goal', 'Mobile and desktop layouts'],
     ARRAY['Next.js', 'Tailwind CSS', 'Responsive design'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Product launches needing a dedicated signup page', 'Campaigns driving traffic to one conversion goal', 'Event or offer promotions'],
     '[{"question":"What counts as one landing page?","answer":"A single page built around one primary goal, such as signups, purchases, or bookings."},{"question":"Can the page connect to my existing signup form or email tool?","answer":"Yes, provided you share the integration details in your brief."}]'::jsonb),
    ('website-redesign',
     ARRAY['Modernized visual design applied to an existing structure', 'Content and SEO equity preservation', 'Responsive layout rebuild'],
     ARRAY['A redesigned version of your existing site', 'A before/after comparison for review', 'Preserved page content and URLs'],
     ARRAY['Next.js', 'Tailwind CSS', 'Responsive design'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Human review & approval', 'Delivery'],
     ARRAY['Established businesses with an outdated site', 'Sites needing a visual refresh without losing SEO ranking', 'Brands updating their visual identity'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because a redesign replaces something already live, the finished result is reviewed against your brand before deployment."},{"question":"Will my existing SEO rankings be affected?","answer":"The redesign is built specifically to preserve your existing content and SEO equity, not replace it."}]'::jsonb),
    ('website-content-generation',
     ARRAY['On-brand copywriting from existing source material', 'Product and service description writing', 'Page-by-page content structuring'],
     ARRAY['Finished page copy for the pages you specify', 'Product or service descriptions', 'Content matched to your existing brand voice'],
     ARRAY['Content generation', 'Brand voice matching'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Businesses with existing brochures or docs but no web copy', 'Product catalogs needing consistent descriptions', 'Sites undergoing a content refresh'],
     '[{"question":"What source material do you need from me?","answer":"Existing brochures, docs, notes, or even rough bullet points, anything that captures what you would otherwise have to write from scratch."},{"question":"Will the copy match my existing brand voice?","answer":"Yes. Matching your existing voice, rather than generating generic copy, is the core of this service."}]'::jsonb),
    ('website-seo-optimization',
     ARRAY['Technical SEO auditing', 'On-page metadata and structure improvements', 'Direct implementation of fixes, not just a report'],
     ARRAY['SEO improvements applied directly to your site', 'A summary of what was changed and why', 'Updated metadata and page structure'],
     ARRAY['Technical SEO', 'Metadata optimization'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Existing sites with declining or stagnant search visibility', 'Sites that have never had a technical SEO pass', 'Content-heavy sites competing for organic traffic'],
     '[{"question":"Do you just give me a report, or actually fix things?","answer":"NOVA AI applies the improvements directly to your site rather than only producing an audit report."},{"question":"Will this guarantee a ranking increase?","answer":"No legitimate service can guarantee rankings. This service fixes real technical and on-page issues that commonly hold sites back."}]'::jsonb),

    ('ai-chatbot-development',
     ARRAY['Conversational flow design', 'Training on your own content and FAQs', 'Website and product embed integration'],
     ARRAY['A trained, deployable chatbot', 'Integration instructions for your site or app', 'A summary of what the bot can and cannot answer'],
     ARRAY['LLM-based conversational AI', 'Retrieval-grounded responses'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Support-heavy websites with repetitive FAQs', 'Product sites wanting an interactive assistant', 'Teams wanting to deflect common questions from a human queue'],
     '[{"question":"What does the chatbot get trained on?","answer":"Your own content and FAQs, so its answers are grounded in your real material rather than generic responses."},{"question":"Can it be embedded in an existing website?","answer":"Yes. Integration instructions are included as part of delivery."}]'::jsonb),
    ('ai-customer-support-agents',
     ARRAY['Multi-channel support conversation handling', 'Ticket resolution for common request types', 'Training on real support history and policies'],
     ARRAY['A deployed support agent for your channels', 'A review period before unsupervised operation begins', 'A summary of ticket types it can resolve'],
     ARRAY['LLM-based conversational AI', 'Support ticket integration'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Human review & approval', 'Delivery'],
     ARRAY['Businesses with high support ticket volume', 'Teams wanting to triage or resolve common tickets automatically', 'Products with well-documented support policies'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because this agent interacts with real customers, its initial responses are reviewed before it operates unsupervised."},{"question":"What happens with requests it cannot handle?","answer":"Requests outside its trained scope are escalated rather than guessed at; the exact escalation path is defined in your brief."}]'::jsonb),
    ('workflow-automation',
     ARRAY['Multi-step workflow design', 'Data syncing and notification automation', 'End-to-end testing of the automated workflow'],
     ARRAY['A working, deployed n8n workflow', 'Documentation of each automated step', 'Test results confirming the workflow runs reliably'],
     ARRAY['n8n', 'Workflow automation'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Teams with repetitive manual, multi-step processes', 'Operations relying on manual data syncing between tools', 'Approval or notification chains handled manually today'],
     '[{"question":"What tools can this connect to?","answer":"n8n supports a wide range of integrations; share the tools involved in your process and NOVA AI will confirm compatibility."},{"question":"What happens if a step in the workflow fails?","answer":"The workflow is tested end-to-end before delivery, and failure handling for each step is built in rather than assumed."}]'::jsonb),
    ('ai-document-processing',
     ARRAY['Automated data extraction from documents', 'Structuring unstructured content into usable data', 'Handling common document formats like invoices and forms'],
     ARRAY['Structured, usable data extracted from your documents', 'A defined output format such as spreadsheet, database, or API', 'A summary of extraction accuracy on your sample set'],
     ARRAY['Document extraction', 'Structured data output'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Teams manually re-typing data from invoices or forms', 'Operations processing high volumes of similar documents', 'Businesses digitizing paper-based records'],
     '[{"question":"What document formats are supported?","answer":"Common formats like PDFs, scanned forms, and invoices; share a sample set and NOVA AI will confirm fit before starting."},{"question":"How accurate is the extraction?","answer":"Accuracy is validated against your own sample documents as part of delivery, not just claimed generically."}]'::jsonb),
    ('ai-knowledge-base-rag',
     ARRAY['Retrieval-augmented generation over your own content', 'Indexing internal docs, wikis, or product content', 'Question-answering grounded in your real material'],
     ARRAY['A searchable AI assistant trained on your docs', 'An indexed, queryable knowledge base', 'Integration instructions for your team or product'],
     ARRAY['Retrieval-augmented generation (RAG)', 'Vector search'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Teams with large, hard-to-search internal documentation', 'Support teams needing accurate, grounded answers', 'Products wanting an in-app help assistant'],
     '[{"question":"Does it answer from general internet knowledge?","answer":"No. Answers are grounded in your own indexed documentation, not generic web knowledge."},{"question":"How current does my documentation need to be?","answer":"The system is only as current as the documents it is given; outdated source docs will produce outdated answers."}]'::jsonb),

    ('seo-audit-strategy',
     ARRAY['Technical SEO review', 'Content and structure analysis', 'Prioritized action planning'],
     ARRAY['A full technical and content SEO audit', 'A prioritized action plan', 'Specific, actionable recommendations'],
     ARRAY['Technical SEO', 'Content analysis'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Sites planning an SEO investment but unsure where to start', 'Businesses with declining organic traffic', 'Teams needing a prioritized roadmap, not just raw data'],
     '[{"question":"Is this just a generic checklist?","answer":"No. The audit is run against your actual site structure, content, and technical setup, not a generic template."},{"question":"Do you also apply the fixes?","answer":"This service delivers the audit and plan; Website SEO Optimization applies the fixes directly if you want that done as well."}]'::jsonb),
    ('keyword-competitor-research',
     ARRAY['Real keyword search volume and intent research', 'Competitor ranking analysis', 'Structured reference document delivery'],
     ARRAY['A structured keyword research document', 'Competitor ranking comparisons', 'Prioritized keyword targets'],
     ARRAY['Keyword research', 'Competitor analysis'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Teams planning a content strategy from scratch', 'Businesses entering a new market or niche', 'Marketing teams needing real data instead of guesswork'],
     '[{"question":"Is this raw data or something I can actually use?","answer":"It is delivered as a usable reference document, not a raw data dump."},{"question":"How many competitors can be included?","answer":"Share your key competitors in your brief; the research is scoped to the ones that matter to you."}]'::jsonb),
    ('blog-article-generation',
     ARRAY['SEO-aware article writing', 'Topic and keyword research grounding', 'On-brand tone matching'],
     ARRAY['Complete, publish-ready articles', 'Target keyword integration', 'Content matched to your brand voice'],
     ARRAY['Content generation', 'SEO writing'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Businesses maintaining a content or blog calendar', 'Sites building organic search authority', 'Teams without in-house writing capacity'],
     '[{"question":"How many articles come with this service?","answer":"Scope, meaning article count and length, is defined per your brief; share your content calendar needs."},{"question":"Do the articles need editing before I publish them?","answer":"They are ready for publishing or light editorial review, whichever your team prefers."}]'::jsonb),
    ('social-media-content-generation',
     ARRAY['Multi-platform post copywriting', 'Content calendar-aligned batch generation', 'Brand voice and posting cadence matching'],
     ARRAY['A batch of ready-to-post social content', 'Captions and post copy across platforms', 'Content aligned to your posting cadence'],
     ARRAY['Content generation', 'Multi-platform copywriting'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Businesses maintaining an active social presence', 'Teams needing a content batch ahead of a campaign', 'Brands wanting consistent voice across platforms'],
     '[{"question":"Which platforms are supported?","answer":"Copy is generated to match the format norms of the platforms you specify in your brief."},{"question":"Can this include visuals as well as captions?","answer":"This service covers post copy; Social Media Graphics covers the accompanying visual assets."}]'::jsonb),
    ('email-campaign-automation',
     ARRAY['Full email sequence drafting', 'Campaign scheduling setup', 'Audience-aligned messaging'],
     ARRAY['A written, sequenced email campaign', 'A scheduled send plan', 'A review step before the campaign sends'],
     ARRAY['Email campaign drafting', 'Sequencing and scheduling'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Human review & approval', 'Delivery'],
     ARRAY['Businesses running lifecycle or promotional email campaigns', 'Product launches needing a coordinated email sequence', 'Teams wanting drafted copy without writing it themselves'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because sending reaches real recipients, the final campaign is reviewed before it goes out."},{"question":"Which email platforms are supported?","answer":"Share your email platform in the brief; the campaign is drafted and sequenced to fit it."}]'::jsonb),

    ('ui-ux-wireframes',
     ARRAY['User flow mapping', 'Low-to-mid fidelity layout design', 'Feature-requirement-driven structuring'],
     ARRAY['A complete set of wireframes', 'Mapped user flows', 'Structure ready for visual design handoff'],
     ARRAY['Wireframing', 'UX flow design'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Product teams starting a new feature or product', 'Teams needing structure before visual design begins', 'Early-stage product planning'],
     '[{"question":"What fidelity are the wireframes?","answer":"Low-to-mid fidelity, focused on layout and flow rather than final visual styling."},{"question":"Can these be handed directly to a designer?","answer":"Yes. They are built specifically to be a starting point for visual design work."}]'::jsonb),
    ('figma-design-generation',
     ARRAY['Component-based Figma design', 'Layout and visual design from a brief or wireframe', 'Editable, handoff-ready file structure'],
     ARRAY['A working Figma file', 'Real, reusable components', 'A structure ready for developer handoff'],
     ARRAY['Figma', 'Component-based design'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Product teams needing a design file, not just static images', 'Teams handing designs off to development', 'Startups needing a first design pass'],
     '[{"question":"Is the file editable or just static exports?","answer":"It is a real, editable Figma file with structured components, not flat images."},{"question":"Can you work from an existing wireframe?","answer":"Yes. Provide your wireframe or brief and the visual design is built from it."}]'::jsonb),
    ('presentation-generation',
     ARRAY['Slide structure and narrative flow', 'Visual consistency across a full deck', 'Content-to-slide translation from your talking points'],
     ARRAY['A complete, polished slide deck', 'Consistent visual styling throughout', 'Content structured from your outline'],
     ARRAY['Presentation design'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Teams preparing a pitch or investor deck', 'Internal reporting needing a polished format', 'Sales teams needing a consistent deck template'],
     '[{"question":"Do I need a full script, or just an outline?","answer":"Talking points or a rough outline is enough; the deck structure is built from that."},{"question":"Can the deck match our existing brand style?","answer":"Yes, provided you share your brand guidelines or existing materials."}]'::jsonb),
    ('social-media-graphics',
     ARRAY['Platform-sized visual asset generation', 'Brand-consistent visual styling', 'Batch generation across formats'],
     ARRAY['A batch of ready-to-post graphics', 'Assets sized for your target platforms', 'Visuals matched to your existing brand identity'],
     ARRAY['Visual asset generation'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Brands maintaining a consistent visual social presence', 'Campaigns needing a batch of assets quickly', 'Teams without in-house design capacity'],
     '[{"question":"Which platforms are the graphics sized for?","answer":"Specify your target platforms in the brief and assets are sized accordingly."},{"question":"Can you match our existing brand style?","answer":"Yes. Share your existing visual identity and the graphics are generated to match it."}]'::jsonb),
    ('brand-content-generation',
     ARRAY['Taglines and brand messaging', 'Consistent-voice content across formats', 'Description and copy generation for multiple uses'],
     ARRAY['A set of brand messaging and copy', 'Content usable across website, marketing, and product', 'Consistent voice across all delivered pieces'],
     ARRAY['Brand content generation'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['New brands defining their messaging for the first time', 'Businesses needing consistent copy across channels', 'Rebrands needing updated messaging'],
     '[{"question":"What formats does this cover?","answer":"Taglines, descriptions, and messaging usable across your website, marketing, and product."},{"question":"How is consistency maintained across pieces?","answer":"All content is generated against the same brand voice definition, established at the start of the project."}]'::jsonb),

    ('data-cleaning-transformation',
     ARRAY['Duplicate and inconsistency detection', 'Data structuring and normalization', 'Format conversion for analysis readiness'],
     ARRAY['A cleaned, structured dataset', 'A summary of issues found and corrected', 'Data ready for direct analysis or reporting'],
     ARRAY['Data cleaning', 'Data transformation'],
     ARRAY['Data intake & scoping', 'Processing', 'Validation', 'Delivery'],
     ARRAY['Teams with messy or inconsistent source data', 'Businesses preparing data for a reporting project', 'Operations merging data from multiple sources'],
     '[{"question":"What data formats can you work with?","answer":"Common formats like CSV, spreadsheets, and database exports; share your source format and NOVA AI will confirm fit."},{"question":"Will I get a report of what was changed?","answer":"Yes. A summary of issues found and corrected is included with the cleaned dataset."}]'::jsonb),
    ('sql-data-analysis',
     ARRAY['SQL query writing against your real schema', 'Business-question-driven analysis', 'Findings delivered as answers, not raw queries'],
     ARRAY['Written findings answering your specific questions', 'The underlying SQL queries used', 'A summary suitable for non-technical stakeholders'],
     ARRAY['SQL'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Teams with a database but no dedicated analyst', 'Businesses needing specific answers, not a dashboard', 'One-off analysis requests'],
     '[{"question":"Do I need to know SQL myself?","answer":"No. Findings are delivered in plain language, with the underlying queries included for reference."},{"question":"Can you work with any database?","answer":"Share your database type and access details in the brief and NOVA AI will confirm compatibility."}]'::jsonb),
    ('power-bi-dashboards',
     ARRAY['Data source connection and modeling', 'Dashboard layout matched to real reporting needs', 'Metric and view configuration'],
     ARRAY['A working Power BI dashboard', 'Connected, live data views', 'Metrics matched to what your team actually tracks'],
     ARRAY['Power BI'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Teams needing recurring visibility into a data source', 'Operations tracking KPIs across a team', 'Businesses standardizing on Power BI for reporting'],
     '[{"question":"Does the dashboard update automatically?","answer":"Yes. It is connected to your live data source rather than built from a static snapshot."},{"question":"What data sources are supported?","answer":"Share your data source in the brief and NOVA AI will confirm Power BI compatibility."}]'::jsonb),
    ('automated-business-reports',
     ARRAY['Recurring report scheduling', 'Live data source connection', 'Defined-format report generation'],
     ARRAY['A scheduled, automatically generated report', 'Connection to your live data source', 'No manual compilation required going forward'],
     ARRAY['Automated reporting'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Teams currently compiling reports manually on a schedule', 'Operations, sales, or performance reporting needs', 'Businesses wanting consistent recurring visibility'],
     '[{"question":"How often can the report run?","answer":"On whatever schedule you define, such as daily, weekly, or monthly."},{"question":"What happens if the underlying data changes format?","answer":"Share this risk in your brief so the report can be scoped to your actual data source''s stability."}]'::jsonb),
    ('competitive-market-research',
     ARRAY['Competitor positioning and pricing research', 'Market trend synthesis', 'Public-source-grounded reference documents'],
     ARRAY['A synthesized competitor and market research document', 'Positioning and pricing comparisons', 'A usable reference, not a raw data dump'],
     ARRAY['Market research'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Businesses planning market entry or expansion', 'Teams needing a current competitive landscape view', 'Product and pricing strategy decisions'],
     '[{"question":"What sources is this research based on?","answer":"Real public sources; the document is built to be a synthesized, usable reference rather than raw scraped data."},{"question":"Can this focus on specific competitors I name?","answer":"Yes. Name your key competitors in the brief and research is scoped accordingly."}]'::jsonb),

    ('mvp-development',
     ARRAY['End-to-end product build from requirements', 'Milestone-based progress delivery', 'Functional, working first version'],
     ARRAY['A working MVP matching your requirements', 'Milestone check-ins throughout the build', 'Source code and deployment-ready output'],
     ARRAY['Next.js', 'TypeScript', 'PostgreSQL'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Human review & approval', 'Delivery'],
     ARRAY['Startups needing a first functional product version', 'Founders validating a product idea', 'Teams needing to move from spec to working software'],
     '[{"question":"Does a human review this before it goes live?","answer":"Given the scope and cost of a full build, milestones are reviewed with you along the way rather than delivered all at once."},{"question":"What happens if requirements change mid-build?","answer":"Milestone reviews are the point at which scope changes can be raised and incorporated."}]'::jsonb),
    ('api-development',
     ARRAY['REST API implementation to specification', 'Endpoint and data model testing', 'Integration-ready delivery'],
     ARRAY['A working, tested REST API', 'Documentation of endpoints and data model', 'Code ready to integrate into your application'],
     ARRAY['Node.js', 'REST', 'PostgreSQL'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Products needing a backend for a new feature', 'Teams integrating with an existing system', 'Applications needing a defined, testable API layer'],
     '[{"question":"Do you need a full spec to start?","answer":"A defined set of endpoints and data model is ideal, but NOVA AI can help shape a rough spec into a concrete one."},{"question":"Is the API tested before delivery?","answer":"Yes. It is implemented and tested against your defined endpoints and data model."}]'::jsonb),
    ('internal-tool-development',
     ARRAY['Admin panel and dashboard building', 'Workflow-specific tool development', 'Deployment for internal team use'],
     ARRAY['A deployed internal tool', 'Functionality matched to your specific operational need', 'Access ready for your team to use immediately'],
     ARRAY['Next.js', 'TypeScript', 'PostgreSQL'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Teams with a specific, well-defined internal process gap', 'Operations needing a lightweight admin tool', 'Businesses replacing a manual spreadsheet-based process'],
     '[{"question":"How well-defined does the problem need to be?","answer":"A specific, well-defined internal problem works best; vague or open-ended requests are harder to scope well."},{"question":"Who can access the finished tool?","answer":"Access is scoped to your team as part of deployment."}]'::jsonb),
    ('bug-fixing-code-refactoring',
     ARRAY['Bug diagnosis and root-cause investigation', 'Fix implementation and code cleanup', 'Verification against your existing test suite'],
     ARRAY['A verified fix for the reported issue', 'Cleaned-up related code where relevant', 'Confirmation against your existing tests'],
     ARRAY['Matched to your existing codebase'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Teams with a specific reported bug needing investigation', 'Codebases accumulating quality issues over time', 'Projects with an existing test suite to verify against'],
     '[{"question":"Do I need an existing test suite for this?","answer":"It is not required, but if you have one, the fix is verified against it directly."},{"question":"Can this include broader refactoring beyond the reported bug?","answer":"Scope is defined in your brief, from a single targeted fix to broader related cleanup."}]'::jsonb),
    ('automated-testing-setup',
     ARRAY['Unit and integration test writing', 'Test coverage aligned to your existing codebase', 'A reusable safety net for future changes'],
     ARRAY['A working test suite added to your codebase', 'Coverage of key existing functionality', 'A safety net for future changes'],
     ARRAY['Matched to your existing stack'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Codebases with little or no existing test coverage', 'Teams about to undertake a larger refactor', 'Projects wanting more confidence before shipping changes'],
     '[{"question":"Do you test my entire codebase?","answer":"Coverage is scoped to the areas you specify in your brief, not assumed to be the entire codebase."},{"question":"What testing framework is used?","answer":"Matched to your existing stack and conventions where possible."}]'::jsonb),

    ('website-deployment',
     ARRAY['Hosting and domain configuration', 'Production deployment setup', 'Pre-launch review of the live configuration'],
     ARRAY['Your website live in a production environment', 'Configured hosting and domain setup', 'A review step before the final go-live'],
     ARRAY['Hosting configuration', 'DNS configuration'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Human review & approval', 'Delivery'],
     ARRAY['Businesses launching a new site to production', 'Teams migrating from an old host', 'Sites needing a properly configured domain and hosting setup'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because this affects a live production environment, the final deployment step is reviewed before it goes live."},{"question":"Do I need to already own a domain?","answer":"Either works; an existing domain can be connected, or guidance is provided for acquiring one."}]'::jsonb),
    ('docker-containerization',
     ARRAY['Dockerfile and container configuration', 'Environment consistency setup', 'Build and run testing'],
     ARRAY['A working Dockerfile and container configuration', 'A tested, runnable container setup', 'Documentation for running it locally or in production'],
     ARRAY['Docker'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Applications needing consistent environments across machines', 'Teams preparing for containerized deployment', 'Projects standardizing their runtime setup'],
     '[{"question":"Does this work with my existing application as-is?","answer":"NOVA AI configures containerization around your existing application; unusual setups may need details shared upfront."},{"question":"Is the container tested before delivery?","answer":"Yes. Build and run are tested as part of delivery, not just configured."}]'::jsonb),
    ('ci-cd-pipeline-setup',
     ARRAY['Automated build and test pipeline configuration', 'Deploy-on-change automation', 'Pipeline testing against your repository'],
     ARRAY['A working CI/CD pipeline configured for your repository', 'Automated test-and-deploy on every change', 'Documentation of the pipeline stages'],
     ARRAY['CI/CD tooling'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Teams currently deploying manually', 'Projects wanting automated testing on every change', 'Repositories preparing for more frequent releases'],
     '[{"question":"Which CI/CD platform is used?","answer":"Typically matched to where your repository already lives; share your setup and NOVA AI will confirm fit."},{"question":"Does this include the tests themselves?","answer":"This service configures the pipeline; Automated Testing Setup covers writing the tests it runs."}]'::jsonb),
    ('server-monitoring-setup',
     ARRAY['Uptime and performance monitoring configuration', 'Error tracking setup', 'Real alerting connected to your team'],
     ARRAY['Configured monitoring for your infrastructure', 'Connected, working alerts', 'A summary of what is being tracked and why'],
     ARRAY['Monitoring and alerting tooling'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Infrastructure running in production without visibility today', 'Teams that find out about outages from users first', 'Operations wanting proactive issue detection'],
     '[{"question":"Where do alerts get sent?","answer":"Configured to your preferred channel, such as email or a team messaging tool, per your brief."},{"question":"Does this monitor the application or just the server?","answer":"Scope, meaning server, application, or both, is defined in your brief."}]'::jsonb),
    ('backup-configuration',
     ARRAY['Scheduled backup system configuration', 'Database and file backup coverage', 'Review before activation on production data'],
     ARRAY['A scheduled, working backup system', 'Coverage of your defined data and files', 'A review step before activation'],
     ARRAY['Backup and restore tooling'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Human review & approval', 'Delivery'],
     ARRAY['Production systems without a current backup strategy', 'Databases holding business-critical data', 'Teams wanting a tested restore path, not just backups'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because backup and restore touch production data directly, the configuration is reviewed before activation."},{"question":"Is the restore process tested, not just the backup?","answer":"Validation is part of setup; a backup that cannot be restored is not a real backup."}]'::jsonb),

    ('security-header-configuration',
     ARRAY['HTTP security header review', 'CSP and HSTS configuration', 'Best-practice alignment for your site'],
     ARRAY['Configured security headers for your site', 'A summary of what was changed and why', 'Verification that headers are correctly applied'],
     ARRAY['CSP', 'HSTS', 'HTTP security headers'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Sites that have never had a security header review', 'Businesses meeting basic security compliance expectations', 'Sites handling any user-submitted data'],
     '[{"question":"Will this break anything on my existing site?","answer":"Headers are configured and validated against your actual site before being considered complete."},{"question":"What headers are typically included?","answer":"Standard current best practice, including CSP and HSTS, scoped to what fits your site."}]'::jsonb),
    ('ssl-security-configuration',
     ARRAY['Certificate configuration', 'Transport security setup', 'Review before changes affect live traffic'],
     ARRAY['Correctly configured SSL and transport security', 'A review step before changes go live', 'Verification against your live domain'],
     ARRAY['SSL/TLS'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Human review & approval', 'Delivery'],
     ARRAY['Domains with misconfigured or expiring certificates', 'Sites needing transport security brought up to current standards', 'Businesses preparing for a security review or audit'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because this affects live traffic to a production site, changes are reviewed before they go live."},{"question":"Will there be downtime during configuration?","answer":"Configuration is validated before being applied specifically to avoid unnecessary downtime."}]'::jsonb),
    ('dependency-vulnerability-scanning',
     ARRAY['Automated dependency scanning', 'Known-vulnerability database checking', 'Clear, prioritized reporting'],
     ARRAY['A full dependency vulnerability scan report', 'A prioritized list of what needs updating', 'Severity context for each finding'],
     ARRAY['Dependency scanning'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Projects that have never had a dependency audit', 'Codebases with many third-party packages', 'Teams preparing for a security review'],
     '[{"question":"Does this fix the vulnerabilities, or just report them?","answer":"This service reports findings with clear prioritization; Bug Fixing & Code Refactoring can apply the actual updates."},{"question":"How current is the vulnerability database used?","answer":"Scanning checks against current known-vulnerability databases at the time the scan runs."}]'::jsonb),
    ('configuration-security-audit',
     ARRAY['Server and application configuration review', 'Access control review', 'Misconfiguration identification against common patterns'],
     ARRAY['A configuration security audit report', 'Findings mapped to common misconfiguration patterns', 'Prioritized recommendations'],
     ARRAY['Configuration review'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Infrastructure that has grown without a formal security review', 'Teams preparing for a compliance check', 'Businesses wanting a second set of eyes on access controls'],
     '[{"question":"What gets reviewed in this audit?","answer":"Server, application, and access configuration, checked against common security misconfiguration patterns."},{"question":"Do you also apply the fixes?","answer":"This service delivers the audit; specific fixes can be scoped as a follow-up based on findings."}]'::jsonb),
    ('wordpress-security-hardening',
     ARRAY['Plugin and permission review', 'Configuration hardening for common attack vectors', 'Review before changes apply to a live site'],
     ARRAY['A hardened WordPress configuration', 'A summary of vulnerabilities addressed', 'A review step before changes are applied'],
     ARRAY['WordPress'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Human review & approval', 'Delivery'],
     ARRAY['Existing WordPress sites with default or outdated configuration', 'Sites using many third-party plugins', 'Businesses that have experienced a prior security incident'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because this modifies a live site''s security posture, changes are reviewed before being applied."},{"question":"Will this affect my existing plugins?","answer":"Plugin review is part of the hardening process; anything flagged is reported before any change is applied."}]'::jsonb)
) AS v(slug, capabilities, deliverables, technologies, process, suited_industries, faqs)
WHERE s.slug = v.slug;

-- =========================================================================
-- PHASE 10B: INTERNSHIP PROGRAMS + REAL INTERNSHIP CATALOG
-- =========================================================================
-- internship_programs is a new, minimal catalog table (mirrors
-- programs/courses/services' existing published-content pattern) — one row
-- per subject area, linked to the matching learning program via
-- program_id. It deliberately does NOT duplicate the skills relationship:
-- "skills you'll use" for an internship program is read at query time via
-- its linked programs.program_skills, the same table already used for the
-- learning program itself. No internship_program_skills join table was
-- added — nothing today needs a skill set that differs from the linked
-- program's own.
--
-- internships gains two nullable columns: internship_program_id (which
-- catalog track this posting belongs to) and duration_weeks (4/12/24,
-- i.e. the 1/3/6-month tracks). Both are nullable specifically so every
-- existing row — including seed.sql's two test-only fixtures, and any
-- future company-posted internship that isn't part of NOVA's own catalog
-- tracks — keeps working unchanged with no backfill required.
CREATE TABLE public.internship_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    short_description text NOT NULL,
    long_description text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_internship_programs_program_id ON public.internship_programs(program_id);
CREATE INDEX idx_internship_programs_status ON public.internship_programs(status);

CREATE TRIGGER update_internship_programs_modtime BEFORE UPDATE ON public.internship_programs
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

ALTER TABLE public.internship_programs ENABLE ROW LEVEL SECURITY;

-- Same two-policy-per-role split already used for programs/courses/services/
-- internships: an anon-scoped policy that never calls is_current_user_admin()
-- (anon has no EXECUTE grant on it), and an authenticated-scoped policy that
-- ORs in admin. Postgres combines multiple PERMISSIVE policies on the same
-- table with OR, so each role only ever needs its own policy to apply.
CREATE POLICY "Anonymous can read published internship programs" ON public.internship_programs
    FOR SELECT TO anon
    USING (status = 'published');

CREATE POLICY "Anyone can read published internship programs OR admin can read all" ON public.internship_programs
    FOR SELECT TO authenticated
    USING (status = 'published' OR public.is_current_user_admin());

CREATE POLICY "Admins can insert internship programs" ON public.internship_programs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update internship programs" ON public.internship_programs
    FOR UPDATE TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

GRANT SELECT ON public.internship_programs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.internship_programs TO authenticated;

ALTER TABLE public.internships ADD COLUMN internship_program_id uuid NULL REFERENCES public.internship_programs(id) ON DELETE SET NULL;
ALTER TABLE public.internships ADD COLUMN duration_weeks integer NULL CHECK (duration_weeks IN (4, 12, 24));

CREATE INDEX idx_internships_internship_program_id ON public.internships(internship_program_id);

-- -------------------------------------------------------------------
-- Seed: 7 internship programs (one per existing learning program)
-- -------------------------------------------------------------------
INSERT INTO public.internship_programs (program_id, slug, name, short_description, long_description, status, display_order)
SELECT p.id, v.slug, v.name, v.short_description, v.long_description, 'published', v.display_order
FROM (VALUES
    ('ai-machine-learning', 'ai-machine-learning-internship', 'AI & Machine Learning Internship Program',
     'Hands-on internship work applying real machine learning and AI systems skills to NOVA projects.',
     'For students who have built a foundation in Python, machine learning, or deep learning and want to apply it to real NOVA project work rather than course exercises alone. Interns work alongside NOVA''s AI Engine team on genuine data preparation, model development, and applied AI tasks, at a track length that matches how much time they can commit.',
     1),
    ('data-analytics-data-science', 'data-analytics-internship', 'Data Analytics & Data Science Internship Program',
     'Hands-on internship work turning real data into decision-ready analysis for NOVA.',
     'For students with SQL, Python, or data visualization skills who want to work with real datasets and real business questions instead of course exercises alone. Interns work on genuine data cleaning, analysis, and reporting tasks that feed directly into NOVA''s own operations, at a track length that matches how much time they can commit.',
     2),
    ('software-development', 'software-development-internship', 'Software Development Internship Program',
     'Hands-on internship work building real features on NOVA''s own platform.',
     'For students with JavaScript/TypeScript, React, or Node.js experience who want to contribute real, shipped code rather than course exercises alone. Interns work on genuine frontend and backend tasks on NOVA''s own product, at a track length that matches how much time they can commit.',
     3),
    ('cybersecurity', 'cybersecurity-internship', 'Cybersecurity Internship Program',
     'Hands-on internship work hardening and auditing real NOVA systems.',
     'For students with networking, Linux, or security fundamentals who want to apply them to real infrastructure rather than course exercises alone. Interns work on genuine configuration review, vulnerability scanning, and hardening tasks across NOVA''s own systems, at a track length that matches how much time they can commit.',
     4),
    ('cloud-devops', 'cloud-devops-internship', 'Cloud & DevOps Internship Program',
     'Hands-on internship work operating and automating real NOVA infrastructure.',
     'For students with cloud, Linux, or container fundamentals who want to work on real production infrastructure rather than course exercises alone. Interns work on genuine deployment, monitoring, and automation tasks for NOVA''s own systems, at a track length that matches how much time they can commit.',
     5),
    ('ui-ux-product-design', 'ui-ux-internship', 'UI/UX & Product Design Internship Program',
     'Hands-on internship work designing real interfaces and product flows for NOVA.',
     'For students with design fundamentals, research, or Figma skills who want to design real product surfaces rather than course exercises alone. Interns work on genuine wireframing, UI design, and usability tasks for NOVA''s own platform, at a track length that matches how much time they can commit.',
     6),
    ('emerging-technologies', 'emerging-tech-internship', 'Emerging Technologies Internship Program',
     'Hands-on internship work exploring and applying blockchain, IoT, or AR/VR at NOVA.',
     'For students with blockchain, IoT, or AR/VR fundamentals who want to apply them to a real applied project rather than course exercises alone. Interns work on genuine exploratory and applied tasks in an emerging-technology area, at a track length that matches how much time they can commit.',
     7)
) AS v(program_slug, slug, name, short_description, long_description, display_order)
JOIN public.programs p ON p.slug = v.program_slug;

-- -------------------------------------------------------------------
-- Seed: 21 real internship postings (3 duration tracks x 7 programs),
-- all platform-owned (company_id NULL) since these are NOVA's own
-- internship program, not third-party company postings.
-- -------------------------------------------------------------------
INSERT INTO public.internships (internship_program_id, title, description, requirements, eligibility, status, duration_weeks)
SELECT ip.id, v.title, v.description, v.requirements, v.eligibility, 'open', v.duration_weeks
FROM (VALUES
    ('ai-machine-learning-internship', 'AI & ML Exploration Internship', 4,
     'A one-month, guided introduction to real AI/ML project work at NOVA. You will shadow the AI Engine team and complete one small, well-scoped task, such as cleaning a dataset or evaluating a model against a defined benchmark.',
     'Working Python proficiency and completion of, or current enrollment in, Machine Learning Fundamentals or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('ai-machine-learning-internship', 'Applied Machine Learning Internship', 12,
     'A three-month internship building and evaluating a real machine learning model end-to-end, from data preparation through evaluation, applied to an actual NOVA use case.',
     'Completion of Machine Learning Fundamentals and Deep Learning with Neural Networks, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed the AI & Machine Learning program''s core courses.'),
    ('ai-machine-learning-internship', 'AI Systems Development Internship', 24,
     'A six-month internship extending the capstone experience into real product work: building, testing, and helping deploy an AI-powered feature as part of NOVA''s own AI Engine.',
     'Completion of the AI & Machine Learning program, or equivalent demonstrated proficiency across Python, classical ML, and deep learning.',
     'Open to current NOVA students who have completed or are finishing the AI & Machine Learning program.'),

    ('data-analytics-internship', 'Data Analytics Foundations Internship', 4,
     'A one-month, guided introduction to real analytics work at NOVA. You will complete one small, well-scoped task, such as cleaning a real dataset or answering a defined business question in SQL.',
     'Working SQL proficiency and completion of, or current enrollment in, SQL for Data Analysis or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('data-analytics-internship', 'Applied Data Analysis Internship', 12,
     'A three-month internship performing a real end-to-end analysis for NOVA: pulling data with SQL, analyzing it in Python, and delivering a decision-ready report.',
     'Completion of SQL for Data Analysis and Python for Data Analysis, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed the Data Analytics & Data Science program''s core courses.'),
    ('data-analytics-internship', 'Data Science Project Internship', 24,
     'A six-month internship extending the capstone experience into real product work: building and maintaining a live analysis or predictive-modeling project used by NOVA''s own operations.',
     'Completion of the Data Analytics & Data Science program, or equivalent demonstrated proficiency across SQL, Python, and statistics.',
     'Open to current NOVA students who have completed or are finishing the Data Analytics & Data Science program.'),

    ('software-development-internship', 'Software Development Foundations Internship', 4,
     'A one-month, guided introduction to real engineering work at NOVA. You will complete one small, well-scoped task on NOVA''s own codebase under review from an experienced engineer.',
     'Working JavaScript proficiency and completion of, or current enrollment in, Programming Foundations with JavaScript or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('software-development-internship', 'Full-Stack Development Internship', 12,
     'A three-month internship building a real feature end-to-end on NOVA''s own platform, from a React frontend through a Node.js backend, with code review from NOVA engineers.',
     'Completion of Frontend Development with React and Backend Development with Node.js, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed the Software Development program''s core courses.'),
    ('software-development-internship', 'Software Engineering Internship', 24,
     'A six-month internship extending the capstone experience into real product work: owning a meaningful feature area on NOVA''s own platform from design through deployment.',
     'Completion of the Software Development program, or equivalent demonstrated proficiency across JavaScript/TypeScript, React, and Node.js.',
     'Open to current NOVA students who have completed or are finishing the Software Development program.'),

    ('cybersecurity-internship', 'Cybersecurity Foundations Internship', 4,
     'A one-month, guided introduction to real security work at NOVA. You will complete one small, well-scoped task, such as a dependency scan or a configuration review against a defined checklist.',
     'Working knowledge of networking fundamentals and completion of, or current enrollment in, Cybersecurity Fundamentals or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('cybersecurity-internship', 'Security Operations Internship', 12,
     'A three-month internship performing real security work for NOVA: vulnerability scanning, configuration hardening, and monitoring, under review from NOVA''s security team.',
     'Completion of Networking & Linux Essentials and Ethical Hacking & Penetration Testing, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed the Cybersecurity program''s core courses.'),
    ('cybersecurity-internship', 'Applied Cybersecurity Internship', 24,
     'A six-month internship extending the capstone experience into real product work: an extended security hardening and incident-response readiness project across NOVA''s own systems.',
     'Completion of the Cybersecurity program, or equivalent demonstrated proficiency across networking, ethical hacking, and application security.',
     'Open to current NOVA students who have completed or are finishing the Cybersecurity program.'),

    ('cloud-devops-internship', 'Cloud Fundamentals Internship', 4,
     'A one-month, guided introduction to real cloud and DevOps work at NOVA. You will complete one small, well-scoped task, such as containerizing a service or configuring monitoring for one component.',
     'Working knowledge of Linux fundamentals and completion of, or current enrollment in, Cloud Computing Fundamentals or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('cloud-devops-internship', 'DevOps Engineering Internship', 12,
     'A three-month internship performing real DevOps work for NOVA: containerization, CI/CD pipeline work, and infrastructure-as-code, under review from NOVA''s infrastructure team.',
     'Completion of Linux & Shell Scripting and Containers with Docker & Kubernetes, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed the Cloud & DevOps program''s core courses.'),
    ('cloud-devops-internship', 'Cloud Infrastructure Internship', 24,
     'A six-month internship extending the capstone experience into real product work: operating and improving a real piece of NOVA''s own cloud infrastructure end-to-end.',
     'Completion of the Cloud & DevOps program, or equivalent demonstrated proficiency across cloud fundamentals, containers, and CI/CD.',
     'Open to current NOVA students who have completed or are finishing the Cloud & DevOps program.'),

    ('ui-ux-internship', 'Design Foundations Internship', 4,
     'A one-month, guided introduction to real product design work at NOVA. You will complete one small, well-scoped task, such as a set of wireframes for a defined feature.',
     'Working knowledge of design fundamentals and completion of, or current enrollment in, Design Fundamentals & Design Thinking or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('ui-ux-internship', 'Product Design Internship', 12,
     'A three-month internship performing real design work for NOVA: user research, wireframes, and a working Figma design file for an actual product surface, under review from NOVA''s design team.',
     'Completion of UX Research Methods and UI Design with Figma, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed the UI/UX & Product Design program''s core courses.'),
    ('ui-ux-internship', 'UX Research & Design Internship', 24,
     'A six-month internship extending the capstone experience into real product work: taking a real NOVA product problem from research through a shipped design.',
     'Completion of the UI/UX & Product Design program, or equivalent demonstrated proficiency across research, UI design, and prototyping.',
     'Open to current NOVA students who have completed or are finishing the UI/UX & Product Design program.'),

    ('emerging-tech-internship', 'Emerging Tech Exploration Internship', 4,
     'A one-month, guided introduction to a chosen emerging-technology area at NOVA. You will complete one small, well-scoped exploratory task in blockchain, IoT, or AR/VR.',
     'Completion of, or current enrollment in, Introduction to Emerging Tech Landscape or an equivalent course.',
     'Open to current NOVA students. No prior internship experience required.'),
    ('emerging-tech-internship', 'Applied Emerging Tech Internship', 12,
     'A three-month internship building a real applied project in a chosen emerging-technology area, under review from NOVA''s emerging technologies team.',
     'Completion of at least one of Blockchain & Web3 Fundamentals, IoT & Embedded Systems, or AR/VR & Spatial Computing, or demonstrated equivalent experience.',
     'Open to current NOVA students who have completed at least one specialization course in the Emerging Technologies program.'),
    ('emerging-tech-internship', 'Emerging Tech Development Internship', 24,
     'A six-month internship extending the capstone experience into real product work: an extended applied project in a chosen emerging-technology area, from prototype through a working demo.',
     'Completion of the Emerging Technologies program, or equivalent demonstrated proficiency in at least one specialization area.',
     'Open to current NOVA students who have completed or are finishing the Emerging Technologies program.')
) AS v(internship_program_slug, title, duration_weeks, description, requirements, eligibility)
JOIN public.internship_programs ip ON ip.slug = v.internship_program_slug;

-- =========================================================================
-- PHASE 10C: CATALOG EXPANSION — COURSES
-- =========================================================================
-- 7 new courses (38 -> 45), each filling a real, specific curriculum gap
-- rather than padding toward a numeric target: production ML deployment,
-- ETL/data engineering, Next.js specifically (React alone doesn't cover
-- it), a missing Cybersecurity capstone, multi-cloud beyond AWS,
-- accessibility, and computer vision. Programs stay at 7 — none of these
-- warranted a new flagship program of their own.
--
-- Four of the seven deliberately resolve a real orphaned skill from the
-- Phase 10 content audit (apache-spark, nextjs, azure, computer-vision) by
-- building a genuine course around it, using ONLY existing skills — no new
-- skill rows invented. java, cpp, go, technical-communication, and
-- problem-solving remain intentionally unconnected: NOVA's actual
-- curriculum direction is JS/TS for web and Python for data/AI, so a
-- Java/C++/Go course would not reflect real curriculum content, and the
-- two soft skills are deliberately cross-cutting rather than tied to one
-- course.
--
-- Each program's former last course (capstone/applied-project) is bumped
-- to display_order + 1 so the new course lands immediately before it,
-- preserving the "capstone comes last" convention. Cybersecurity had no
-- capstone at all — its new course fills that real gap directly at the
-- next order with no bump needed.
UPDATE public.courses c SET display_order = 7
FROM public.programs p WHERE c.program_id = p.id AND p.slug = 'ai-machine-learning' AND c.slug = 'ai-systems-capstone';
UPDATE public.courses c SET display_order = 7
FROM public.programs p WHERE c.program_id = p.id AND p.slug = 'data-analytics-data-science' AND c.slug = 'data-science-capstone';
UPDATE public.courses c SET display_order = 7
FROM public.programs p WHERE c.program_id = p.id AND p.slug = 'software-development' AND c.slug = 'fullstack-capstone';
UPDATE public.courses c SET display_order = 6
FROM public.programs p WHERE c.program_id = p.id AND p.slug = 'cloud-devops' AND c.slug = 'cloud-devops-capstone';
UPDATE public.courses c SET display_order = 6
FROM public.programs p WHERE c.program_id = p.id AND p.slug = 'ui-ux-product-design' AND c.slug = 'product-design-capstone';
UPDATE public.courses c SET display_order = 6
FROM public.programs p WHERE c.program_id = p.id AND p.slug = 'emerging-technologies' AND c.slug = 'emerging-tech-applied-project';

INSERT INTO public.courses (program_id, slug, title, description, level, duration_hours, display_order, status, overview, prerequisites, learning_outcomes)
SELECT p.id, v.slug, v.title, v.description, v.level, v.duration_hours, v.display_order, 'published', v.overview, v.prerequisites, v.learning_outcomes
FROM (VALUES
    ('ai-machine-learning', 'mlops-model-deployment', 'MLOps & Model Deployment',
     'Taking a trained model from a notebook to a reliable, monitored service in production.', 'advanced', 20, 6,
     'Covers containerizing a trained model, deploying it behind an API, and setting up a CI/CD pipeline to retrain and redeploy it as new data arrives, plus basic monitoring for model drift.',
     'Deep Learning with Neural Networks.',
     ARRAY['Package a trained model into a deployable service', 'Build a CI/CD pipeline for retraining and redeployment', 'Monitor a deployed model for performance and drift']),
    ('data-analytics-data-science', 'data-engineering-fundamentals', 'Data Engineering Fundamentals',
     'Building the ETL pipelines that get raw data into a state analysts can actually use.', 'intermediate', 22, 6,
     'Covers designing and building ETL pipelines, working with larger-than-memory datasets using Apache Spark, and scheduling recurring data jobs reliably.',
     'Python for Data Analysis.',
     ARRAY['Design and build a basic ETL pipeline', 'Process larger-than-memory datasets with Apache Spark', 'Schedule and monitor a recurring data pipeline']),
    ('software-development', 'nextjs-fullstack-frameworks', 'Next.js & Full-Stack Frameworks',
     'Extending React into a full-stack framework with server-side rendering, routing, and API routes built in.', 'intermediate', 22, 6,
     'Covers building a full-stack application in Next.js: file-based routing, server-side rendering and static generation, and API routes, as a production-grade alternative to hand-wiring a separate React frontend and Node.js backend.',
     'Frontend Development with React.',
     ARRAY['Build a full-stack application with Next.js', 'Choose between server-side rendering and static generation appropriately', 'Implement API routes within a Next.js application']),
    ('cybersecurity', 'cybersecurity-capstone', 'Cybersecurity Capstone Project',
     'A self-directed project assessing and hardening a real system end-to-end.', 'advanced', 20, 6,
     'A capstone project applying the full security lifecycle covered in this program to one system: assessment, exploitation testing within a defined scope, hardening, and incident-response readiness documentation.',
     'All prior courses in the Cybersecurity program.',
     ARRAY['Apply a full security assessment lifecycle to a real system', 'Harden a system based on assessment findings', 'Document incident-response readiness for the system']),
    ('cloud-devops', 'multi-cloud-azure-gcp', 'Multi-Cloud Fundamentals: Azure & GCP',
     'Applying the same core cloud concepts on Azure and GCP after learning them on AWS.', 'intermediate', 16, 5,
     'Covers the core compute, storage, and networking services on Microsoft Azure and Google Cloud Platform, mapped directly against the AWS equivalents from Cloud Computing Fundamentals, so the underlying concepts transfer rather than needing to be relearned per cloud.',
     'Cloud Computing Fundamentals.',
     ARRAY['Provision core compute and storage resources on Azure', 'Provision core compute and storage resources on GCP', 'Map cloud concepts across AWS, Azure, and GCP']),
    ('ui-ux-product-design', 'accessibility-inclusive-design', 'Accessibility & Inclusive Design',
     'Designing interfaces that work for users with different abilities, not as an afterthought.', 'intermediate', 14, 5,
     'Covers WCAG accessibility guidelines, designing for screen readers and keyboard navigation, and auditing an existing interface for accessibility gaps, building accessibility into the design process rather than retrofitting it.',
     'UI Design with Figma.',
     ARRAY['Apply WCAG accessibility guidelines to an interface design', 'Design for screen reader and keyboard-only navigation', 'Audit an existing interface for accessibility gaps']),
    ('emerging-technologies', 'computer-vision-applications', 'Computer Vision Applications',
     'Building real image classification and object detection systems, not just describing how they work.', 'intermediate', 20, 5,
     'Covers image classification and object detection using deep learning, applied to real image datasets, as a specialization within the emerging-technology landscape alongside blockchain, IoT, and AR/VR.',
     'Introduction to Emerging Tech Landscape.',
     ARRAY['Build an image classification model', 'Build a basic object detection pipeline', 'Evaluate a computer vision model against real image data'])
) AS v(program_slug, slug, title, description, level, duration_hours, display_order, overview, prerequisites, learning_outcomes)
JOIN public.programs p ON p.slug = v.program_slug
ON CONFLICT (program_id, slug) DO NOTHING;

INSERT INTO public.course_skills (course_id, skill_id)
SELECT c.id, s.id FROM (VALUES
    ('ai-machine-learning', 'mlops-model-deployment', 'machine-learning'), ('ai-machine-learning', 'mlops-model-deployment', 'docker'), ('ai-machine-learning', 'mlops-model-deployment', 'ci-cd'),
    ('data-analytics-data-science', 'data-engineering-fundamentals', 'sql'), ('data-analytics-data-science', 'data-engineering-fundamentals', 'apache-spark'), ('data-analytics-data-science', 'data-engineering-fundamentals', 'python'),
    ('software-development', 'nextjs-fullstack-frameworks', 'nextjs'), ('software-development', 'nextjs-fullstack-frameworks', 'react'), ('software-development', 'nextjs-fullstack-frameworks', 'typescript'),
    ('cybersecurity', 'cybersecurity-capstone', 'cybersecurity-fundamentals'), ('cybersecurity', 'cybersecurity-capstone', 'ethical-hacking'), ('cybersecurity', 'cybersecurity-capstone', 'incident-response'),
    ('cloud-devops', 'multi-cloud-azure-gcp', 'azure'), ('cloud-devops', 'multi-cloud-azure-gcp', 'cloud-architecture'),
    ('ui-ux-product-design', 'accessibility-inclusive-design', 'ui-design'), ('ui-ux-product-design', 'accessibility-inclusive-design', 'ux-research'),
    ('emerging-technologies', 'computer-vision-applications', 'computer-vision'), ('emerging-technologies', 'computer-vision-applications', 'python'), ('emerging-technologies', 'computer-vision-applications', 'deep-learning')
) AS v(program_slug, course_slug, skill_slug)
JOIN public.programs p ON p.slug = v.program_slug
JOIN public.courses c ON c.program_id = p.id AND c.slug = v.course_slug
JOIN public.skills s ON s.slug = v.skill_slug
ON CONFLICT DO NOTHING;

-- =========================================================================
-- PHASE 10C: CATALOG EXPANSION — SERVICES
-- =========================================================================
-- 24 new services (40 -> 64), 3 genuinely distinct new offerings per
-- existing category — never a rename or minor variant of an existing
-- service. Several deliberately follow directly from the new Phase 10C
-- courses (data-pipeline-automation from Data Engineering Fundamentals,
-- nextjs-application-development from Next.js & Full-Stack Frameworks,
-- multi-cloud-migration-assessment from Multi-Cloud Fundamentals,
-- website-accessibility-audit / accessibility-design-review from
-- Accessibility & Inclusive Design, incident-response-readiness-review
-- from the new Cybersecurity Capstone) — real coherence with the
-- curriculum, not coincidence. All 8 categories held at their existing
-- taxonomy; no new category was needed.
INSERT INTO public.services (category_id, slug, name, short_description, description, automation_level, published, display_order, capabilities, deliverables, technologies, process, suited_industries, faqs)
SELECT sc.id, v.slug, v.name, v.short_description, v.description, v.automation_level, true, v.display_order, v.capabilities, v.deliverables, v.technologies, v.process, v.suited_industries, v.faqs
FROM (VALUES
    ('websites-web', 'e-commerce-store-setup', 'E-Commerce Store Setup', 'A working online store built from your product catalog.',
     'NOVA AI builds a functional e-commerce storefront, product listings, cart, and checkout, from your product catalog and brand details.', 'autonomous', 6,
     ARRAY['Product catalog import and listing setup', 'Cart and checkout flow configuration', 'Responsive storefront design'],
     ARRAY['A working online store', 'Configured product listings', 'A functional cart and checkout flow'],
     ARRAY['Next.js', 'Tailwind CSS', 'Payment gateway integration'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Businesses selling physical or digital products online', 'Brands moving from marketplace-only to their own store', 'Small retailers launching their first online store'],
     '[{"question":"Do I need a payment processor account already?","answer":"Either works; the store can be configured against an existing account or you can set one up during the build."},{"question":"Can I add or remove products after launch?","answer":"Yes. The catalog is set up so your team can manage listings going forward."}]'::jsonb),
    ('websites-web', 'website-accessibility-audit', 'Website Accessibility Audit', 'A WCAG accessibility audit with fixes applied directly.',
     'NOVA AI reviews your site against WCAG accessibility guidelines and applies the fixes directly, covering screen reader support, keyboard navigation, and color contrast.', 'autonomous', 7,
     ARRAY['WCAG guideline review', 'Screen reader and keyboard navigation fixes', 'Color contrast and markup corrections'],
     ARRAY['An accessibility audit with findings', 'Fixes applied directly to your site', 'A summary of remaining manual-review items'],
     ARRAY['WCAG', 'Semantic HTML'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Sites that have never had an accessibility review', 'Organizations with accessibility compliance requirements', 'Public-facing sites serving a broad audience'],
     '[{"question":"Does this guarantee full compliance?","answer":"It fixes what can be verified and corrected automatically; some items genuinely require manual legal or expert review, and those are flagged rather than silently skipped."},{"question":"Will this change how my site looks?","answer":"Only where a visual change is required for accessibility, such as contrast; layout and branding are otherwise preserved."}]'::jsonb),
    ('websites-web', 'website-translation', 'Multi-Page Website Translation', 'Your existing site''s content translated into additional languages.',
     'Existing page content translated into the languages you specify, preserving your site''s structure and formatting.', 'autonomous', 8,
     ARRAY['Page content translation', 'Structure and formatting preservation', 'Multi-language content delivery'],
     ARRAY['Translated page content in your specified languages', 'Content matched to your existing page structure'],
     ARRAY['Content translation'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Businesses expanding into new-language markets', 'Sites serving a multilingual audience', 'Organizations localizing existing content'],
     '[{"question":"How many languages can be included?","answer":"Specify the languages you need in your brief; scope is set per project."},{"question":"Does this include setting up language switching on the site?","answer":"Translated content is delivered ready to publish; wiring up a language switcher is scoped separately if your site does not already support it."}]'::jsonb),

    ('ai-automation', 'ai-meeting-notes-summarization', 'AI Meeting Notes & Summarization', 'Automated transcription and summarization of your meetings.',
     'Meeting recordings turned into structured notes: a summary, key decisions, and action items, without manual note-taking.', 'autonomous', 6,
     ARRAY['Meeting transcription', 'Summary and key-decision extraction', 'Action item identification'],
     ARRAY['A structured meeting summary', 'A list of extracted action items', 'The full transcript for reference'],
     ARRAY['Speech-to-text', 'LLM-based summarization'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Teams running frequent recurring meetings', 'Organizations needing a reliable meeting record', 'Distributed teams needing shared meeting summaries'],
     '[{"question":"What meeting platforms are supported?","answer":"Share your platform and recording format in the brief and NOVA AI will confirm compatibility."},{"question":"How accurate is the transcription?","answer":"Accuracy depends on recording quality; the full transcript is included so you can verify against the summary."}]'::jsonb),
    ('ai-automation', 'ai-email-triage-routing', 'AI Email Triage & Routing', 'Incoming email automatically categorized and routed to the right team.',
     'NOVA AI classifies incoming email by topic and urgency and routes it to the right team or queue. Because this affects real incoming communications, initial routing rules are reviewed before running unsupervised.', 'approval_required', 7,
     ARRAY['Email classification by topic and urgency', 'Automated routing to the right team or queue', 'Routing rule configuration'],
     ARRAY['A working email triage and routing system', 'Configured routing rules', 'A review period before unsupervised operation'],
     ARRAY['LLM-based classification', 'Email integration'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Human review & approval', 'Delivery'],
     ARRAY['Teams receiving high volumes of incoming email', 'Support or sales inboxes needing faster routing', 'Organizations with multiple team queues'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because this affects real incoming communications, initial routing rules are reviewed before the system runs unsupervised."},{"question":"What happens to emails that do not match any category?","answer":"Unmatched emails fall back to a default queue you define, rather than being dropped."}]'::jsonb),
    ('ai-automation', 'custom-ai-integration', 'Custom AI Integration (API/Webhook)', 'An existing AI capability connected into your own application.',
     'NOVA AI connects a defined AI capability, such as a chatbot or document processor, into your own application via API or webhook, so it runs inside your existing product rather than as a separate tool.', 'autonomous', 8,
     ARRAY['API and webhook integration', 'Connecting an AI capability into an existing application', 'Integration testing against your app'],
     ARRAY['A working integration into your application', 'Documentation of the integration setup', 'Verification that the integration works against your app'],
     ARRAY['REST APIs', 'Webhooks'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Products wanting to embed an AI capability directly', 'Teams integrating with an existing internal system', 'Businesses extending an existing app rather than building a new one'],
     '[{"question":"Which AI capability can be integrated?","answer":"Any NOVA AI capability already offered as a service, such as a chatbot or document processor, connected into your application."},{"question":"Do you need access to my codebase?","answer":"Read access to the relevant integration points is typically enough; scope is confirmed in your brief."}]'::jsonb),

    ('digital-marketing', 'ab-copy-variants', 'Landing Page A/B Copy Variants', 'Multiple tested copy variants for an existing landing page.',
     'NOVA AI generates several distinct copy variants for an existing landing page, ready to run as an A/B test to find what converts best.', 'autonomous', 6,
     ARRAY['Multiple distinct copy variant generation', 'Conversion-focused messaging angles', 'Variant structuring for A/B testing'],
     ARRAY['Several distinct copy variants for your page', 'Variants ready to load into your A/B testing tool'],
     ARRAY['Content generation', 'Conversion copywriting'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Teams wanting to test messaging before committing', 'Pages with underperforming conversion rates', 'Campaigns with a defined testing budget'],
     '[{"question":"How many variants are included?","answer":"Scope is defined in your brief; a small set of genuinely distinct variants works better than many minor tweaks."},{"question":"Do you run the A/B test itself?","answer":"This service delivers the variants; running the test uses your own analytics or testing tool."}]'::jsonb),
    ('digital-marketing', 'local-seo-gbp', 'Local SEO & Google Business Profile Optimization', 'Your Google Business Profile and local search presence optimized.',
     'NOVA AI reviews and optimizes your Google Business Profile listing and local on-page SEO signals to improve visibility in local search results.', 'autonomous', 7,
     ARRAY['Google Business Profile optimization', 'Local on-page SEO review', 'Local search visibility improvements'],
     ARRAY['An optimized Google Business Profile listing', 'Local SEO improvements applied to your site', 'A summary of changes made'],
     ARRAY['Local SEO', 'Google Business Profile'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Local businesses serving a specific geographic area', 'Service businesses relying on local search traffic', 'Businesses with an underused or outdated listing'],
     '[{"question":"Do I need to already have a Google Business Profile?","answer":"Either works; an existing listing can be optimized, or a new one can be set up as part of this service."},{"question":"Does this guarantee a top local ranking?","answer":"No legitimate service can guarantee rankings; this service applies real, current best-practice optimizations."}]'::jsonb),
    ('digital-marketing', 'video-script-generation', 'Video Script Generation', 'Scripts for marketing or explainer videos generated from your content.',
     'Well-structured scripts for marketing or explainer videos, generated from your product details and target audience, ready for production.', 'autonomous', 8,
     ARRAY['Video script structuring', 'Audience-targeted messaging', 'Production-ready script formatting'],
     ARRAY['A complete, production-ready video script', 'Content structured for the video''s intended length'],
     ARRAY['Content generation', 'Script writing'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Teams producing marketing or explainer videos', 'Product launches needing a video component', 'Businesses without in-house scriptwriting capacity'],
     '[{"question":"What video length can this support?","answer":"Specify your target length in the brief; the script is structured to fit it."},{"question":"Do you also produce the video?","answer":"This service delivers the script; production and filming are handled by your own team or a separate vendor."}]'::jsonb),

    ('design-creative', 'icon-illustration-set', 'Icon & Illustration Set Generation', 'A cohesive custom icon or illustration set matched to your brand.',
     'A set of custom icons or illustrations generated in a consistent style, matched to your brand''s existing visual identity.', 'autonomous', 6,
     ARRAY['Custom icon and illustration generation', 'Consistent visual style across a full set', 'Brand-matched styling'],
     ARRAY['A complete icon or illustration set', 'Consistent styling across every asset', 'Files ready for use across your product or site'],
     ARRAY['Visual asset generation'],
     ARRAY['Research & briefing', 'AI-driven drafting', 'Quality review', 'Delivery'],
     ARRAY['Products needing a consistent icon system', 'Brands wanting custom illustrations over stock art', 'Sites and apps standardizing their visual language'],
     '[{"question":"How many icons or illustrations are included?","answer":"Scope is defined in your brief based on your actual needs."},{"question":"What file formats are delivered?","answer":"Standard formats such as SVG and PNG, suited for web and product use."}]'::jsonb),
    ('design-creative', 'email-newsletter-template', 'Email Newsletter Template Design', 'A reusable, branded email newsletter template.',
     'A reusable email template designed to your brand, ready to drop new content into for each send without redesigning from scratch.', 'autonomous', 7,
     ARRAY['Reusable email template design', 'Brand-matched styling', 'Cross-client email compatibility'],
     ARRAY['A reusable, branded email template', 'A template ready to use in your email platform'],
     ARRAY['Email template design', 'Responsive email markup'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Businesses sending a recurring newsletter', 'Teams currently redesigning each email from scratch', 'Brands wanting consistent email visual identity'],
     '[{"question":"Which email platforms are supported?","answer":"Share your email platform in the brief and the template is built to import cleanly into it."},{"question":"Will it display consistently across email clients?","answer":"Yes, it is built and tested against common email client rendering differences."}]'::jsonb),
    ('design-creative', 'accessibility-design-review', 'Accessibility-Focused Design Review', 'An existing design reviewed against accessibility standards.',
     'NOVA AI reviews an existing design, contrast, type sizing, interaction patterns, against accessibility standards and recommends specific fixes.', 'autonomous', 8,
     ARRAY['Contrast and type-sizing review', 'Interaction pattern accessibility review', 'Specific, actionable fix recommendations'],
     ARRAY['An accessibility review report', 'Specific, prioritized fix recommendations'],
     ARRAY['WCAG'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Design teams wanting an accessibility check before build', 'Products preparing for an accessibility compliance review', 'Teams retrofitting accessibility into an existing design'],
     '[{"question":"What design formats can you review?","answer":"Figma files or equivalent design-tool exports; share your file and NOVA AI will confirm fit."},{"question":"Do you also implement the fixes?","answer":"This service delivers the review and recommendations; implementation is scoped separately or covered by Website Accessibility Audit for a live site."}]'::jsonb),

    ('data-business', 'data-pipeline-automation', 'Data Pipeline Automation', 'A recurring ETL pipeline built and scheduled for your data sources.',
     'NOVA AI builds a recurring pipeline that pulls, cleans, and loads your data on a schedule, removing manual data-wrangling from your workflow.', 'autonomous', 6,
     ARRAY['ETL pipeline design and build', 'Scheduled, recurring data processing', 'Pipeline monitoring and error handling'],
     ARRAY['A working, scheduled data pipeline', 'Monitoring for pipeline failures', 'Documentation of the pipeline stages'],
     ARRAY['ETL', 'Apache Spark'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Teams manually re-running data imports on a schedule', 'Operations combining data from multiple recurring sources', 'Businesses scaling past manual spreadsheet workflows'],
     '[{"question":"What data sources can this pull from?","answer":"Share your sources in the brief and NOVA AI will confirm compatibility."},{"question":"What happens if a pipeline run fails?","answer":"Monitoring and error handling are built in, so failures are visible rather than silent."}]'::jsonb),
    ('data-business', 'survey-feedback-analysis', 'Survey & Feedback Analysis', 'Open-ended survey and feedback responses turned into structured insights.',
     'NOVA AI analyzes open-ended survey or feedback responses and structures them into clear themes and sentiment, rather than leaving them as an unreadable pile of text.', 'autonomous', 7,
     ARRAY['Open-ended response theme extraction', 'Sentiment analysis', 'Structured insight reporting'],
     ARRAY['A structured summary of themes and sentiment', 'Representative quotes supporting each theme'],
     ARRAY['NLP', 'Sentiment analysis'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Teams running customer or employee feedback surveys', 'Product teams with a backlog of unread open-ended responses', 'Businesses wanting recurring feedback analysis'],
     '[{"question":"What survey formats can you work with?","answer":"Common formats like CSV exports from survey tools; share your format and NOVA AI will confirm fit."},{"question":"How is sentiment measured?","answer":"Responses are analyzed for overall tone alongside the extracted themes, not scored in isolation."}]'::jsonb),
    ('data-business', 'financial-reporting-dashboard', 'Financial Reporting Dashboard', 'A dashboard built specifically for your financial metrics.',
     'A working dashboard connected to your financial data source, tracking the metrics your team actually reviews: revenue, expenses, and cash flow.', 'autonomous', 8,
     ARRAY['Financial data source connection', 'Revenue, expense, and cash flow tracking', 'Dashboard layout matched to real reporting needs'],
     ARRAY['A working financial reporting dashboard', 'Connected, live financial data views'],
     ARRAY['Power BI', 'Financial reporting'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Finance teams tracking metrics manually today', 'Businesses wanting recurring visibility into cash flow', 'Operations needing a single source of financial truth'],
     '[{"question":"What financial data sources are supported?","answer":"Share your accounting or finance data source in the brief and NOVA AI will confirm compatibility."},{"question":"Does the dashboard update automatically?","answer":"Yes, it is connected to your live data source rather than built from a static snapshot."}]'::jsonb),

    ('software-development', 'nextjs-application-development', 'Next.js Application Development', 'A full application built specifically in Next.js.',
     'NOVA AI builds a complete application in Next.js, combining frontend, server-side rendering, and API routes in a single production-grade framework.', 'autonomous', 6,
     ARRAY['Full-stack Next.js application build', 'Server-side rendering and static generation', 'API route implementation'],
     ARRAY['A complete, working Next.js application', 'Source code ready for deployment'],
     ARRAY['Next.js', 'TypeScript'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Teams standardizing on Next.js for new projects', 'Products needing SEO-friendly server-rendered pages', 'Startups wanting a single framework for frontend and backend'],
     '[{"question":"How is this different from MVP Development?","answer":"This service is specifically a Next.js build; MVP Development covers broader product scope and may use a different stack depending on your requirements."},{"question":"Is the application tested before delivery?","answer":"Yes, it is built and tested against your defined requirements before delivery."}]'::jsonb),
    ('software-development', 'third-party-api-integration', 'Third-Party API Integration', 'An external API (payments, messaging, etc.) integrated into your existing app.',
     'NOVA AI integrates a defined third-party API, such as a payment processor or messaging service, into your existing application, including error handling for real-world failure cases.', 'autonomous', 7,
     ARRAY['Third-party API integration', 'Error and failure-case handling', 'Integration testing against your existing app'],
     ARRAY['A working integration with the specified third-party API', 'Error handling for common failure cases', 'Verification against your existing application'],
     ARRAY['REST APIs', 'Webhooks'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Products needing payments, messaging, or another third-party capability', 'Teams without bandwidth to research and implement a new API themselves', 'Applications extending existing functionality'],
     '[{"question":"Which third-party APIs can be integrated?","answer":"Share the specific API in your brief and NOVA AI will confirm compatibility and scope."},{"question":"Do you handle the third-party account setup too?","answer":"Account setup with the third party is your responsibility; NOVA AI handles the integration once credentials are available."}]'::jsonb),
    ('software-development', 'database-schema-design-migration', 'Database Schema Design & Migration', 'A database schema designed or migrated for your application''s real data needs.',
     'NOVA AI designs a new database schema, or migrates an existing one, based on your application''s actual data and query patterns.', 'autonomous', 8,
     ARRAY['Database schema design', 'Migration planning and execution', 'Query-pattern-informed structure'],
     ARRAY['A designed or migrated database schema', 'Migration scripts', 'Verification against your existing data'],
     ARRAY['PostgreSQL', 'SQL'],
     ARRAY['Requirements & research', 'AI-driven build', 'Automated QA & review', 'Delivery'],
     ARRAY['Applications outgrowing their original schema', 'New projects needing a schema designed from real requirements', 'Teams migrating between database structures'],
     '[{"question":"Will this affect my existing data?","answer":"Migration scripts are built and verified against your existing data before being considered complete."},{"question":"What database systems are supported?","answer":"Share your database system in the brief and NOVA AI will confirm compatibility."}]'::jsonb),

    ('cloud-infrastructure', 'multi-cloud-migration-assessment', 'Multi-Cloud Migration Assessment', 'An assessment of your application''s readiness to migrate to Azure or GCP.',
     'NOVA AI reviews your current application and infrastructure and produces a concrete assessment of what migrating to Azure or GCP would involve, including effort and compatibility gaps.', 'autonomous', 6,
     ARRAY['Migration readiness assessment', 'Cross-cloud compatibility review', 'Effort and gap analysis'],
     ARRAY['A migration readiness assessment report', 'A concrete list of compatibility gaps', 'An effort estimate for the migration'],
     ARRAY['Azure', 'Google Cloud Platform'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Businesses considering a move off their current cloud provider', 'Teams evaluating multi-cloud or cloud-diversification strategy', 'Organizations with compliance-driven cloud requirements'],
     '[{"question":"Does this include the actual migration?","answer":"This service delivers the assessment; the migration itself is scoped separately once you have decided to proceed."},{"question":"Which cloud providers can this assess?","answer":"Azure and GCP are covered directly; share your current provider in the brief."}]'::jsonb),
    ('cloud-infrastructure', 'auto-scaling-configuration', 'Auto-Scaling Configuration', 'Auto-scaling configured for your infrastructure to handle variable load.',
     'NOVA AI configures auto-scaling rules so your infrastructure grows and shrinks with real traffic. Because this affects how live production infrastructure behaves under load, the configuration is reviewed before activation.', 'approval_required', 7,
     ARRAY['Auto-scaling rule configuration', 'Load-based scaling policy design', 'Review before activation on production traffic'],
     ARRAY['Configured auto-scaling for your infrastructure', 'A review step before activation', 'Documentation of the scaling rules'],
     ARRAY['Cloud auto-scaling'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Human review & approval', 'Delivery'],
     ARRAY['Applications with variable or unpredictable traffic', 'Teams currently over-provisioning to handle peak load manually', 'Infrastructure preparing for a traffic-heavy launch'],
     '[{"question":"Does a human review this before it goes live?","answer":"Yes. Because this affects how live production infrastructure behaves under load, the configuration is reviewed before activation."},{"question":"Will this reduce my infrastructure costs?","answer":"It typically reduces over-provisioning costs during low-traffic periods, though exact savings depend on your traffic pattern."}]'::jsonb),
    ('cloud-infrastructure', 'cost-optimization-review', 'Cost Optimization Review', 'A review of your cloud spend with savings applied directly.',
     'NOVA AI reviews your cloud spend for over-provisioned or unused resources and applies the safe optimizations directly, rather than just producing a report.', 'autonomous', 8,
     ARRAY['Cloud spend analysis', 'Over-provisioned resource identification', 'Direct application of safe optimizations'],
     ARRAY['A cloud cost review with findings', 'Safe optimizations applied directly', 'An estimated savings summary'],
     ARRAY['Cloud cost analysis'],
     ARRAY['Assessment', 'Configuration & implementation', 'Validation & testing', 'Delivery'],
     ARRAY['Teams with cloud spend that has grown without regular review', 'Businesses wanting cost accountability on infrastructure', 'Organizations preparing for a budget review'],
     '[{"question":"Will this risk breaking anything in production?","answer":"Only safe, verified optimizations are applied directly; anything with real risk is flagged for your review instead."},{"question":"How much can I expect to save?","answer":"Savings depend entirely on your actual usage; the review includes a concrete estimate based on what is found."}]'::jsonb),

    ('defensive-cybersecurity', 'api-security-review', 'API Security Review', 'Your API reviewed for common security issues.',
     'NOVA AI reviews your API for common security issues such as broken authentication, excessive data exposure, and missing rate limiting, and reports what it finds.', 'autonomous', 6,
     ARRAY['Authentication and authorization review', 'Data exposure review', 'Rate limiting and abuse-prevention review'],
     ARRAY['An API security review report', 'Prioritized findings and recommendations'],
     ARRAY['API security'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['APIs that have never had a dedicated security review', 'Teams exposing new endpoints to external consumers', 'Businesses preparing for a security audit'],
     '[{"question":"Do you need production access to review the API?","answer":"API documentation and a test or staging environment are typically enough; production access is not required."},{"question":"Do you also fix the issues found?","answer":"This service delivers the review; Bug Fixing & Code Refactoring can apply the fixes as a follow-up."}]'::jsonb),
    ('defensive-cybersecurity', 'access-control-permissions-audit', 'Access Control & Permissions Audit', 'User and role permissions across your system reviewed for over-privileged access.',
     'NOVA AI reviews user and role permissions across your system to identify over-privileged accounts and unused access, and reports what it finds.', 'autonomous', 7,
     ARRAY['Role and permission mapping', 'Over-privileged account identification', 'Unused access identification'],
     ARRAY['An access control audit report', 'A list of over-privileged or unused accounts', 'Prioritized recommendations'],
     ARRAY['Access control review'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Systems with permissions that have grown unmanaged over time', 'Teams preparing for a compliance or security review', 'Businesses with employee turnover requiring access cleanup'],
     '[{"question":"What systems can this review?","answer":"Share the systems and how roles/permissions are managed in your brief and NOVA AI will confirm fit."},{"question":"Do you remove the access directly?","answer":"This service delivers findings and recommendations; removing access is a decision for your own team to action."}]'::jsonb),
    ('defensive-cybersecurity', 'incident-response-readiness-review', 'Incident Response Readiness Review', 'A review of how ready your team is to respond to a real security incident.',
     'NOVA AI reviews your existing monitoring, alerting, and response documentation against a real incident-response readiness checklist, and reports the gaps.', 'autonomous', 8,
     ARRAY['Monitoring and alerting coverage review', 'Response documentation review', 'Gap analysis against a readiness checklist'],
     ARRAY['An incident response readiness report', 'A prioritized list of gaps', 'Recommendations for closing each gap'],
     ARRAY['Incident response'],
     ARRAY['Data intake & scoping', 'Analysis', 'Validation', 'Delivery'],
     ARRAY['Teams that have never tested their incident response process', 'Businesses preparing for a compliance requirement', 'Organizations after a near-miss security event'],
     '[{"question":"Does this include running a real incident drill?","answer":"This service reviews your existing readiness against a checklist; a live drill can be scoped as a separate follow-up."},{"question":"What if we do not have any documented process yet?","answer":"That is a common and useful finding in itself; the review will recommend where to start."}]'::jsonb)
) AS v(category_slug, slug, name, short_description, description, automation_level, display_order, capabilities, deliverables, technologies, process, suited_industries, faqs)
JOIN public.service_categories sc ON sc.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;
