// Kept out of actions.ts on purpose: a "use server" file may only export
// async functions — a plain const/type export there breaks the build
// ("A 'use server' file can only export async functions, found object").
export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialAuthActionState: AuthActionState = { status: "idle" };
