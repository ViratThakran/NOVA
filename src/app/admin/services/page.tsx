import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Cpu, ChevronRight, FileText, Bot, Zap } from "lucide-react";
import { createServerSideClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "AI Services Catalog | NOVA Admin" };

type PublishedFilter = "all" | "published" | "unpublished";

const FILTERS: { value: PublishedFilter; label: string }[] = [
  { value: "all", label: "All Services" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

function normalizeFilter(raw: string | string[] | undefined): PublishedFilter {
  if (typeof raw !== "string") return "all";
  return (["all", "published", "unpublished"] as const).includes(raw as PublishedFilter)
    ? (raw as PublishedFilter)
    : "all";
}

interface AdminServiceRow {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  automation_level: string;
  published: boolean;
  display_order: number;
  service_categories: { name: string } | null;
  service_requests: { count: number }[];
}

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string; q?: string }>;
}) {
  const { published: rawFilter, q: rawQuery } = await searchParams;
  const filter = normalizeFilter(rawFilter);
  const searchQuery = rawQuery ? rawQuery.trim().toLowerCase() : "";

  const supabase = await createServerSideClient();

  let query = supabase
    .from("services")
    .select("id, name, slug, short_description, automation_level, published, display_order, service_categories(name), service_requests(count)")
    .order("display_order", { ascending: true });

  if (filter === "published") query = query.eq("published", true);
  if (filter === "unpublished") query = query.eq("published", false);

  const { data: rawServices, error } = await query;
  let services = (rawServices as unknown as AdminServiceRow[] | null) ?? [];

  if (searchQuery) {
    services = services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery) ||
        (s.service_categories?.name && s.service_categories.name.toLowerCase().includes(searchQuery)) ||
        s.automation_level.toLowerCase().includes(searchQuery)
    );
  }

  return (
    <div className="flex flex-col gap-6 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-sky-600" />
            AI Services Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage autonomous &amp; human-in-the-loop AI service offerings and workforce requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/services/requests"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-sky-600" />
            Service Requests Queue
          </Link>
          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Service
          </Link>
        </div>
      </div>

      {/* TOOLBAR WITH GLASSMORPHISM */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/services" : `/admin/services?published=${f.value}`}
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

        <form method="GET" action="/admin/services" className="relative sm:w-64">
          {filter !== "all" && <input type="hidden" name="published" value={filter} />}
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search AI services..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* TABLE WITH GLASSMORPHISM */}
      {error ? (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-red-200 text-center shadow-xs">
          <p className="text-sm font-semibold text-red-600">Couldn&apos;t load services.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 text-center flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Cpu className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No services match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "AI services you create will appear here."}
          </p>
          <Link
            href="/admin/services/new"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Service
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50/50">
                  <th className="py-4 px-5">Service Name</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Automation Level</th>
                  <th className="py-4 px-5 text-center">Requests</th>
                  <th className="py-4 px-5">Publish Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {services.map((service) => {
                  const requestCount = service.service_requests?.[0]?.count ?? 0;
                  return (
                    <tr key={service.id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/services/${service.id}`}
                            className="font-bold text-slate-900 hover:text-sky-600 text-xs sm:text-sm transition-colors"
                          >
                            {service.name}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-mono">{service.slug}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold uppercase">
                          {service.service_categories?.name || "General"}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${
                            service.automation_level === "autonomous"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {service.automation_level}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                          <FileText className="h-3 w-3" />
                          {requestCount}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${
                            service.published
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {service.published ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
                        >
                          Manage
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
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
