export interface CompanyActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export const initialCompanyActionState: CompanyActionState = { status: "idle" };
