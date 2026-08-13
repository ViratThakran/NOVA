import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Onboarding — NOVA" };

export default function StudentOnboardingPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Complete your profile"
        description="A short onboarding flow to get you ready to apply."
      />
      <EmptyState
        title="Onboarding is coming in Phase 3D"
        description="This flow will collect your education, skills, and resume using the existing student_profiles table and onboarding validation schema."
      />
    </div>
  );
}
