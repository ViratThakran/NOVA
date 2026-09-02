import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Build Your NOVA Profile | Onboarding" };

export default async function StudentOnboardingPage() {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    redirect("/login");
  }

  const { supabase, user } = auth;
  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();

  if (profile?.onboarded) {
    redirect("/student/dashboard");
  }


  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-4 text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to NOVA
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Build Your Student Career Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Set up your academic background, technical skills, and PDF resume to start applying for open residency opportunities.
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
