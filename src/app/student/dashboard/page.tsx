import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSideClient } from "@/lib/supabase";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard — NOVA" };

interface EducationInfo {
  school?: string;
  degree?: string;
  grad_year?: number;
}

export default async function StudentDashboardPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: studentProfile }] = await Promise.all([
    supabase.from("profiles").select("first_name, email, onboarded").eq("id", user.id).single(),
    supabase.from("student_profiles").select("education_info, skills, resume_path").eq("id", user.id).maybeSingle(),
  ]);

  // Onboarding hasn't been completed yet — send them there instead of
  // showing a dashboard with nothing real in it.
  if (!profile?.onboarded) {
    redirect("/student/onboarding");
  }

  const educationInfo = (studentProfile?.education_info as EducationInfo | null) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={profile.first_name ? `Welcome, ${profile.first_name}` : "Your dashboard"}
        description="Your NOVA session, profile, and onboarding status."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Row label="Signed in as" value={profile.email} />
          <Row label="Onboarding" value={<Badge variant="success">Complete</Badge>} />
          <Row label="School" value={educationInfo?.school || "—"} />
          <Row label="Degree" value={educationInfo?.degree || "—"} />
          <Row label="Graduation year" value={educationInfo?.grad_year?.toString() || "—"} />
          <Row label="Skills" value={studentProfile?.skills?.join(", ") || "—"} />
          <Row label="Resume" value={studentProfile?.resume_path ? "Uploaded" : "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <span className="text-small text-text-muted">{label}</span>
      <span className="text-small font-medium text-text">{value}</span>
    </div>
  );
}
