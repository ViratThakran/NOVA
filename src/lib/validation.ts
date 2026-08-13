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
