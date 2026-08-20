"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { IndustryAccent, getIndustryAccent } from "./industry-theme";
import { cn } from "@/lib/utils";

export interface IndustryActionCase {
  id: string;
  tag: string;
  title: string;
  synopsis: string;
  stat: string;
  image: string;
}

interface Props {
  id?: string;
  chapter?: string;
  heading: string;
  subtext: string;
  stories: IndustryActionCase[];
  accent?: IndustryAccent;
}

export function IndustryInActionSection({
  id = "industry-action",
  chapter = "04 / SYSTEMS IN ACTION",
  heading,
  subtext,
  stories,
  accent = "emerald",
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const a = getIndustryAccent(accent);

  return (
    <section
      id={id}
      className="relative py-24 sm:py-32 bg-[#08080A] text-white border-b border-white/[0.08] overflow-hidden"
    >
      <div className={cn("absolute top-0 left-1/4 w-[700px] h-[500px] rounded-full blur-3xl pointer-events-none", a.orbDark1)} />
      <div className={cn("absolute bottom-0 right-10 w-[500px] h-[400px] rounded-full blur-3xl pointer-events-none", a.orbDark2)} />

      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-3 max-w-2xl mb-16 sm:mb-20">
          <span className={cn("text-[11px] font-mono font-semibold tracking-[0.24em] uppercase", a.textDark)}>
            {chapter}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white capitalize leading-tight">
            {heading}
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed mt-2">
            {subtext}
          </p>
        </div>

        <div className="flex flex-col gap-14 sm:gap-16">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-center ${
                index % 2 === 1 ? "lg:[direction:rtl]" : ""
              }`}
            >
              <div className={`lg:col-span-5 ${index % 2 === 1 ? "[direction:ltr]" : ""}`}>
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-inner">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </div>
              </div>

              <div className={`lg:col-span-7 flex flex-col gap-5 ${index % 2 === 1 ? "[direction:ltr]" : ""}`}>
                <span className="text-[10px] font-mono font-semibold tracking-widest text-neutral-500 uppercase">
                  {story.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                  {story.title}
                </h3>
                <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
                  {story.synopsis}
                </p>
                <div className="pt-4 border-t border-white/10">
                  <span className={cn("text-xs font-mono tracking-widest uppercase font-semibold", a.statText)}>
                    {story.stat}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
