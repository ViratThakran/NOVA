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
    class: "bg-emerald-950/80 text-emerald-300 border-emerald-700/40",
  },
  approval_required: {
    label: "Approval Required",
    description: "AI-assisted — reviewed by a NOVA administrator before delivery.",
    class: "bg-amber-950/80 text-amber-300 border-amber-700/40",
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
      <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
        <p className="text-sm font-semibold text-red-300 font-mono">Your session has expired. Please log in again.</p>
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/40 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> NOVA AI NETWORK
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-400" />
            AI SERVICES CATALOG
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Request AI-executed work from NOVA&apos;s service catalog. Describe your goal — our AI network handles execution.
          </p>
        </div>
        <Link
          href="/student/services/requests"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          My Service Requests
        </Link>
      </div>

      {/* SERVICES GRID */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load services. Please try again.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Zap className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No AI Services Available Yet</p>
          <p className="text-xs text-slate-500 max-w-sm">NOVA&apos;s AI service catalog will appear here as new services launch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => {
            const auto = AUTOMATION_LABELS[service.automation_level] ?? {
              label: service.automation_level,
              description: "",
              class: "bg-slate-900 text-slate-400 border-slate-700",
            };

            return (
              <div
                key={service.id}
                className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    {service.service_categories?.name && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {service.service_categories.name}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${auto.class}`}>
                      <Zap className="h-2.5 w-2.5 inline mr-0.5" />
                      {auto.label}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-white">{service.name}</h2>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {service.short_description}
                  </p>

                  <p className="text-[11px] text-slate-500 font-mono italic">
                    {auto.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <RequestServiceForm serviceId={service.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER CTA */}
      {services.length > 0 && (
        <div className="mt-2 flex items-center justify-center">
          <Link
            href="/student/services/requests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5 text-indigo-400" />
            Track your submitted AI service requests
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
