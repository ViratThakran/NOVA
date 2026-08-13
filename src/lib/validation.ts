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
