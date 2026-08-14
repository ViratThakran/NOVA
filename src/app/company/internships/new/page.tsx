import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireCompanyAccess } from "@/lib/auth";
import { CreateCompanyInternshipForm } from "./create-form";

export const metadata: Metadata = { title: "Create internship — NOVA Company" };

export default async function NewCompanyInternshipPage() {
  const { companyId, companyRole } = await requireCompanyAccess();
  if (companyRole !== "owner" && companyRole !== "admin") {
    redirect("/company/internships");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Create internship" description="New listings start as a draft, not visible to students." />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <CreateCompanyInternshipForm companyId={companyId} />
        </CardContent>
      </Card>
    </div>
  );
}
