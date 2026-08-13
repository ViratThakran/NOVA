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
  -- GoTrue requires these on every auth.users row for password sign-in to succeed.
  -- instance_id: GoTrue's multi-instance support is deprecated; auth.instances is
  -- empty in this local install, and the nil UUID is the convention every row uses.
  -- aud/role: must match GOTRUE_JWT_AUD / GOTRUE_JWT_DEFAULT_GROUP_NAME, confirmed
  -- against the running local auth container to both be 'authenticated'.
  v_instance_id CONSTANT uuid := '00000000-0000-0000-0000-000000000000';
  v_aud         CONSTANT text := 'authenticated';
  v_role        CONSTANT text := 'authenticated';

  student_a_id UUID := gen_random_uuid();
  student_b_id UUID := gen_random_uuid();
  admin_id     UUID := gen_random_uuid();
  internship_id UUID := gen_random_uuid();
  -- Second open internship, deliberately left with no pre-existing application,
  -- for tests that need to exercise application *creation* (Student A already
  -- has an application against `internship_id` above, so reusing it would
  -- collide with the unique_student_internship constraint).
  internship_unclaimed_id UUID := gen_random_uuid();
BEGIN
  -- Create Student A in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_user_meta_data
  ) VALUES (
    v_instance_id,
    student_a_id,
    v_aud,
    v_role,
    'student-a@test.nova',
    extensions.crypt('TestPassword123!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '', '', '', '',
    '{"first_name": "Alice", "last_name": "Student"}'::jsonb
  ) ON CONFLICT (email) WHERE is_sso_user = false DO NOTHING;

  -- Create Student B in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_user_meta_data
  ) VALUES (
    v_instance_id,
    student_b_id,
    v_aud,
    v_role,
    'student-b@test.nova',
    extensions.crypt('TestPassword123!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '', '', '', '',
    '{"first_name": "Bob", "last_name": "Student"}'::jsonb
  ) ON CONFLICT (email) WHERE is_sso_user = false DO NOTHING;

  -- Create Admin user in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_user_meta_data
  ) VALUES (
    v_instance_id,
    admin_id,
    v_aud,
    v_role,
    'admin@test.nova',
    extensions.crypt('TestPassword123!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '', '', '', '',
    '{"first_name": "Test", "last_name": "Admin"}'::jsonb
  ) ON CONFLICT (email) WHERE is_sso_user = false DO NOTHING;

  -- Create matching auth.identities rows (provider='email'). GoTrue's own user
  -- creation path always writes one; without it some client/session flows that
  -- read identities can behave inconsistently even though password grant itself
  -- checks auth.users directly.
  INSERT INTO auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES
    (student_a_id, student_a_id::text, 'email',
     jsonb_build_object('sub', student_a_id::text, 'email', 'student-a@test.nova', 'email_verified', true, 'phone_verified', false),
     now(), now(), now()),
    (student_b_id, student_b_id::text, 'email',
     jsonb_build_object('sub', student_b_id::text, 'email', 'student-b@test.nova', 'email_verified', true, 'phone_verified', false),
     now(), now(), now()),
    (admin_id, admin_id::text, 'email',
     jsonb_build_object('sub', admin_id::text, 'email', 'admin@test.nova', 'email_verified', true, 'phone_verified', false),
     now(), now(), now())
  ON CONFLICT (provider_id, provider) DO NOTHING;

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

  -- Second open internship with no pre-existing application — see declaration comment above.
  INSERT INTO public.internships (id, title, description, requirements, eligibility, status)
  VALUES (
    internship_unclaimed_id,
    'Test Data Internship — Unclaimed',
    'A second seeded open internship with no pre-existing application, reserved for tests that create a new application.',
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
