import { z } from "zod";

// Schema for updating a user's own profile
// Enforces that users cannot modify id, email, deactivated_at, or roles
export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
});

// Schema for student onboarding
export const onboardingSchema = z.object({
  education_info: z.object({
    school: z.string().min(1, "School name is required"),
    degree: z.string().min(1, "Degree is required"),
    grad_year: z.number().int().min(2000).max(2100),
  }),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  resume_path: z.string().min(1, "Resume file is required"),
  resume_size: z.number().int().max(5242880, "File size must not exceed 5MB"),
});

// Schema for editing a student's profile after onboarding — same academic
// shape as onboardingSchema minus the resume fields (replacing the resume
// is a separate action with its own file validation, not a form field here).
export const studentProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  education_info: z.object({
    school: z.string().min(1, "School name is required"),
    degree: z.string().min(1, "Degree is required"),
    grad_year: z.number().int().min(2000).max(2100),
  }),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
});

// Schema for submitting an application
export const applicationSchema = z.object({
  internship_id: z.string().uuid("Invalid internship ID"),
  cover_letter: z.string().min(10, "Cover letter must be at least 10 characters").max(5000),
});

// Schema for review action
export const reviewSchema = z.object({
  application_id: z.string().uuid("Invalid application ID"),
  status: z.enum(["accepted", "rejected"]),
  feedback: z.string().max(1000).optional(),
});

// Schema for marking an application under review
export const markUnderReviewSchema = z.object({
  application_id: z.string().uuid("Invalid application ID"),
});

// Schema for marking a single notification read
export const markNotificationReadSchema = z.object({
  notification_id: z.string().uuid("Invalid notification ID"),
});

// Schema for internship content — shared by create and edit, since both
// write the same four columns (status is handled separately below).
export const internshipSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  requirements: z.string().min(1, "Requirements are required").max(5000),
  eligibility: z.string().min(1, "Eligibility is required").max(5000),
});

// Schema for editing an existing internship's content
export const editInternshipSchema = internshipSchema.extend({
  internship_id: z.string().uuid("Invalid internship ID"),
});

// Schema for changing only an internship's status — the enum mirrors the
// internships.status CHECK constraint exactly, no invented states.
export const internshipStatusSchema = z.object({
  internship_id: z.string().uuid("Invalid internship ID"),
  status: z.enum(["draft", "open", "closed", "archived"]),
});

// Schema for creating a new company via create_company() — same name/
// description shape as companyProfileSchema below, but with no company_id
// since none exists yet. Deliberately collects nothing beyond what the
// companies table itself has columns for (see the migration's `companies`
// table: id, name, description, timestamps only).
export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  description: z.string().max(2000).optional(),
});

// Schema for updating a company's profile fields
export const companyProfileSchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  name: z.string().min(1, "Company name is required").max(200),
  description: z.string().max(2000).optional(),
});

// Schema for adding an existing user to a company by email. The email is
// resolved to a user id server-side via the find_user_for_company_membership()
// RPC (Phase 5B-3) — never trusted directly as an identifier.
export const addCompanyMemberSchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  email: z.string().trim().email("Enter a valid email address"),
  company_role: z.enum(["admin", "member"]),
});

export const updateCompanyMemberRoleSchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  member_user_id: z.string().uuid("Invalid user ID"),
  company_role: z.enum(["admin", "member"]),
});

export const removeCompanyMemberSchema = z.object({
  company_id: z.string().uuid("Invalid company ID"),
  member_user_id: z.string().uuid("Invalid user ID"),
});

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only");

// -----------------------------------------------------------------------
// Program/course catalog management schemas (Phase 10D.1)
// -----------------------------------------------------------------------
// Mirrors every column the programs/courses tables actually have (see the
// migration's `programs`/`courses` CREATE TABLE) — no invented fields.
// category/difficulty/level enums match the tables' own CHECK constraints
// exactly, the same discipline serviceSchema's automation_level follows.

export const programSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, "Name is required").max(200),
  short_description: z.string().min(1, "Short description is required").max(300),
  long_description: z.string().min(1, "Long description is required").max(5000),
  overview: z.string().max(5000).optional(),
  prerequisites: z.string().max(2000).optional(),
  category: z.enum([
    "ai_ml",
    "data_analytics",
    "software_development",
    "cybersecurity",
    "cloud_devops",
    "design",
    "emerging_tech",
  ]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration_weeks: z.coerce.number().int().min(1, "Duration must be at least 1 week"),
  // Submitted as a single newline-separated textarea field and split here —
  // matches how onboarding's comma-separated skills field is parsed in
  // completeOnboardingAction, same "one plain-text field, split server-side"
  // convention rather than a dynamic array-of-inputs form.
  career_outcomes: z
    .string()
    .max(2000)
    .optional()
    .transform((value) =>
      (value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const editProgramSchema = programSchema.extend({
  program_id: z.string().uuid("Invalid program ID"),
});

// Mirrors the programs.status CHECK constraint exactly — no invented states.
export const programStatusSchema = z.object({
  program_id: z.string().uuid("Invalid program ID"),
  status: z.enum(["draft", "published", "archived"]),
});

export const programSkillsSchema = z.object({
  program_id: z.string().uuid("Invalid program ID"),
  skill_ids: z.array(z.string().uuid()),
});

export const courseSchema = z.object({
  program_id: z.string().uuid("Invalid program"),
  slug: slugSchema,
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  overview: z.string().max(5000).optional(),
  prerequisites: z.string().max(2000).optional(),
  learning_outcomes: z
    .string()
    .max(2000)
    .optional()
    .transform((value) =>
      (value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  duration_hours: z.coerce.number().int().min(1, "Duration must be at least 1 hour"),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const editCourseSchema = courseSchema.extend({
  course_id: z.string().uuid("Invalid course ID"),
});

// Mirrors the courses.status CHECK constraint exactly.
export const courseStatusSchema = z.object({
  course_id: z.string().uuid("Invalid course ID"),
  status: z.enum(["draft", "published", "archived"]),
});

export const courseSkillsSchema = z.object({
  course_id: z.string().uuid("Invalid course ID"),
  skill_ids: z.array(z.string().uuid()),
});

// -----------------------------------------------------------------------
// Service catalog schemas (Phase 8A)
// -----------------------------------------------------------------------

// Schema for creating a service — content fields shared with editServiceSchema.
export const serviceSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  name: z.string().min(1, "Name is required").max(200),
  slug: slugSchema,
  short_description: z.string().min(1, "Short description is required").max(300),
  description: z.string().min(1, "Description is required").max(5000),
  // Mirrors the services.automation_level CHECK constraint exactly — no
  // "human_required" option, matching the AI-first catalog's own scope.
  automation_level: z.enum(["autonomous", "approval_required"]),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const editServiceSchema = serviceSchema.extend({
  service_id: z.string().uuid("Invalid service ID"),
});

// Schema for toggling only a service's publish state.
export const serviceStatusSchema = z.object({
  service_id: z.string().uuid("Invalid service ID"),
  published: z.boolean(),
});

// -----------------------------------------------------------------------
// Service request schemas (Phase 8B)
// -----------------------------------------------------------------------

// Schema for submitting a new service request. company_id is optional —
// present only when a company member is requesting on behalf of their
// company (see requireCompanyAccess()); omitted for a personal/student
// request. Never trusted as the sole authorization signal — the INSERT RLS
// policy independently re-verifies company membership regardless.
export const serviceRequestSchema = z.object({
  service_id: z.string().uuid("Invalid service"),
  company_id: z.string().uuid("Invalid company").optional(),
  details: z.string().min(1, "Please describe what you need").max(5000),
});

// Schema for admin accept/reject of a pending request — mirrors reviewSchema's shape.
export const reviewServiceRequestSchema = z.object({
  request_id: z.string().uuid("Invalid request ID"),
  decision: z.enum(["accepted", "rejected"]),
});

// Schema for advancing an accepted request through the delivery lifecycle.
// notes is required by the advance_service_request() RPC itself when
// new_status is 'delivered' — validated there, not duplicated here, so the
// one real rule stays in the one place that enforces it.
export const advanceServiceRequestSchema = z.object({
  request_id: z.string().uuid("Invalid request ID"),
  new_status: z.enum(["in_progress", "delivered", "completed"]),
  notes: z.string().max(5000).optional(),
});

export const cancelServiceRequestSchema = z.object({
  request_id: z.string().uuid("Invalid request ID"),
});

// -----------------------------------------------------------------------
// AI workforce orchestration schemas (Phase 8D)
// -----------------------------------------------------------------------

export const planServiceRequestSchema = z.object({
  request_id: z.string().uuid("Invalid request ID"),
});

export const runAiTaskSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
});

export const decideAiApprovalSchema = z.object({
  approval_id: z.string().uuid("Invalid approval ID"),
  decision: z.enum(["approved", "rejected"]),
});

// -----------------------------------------------------------------------
// Contact form schema (Phase 9)
// -----------------------------------------------------------------------

export const contactSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email address").max(320),
  company: z.string().max(200).optional(),
  message: z.string().min(1, "Please enter a message").max(5000),
});

export const contactSubmissionStatusSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID"),
  status: z.enum(["new", "reviewed"]),
});

// -----------------------------------------------------------------------
// Authentication schemas (Phase 3C)
// -----------------------------------------------------------------------

// Supabase/GoTrue hashes with bcrypt, which silently truncates at 72 bytes —
// rejecting longer passwords here avoids a password that "works" at signup
// but effectively loses its trailing characters.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be no more than 72 characters")
  .regex(/[A-Za-z]/, "Password must include at least one letter")
  .regex(/[0-9]/, "Password must include at least one number");

// Public registration only ever creates a 'student' — there is no role field
// here at all, so there is nothing for a client to escalate.
export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
