import { describe, it, expect } from "vitest";
import {
  profileUpdateSchema,
  onboardingSchema,
  applicationSchema,
  reviewSchema,
  markUnderReviewSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../src/lib/validation";

describe("Security Validation Schemas", () => {
  describe("Profile Update Schema", () => {
    it("should accept valid profile names", () => {
      const result = profileUpdateSchema.safeParse({
        first_name: "John",
        last_name: "Doe",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty names", () => {
      const result = profileUpdateSchema.safeParse({
        first_name: "",
        last_name: "Doe",
      });
      expect(result.success).toBe(false);
    });

    it("should reject extra/unauthorized fields in strict mode if applicable", () => {
      // By default zod strips extra keys unless strict is used.
      // Let's assert that only first_name and last_name are outputted, and roles are ignored.
      const parsed = profileUpdateSchema.parse({
        first_name: "John",
        last_name: "Doe",
        role: "admin",
        id: "some-uuid",
      });
      expect(parsed).not.toHaveProperty("role");
      expect(parsed).not.toHaveProperty("id");
    });
  });

  describe("Student Onboarding Schema", () => {
    it("should accept valid student onboarding records", () => {
      const result = onboardingSchema.safeParse({
        education_info: {
          school: "Tech University",
          degree: "Computer Science",
          grad_year: 2027,
        },
        skills: ["TypeScript", "SQL"],
        resume_path: "resumes/user-uuid/resume.pdf",
        resume_size: 1024 * 1024, // 1MB
      });
      expect(result.success).toBe(true);
    });

    it("should reject large file sizes", () => {
      const result = onboardingSchema.safeParse({
        education_info: {
          school: "Tech University",
          degree: "Computer Science",
          grad_year: 2027,
        },
        skills: ["TypeScript"],
        resume_path: "resumes/user-uuid/resume.pdf",
        resume_size: 6 * 1024 * 1024, // 6MB (max is 5MB)
      });
      expect(result.success).toBe(false);
    });

    it("should reject a missing school", () => {
      const result = onboardingSchema.safeParse({
        education_info: { school: "", degree: "Computer Science", grad_year: 2027 },
        skills: ["TypeScript"],
        resume_path: "user-uuid/resume.pdf",
        resume_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject a missing degree", () => {
      const result = onboardingSchema.safeParse({
        education_info: { school: "Tech University", degree: "", grad_year: 2027 },
        skills: ["TypeScript"],
        resume_path: "user-uuid/resume.pdf",
        resume_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject a graduation year outside the allowed range", () => {
      const result = onboardingSchema.safeParse({
        education_info: { school: "Tech University", degree: "Computer Science", grad_year: 1999 },
        skills: ["TypeScript"],
        resume_path: "user-uuid/resume.pdf",
        resume_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject a non-numeric graduation year (e.g. NaN from an empty form field)", () => {
      const result = onboardingSchema.safeParse({
        education_info: { school: "Tech University", degree: "Computer Science", grad_year: Number("") },
        skills: ["TypeScript"],
        resume_path: "user-uuid/resume.pdf",
        resume_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject an empty skills array", () => {
      const result = onboardingSchema.safeParse({
        education_info: { school: "Tech University", degree: "Computer Science", grad_year: 2027 },
        skills: [],
        resume_path: "user-uuid/resume.pdf",
        resume_size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("should reject a missing resume_path", () => {
      const result = onboardingSchema.safeParse({
        education_info: { school: "Tech University", degree: "Computer Science", grad_year: 2027 },
        skills: ["TypeScript"],
        resume_path: "",
        resume_size: 1024,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Application Submission Schema", () => {
    it("should accept a valid application", () => {
      const result = applicationSchema.safeParse({
        internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        cover_letter: "I'm excited to apply for this internship and believe my skills are a strong fit.",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short cover letters", () => {
      const result = applicationSchema.safeParse({
        internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        cover_letter: "Too short",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a cover letter over 5000 characters", () => {
      const result = applicationSchema.safeParse({
        internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        cover_letter: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject a non-UUID internship_id", () => {
      const result = applicationSchema.safeParse({
        internship_id: "not-a-uuid",
        cover_letter: "I'm excited to apply for this internship and believe my skills are a strong fit.",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a missing internship_id", () => {
      const result = applicationSchema.safeParse({
        cover_letter: "I'm excited to apply for this internship and believe my skills are a strong fit.",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Admin Review Schema", () => {
    it("should accept valid accepted/rejected decisions", () => {
      const result = reviewSchema.safeParse({
        application_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        status: "accepted",
        feedback: "Solid technical background.",
      });
      expect(result.success).toBe(true);
    });

    it("should accept a review with no feedback (optional field)", () => {
      const result = reviewSchema.safeParse({
        application_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        status: "rejected",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status actions", () => {
      const result = reviewSchema.safeParse({
        application_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        status: "pending_review", // invalid enum value
      });
      expect(result.success).toBe(false);
    });

    it("should reject a non-UUID application_id", () => {
      const result = reviewSchema.safeParse({
        application_id: "not-a-uuid",
        status: "accepted",
      });
      expect(result.success).toBe(false);
    });

    it("should reject feedback over 1000 characters", () => {
      const result = reviewSchema.safeParse({
        application_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        status: "accepted",
        feedback: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Mark Under Review Schema", () => {
    it("should accept a valid application_id", () => {
      const result = markUnderReviewSchema.safeParse({
        application_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID application_id", () => {
      const result = markUnderReviewSchema.safeParse({ application_id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("should reject a missing application_id", () => {
      const result = markUnderReviewSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Register Schema", () => {
    it("should accept a valid registration", () => {
      const result = registerSchema.safeParse({
        first_name: "Alice",
        last_name: "Student",
        email: "alice@example.com",
        password: "correcthorse1",
      });
      expect(result.success).toBe(true);
    });

    it("should lowercase and trim the email", () => {
      const parsed = registerSchema.parse({
        first_name: "Alice",
        last_name: "Student",
        email: "  Alice@Example.com  ",
        password: "correcthorse1",
      });
      expect(parsed.email).toBe("alice@example.com");
    });

    it("should reject an invalid email", () => {
      const result = registerSchema.safeParse({
        first_name: "Alice",
        last_name: "Student",
        email: "not-an-email",
        password: "correcthorse1",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a password under 8 characters", () => {
      const result = registerSchema.safeParse({
        first_name: "Alice",
        last_name: "Student",
        email: "alice@example.com",
        password: "sh0rt",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a password over 72 characters (bcrypt truncation limit)", () => {
      const result = registerSchema.safeParse({
        first_name: "Alice",
        last_name: "Student",
        email: "alice@example.com",
        password: "a1".repeat(37), // 74 chars
      });
      expect(result.success).toBe(false);
    });

    it("should reject a password with no number", () => {
      const result = registerSchema.safeParse({
        first_name: "Alice",
        last_name: "Student",
        email: "alice@example.com",
        password: "noNumbersHere",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a password with no letter", () => {
      const result = registerSchema.safeParse({
        first_name: "Alice",
        last_name: "Student",
        email: "alice@example.com",
        password: "12345678",
      });
      expect(result.success).toBe(false);
    });

    it("has no role field at all — public registration cannot choose a role", () => {
      const parsed = registerSchema.parse({
        first_name: "Alice",
        last_name: "Student",
        email: "alice@example.com",
        password: "correcthorse1",
        role: "admin", // extra field, must be stripped
      });
      expect(parsed).not.toHaveProperty("role");
    });
  });

  describe("Login Schema", () => {
    it("should accept a valid login", () => {
      const result = loginSchema.safeParse({ email: "alice@example.com", password: "anything" });
      expect(result.success).toBe(true);
    });

    it("should reject an invalid email", () => {
      const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty password", () => {
      const result = loginSchema.safeParse({ email: "alice@example.com", password: "" });
      expect(result.success).toBe(false);
    });

    it("does not enforce password strength at login (only at registration)", () => {
      // A login attempt should never fail validation just because the
      // stored password happens to be short/simple — that's a signup-time
      // policy, not a login-time one.
      const result = loginSchema.safeParse({ email: "alice@example.com", password: "x" });
      expect(result.success).toBe(true);
    });
  });

  describe("Forgot Password Schema", () => {
    it("should accept a valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "alice@example.com" });
      expect(result.success).toBe(true);
    });

    it("should reject an invalid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });
  });

  describe("Reset Password Schema", () => {
    it("should accept matching valid passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "correcthorse1",
        confirmPassword: "correcthorse1",
      });
      expect(result.success).toBe(true);
    });

    it("should reject mismatched passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "correcthorse1",
        confirmPassword: "different1",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a weak new password even if confirmed correctly", () => {
      const result = resetPasswordSchema.safeParse({
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });
  });
});
