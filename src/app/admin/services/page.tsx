import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Cpu, ChevronRight, FileText, Bot } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            AI SERVICES CATALOG
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage autonomous &amp; human-in-the-loop AI service offerings and requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/services/requests"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold uppercase tracking-wider transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Service Requests Queue
          </Link>
          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Service
          </Link>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0E131F] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/services" : `/admin/services?published=${f.value}`}
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

        <form method="GET" action="/admin/services" className="relative sm:w-64">
          {filter !== "all" && <input type="hidden" name="published" value={filter} />}
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            name="q"
            defaultValue={rawQuery || ""}
            placeholder="Search AI services..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </form>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
          <p className="text-sm font-semibold text-red-300 font-mono">Couldn&apos;t load services.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0E131F] border border-slate-800 text-center flex flex-col items-center gap-3">
          <Cpu className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-300 font-mono">No services match this view</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results for "${searchQuery}".` : "AI services you create will appear here."}
          </p>
          <Link
            href="/admin/services/new"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Service
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E131F]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Automation Level</th>
                <th className="py-3 px-4 text-center">Total Requests</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {services.map((service) => {
                const requestCount = service.service_requests?.[0]?.count ?? 0;
                const isAuto = service.automation_level === "autonomous";

                return (
                  <tr key={service.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="font-bold text-white hover:text-indigo-300 transition-colors"
                        >
                          {service.name}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-500 line-clamp-1">
                          {service.short_description}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-bold text-cyan-300 uppercase">
                        {service.service_categories?.name ?? "Uncategorized"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                          isAuto
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                            : "bg-amber-950/80 text-amber-300 border-amber-700/40"
                        }`}
                      >
                        <Bot className="h-3 w-3" />
                        {service.automation_level.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href="/admin/services/requests"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-bold"
                      >
                        <FileText className="h-3 w-3" />
                        {requestCount}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                          service.published
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {service.published ? "Published" : "Unpublished"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                      >
                        Edit / Manage
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
