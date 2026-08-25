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
  services: { name: string; short_description: string } | null;
}

interface ArtifactRow {
  id: string;
  type: string;
  created_at: string;
}

export default async function StudentServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notFoundState = (
    <div className="flex flex-col gap-6 text-slate-800">
      <Link
        href="/student/services/requests"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Service Requests
      </Link>
      <div className="p-12 rounded-2xl bg-white border border-slate-100 text-center flex flex-col items-center gap-3 shadow-xs">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-800">Request Not Found</p>
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
    class: "bg-slate-50 text-slate-700 border-slate-200",
  };
  const isDelivered = ["delivered", "completed"].includes(request.status);

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* BACK LINK */}
      <Link
        href="/student/services/requests"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Service Requests
      </Link>

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-sky-600" /> AI Service Request
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {request.services?.name ?? "Service Request"}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            Submitted {new Date(request.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
          <span className="text-xs text-slate-600 font-semibold">Status:</span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${meta.class}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* DELIVERY BANNER */}
      {isDelivered && (
        <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Service Delivered
            </span>
            <p className="text-xs text-slate-600">
              Your AI service request has been executed and delivered. Review the details and deliverables below.
            </p>
          </div>
        </div>
      )}

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: REQUEST DETAILS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" />
              Your Request Details
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {request.details}
            </div>

            {request.deliverable_notes && (
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Delivery Notes from NOVA
                </h4>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed whitespace-pre-line">
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
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Deliverables ({artifacts.length})
              </h3>
              <div className="flex flex-col gap-2">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="text-xs font-semibold text-slate-800">
                      {customerDeliverableLabel(artifact.type)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(artifact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CANCEL (if pending) */}
          {request.status === "pending" && (
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Manage Request
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your request is pending review. You can cancel it if you no longer need this service.
              </p>
              <CancelRequestButton requestId={request.id} />
            </div>
          )}

          {/* SERVICE INFO */}
          {request.services?.short_description && (
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col gap-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                About This Service
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {request.services.short_description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
