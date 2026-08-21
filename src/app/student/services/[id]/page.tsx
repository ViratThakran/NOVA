import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Calendar, Zap, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { customerDeliverableLabel } from "@/lib/deliverable-labels";
import { CancelRequestButton } from "../cancel-request-button";

export const metadata: Metadata = { title: "Service Request Details | NOVA" };

const idSchema = z.string().uuid();

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
  services: { name: string; short_description: string } | null;
}

interface ArtifactRow {
  id: string;
  type: string;
  created_at: string;
}

// Customer-facing tracking view — deliberately does NOT show internal AI
// workforce mechanics (agents, task IDs, approvals). Only status, request
// details, deliverable notes, and artifact types visible to the student.
export default async function StudentServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFoundState = (
    <div className="flex flex-col gap-6">
      <Link
        href="/student/services/requests"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Service Requests
      </Link>
      <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3 font-mono">
        <AlertCircle className="h-10 w-10 text-slate-600" />
        <p className="text-sm font-bold text-slate-300">Request Not Found</p>
        <p className="text-xs text-slate-500 max-w-sm">
          This service request doesn&apos;t exist or is not associated with your account.
        </p>
      </div>
    </div>
  );

  if (!idSchema.safeParse(id).success) return notFoundState;

  const auth = await getAuthenticatedUser();
  if (!auth) return notFoundState;
  const { supabase, user } = auth;

  const [{ data: rawRequest, error }, { data: rawArtifacts }] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id, status, details, deliverable_notes, created_at, services(name, short_description)")
      .eq("id", id)
      .eq("requester_id", user.id)
      .maybeSingle(),
    supabase
      .from("ai_artifacts")
      .select("id, type, created_at")
      .eq("service_request_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (error || !rawRequest) return notFoundState;

  const request = rawRequest as unknown as RequestRow;
  const artifacts = (rawArtifacts as unknown as ArtifactRow[] | null) ?? [];
  const meta = STATUS_META[request.status] ?? {
    label: request.status,
    class: "bg-slate-900 text-slate-400 border-slate-700",
  };
  const isDelivered = ["delivered", "completed"].includes(request.status);

  return (
    <div className="flex flex-col gap-6">
      {/* BACK LINK */}
      <Link
        href="/student/services/requests"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Service Requests
      </Link>

      {/* HEADER BANNER */}
      <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/40 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-3 w-3" /> AI SERVICE REQUEST
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-sans">
            {request.services?.name ?? "Service Request"}
          </h1>
          <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Submitted {new Date(request.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          <span className="text-xs font-mono text-slate-400 font-semibold">Status:</span>
          <span className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-wider ${meta.class}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* DELIVERY BANNER */}
      {isDelivered && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-3 font-mono">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              SERVICE DELIVERED
            </span>
            <p className="text-xs text-slate-300 font-sans">
              Your AI service request has been executed and delivered. Review the details and deliverables below.
            </p>
          </div>
        </div>
      )}

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: REQUEST DETAILS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-5 font-mono">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Your Request Details
            </h3>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {request.details}
            </div>

            {request.deliverable_notes && (
              <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Delivery Notes from NOVA
                </h4>
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 leading-relaxed whitespace-pre-line font-sans">
                  {request.deliverable_notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DELIVERABLES & MANAGEMENT */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* DELIVERABLES */}
          {artifacts.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Deliverables ({artifacts.length})
              </h3>
              <div className="flex flex-col gap-2">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <span className="text-xs font-semibold text-slate-200">
                      {customerDeliverableLabel(artifact.type)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(artifact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CANCEL (if pending) */}
          {request.status === "pending" && (
            <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-4 font-mono">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Manage Request
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Your request is pending review. You can cancel it if you no longer need this service.
              </p>
              <CancelRequestButton requestId={request.id} />
            </div>
          )}

          {/* SERVICE INFO */}
          {request.services?.short_description && (
            <div className="p-6 rounded-2xl bg-[#0E131F] border border-slate-800 flex flex-col gap-2 font-mono">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About This Service
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {request.services.short_description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
