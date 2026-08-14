import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreateInternshipForm } from "./create-internship-form";

export const metadata: Metadata = { title: "Create internship — NOVA Admin" };

export default function NewInternshipPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Create internship" description="New listings start as a draft, not visible to students." />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <CreateInternshipForm />
        </CardContent>
      </Card>
    </div>
  );
}
