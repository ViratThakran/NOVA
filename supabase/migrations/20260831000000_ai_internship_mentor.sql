-- Persistent AI internship mentor workflow.
-- The existing review_application() RPC creates enrollments atomically.
-- This trigger attaches exactly one durable mentor journey to each enrollment.

CREATE TABLE public.internship_ai_journeys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'pending_setup' CHECK (status IN ('pending_setup','active','completed','paused','failed')),
    current_sequence integer NOT NULL DEFAULT 0 CHECK (current_sequence >= 0),
    target_task_count integer NOT NULL DEFAULT 6 CHECK (target_task_count BETWEEN 1 AND 24),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.internship_ai_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id uuid NOT NULL REFERENCES public.internship_ai_journeys(id) ON DELETE CASCADE,
    sequence_no integer NOT NULL CHECK (sequence_no > 0),
    title text NOT NULL,
    objective text NOT NULL,
    instructions text NOT NULL,
    deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
    acceptance_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
    estimated_hours integer NOT NULL DEFAULT 4 CHECK (estimated_hours BETWEEN 1 AND 80),
    status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','submitted','needs_revision','completed','cancelled')),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (journey_id, sequence_no)
);

CREATE TABLE public.internship_ai_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.internship_ai_tasks(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    submission_url text,
    submission_text text,
    status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed')),
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (NULLIF(btrim(COALESCE(submission_url,'')), '') IS NOT NULL OR NULLIF(btrim(COALESCE(submission_text,'')), '') IS NOT NULL)
);

CREATE TABLE public.internship_ai_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid NOT NULL UNIQUE REFERENCES public.internship_ai_submissions(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES public.internship_ai_tasks(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
    verdict text NOT NULL CHECK (verdict IN ('passed','needs_revision')),
    score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
    summary text NOT NULL,
    strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
    improvements jsonb NOT NULL DEFAULT '[]'::jsonb,
    next_step text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.internship_ai_email_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id uuid NOT NULL REFERENCES public.internship_ai_journeys(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dedupe_key text NOT NULL UNIQUE,
    template text NOT NULL CHECK (template IN ('internship_welcome','task_ready','feedback_ready','internship_completed')),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    sent_at timestamptz
);

CREATE INDEX idx_internship_ai_journeys_student ON public.internship_ai_journeys(student_id);
CREATE INDEX idx_internship_ai_journeys_status ON public.internship_ai_journeys(status);
CREATE INDEX idx_internship_ai_tasks_journey ON public.internship_ai_tasks(journey_id);
CREATE INDEX idx_internship_ai_submissions_task ON public.internship_ai_submissions(task_id);
CREATE INDEX idx_internship_ai_reviews_student ON public.internship_ai_reviews(student_id);
CREATE INDEX idx_internship_ai_email_outbox_pending ON public.internship_ai_email_outbox(status, created_at);

CREATE TRIGGER update_internship_ai_journeys_modtime
    BEFORE UPDATE ON public.internship_ai_journeys
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_internship_ai_tasks_modtime
    BEFORE UPDATE ON public.internship_ai_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE OR REPLACE FUNCTION public.bootstrap_internship_ai_journey()
RETURNS trigger AS $$
DECLARE journey_uuid uuid;
BEGIN
    INSERT INTO public.internship_ai_journeys (enrollment_id, student_id, internship_id)
    VALUES (NEW.id, NEW.student_id, NEW.internship_id)
    ON CONFLICT (enrollment_id) DO UPDATE SET updated_at = timezone('utc'::text, now())
    RETURNING id INTO journey_uuid;

    INSERT INTO public.internship_ai_email_outbox (journey_id, user_id, dedupe_key, template, payload)
    VALUES (journey_uuid, NEW.student_id, 'internship-welcome:' || NEW.id::text, 'internship_welcome', jsonb_build_object('enrollment_id', NEW.id, 'internship_id', NEW.internship_id))
    ON CONFLICT (dedupe_key) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.bootstrap_internship_ai_journey() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_internship_ai_journey() FROM authenticated;

CREATE TRIGGER on_enrollment_create_ai_journey
    AFTER INSERT ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.bootstrap_internship_ai_journey();

ALTER TABLE public.internship_ai_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_ai_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_ai_email_outbox ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.internship_ai_journeys TO authenticated;
GRANT SELECT ON public.internship_ai_tasks TO authenticated;
GRANT SELECT, INSERT ON public.internship_ai_submissions TO authenticated;
GRANT SELECT ON public.internship_ai_reviews TO authenticated;

CREATE POLICY "Students read own AI internship journeys or admins read all" ON public.internship_ai_journeys
    FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_current_user_admin());
CREATE POLICY "Students read own AI internship tasks or admins read all" ON public.internship_ai_tasks
    FOR SELECT TO authenticated USING (
        public.is_current_user_admin() OR EXISTS (SELECT 1 FROM public.internship_ai_journeys j WHERE j.id = journey_id AND j.student_id = auth.uid())
    );
CREATE POLICY "Students read own AI internship submissions or admins read all" ON public.internship_ai_submissions
    FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_current_user_admin());
CREATE POLICY "Students submit own actionable AI internship work" ON public.internship_ai_submissions
    FOR INSERT TO authenticated WITH CHECK (
        student_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.internship_ai_tasks t
            JOIN public.internship_ai_journeys j ON j.id = t.journey_id
            WHERE t.id = task_id AND j.student_id = auth.uid() AND j.status = 'active' AND t.status IN ('assigned','needs_revision')
        )
    );
CREATE POLICY "Students read own AI internship reviews or admins read all" ON public.internship_ai_reviews
    FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_current_user_admin());

-- No authenticated/anon grants on the email outbox: only the server-side AI worker can process it.
