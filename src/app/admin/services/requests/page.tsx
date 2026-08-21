import type { Metadata } from "next";
import Link from "next/link";
import { Search, FileText, ChevronRight, Calendar, User, Cpu, ArrowLeft } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Service Requests | NOVA Admin" };

type StatusFilter = "all" | "pending" | "accepted" | "in_progress" | "delivered" | "completed" | "rejected" | "cancelled";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Requests" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-950/80 text-amber-300 border-amber-700/40",
  accepted: "bg-cyan-950/80 text-cyan-300 border-cyan-700/40",
  in_progress: "bg-indigo-950/80 text-indigo-300 border-indigo-700/40",
  delivered: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40",
  completed: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40",
  rejected: "bg-red-950/80 text-red-300 border-red-700/40",
  cancelled: "bg-slate-800 text-slate-400 border-slate-700",
};

function normalizeFilter(raw: string | string[] | undefined): StatusFilter {
  if (typeof raw !== "string") return "all";
  return (FILTERS.map((f) => f.value) as string[]).includes(raw) ? (raw as StatusFilter) : "all";
}

interface RequestRow {
  id: string;
  status: string;
  details: string;
  created_at: string;
  services: { id: string; name: string } | null;
  requester: { id: string; first_name: string | null; last_name: string | null; email: string } | null;
  companies: { id: string; name: string } | null;
}

export default async function AdminServiceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const statusFilter = normalizeFilter(rawStatus);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("service_requests")
    .select("id, status, details, created_at, services(id, name), requester:profiles(id, first_name, last_name, email), companies(id, name)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data: rawRequests, error } = await query;
  let requests = (rawRequests as unknown as RequestRow[] | null) ?? [];

  if (searchQuery) {
    requests = requests.filter((r) => {
      const serviceName = r.services?.name?.toLowerCase() ?? "";
      const companyName = r.companies?.name?.toLowerCase() ?? "";
      const reqName = r.requester
        ? [r.requester.first_name, r.requester.last_name].filter(Boolean).join(" ").toLowerCase()
        : "";
      const reqEmail = r.requester?.email?.toLowerCase() ?? "";
      return (
        serviceName.includes(searchQuery) ||
        companyName.includes(searchQuery) ||
        reqName.includes(searchQuery) ||
        reqEmail.includes(searchQuery) ||
        r.details.toLowerCase().includes(searchQuery)
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/services"
              className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> AI Services Catalog
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            SERVICE REQUESTS QUEUE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Operational review queue for client and organization service execution requests.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {FILTERS.map((f) => {
              const isSelected = statusFilter === f.value;
              return (
                <Link
                  key={f.value}
                  href={f.value === "all" ? "/admin/services/requests" : `/admin/services/requests?status=${f.value}`}
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

          {/* Search */}
          <form method="GET" action="/admin/services/requests" className="relative sm:w-64">
            {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={rawQuery || ""}
              placeholder="Search requests..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </form>
        </div>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load service requests.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No service requests match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "Incoming service requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {requests.map((request) => {
                const requesterLabel = request.requester
                  ? [request.requester.first_name, request.requester.last_name].filter(Boolean).join(" ") || request.requester.email
                  : "Unknown Requester";
                const date = new Date(request.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const style = STATUS_STYLES[request.status] ?? "bg-slate-800 text-slate-400 border-slate-700";

                return (
                  <tr key={request.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        {request.services?.id ? (
                          <Link
                            href={`/admin/services/${request.services.id}`}
                            className="hover:text-indigo-300 transition-colors"
                          >
                            {request.services.name}
                          </Link>
                        ) : (
                          <span>{request.services?.name ?? "Service"}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-500" />
                          {requesterLabel}
                        </span>
                        {request.requester?.email && (
                          <span className="text-[10px] font-mono text-slate-500">{request.requester.email}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {request.companies ? (
                        <Link
                          href={`/admin/companies/${request.companies.id}`}
                          className="text-slate-300 hover:text-indigo-300 transition-colors font-bold"
                        >
                          {request.companies.name}
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Individual</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${style}`}>
                        {request.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-600" />
                        {date}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/services/requests/${request.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        Review
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
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
