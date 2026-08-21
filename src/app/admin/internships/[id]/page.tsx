import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, FileText } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import type { InternshipStatus } from "@/lib/internship-status";
import { EditInternshipForm } from "./edit-internship-form";
import { StatusControl } from "./status-control";

export const metadata: Metadata = { title: "Internship details — NOVA Admin" };

const idSchema = z.string().uuid();

interface InternshipRow {
  id: string;
  title: string;
  description: string;
  requirements: string;
  eligibility: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default async function AdminInternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notFoundState = (
    <div className="flex flex-col gap-8">
      <PageHeader title="Internship details" />
      <EmptyState title="Internship not found" description="This internship doesn't exist." />
    </div>
  );

  // Malformed ids never reach Postgres — an invalid UUID literal would come
  // back as a raw Postgres error (22P02) rather than a clean "not found".
  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return notFoundState; // layout already redirects unauthenticated/non-admin users; this is a safe fallback
  }
  const { supabase } = auth;

  // Admin sees every internship via the internships SELECT policy's
  // `OR is_current_user_admin()` clause — no extra filter needed here.
  const { data: internship, error } = await supabase
    .from("internships")
    .select("id, title, description, requirements, eligibility, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Internship details" />
        <ErrorState title="Couldn't load this internship" description="Something went wrong. Please try again." />
      </div>
    );
  }

  if (!internship) {
    return notFoundState;
  }

  const record = internship as InternshipRow;

  return (
    <div className="flex flex-col gap-8">
      {/* Cross-entity nav */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/internships"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities
        </Link>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-indigo-400" />
          View Applications
        </Link>
      </div>

      <PageHeader
        title={record.title}
        description={`Created ${new Date(record.created_at).toLocaleDateString()} · Last updated ${new Date(
          record.updated_at
        ).toLocaleDateString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <EditInternshipForm internship={record} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-small font-semibold text-text">Status</h3>
              <StatusControl internshipId={record.id} currentStatus={record.status as InternshipStatus} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
