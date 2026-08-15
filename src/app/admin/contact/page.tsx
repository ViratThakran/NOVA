import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createServerSideClient } from "@/lib/supabase";
import { MarkReviewedButton } from "./mark-reviewed-button";

export const metadata: Metadata = { title: "Contact submissions — NOVA Admin" };

interface SubmissionRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default async function AdminContactPage() {
  const supabase = await createServerSideClient();

  const { data: submissions, error } = await supabase
    .from("contact_submissions")
    .select("id, name, email, company, message, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Contact submissions" description="Messages sent through the public contact form." />

      {error ? (
        <ErrorState title="Couldn't load submissions" description="Something went wrong. Please try again." />
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState title="No submissions yet" description="Messages sent through /contact will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {(submissions as SubmissionRow[]).map((submission) => (
            <Card key={submission.id}>
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-small font-medium text-text">
                      {submission.name} · {submission.email}
                    </span>
                    {submission.company && <span className="text-caption text-text-muted">{submission.company}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={submission.status === "new" ? "warning" : "default"}>{submission.status}</Badge>
                    <span className="text-caption text-text-muted">{new Date(submission.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="whitespace-pre-line text-small text-text-muted">{submission.message}</p>
                {submission.status === "new" && <MarkReviewedButton submissionId={submission.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
