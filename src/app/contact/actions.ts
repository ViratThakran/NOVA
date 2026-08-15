"use server";

import { contactSubmissionSchema } from "@/lib/validation";
import { createServerSideClient } from "@/lib/supabase";
import type { ContactActionState } from "./action-state";

export async function submitContactAction(_prevState: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const parsed = contactSubmissionSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Works for both anonymous and authenticated visitors — the INSERT RLS
  // policy on contact_submissions allows both, and this Server Action
  // never reads submissions back (write-only from here; only an admin can
  // ever read them).
  const supabase = await createServerSideClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company ?? null,
    message: parsed.data.message,
  });

  if (error) {
    console.error("submitContactAction:", error);
    return { status: "error", message: "We couldn't send your message. Please try again." };
  }

  return { status: "success", message: "Thanks — we've received your message and will get back to you." };
}
