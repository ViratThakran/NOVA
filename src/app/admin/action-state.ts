// Kept out of actions.ts on purpose: a "use server" file may only export
// async functions — a plain const/type export there breaks the build (see
// src/app/auth/action-state.ts, which hit exactly this in Phase 3C).
export interface AdminActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialAdminActionState: AdminActionState = { status: "idle" };
