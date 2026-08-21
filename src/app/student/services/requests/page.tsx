import Link from "next/link";
import type { Metadata } from "next";
import { LayoutGrid, ChevronRight, Calendar, Zap, AlertCircle, Send, X } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { CancelRequestButton } from "../cancel-request-button";

export const metadata: Metadata = { title: "My Service Requests | NOVA" };

const STATUS_META: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending Review", class: "bg-amber-950/80 text-amber-300 border-amber-700/40" },
  accepted: { label: "Accepted", class: "bg-cyan-950/80 text-cyan-300 border-cyan-700/40" },
  in_progress: { label: "In Progress", class: "bg-indigo-950/80 text-indigo-300 border-indigo-700/40" },
  delivered: { label: "Delivered", class: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40" },
  completed: { label: "Completed", class: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40" },
  rejected: { label: "Rejected", class: "bg-red-950/80 text-red-300 border-red-800/40" },
  cancelled: { label: "Cancelled", class: "bg-slate-900 text-slate-400 border-slate-700" },
};

interface RequestRow {
  id: string;
  status: string;
  details: string;
  deliverable_notes: string | null;
  created_at: string;
  services: { name: string } | null;
}

export default async function StudentServiceRequestsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
        <p className="text-sm font-semibold text-red-300 font-mono">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase, user } = auth;

  const { data: rawRequests, error } = await supabase
    .from("service_requests")
    .select("id, status, details, deliverable_notes, created_at, services(name)")
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false });

  const requests = (rawRequests as unknown as RequestRow[] | null) ?? [];

  const activeCount = requests.filter((r) =>
    ["pending", "accepted", "in_progress"].includes(r.status)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-400" />
            MY SERVICE REQUESTS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Track AI service requests you&apos;ve submitted to NOVA.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeCount > 0 && (
            <span className="px-3 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/40 text-indigo-300 font-mono text-xs font-bold uppercase">
              {activeCount} Active
            </span>
          )}
          <Link
            href="/student/services"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Browse Services
          </Link>
        </div>
      </div>

      {/* REQUESTS LIST */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load your service requests.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <LayoutGrid className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No Service Requests Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Service requests you submit will appear here. Browse available AI services to get started.
          </p>
          <Link
            href="/student/services"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Browse AI Services →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => {
            const meta = STATUS_META[request.status] ?? {
              label: request.status,
              class: "bg-slate-900 text-slate-400 border-slate-700",
            };

            return (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0E131F] border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/student/services/${request.id}`}
                      className="text-sm font-bold text-white hover:text-indigo-300 transition-colors font-sans"
                    >
                      {request.services?.name ?? "AI Service"}
                    </Link>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${meta.class}`}>
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">
                    {request.details}
                  </p>

                  {request.deliverable_notes && (
                    <p className="text-[11px] font-mono text-emerald-400 italic mt-0.5">
                      Delivery note: {request.deliverable_notes}
                    </p>
                  )}

                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-600" />
                    Submitted {new Date(request.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/student/services/${request.id}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  {request.status === "pending" && (
                    <CancelRequestButton requestId={request.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
