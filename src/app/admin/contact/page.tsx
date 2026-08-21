import type { Metadata } from "next";
import Link from "next/link";
import { Search, Mail, Building, Calendar, CheckCircle2 } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";
import { MarkReviewedButton } from "./mark-reviewed-button";

export const metadata: Metadata = { title: "Contact Submissions | NOVA Admin" };

type StatusFilter = "all" | "new" | "reviewed";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Submissions" },
  { value: "new", label: "New / Unread" },
  { value: "reviewed", label: "Reviewed" },
];

function normalizeFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "new", "reviewed"] as const).includes(raw as StatusFilter) ? (raw as StatusFilter) : "all";
}

interface SubmissionRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const statusFilter = normalizeFilter(rawStatus);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("contact_submissions")
    .select("id, name, email, company, message, status, created_at")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data: rawSubmissions, error } = await query;
  let submissions = (rawSubmissions as SubmissionRow[] | null) ?? [];

  if (searchQuery) {
    submissions = submissions.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery) ||
        s.email.toLowerCase().includes(searchQuery) ||
        (s.company && s.company.toLowerCase().includes(searchQuery)) ||
        s.message.toLowerCase().includes(searchQuery)
    );
  }

  const newCount = submissions.filter((s) => s.status === "new").length;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            PUBLIC CONTACT SUBMISSIONS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Review incoming inquiries and messages submitted via NOVA&apos;s public contact page.
          </p>
        </div>
        {newCount > 0 && (
          <span className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-700/40 text-amber-300 font-mono text-xs font-bold uppercase shrink-0">
            {newCount} New Inquiry{newCount !== 1 ? "ies" : ""}
          </span>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = statusFilter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/contact" : `/admin/contact?status=${f.value}`}
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/admin/contact" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search name, email, message..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load submissions.</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Mail className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No submissions match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Contact submissions sent via /contact will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Message Content</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {submissions.map((submission) => {
                const date = new Date(submission.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isNew = submission.status === "new";

                return (
                  <tr key={submission.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white">{submission.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{submission.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {submission.company ? (
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Building className="h-3 w-3 text-slate-500" />
                          {submission.company}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-300 text-[12px] leading-relaxed max-w-md">
                      <p className="line-clamp-3">{submission.message}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {isNew ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/40 text-[10px] font-bold text-amber-300 uppercase">
                          New
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40 text-[10px] font-bold text-emerald-300 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Reviewed
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isNew ? (
                        <MarkReviewedButton submissionId={submission.id} />
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
