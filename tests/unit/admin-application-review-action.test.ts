import { describe, it, expect, vi, beforeEach } from "vitest";
import { reviewApplicationAction, markUnderReviewAction } from "../../src/app/admin/actions";
import { reviewCompanyApplicationAction, markCompanyUnderReviewAction } from "../../src/app/company/actions";
import * as authModule from "../../src/lib/auth";

vi.mock("../../src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
  };
});

describe("Application Review Authorization & Lifecycle Unit Tests (Step 7)", () => {
  const mockRpc = vi.fn();
  const adminUser = { id: "admin-uuid-001", email: "admin@nova.ai" };
  const studentUser = { id: "student-uuid-002", email: "student@nova.ai" };
  const companyUser = { id: "company-uuid-003", email: "company@partner.com" };

  const mockSupabase = {
    rpc: mockRpc,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. admin can accept application", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: adminUser as any,
      roles: ["admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "accepted");
    formData.set("feedback", "Strong match.");

    const result = await reviewApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("success");
    expect(result.message).toBe("Application accepted.");
    expect(mockRpc).toHaveBeenCalledWith("review_application", {
      app_uuid: "4302b544-e2a0-4692-99b0-fa09aa252ae7",
      review_status: "accepted",
      feedback: "Strong match.",
    });
  });

  it("2. admin can reject application", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: adminUser as any,
      roles: ["admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "rejected");
    formData.set("feedback", "Not a fit at this time.");

    const result = await reviewApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("success");
    expect(result.message).toBe("Application rejected.");
    expect(mockRpc).toHaveBeenCalledWith("review_application", {
      app_uuid: "4302b544-e2a0-4692-99b0-fa09aa252ae7",
      review_status: "rejected",
      feedback: "Not a fit at this time.",
    });
  });

  it("3. company can accept application for its own internship", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: companyUser as any,
      roles: ["company_admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "accepted");

    const result = await reviewCompanyApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("success");
    expect(result.message).toBe("Application accepted.");
  });

  it("4. company cannot accept application belonging to another company (RPC throws Unauthorized)", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: companyUser as any,
      roles: ["company_admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Unauthorized: You do not have permission to review this application." },
    });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "accepted");

    const result = await reviewCompanyApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe("You don't have permission to review this application.");
  });

  it("5. student cannot accept application (denied by role check)", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: studentUser as any,
      roles: ["student"],
      supabase: mockSupabase as any,
    });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "accepted");

    const result = await reviewApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe("You don't have permission to review applications.");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("6. unauthenticated user cannot accept application", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "accepted");

    const result = await reviewApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe("Your session has expired. Please log in again.");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("7 & 8. repeated acceptance on already processed application returns invalid state error", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: adminUser as any,
      roles: ["admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Invalid State: Application has already been processed." },
    });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "accepted");

    const result = await reviewApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe("This application is no longer in a state that allows that action.");
  });

  it("9. rejected application reports clean user message", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: adminUser as any,
      roles: ["admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");
    formData.set("status", "rejected");

    const result = await reviewApplicationAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("success");
    expect(result.message).toBe("Application rejected.");
  });

  it("10. admin mark application under review works authoritatively", async () => {
    vi.mocked(authModule.getAuthenticatedUser).mockResolvedValue({
      user: adminUser as any,
      roles: ["admin"],
      supabase: mockSupabase as any,
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const formData = new FormData();
    formData.set("application_id", "4302b544-e2a0-4692-99b0-fa09aa252ae7");

    const result = await markUnderReviewAction({ status: "idle", message: "" }, formData);

    expect(result.status).toBe("success");
    expect(result.message).toBe("Application marked as under review.");
    expect(mockRpc).toHaveBeenCalledWith("mark_application_under_review", {
      app_uuid: "4302b544-e2a0-4692-99b0-fa09aa252ae7",
    });
  });
});
