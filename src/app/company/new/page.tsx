import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth";
import { CreateCompanyForm } from "./create-company-form";

export const metadata: Metadata = { title: "Create a company — NOVA" };

export default async function NewCompanyPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/company/new");
  const { user, supabase } = auth;

  // Someone who already belongs to a company has nothing to do here —
  // multi-company creation from this flow is out of scope (see
  // requireCompanyAccess()'s own "multi-company switching is out of scope"
  // note); send them straight to the company they already have.
  const { data: existingMembership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    redirect("/company");
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:py-16">
      <PageHeader
        title="Create your company"
        description="Set up a company workspace to post internships, review applicants, and request services on the company platform."
      />
      <Card>
        <CardContent className="p-6">
          <CreateCompanyForm />
        </CardContent>
      </Card>
    </div>
  );
}
