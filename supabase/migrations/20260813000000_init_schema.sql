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

-- 4. Transactional Function: Review Application (invoked by admins)
CREATE OR REPLACE FUNCTION public.review_application(
    app_uuid uuid,
    review_status text,
    feedback text
)
RETURNS boolean AS $$
DECLARE
    app_record public.applications%ROWTYPE;
BEGIN
    -- Verify actor is admin
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
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

-- 4b. Transactional Function: Mark Application Under Review (invoked by admins)
-- Companion to review_application() above: transitions pending -> under_review
-- only. No decision has been made yet, so it deliberately creates no
-- enrollment/notification — it only records that an admin has started
-- looking at the application. Follows the exact same conventions as
-- review_application(): SECURITY DEFINER with a function-level search_path
-- SET clause, an explicit admin check, a row lock, and a write_audit_log() call.
CREATE OR REPLACE FUNCTION public.mark_application_under_review(
    app_uuid uuid
)
RETURNS boolean AS $$
DECLARE
    app_record public.applications%ROWTYPE;
BEGIN
    -- Verify actor is admin
    IF NOT public.is_current_user_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User is not an administrator.';
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
--   - notifications:     SELECT, UPDATE   (own rows, read-flag only; INSERT is RPC-only)
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
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

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
