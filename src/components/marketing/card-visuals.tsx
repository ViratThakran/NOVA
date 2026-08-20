"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// 1. LEARN VISUAL: Knowledge, Experimentation & Curriculum
export function LearnArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#0b1528] via-[#09101d] to-[#050811] border border-blue-900/40 p-5 flex flex-col justify-between shadow-inner select-none", className)}>
      {/* Soft Blue Atmospheric Radial */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/20 blur-[60px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/15 blur-[50px] pointer-events-none rounded-full" />

      {/* Top Bar: Curriculum Stream */}
      <div className="relative z-10 flex items-center justify-between border-b border-blue-900/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-blue-300 uppercase">
            Curriculum Matrix
          </span>
        </div>
        <span className="rounded bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
          Cohort 2026
        </span>
      </div>

      {/* Center: Layered Modular Engineering Labs */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 my-2">
        <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-3 flex flex-col gap-1 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">AI Foundations</span>
            <span className="text-[10px] font-mono text-blue-400">Lab 01</span>
          </div>
          <div className="w-full bg-blue-900/40 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full w-[85%] rounded-full" />
          </div>
          <span className="text-[10px] text-blue-200/70 mt-0.5">Transformers & Agents</span>
        </div>

        <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-3 flex flex-col gap-1 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Distributed Systems</span>
            <span className="text-[10px] font-mono text-cyan-400">Lab 02</span>
          </div>
          <div className="w-full bg-blue-900/40 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-cyan-400 to-indigo-400 h-full w-[70%] rounded-full" />
          </div>
          <span className="text-[10px] text-blue-200/70 mt-0.5">Concurrency & Scalability</span>
        </div>
      </div>

      {/* Bottom: Concept Graph */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-blue-300/80 pt-2 border-t border-blue-900/30">
        <span>Instruction: Production Architecture</span>
        <span className="text-cyan-400">Audited Mastery</span>
      </div>
    </div>
  );
}

// 2. BUILD VISUAL: Creation, Code, Systems & AI
export function BuildArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#180d2b] via-[#10081d] to-[#0a0412] border border-violet-900/40 p-5 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/20 blur-[50px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-violet-900/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-violet-300 uppercase">
            Production Build Engine
          </span>
        </div>
        <span className="text-[10px] font-mono text-violet-400">v3.4-live</span>
      </div>

      {/* Synthesized System Diagram */}
      <div className="relative z-10 flex flex-col gap-2 my-2 font-mono text-[11px]">
        <div className="flex items-center gap-2 text-violet-200 bg-violet-950/60 border border-violet-800/40 px-3 py-1.5 rounded-lg">
          <span className="text-violet-400">▶</span>
          <span>Deploying autonomous agent pipeline</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          <div className="bg-violet-900/30 border border-violet-800/30 py-1.5 rounded text-violet-300">
            UI Platform
          </div>
          <div className="bg-violet-900/30 border border-violet-800/30 py-1.5 rounded text-violet-300">
            API Gateway
          </div>
          <div className="bg-violet-900/30 border border-violet-800/30 py-1.5 rounded text-emerald-300">
            Live Cluster
          </div>
        </div>
      </div>

      {/* Bottom State */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-violet-300/80 pt-2 border-t border-violet-900/30">
        <span>Artifact: Tangible Software</span>
        <span className="text-violet-400">Ready to Ship</span>
      </div>
    </div>
  );
}

// 3. EXPERIENCE VISUAL: Human Collaboration, Squads & Mentorship
export function ExperienceArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#26150a] via-[#1a0e06] to-[#0f0703] border border-amber-900/40 p-5 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 blur-[50px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-amber-900/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-amber-300 uppercase">
            Squad Collaboration
          </span>
        </div>
        <span className="text-[10px] font-mono text-amber-400">Sprint 12</span>
      </div>

      {/* Team Reviews & Live Commits Frame */}
      <div className="relative z-10 flex flex-col gap-2 my-2">
        <div className="flex items-center justify-between rounded-lg bg-amber-950/50 border border-amber-800/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-amber-950 bg-amber-600 text-[10px] font-bold text-white text-center leading-6">E1</span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-amber-950 bg-amber-700 text-[10px] font-bold text-white text-center leading-6">M2</span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-amber-950 bg-amber-800 text-[10px] font-bold text-white text-center leading-6">S3</span>
            </div>
            <span className="text-amber-100 font-medium">Architecture PR Review</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Approved</span>
        </div>

        <div className="text-[11px] font-mono text-amber-300/90 pl-1">
          ✓ 14 commits merged • Verified live deploy
        </div>
      </div>

      {/* Bottom State */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-amber-300/80 pt-2 border-t border-amber-900/30">
        <span>Guidance: Tech Leads</span>
        <span className="text-amber-400">Proof of Work</span>
      </div>
    </div>
  );
}

// 4. GROW VISUAL: Pathways, Career Doorways & Opportunity
export function GrowArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#062419] via-[#041911] to-[#020d09] border border-emerald-900/40 p-5 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/20 blur-[60px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-teal-500/15 blur-[50px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-emerald-900/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-300 uppercase">
            Career & Opportunity Grid
          </span>
        </div>
        <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          Global Pathways
        </span>
      </div>

      {/* Pathway Highlights */}
      <div className="relative z-10 grid grid-cols-3 gap-2.5 my-2">
        <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-2.5 flex flex-col gap-1 backdrop-blur-sm text-center">
          <span className="text-[10px] font-mono text-emerald-400">DOORWAY 01</span>
          <span className="text-xs font-bold text-white">Paid Internships</span>
        </div>
        <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-2.5 flex flex-col gap-1 backdrop-blur-sm text-center">
          <span className="text-[10px] font-mono text-teal-400">DOORWAY 02</span>
          <span className="text-xs font-bold text-white">Direct Hiring</span>
        </div>
        <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-2.5 flex flex-col gap-1 backdrop-blur-sm text-center">
          <span className="text-[10px] font-mono text-cyan-400">DOORWAY 03</span>
          <span className="text-xs font-bold text-white">Builder Labs</span>
        </div>
      </div>

      {/* Bottom State */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-emerald-300/80 pt-2 border-t border-emerald-900/30">
        <span>Connection: Direct to Engineering Labs</span>
        <span className="text-emerald-400">Lifelong Network</span>
      </div>
    </div>
  );
}

// 5. WHAT WE DO: AI & Intelligence Large Artwork
export function AiCapabilityArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[260px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c132c] via-[#080d1f] to-[#04060e] border border-blue-800/50 p-6 flex flex-col justify-between shadow-2xl select-none", className)}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/25 blur-[70px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 blur-[60px] pointer-events-none rounded-full" />

      <div className="relative z-10 flex items-center justify-between border-b border-blue-800/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-blue-300 uppercase">
            Autonomous Intelligence Grid
          </span>
        </div>
        <span className="rounded bg-blue-950 border border-blue-700/60 px-2.5 py-1 text-[11px] font-mono text-cyan-300">
          Agent-Cluster Active
        </span>
      </div>

      <div className="relative z-10 my-3 space-y-2.5">
        <div className="flex items-center justify-between bg-blue-950/60 border border-blue-800/40 px-4 py-2.5 rounded-xl text-xs font-mono text-blue-100">
          <span>// Multi-Agent Execution</span>
          <span className="text-emerald-400">Concurrency: 64 streams</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="bg-blue-900/30 border border-blue-700/40 py-2 rounded-lg text-blue-200">
            LLM Pipeline
          </div>
          <div className="bg-blue-900/30 border border-blue-700/40 py-2 rounded-lg text-indigo-200">
            Neural Vectors
          </div>
          <div className="bg-blue-900/30 border border-blue-700/40 py-2 rounded-lg text-cyan-200">
            Self-Evaluation
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs font-mono text-blue-300/80 pt-3 border-t border-blue-800/40">
        <span>Telemetry: 99.98% Verification Score</span>
        <span className="text-blue-400">Autonomous Orchestration</span>
      </div>
    </div>
  );
}

// 6. WHAT WE DO: Digital Products Artwork
export function DigitalProductsArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#121629] to-[#090b14] border border-blue-900/40 p-4 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] font-mono text-neutral-400">
        <span>Responsive Viewport</span>
        <span className="text-blue-400">Edge-Native</span>
      </div>
      <div className="flex items-center justify-center gap-3 my-1">
        <div className="h-14 w-28 rounded-md bg-neutral-900 border border-neutral-700/80 p-1 flex flex-col gap-1 shadow-md">
          <div className="h-2 w-full bg-neutral-800 rounded-sm" />
          <div className="grid grid-cols-2 gap-1 flex-1">
            <div className="bg-blue-900/40 rounded-sm" />
            <div className="bg-indigo-900/40 rounded-sm" />
          </div>
        </div>
        <div className="h-14 w-10 rounded-md bg-neutral-900 border border-neutral-700/80 p-1 flex flex-col gap-1 shadow-md">
          <div className="h-2 w-full bg-neutral-800 rounded-sm" />
          <div className="flex-1 bg-cyan-900/40 rounded-sm" />
        </div>
      </div>
      <span className="text-[10px] font-mono text-neutral-400 text-center">Web & Mobile Platforms</span>
    </div>
  );
}

// 7. WHAT WE DO: Software & Technology Artwork
export function SoftwareArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#181329] to-[#0c0915] border border-violet-900/40 p-4 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] font-mono text-neutral-400">
        <span>Architecture Mesh</span>
        <span className="text-violet-400">High Throughput</span>
      </div>
      <div className="grid grid-cols-3 gap-2 my-1 text-center font-mono text-[10px]">
        <div className="bg-violet-950/60 border border-violet-800/40 py-2 rounded text-violet-200">
          Services
        </div>
        <div className="bg-violet-950/60 border border-violet-800/40 py-2 rounded text-violet-200">
          gRPC
        </div>
        <div className="bg-violet-950/60 border border-violet-800/40 py-2 rounded text-emerald-300">
          Cloud Mesh
        </div>
      </div>
      <span className="text-[10px] font-mono text-neutral-400 text-center">Distributed & Resilient Backend</span>
    </div>
  );
}

// 8. WHAT WE DO: Data & Analytics Artwork
export function DataArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-br from-[#0c1e28] to-[#060f14] border border-cyan-900/40 p-3.5 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
        <span>Data Telemetry</span>
        <span className="text-emerald-400">Live</span>
      </div>
      <div className="flex items-end justify-between gap-1.5 h-10 px-2">
        <div className="w-full bg-cyan-800/60 h-[40%] rounded-t-sm" />
        <div className="w-full bg-cyan-600/70 h-[70%] rounded-t-sm" />
        <div className="w-full bg-cyan-500/80 h-[90%] rounded-t-sm" />
        <div className="w-full bg-cyan-400 h-[60%] rounded-t-sm" />
        <div className="w-full bg-cyan-300 h-[85%] rounded-t-sm" />
      </div>
      <span className="text-[10px] font-mono text-neutral-400 text-center">Stream Processing & Warehouses</span>
    </div>
  );
}

// 9. WHAT WE DO: Automation Artwork
export function AutomationArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-br from-[#211429] to-[#0e0712] border border-purple-900/40 p-3.5 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="flex items-center justify-between text-[11px] font-mono text-purple-300">
        <span>Workflow Orchestration</span>
        <span className="text-emerald-400">Automated</span>
      </div>
      <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-purple-200">
        <span className="bg-purple-950 px-2 py-1 rounded border border-purple-800">Trigger</span>
        <span>→</span>
        <span className="bg-purple-950 px-2 py-1 rounded border border-purple-800">Pipeline</span>
        <span>→</span>
        <span className="bg-emerald-950 px-2 py-1 rounded border border-emerald-800 text-emerald-300">Deploy</span>
      </div>
      <span className="text-[10px] font-mono text-neutral-400 text-center">Self-Healing CI/CD Engines</span>
    </div>
  );
}

// 10. WHAT WE DO: Talent Solutions Artwork
export function TalentArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-br from-[#0c261b] to-[#05120c] border border-emerald-900/40 p-3.5 flex flex-col justify-between shadow-inner select-none", className)}>
      <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
        <span>Engineering Squads</span>
        <span className="text-teal-400">Embedded</span>
      </div>
      <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-emerald-100">
        <span className="bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">Lead</span>
        <span className="bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">Full-Stack</span>
        <span className="bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">AI Engineer</span>
      </div>
      <span className="text-[10px] font-mono text-neutral-400 text-center">Direct Squad Placement</span>
    </div>
  );
}
