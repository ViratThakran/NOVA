import { describe, it, expect } from "vitest";
import { profileUpdateSchema, onboardingSchema, applicationSchema, reviewSchema } from "../../src/lib/validation";

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
  });

  describe("Application Submission Schema", () => {
    it("should reject short cover letters", () => {
      const result = applicationSchema.safeParse({
        internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        cover_letter: "Too short",
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

    it("should reject invalid status actions", () => {
      const result = reviewSchema.safeParse({
        application_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        status: "pending_review", // invalid enum value
      });
      expect(result.success).toBe(false);
    });
  });
});
