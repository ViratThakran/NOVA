import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSideClient } from "@/lib/supabase";
import { OnboardingForm } from "./onboarding-form";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Build Your NOVA Profile | Onboarding" };

export default async function StudentOnboardingPage() {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).single();

  if (profile?.onboarded) {
    redirect("/student/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-4">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/40 font-mono text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> WELCOME TO NOVA
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-sans">
          Build Your Student Career Profile
        </h1>
        <p className="text-xs font-mono text-slate-400 leading-relaxed">
          Set up your academic background, technical skills, and PDF resume to start applying for open residency opportunities.
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
