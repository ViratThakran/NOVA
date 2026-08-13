// Kept out of actions.ts on purpose: a "use server" file may only export
// async functions — a plain const/type export there breaks the build (see
// src/app/auth/action-state.ts, which hit exactly this in Phase 3C).
export interface OnboardingActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialOnboardingActionState: OnboardingActionState = { status: "idle" };

export interface ApplicationActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialApplicationActionState: ApplicationActionState = { status: "idle" };

export interface NotificationActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialNotificationActionState: NotificationActionState = { status: "idle" };
