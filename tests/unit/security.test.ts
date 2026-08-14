import { describe, it, expect } from "vitest";
import {
  profileUpdateSchema,
  onboardingSchema,
  applicationSchema,
  reviewSchema,
  markUnderReviewSchema,
  markNotificationReadSchema,
  internshipSchema,
  editInternshipSchema,
  internshipStatusSchema,
  serviceSchema,
  editServiceSchema,
  serviceStatusSchema,
  serviceRequestSchema,
  reviewServiceRequestSchema,
  advanceServiceRequestSchema,
  cancelServiceRequestSchema,
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

  describe("Mark Notification Read Schema", () => {
    it("should accept a valid notification_id", () => {
      const result = markNotificationReadSchema.safeParse({
        notification_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID notification_id", () => {
      const result = markNotificationReadSchema.safeParse({ notification_id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("should reject a missing notification_id", () => {
      const result = markNotificationReadSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Internship Content Schema", () => {
    const validInternship = {
      title: "Software Engineering Intern",
      description: "Work with the platform team on real features.",
      requirements: "Comfortable with TypeScript.",
      eligibility: "Open to students in their 2nd year or above.",
    };

    it("should accept valid internship content", () => {
      const result = internshipSchema.safeParse(validInternship);
      expect(result.success).toBe(true);
    });

    it("should reject an empty title", () => {
      const result = internshipSchema.safeParse({ ...validInternship, title: "" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty description", () => {
      const result = internshipSchema.safeParse({ ...validInternship, description: "" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty requirements field", () => {
      const result = internshipSchema.safeParse({ ...validInternship, requirements: "" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty eligibility field", () => {
      const result = internshipSchema.safeParse({ ...validInternship, eligibility: "" });
      expect(result.success).toBe(false);
    });

    it("should reject a title over 200 characters", () => {
      const result = internshipSchema.safeParse({ ...validInternship, title: "a".repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe("Edit Internship Schema", () => {
    it("should accept valid content plus an internship_id", () => {
      const result = editInternshipSchema.safeParse({
        internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        title: "Data Science Intern",
        description: "Analyze real datasets.",
        requirements: "Basic statistics.",
        eligibility: "Any enrolled student.",
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID internship_id", () => {
      const result = editInternshipSchema.safeParse({
        internship_id: "not-a-uuid",
        title: "Data Science Intern",
        description: "Analyze real datasets.",
        requirements: "Basic statistics.",
        eligibility: "Any enrolled student.",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Internship Status Schema", () => {
    it("should accept each real internship status", () => {
      for (const status of ["draft", "open", "closed", "archived"]) {
        const result = internshipStatusSchema.safeParse({
          internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject an invented status", () => {
      const result = internshipStatusSchema.safeParse({
        internship_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        status: "published",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a non-UUID internship_id", () => {
      const result = internshipStatusSchema.safeParse({ internship_id: "not-a-uuid", status: "open" });
      expect(result.success).toBe(false);
    });
  });

  describe("Service Schema", () => {
    const validService = {
      category_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
      name: "AI Website Creation",
      slug: "ai-website-creation",
      short_description: "A complete, production-ready website generated from a brief.",
      description: "NOVA AI turns a project brief into a full website.",
      automation_level: "autonomous",
      display_order: 1,
    };

    it("should accept valid service content", () => {
      const result = serviceSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID category_id", () => {
      const result = serviceSchema.safeParse({ ...validService, category_id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("should reject an empty name", () => {
      const result = serviceSchema.safeParse({ ...validService, name: "" });
      expect(result.success).toBe(false);
    });

    it("should reject an invalid automation_level", () => {
      const result = serviceSchema.safeParse({ ...validService, automation_level: "human_required" });
      expect(result.success).toBe(false);
    });

    it("should accept both real automation levels", () => {
      for (const automation_level of ["autonomous", "approval_required"]) {
        const result = serviceSchema.safeParse({ ...validService, automation_level });
        expect(result.success).toBe(true);
      }
    });

    it("should reject a slug with uppercase or spaces", () => {
      expect(serviceSchema.safeParse({ ...validService, slug: "AI Website" }).success).toBe(false);
      expect(serviceSchema.safeParse({ ...validService, slug: "ai_website" }).success).toBe(false);
    });

    it("should accept a well-formed kebab-case slug", () => {
      const result = serviceSchema.safeParse({ ...validService, slug: "ai-website-creation-2" });
      expect(result.success).toBe(true);
    });

    it("should default display_order to 0 when omitted", () => {
      const { display_order, ...withoutOrder } = validService;
      const result = serviceSchema.safeParse(withoutOrder);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.display_order).toBe(0);
    });
  });

  describe("Edit Service Schema", () => {
    it("should accept valid content plus a service_id", () => {
      const result = editServiceSchema.safeParse({
        service_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        category_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        name: "Landing Page Creation",
        slug: "landing-page-creation",
        short_description: "A focused, conversion-oriented landing page.",
        description: "A single, purpose-built page designed around one goal.",
        automation_level: "autonomous",
        display_order: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID service_id", () => {
      const result = editServiceSchema.safeParse({
        service_id: "not-a-uuid",
        category_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        name: "Landing Page Creation",
        slug: "landing-page-creation",
        short_description: "x",
        description: "x",
        automation_level: "autonomous",
        display_order: 2,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Service Status Schema", () => {
    it("should accept a valid publish toggle", () => {
      const result = serviceStatusSchema.safeParse({
        service_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        published: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject a non-boolean published value", () => {
      const result = serviceStatusSchema.safeParse({
        service_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
        published: "true",
      });
      expect(result.success).toBe(false);
    });

    it("should reject a non-UUID service_id", () => {
      const result = serviceStatusSchema.safeParse({ service_id: "not-a-uuid", published: true });
      expect(result.success).toBe(false);
    });
  });

  describe("Service Request Schema", () => {
    const validRequest = {
      service_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789",
      details: "I need a landing page for my project.",
    };

    it("should accept a valid personal request (no company_id)", () => {
      const result = serviceRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should accept a valid company request", () => {
      const result = serviceRequestSchema.safeParse({ ...validRequest, company_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789" });
      expect(result.success).toBe(true);
    });

    it("should reject empty details", () => {
      const result = serviceRequestSchema.safeParse({ ...validRequest, details: "" });
      expect(result.success).toBe(false);
    });

    it("should reject a non-UUID service_id", () => {
      const result = serviceRequestSchema.safeParse({ ...validRequest, service_id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("should reject a non-UUID company_id", () => {
      const result = serviceRequestSchema.safeParse({ ...validRequest, company_id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });
  });

  describe("Review Service Request Schema", () => {
    it("should accept accepted and rejected decisions", () => {
      for (const decision of ["accepted", "rejected"]) {
        const result = reviewServiceRequestSchema.safeParse({ request_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789", decision });
        expect(result.success).toBe(true);
      }
    });

    it("should reject an invented decision", () => {
      const result = reviewServiceRequestSchema.safeParse({ request_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789", decision: "maybe" });
      expect(result.success).toBe(false);
    });
  });

  describe("Advance Service Request Schema", () => {
    it("should accept each real forward status with optional notes", () => {
      for (const new_status of ["in_progress", "delivered", "completed"]) {
        const result = advanceServiceRequestSchema.safeParse({ request_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789", new_status, notes: "x" });
        expect(result.success).toBe(true);
      }
    });

    it("should reject 'pending' or 'accepted' as a target (never a forward move)", () => {
      for (const new_status of ["pending", "accepted"]) {
        const result = advanceServiceRequestSchema.safeParse({ request_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789", new_status });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Cancel Service Request Schema", () => {
    it("should accept a valid request_id", () => {
      const result = cancelServiceRequestSchema.safeParse({ request_id: "713ba0c6-302a-4a6c-9403-b0eb972f7789" });
      expect(result.success).toBe(true);
    });

    it("should reject a non-UUID request_id", () => {
      const result = cancelServiceRequestSchema.safeParse({ request_id: "not-a-uuid" });
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
