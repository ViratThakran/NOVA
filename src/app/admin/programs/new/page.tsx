import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreateProgramForm } from "./create-program-form";

export const metadata: Metadata = { title: "Create program — NOVA Admin" };

export default function NewProgramPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Create program" description="New programs start as a draft, not visible to the public catalog." />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <CreateProgramForm />
        </CardContent>
      </Card>
    </div>
  );
}
