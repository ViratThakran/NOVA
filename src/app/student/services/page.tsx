import Link from "next/link";
import type { Metadata } from "next";
import { Zap, ChevronRight, Sparkles, LayoutGrid, Send } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { RequestServiceForm } from "./request-service-form";

export const metadata: Metadata = { title: "AI Services & Requests | NOVA" };

const AUTOMATION_LABELS: Record<string, { label: string; description: string; class: string }> = {
  autonomous: {
    label: "AI-Executed",
    description: "Runs fully automatically without manual approval.",
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  approval_required: {
    label: "Approval Required",
    description: "AI-assisted — reviewed by a NOVA administrator before delivery.",
    class: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

interface ServiceRow {
  id: string;
  name: string;
  short_description: string;
  automation_level: string;
  service_categories: { name: string } | null;
}

export default async function StudentServicesPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return (
      <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-600">Your session has expired. Please log in again.</p>
      </div>
    );
  }
  const { supabase } = auth;

  const { data: rawServices, error } = await supabase
    .from("services")
    .select("id, name, short_description, automation_level, service_categories(name)")
    .eq("published", true)
    .order("display_order", { ascending: true });

  const services = (rawServices as unknown as ServiceRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" /> NOVA AI Network
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-sky-600" />
            AI Services Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Request AI-executed tasks from NOVA&apos;s service network. Describe your goal — our AI engine assists with delivery.
          </p>
        </div>
        <Link
          href="/student/services/requests"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <LayoutGrid className="h-4 w-4" />
          My Service Requests
        </Link>
      </div>

      {/* SERVICES GRID WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load services. Please try again.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Zap className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No AI Services Available Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">NOVA&apos;s AI service catalog will appear here as new services launch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {services.map((service) => {
            const auto = AUTOMATION_LABELS[service.automation_level] ?? {
              label: service.automation_level,
              description: "",
              class: "bg-slate-50 text-slate-600 border-slate-200",
            };

            return (
              <div
                key={service.id}
                className="flex flex-col justify-between gap-4 p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/95 hover:border-sky-300/80 hover:shadow-[0_14px_35px_rgba(14,165,233,0.12)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {service.service_categories?.name || "General Service"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${auto.class}`}>
                      {auto.label}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {service.name}
                  </h2>

                  <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-3 leading-relaxed font-normal">
                    {service.short_description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <RequestServiceForm serviceId={service.id} serviceName={service.name} />

                  <Link
                    href={`/student/services/${service.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
