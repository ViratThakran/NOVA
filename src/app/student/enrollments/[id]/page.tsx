import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Building2, Calendar, FileText, Briefcase, AlertCircle } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getEnrollmentStatusMeta } from "@/lib/enrollment-view-state";

export const metadata: Metadata = { title: "Residency Details | NOVA" };

const idSchema = z.string().uuid();

interface EnrollmentDetailRow {
  id: string;
  status: string;
  application_id: string;
  created_at: string;
  updated_at: string;
  internship: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    eligibility: string;
    companies: { name: string } | null;
  } | null;
}

export default async function StudentEnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFoundState = (
    <div className="flex flex-col gap-6">
      <Link
        href="/student/enrollments"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Residencies
      </Link>
      <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3 font-mono">
        <AlertCircle className="h-10 w-10 text-slate-600" />
        <p className="text-sm font-bold text-slate-300">Residency Not Found</p>
        <p className="text-xs text-slate-500 max-w-sm">
          This residency enrollment doesn&apos;t exist or is not associated with your account.
        </p>
      </div>
    </div>
  );

  if (!idSchema.safeParse(id).success) {
    return notFoundState;
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFoundState;
  }

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select(
      "id, status, application_id, created_at, updated_at, internship:internships(id, title, description, requirements, eligibility, companies(name))"
    )
    .eq("id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error || !enrollment) {
    return notFoundState;
  }

  const record = enrollment as unknown as EnrollmentDetailRow;
  const { label, variant } = getEnrollmentStatusMeta(record.status);
  const companyName = record.internship?.companies?.name || "NOVA Partner Company";
  const enrolledDate = new Date(record.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* BACK LINK */}
      <Link
        href="/student/enrollments"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Residencies
      </Link>

      {/* HEADER BANNER */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/40 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {companyName}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-sans">
            {record.internship?.title || "Residency Position"}
          </h1>
          <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Enrolled on {enrolledDate}
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0 font-mono">
          <span className="text-xs text-slate-400 font-semibold">Residency Status:</span>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: RESIDENCY SPECIFICATION */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-6 font-sans">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              Residency Position Specifications
            </h3>
            {record.internship && (
              <>
                <Section title="Description" body={record.internship.description} />
                <Section title="Requirements" body={record.internship.requirements} />
                <Section title="Eligibility" body={record.internship.eligibility} />
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LINKED APPLICATION INFORMATION */}
        <div className="lg:col-span-5 flex flex-col gap-6 font-mono">
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Linked Application Record
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              This residency was created following your accepted application. You can review your original cover letter and application details.
            </p>
            <Link
              href={`/student/applications/${record.application_id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <FileText className="h-3.5 w-3.5" /> View Original Application
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">{title}</h4>
      <p className="whitespace-pre-line text-xs text-slate-300 leading-relaxed font-sans">{body}</p>
    </div>
  );
}
