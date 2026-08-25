import Link from "next/link";
import type { Metadata } from "next";
import { LayoutGrid, ChevronRight, Calendar, Zap, AlertCircle, Send, X } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { CancelRequestButton } from "../cancel-request-button";

export const metadata: Metadata = { title: "My Service Requests | NOVA" };

const STATUS_META: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending Review", class: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", class: "bg-sky-50 text-sky-700 border-sky-200" },
  in_progress: { label: "In Progress", class: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered: { label: "Delivered", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", class: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", class: "bg-slate-50 text-slate-700 border-slate-200" },
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
      <div className="p-8 rounded-2xl bg-white border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
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
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-sky-600" />
            My Service Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track AI service requests you&apos;ve submitted to NOVA.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold shadow-2xs">
              {activeCount} Active
            </span>
          )}
          <Link
            href="/student/services"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Browse Services
          </Link>
        </div>
      </div>

      {/* REQUESTS LIST */}
      {error ? (
        <div className="p-8 rounded-2xl bg-white border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load your service requests.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-100 text-center flex flex-col items-center gap-3 shadow-xs">
          <LayoutGrid className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No Service Requests Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Service requests you submit will appear here. Browse available AI services to get started.
          </p>
          <Link
            href="/student/services"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Browse AI Services →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => {
            const meta = STATUS_META[request.status] ?? {
              label: request.status,
              class: "bg-slate-50 text-slate-700 border-slate-200",
            };

            return (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-sky-300 hover:shadow-md transition-all duration-150"
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/student/services/${request.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-sky-600 transition-colors"
                    >
                      {request.services?.name ?? "AI Service"}
                    </Link>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${meta.class}`}>
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {request.details}
                  </p>

                  {request.deliverable_notes && (
                    <p className="text-[11px] text-emerald-700 italic mt-0.5">
                      Delivery note: {request.deliverable_notes}
                    </p>
                  )}

                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
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
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
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
