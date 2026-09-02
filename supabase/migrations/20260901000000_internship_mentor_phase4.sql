-- =========================================================================
-- NOVA AI INTERNSHIP MENTOR — PHASE 4 ADAPTIVE LEARNING STATE MIGRATION
-- =========================================================================
-- Establishes persistent longitudinal student state, adaptive skill ratings,
-- tracked weaknesses/repeated errors, milestone progress, and capstone tracking.

-- 1. Student Learning States Table
-- Tracks adaptive progression, skill confidence, weaknesses, and difficulty recommendations.
CREATE TABLE IF NOT EXISTS public.student_learning_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
    current_milestone_index integer NOT NULL DEFAULT 0,
    completed_milestones integer[] NOT NULL DEFAULT '{}'::integer[],
    active_task_id uuid REFERENCES public.internship_tasks(id) ON DELETE SET NULL,
    total_submissions integer NOT NULL DEFAULT 0,
    passed_submissions integer NOT NULL DEFAULT 0,
    average_score numeric NOT NULL DEFAULT 0,
    learning_velocity numeric NOT NULL DEFAULT 1.0,
    current_difficulty text NOT NULL DEFAULT 'beginner' CHECK (current_difficulty IN ('beginner', 'intermediate', 'advanced')),
    difficulty_recommendation text NOT NULL DEFAULT 'MAINTAIN' CHECK (difficulty_recommendation IN ('SCALE_UP', 'MAINTAIN', 'SCAFFOLD')),
    skill_ratings jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of StudentSkillAssessment objects
    observed_strengths text[] NOT NULL DEFAULT '{}'::text[],
    observed_weaknesses text[] NOT NULL DEFAULT '{}'::text[],
    repeated_errors text[] NOT NULL DEFAULT '{}'::text[],
    next_recommended_focus text,
    capstone_progress_percentage integer NOT NULL DEFAULT 0 CHECK (capstone_progress_percentage >= 0 AND capstone_progress_percentage <= 100),
    last_evaluated_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_enrollment_learning_state UNIQUE (enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_student_learning_states_student_id ON public.student_learning_states(student_id);
CREATE INDEX IF NOT EXISTS idx_student_learning_states_enrollment_id ON public.student_learning_states(enrollment_id);

-- 2. Enrollment Milestones Progress Table
-- Tracks milestone completion grade and timestamp per enrollment.
CREATE TABLE IF NOT EXISTS public.enrollment_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    milestone_index integer NOT NULL,
    title text NOT NULL,
    status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'completed')),
    completed_task_count integer NOT NULL DEFAULT 0,
    average_score numeric,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_enrollment_milestone UNIQUE (enrollment_id, milestone_index)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_milestones_enrollment ON public.enrollment_milestones(enrollment_id);

-- Enable RLS
ALTER TABLE public.student_learning_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for student_learning_states
CREATE POLICY "Students can view own learning state" ON public.student_learning_states
    FOR SELECT TO authenticated
    USING (auth.uid() = student_id OR public.is_current_user_admin());

CREATE POLICY "Admins can manage student learning states" ON public.student_learning_states
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- Policies for enrollment_milestones
CREATE POLICY "Students can view own enrollment milestones" ON public.enrollment_milestones
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.id = enrollment_milestones.enrollment_id
            AND e.student_id = auth.uid()
        )
        OR public.is_current_user_admin()
    );

CREATE POLICY "Admins can manage enrollment milestones" ON public.enrollment_milestones
    FOR ALL TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());
