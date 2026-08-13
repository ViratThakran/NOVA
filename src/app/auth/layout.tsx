import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Link
        href="/"
        className="rounded-sm text-body font-semibold tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        NOVA
      </Link>
      <Card className="w-full max-w-md">
        <CardContent className="p-8">{children}</CardContent>
      </Card>
    </div>
  );
}
