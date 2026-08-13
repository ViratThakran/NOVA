import { Badge } from "@/components/ui/badge";
import { getApplicationStatusMeta } from "@/lib/application-view-state";

export function ApplicationStatusBadge({ status }: { status: string }) {
  const { label, variant } = getApplicationStatusMeta(status);
  return <Badge variant={variant}>{label}</Badge>;
}
