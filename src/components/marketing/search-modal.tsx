"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Sparkles, Layers } from "lucide-react";
import { CAPABILITIES } from "@/data/capabilities";
import { INDUSTRIES } from "@/data/industries";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global Cmd+K / Ctrl+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled by parent if needed
        }
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const q = query.trim().toLowerCase();

  const filteredCapabilities = React.useMemo(() => {
    if (!q) return CAPABILITIES;
    return CAPABILITIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q)
    );
  }, [q]);

  const filteredIndustries = React.useMemo(() => {
    if (!q) return INDUSTRIES;
    return INDUSTRIES.filter(
      (ind) =>
        ind.name.toLowerCase().includes(q) ||
        ind.title.toLowerCase().includes(q) ||
        ind.tagline.toLowerCase().includes(q) ||
        ind.heroDescription.toLowerCase().includes(q)
    );
  }, [q]);

  const hasResults = filteredCapabilities.length > 0 || filteredIndustries.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm pointer-events-auto"
            aria-hidden="true"
          />

          {/* Search Modal Surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-[#121216] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-white overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#16161B]">
              <Search className="h-5 w-5 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search capabilities, industries, technologies..."
                className="w-full bg-transparent text-base text-white placeholder-neutral-500 focus:outline-none font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-neutral-400 border border-white/10">
                ESC
              </kbd>
            </div>

            {/* Results Body */}
            <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-6">
              {!hasResults && (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <p className="text-sm text-neutral-400 font-normal">
                    No results matching &quot;<span className="text-white">{query}</span>&quot;
                  </p>
                  <span className="text-xs text-neutral-500 font-mono">
                    Try searching for AI, Cloud, Software, Healthcare, or Financial Services.
                  </span>
                </div>
              )}

              {/* Capabilities Section */}
              {filteredCapabilities.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 text-[11px] font-mono font-semibold tracking-widest text-indigo-400 uppercase">
                    <Sparkles className="h-3 w-3" />
                    <span>Capabilities ({filteredCapabilities.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredCapabilities.map((cap) => (
                      <Link
                        key={cap.slug}
                        href={`/what-we-do/${cap.slug}`}
                        onClick={onClose}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.06] transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-400 font-bold">
                              {cap.number}
                            </span>
                            <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {cap.title}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 line-clamp-1">
                            {cap.tagline}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries Section */}
              {filteredIndustries.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 text-[11px] font-mono font-semibold tracking-widest text-indigo-400 uppercase">
                    <Layers className="h-3 w-3" />
                    <span>Industries ({filteredIndustries.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredIndustries.map((ind) => (
                      <Link
                        key={ind.slug}
                        href={`/industries/${ind.slug}`}
                        onClick={onClose}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.06] transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-400 font-bold">
                              {ind.number}
                            </span>
                            <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {ind.title}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 line-clamp-1">
                            {ind.heroDescription}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-[#16161B] flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-2">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px]">⌘K</kbd> /{" "}
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px]">Ctrl+K</kbd> to toggle
              </span>
              <span>NOVA Global Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
