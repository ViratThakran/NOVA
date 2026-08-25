import type { Metadata } from "next";
import Link from "next/link";
import { Search, Mail, Building, Calendar, CheckCircle2, MessageSquare } from "lucide-react";
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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-sky-600" />
            Public Contact Submissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming inquiries and messages submitted via NOVA&apos;s public contact page.
          </p>
        </div>
        {newCount > 0 && (
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase shrink-0 shadow-xs">
            {newCount} New Inquiry{newCount !== 1 ? "ies" : ""}
          </span>
        )}
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = statusFilter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/contact" : `/admin/contact?status=${f.value}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" action="/admin/contact" className="relative sm:w-64">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search name, email, message..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load submissions.</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Mail className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No submissions match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Contact submissions sent via /contact will appear here."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Sender</th>
                  <th className="py-4 px-5">Company</th>
                  <th className="py-4 px-5">Message Content</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Received</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((sub) => {
                  const date = new Date(sub.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={sub.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900">{sub.name}</span>
                          <span className="text-[11px] text-slate-500">{sub.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {sub.company ? (
                          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Building className="h-3.5 w-3.5 text-sky-600" />
                            {sub.company}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 max-w-xs">
                        <p className="text-slate-700 leading-relaxed text-xs line-clamp-2">{sub.message}</p>
                      </td>

                      <td className="py-4 px-5">
                        {sub.status === "new" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 uppercase">
                            New
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 uppercase">
                            <CheckCircle2 className="h-3 w-3 text-slate-400" /> Reviewed
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {date}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {sub.status === "new" && (
                          <MarkReviewedButton submissionId={sub.id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
