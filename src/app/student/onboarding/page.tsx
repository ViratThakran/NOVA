import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSideClient } from "@/lib/supabase";
import { PageHeader } from "@/components/app/page-header";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Onboarding — NOVA" };

export default async function StudentOnboardingPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // StudentLayout's requireRole("student") already guarantees an
  // authenticated student reaches this point — this just decides whether
  // onboarding is still needed for them specifically.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).single();

  if (profile?.onboarded) {
    redirect("/student/dashboard");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Complete your profile"
        description="Add your education, skills, and resume to start applying to internships."
      />
      <OnboardingForm />
    </div>
  );
}
