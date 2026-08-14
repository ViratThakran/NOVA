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
