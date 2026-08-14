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
