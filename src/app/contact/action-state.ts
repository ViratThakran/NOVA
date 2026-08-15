// Kept out of actions.ts on purpose: a "use server" file may only export
// async functions — a plain const/type export there breaks the build.
export interface ContactActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialContactActionState: ContactActionState = { status: "idle" };
