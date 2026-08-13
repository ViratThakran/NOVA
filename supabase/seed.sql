-- Supabase Seed Script
-- Creates test users for local integration test suite ONLY.
-- This file is loaded by `npx supabase db seed` or applied during `supabase start`.
-- DO NOT use in production. These accounts exist only in the local emulator.

-- Insert test users directly into auth.users (service role only, local dev context)
-- Passwords are hashed using bcrypt. The plaintext for all is: TestPassword123!

-- Note: In practice with the Supabase CLI, test users are created via:
--   supabase/tests/fixtures.sql using the service-role admin API
-- Below is the administrative seed for local dev only.

DO $$
DECLARE
  student_a_id UUID := gen_random_uuid();
  student_b_id UUID := gen_random_uuid();
  admin_id     UUID := gen_random_uuid();
  internship_id UUID := gen_random_uuid();
BEGIN
  -- Create Student A in auth.users
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data
  ) VALUES (
    student_a_id,
    'student-a@test.nova',
    crypt('TestPassword123!', gen_salt('bf')),
    now(), now(), now(),
    '{"first_name": "Alice", "last_name": "Student"}'::jsonb
  ) ON CONFLICT (email) WHERE is_sso_user = false DO NOTHING;

  -- Create Student B in auth.users
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data
  ) VALUES (
    student_b_id,
    'student-b@test.nova',
    crypt('TestPassword123!', gen_salt('bf')),
    now(), now(), now(),
    '{"first_name": "Bob", "last_name": "Student"}'::jsonb
  ) ON CONFLICT (email) WHERE is_sso_user = false DO NOTHING;

  -- Create Admin user in auth.users
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data
  ) VALUES (
    admin_id,
    'admin@test.nova',
    crypt('TestPassword123!', gen_salt('bf')),
    now(), now(), now(),
    '{"first_name": "Test", "last_name": "Admin"}'::jsonb
  ) ON CONFLICT (email) WHERE is_sso_user = false DO NOTHING;

  -- Escalate admin user's role (trigger sets 'student', override here for test admin)
  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = admin_id AND role = 'student';

  -- Create student profiles for test students
  INSERT INTO public.student_profiles (id, education_info, skills)
  VALUES
    (student_a_id, '{"school": "Test University", "degree": "CS", "grad_year": 2027}', ARRAY['TypeScript', 'SQL']),
    (student_b_id, '{"school": "Test University", "degree": "Engineering", "grad_year": 2026}', ARRAY['Python', 'ML'])
  ON CONFLICT (id) DO NOTHING;

  -- Create a test open internship
  INSERT INTO public.internships (id, title, description, requirements, eligibility, status)
  VALUES (
    internship_id,
    'Test Software Engineering Internship',
    'A test internship for integration testing purposes.',
    'Basic programming skills required.',
    'Open to students in their 2nd year or above.',
    'open'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create a test pending application for Student A
  INSERT INTO public.applications (student_id, internship_id, cover_letter, status)
  VALUES (
    student_a_id,
    internship_id,
    'I am very interested in this internship opportunity and believe I am a strong candidate.',
    'pending'
  ) ON CONFLICT ON CONSTRAINT unique_student_internship DO NOTHING;

END $$;
