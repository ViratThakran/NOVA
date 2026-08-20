"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CapabilityAccent, getAccent } from "./capability-theme";
import { cn } from "@/lib/utils";

export interface RealWorldProject {
  id: string;
  tag: string;
  title: string;
  synopsis: string;
  architecture: string;
  image: string;
  href?: string;
}

interface Props {
  id: string;
  chapter: string;
  heading: string;
  subtext: string;
  projects: RealWorldProject[];
  accent: CapabilityAccent;
}

export function SharedRealWorldSection({ id, chapter, heading, subtext, projects, accent }: Props) {
  const a = getAccent(accent);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id={id}
      className="relative py-24 sm:py-32 bg-[#F8F9FC] text-neutral-950 border-b border-neutral-200/80 overflow-hidden"
    >
      <div className={cn("absolute top-1/3 -right-20 w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none", a.orb1)} />
      <div className={cn("absolute bottom-10 -left-20 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orb2)} />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className={cn("text-[11px] font-mono font-semibold tracking-[0.24em] uppercase", a.text)}>
            {chapter}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 capitalize leading-tight">
            {heading}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed mt-2">{subtext}</p>
        </div>

        <div className="flex flex-col gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 sm:p-10 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_0_rgba(0,0,0,0.03)] hover:bg-white/85 transition-all duration-300"
            >
              <Link
                href={project.href ?? "/contact"}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center focus-visible:outline-none rounded-2xl"
              >
                <div className="lg:col-span-4">
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-200/80">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 450px"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-90"
                    />
                  </div>
                </div>
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <span className="text-[11px] font-mono font-semibold tracking-widest text-neutral-500 uppercase">{project.tag}</span>
                  <h3 className={cn("text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 transition-colors duration-200", `group-hover:${a.text}`)}>{project.title}</h3>
                  <p className="text-base sm:text-lg text-neutral-700 leading-relaxed">{project.synopsis}</p>
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-200/60">
                    <span className="text-xs font-mono text-neutral-500">
                      Architecture: <span className="text-neutral-900 font-medium">{project.architecture}</span>
                    </span>
                    <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold group-hover:translate-x-1.5 transition-transform duration-200", a.text)}>
                      <span>View Solution</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
