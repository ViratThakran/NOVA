import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth";
import { StudentProfileForm } from "./profile-form";
import { ResumeForm } from "./resume-form";

export const metadata: Metadata = { title: "Profile — NOVA" };

const RESUME_SIGNED_URL_TTL_SECONDS = 60;

export default async function StudentProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Your profile" />
        <ErrorState title="Your session has expired" description="Please log in again." />
      </div>
    );
  }
  const { supabase, user } = auth;

  const [{ data: profile, error: profileError }, { data: studentProfile, error: studentProfileError }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name, email").eq("id", user.id).single(),
    supabase
      .from("student_profiles")
      .select("education_info, skills, resume_path, resume_size")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (profileError || studentProfileError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Your profile" />
        <ErrorState title="Couldn't load your profile" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Your profile" description="Manage your personal and academic information." />
        <EmptyState
          title="Finish onboarding first"
          description="Complete onboarding to set up your academic profile and resume before editing them here."
          action={
            <Link href="/student/onboarding" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Go to onboarding
            </Link>
          }
        />
      </div>
    );
  }

  const educationInfo = (studentProfile.education_info ?? {}) as { school?: string; degree?: string; grad_year?: number };

  let resumeUrl: string | null = null;
  if (studentProfile.resume_path) {
    const { data: signed } = await supabase.storage
      .from("resumes")
      .createSignedUrl(studentProfile.resume_path, RESUME_SIGNED_URL_TTL_SECONDS);
    resumeUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your profile" description="Manage your personal and academic information." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <StudentProfileForm
                firstName={profile?.first_name ?? ""}
                lastName={profile?.last_name ?? ""}
                school={educationInfo.school ?? ""}
                degree={educationInfo.degree ?? ""}
                gradYear={educationInfo.grad_year ?? new Date().getFullYear()}
                skills={studentProfile.skills ?? []}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <h3 className="text-small font-semibold text-text">Resume</h3>
              {resumeUrl ? (
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-small text-primary underline">
                  Download current resume{studentProfile.resume_size ? ` (${Math.round(studentProfile.resume_size / 1024)} KB)` : ""}
                </a>
              ) : (
                <p className="text-small text-text-muted">No resume on file.</p>
              )}
              <ResumeForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
