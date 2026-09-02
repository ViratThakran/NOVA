-- =========================================================================
-- NOVA AI INTERNSHIP MENTOR — PHASE 3 PERSISTENCE MIGRATION
-- =========================================================================
-- Establishes persistent state for internship tasks, multi-attempt submissions,
-- runtime sandbox execution jobs, factual runtime evidence, and AI mentor reviews.
-- Every table is secured with Row Level Security (RLS) guaranteeing strict student isolation.

-- 1. Internship Tasks Table
-- Persistent record of a generated/assigned task for an active student enrollment.
CREATE TABLE IF NOT EXISTS public.internship_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE RESTRICT,
    milestone_index integer NOT NULL DEFAULT 0,
    title text NOT NULL,
    objective text NOT NULL,
    business_context text NOT NULL,
    instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
    deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
    acceptance_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
    skills_practiced text[] NOT NULL DEFAULT '{}'::text[],
    difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours numeric NOT NULL DEFAULT 4,
    status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'submitted', 'in_review', 'completed', 'needs_revision', 'cancelled')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_internship_tasks_student_id ON public.internship_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_tasks_enrollment_id ON public.internship_tasks(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_internship_tasks_status ON public.internship_tasks(status);

-- 2. Internship Submissions Table
-- Multi-attempt submissions tied to an immutable commit SHA.
CREATE TABLE IF NOT EXISTS public.internship_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    submission_type text NOT NULL DEFAULT 'github' CHECK (submission_type IN ('github', 'figma', 'document', 'url')),
    github_url text NOT NULL,
    branch text NOT NULL DEFAULT 'main',
    commit_sha text NOT NULL, -- Pinned immutable Git commit SHA (never latest branch pointer)
    student_explanation text NOT NULL,
    attempt_number integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'collecting_evidence', 'running_verification', 'in_review',
        'passed', 'needs_revision', 'manual_review', 'failed'
    )),
    submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_task_attempt UNIQUE (task_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_internship_submissions_task_id ON public.internship_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_internship_submissions_student_id ON public.internship_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_submissions_commit_sha ON public.internship_submissions(commit_sha);

-- 3. Execution Jobs Table
-- Records out-of-process runtime sandbox execution requests with strict runner tracking.
CREATE TABLE IF NOT EXISTS public.execution_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL REFERENCES public.internship_submissions(id) ON DELETE CASCADE,
    repository text NOT NULL,
    commit_sha text NOT NULL,
    execution_profile text NOT NULL CHECK (execution_profile IN ('node_typescript', 'python', 'custom')),
    status text NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'preparing', 'running', 'completed', 'timed_out',
        'resource_exceeded', 'blocked', 'failed', 'cancelled', 'verification_unavailable'
    )),
    runner_version text NOT NULL DEFAULT '1.0',
    profile_version text NOT NULL DEFAULT '1.0',
    timeout_seconds integer NOT NULL DEFAULT 60,
    exit_code integer,
    duration_ms integer,
    requested_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_execution_jobs_submission_id ON public.execution_jobs(submission_id);
CREATE INDEX IF NOT EXISTS idx_execution_jobs_status ON public.execution_jobs(status);
CREATE INDEX IF NOT EXISTS idx_execution_jobs_commit_sha ON public.execution_jobs(commit_sha);

-- 4. Runtime Evidences Table
-- Factual execution evidence produced exclusively by the isolated verification runner.
CREATE TABLE IF NOT EXISTS public.runtime_evidences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_job_id uuid NOT NULL REFERENCES public.execution_jobs(id) ON DELETE CASCADE,
    submission_id uuid NOT NULL REFERENCES public.internship_submissions(id) ON DELETE CASCADE,
    commit_sha text NOT NULL,
    status text NOT NULL CHECK (status IN ('completed', 'timed_out', 'resource_exceeded', 'blocked', 'failed', 'verification_unavailable')),
    exit_code integer NOT NULL DEFAULT 0,
    duration_ms integer NOT NULL DEFAULT 0,
    tests_summary jsonb NOT NULL DEFAULT '{"total": 0, "passed": 0, "failed": 0, "skipped": 0}'::jsonb,
    build_summary jsonb NOT NULL DEFAULT '{"attempted": false, "status": "skipped"}'::jsonb,
    lint_summary jsonb NOT NULL DEFAULT '{"attempted": false, "status": "skipped"}'::jsonb,
    bounded_stdout text NOT NULL DEFAULT '', -- Max 64KB bounded log
    bounded_stderr text NOT NULL DEFAULT '', -- Max 64KB bounded log
    resource_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_runtime_evidences_submission_id ON public.runtime_evidences(submission_id);
CREATE INDEX IF NOT EXISTS idx_runtime_evidences_execution_job_id ON public.runtime_evidences(execution_job_id);

-- 5. Internship Reviews Table
-- Multi-attempt AI evaluations combining static AST evidence + factual runtime verification.
CREATE TABLE IF NOT EXISTS public.internship_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL REFERENCES public.internship_submissions(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
    attempt_number integer NOT NULL DEFAULT 1,
    verdict text NOT NULL CHECK (verdict IN ('passed', 'needs_revision', 'manual_review')),
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    summary text NOT NULL,
    criteria_results jsonb NOT NULL DEFAULT '[]'::jsonb, -- Includes static evidence and runtime test evidence
    technical_quality jsonb NOT NULL DEFAULT '{}'::jsonb,
    deliverables_evaluated jsonb NOT NULL DEFAULT '[]'::jsonb,
    strengths text[] NOT NULL DEFAULT '{}'::text[],
    improvements text[] NOT NULL DEFAULT '{}'::text[],
    next_step text NOT NULL,
    review_engine_version text NOT NULL DEFAULT '1.0',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_submission_review UNIQUE (submission_id)
);

CREATE INDEX IF NOT EXISTS idx_internship_reviews_submission_id ON public.internship_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_internship_reviews_task_id ON public.internship_reviews(task_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_reviews ENABLE ROW LEVEL SECURITY;

-- 1. internship_tasks RLS
CREATE POLICY "Students can view own assigned tasks" ON public.internship_tasks
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR public.is_current_user_admin());

CREATE POLICY "Admins can manage internship tasks" ON public.internship_tasks
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 2. internship_submissions RLS
CREATE POLICY "Students can view own submissions" ON public.internship_submissions
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR public.is_current_user_admin());

CREATE POLICY "Students can insert own submissions" ON public.internship_submissions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can manage submissions" ON public.internship_submissions
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 3. execution_jobs RLS
CREATE POLICY "Students can view own execution jobs" ON public.execution_jobs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internship_submissions s
            WHERE s.id = execution_jobs.submission_id AND (s.student_id = auth.uid() OR public.is_current_user_admin())
        )
    );

CREATE POLICY "Admins can manage execution jobs" ON public.execution_jobs
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 4. runtime_evidences RLS
CREATE POLICY "Students can view own runtime evidences" ON public.runtime_evidences
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internship_submissions s
            WHERE s.id = runtime_evidences.submission_id AND (s.student_id = auth.uid() OR public.is_current_user_admin())
        )
    );

CREATE POLICY "Admins can manage runtime evidences" ON public.runtime_evidences
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- 5. internship_reviews RLS
CREATE POLICY "Students can view own reviews" ON public.internship_reviews
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internship_submissions s
            WHERE s.id = internship_reviews.submission_id AND (s.student_id = auth.uid() OR public.is_current_user_admin())
        )
    );

CREATE POLICY "Admins can manage reviews" ON public.internship_reviews
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());
