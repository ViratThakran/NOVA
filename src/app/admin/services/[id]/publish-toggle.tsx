"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateServiceStatusAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PublishToggle({ serviceId, published }: { serviceId: string; published: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateServiceStatusAction, initialAdminActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <div className="flex flex-col gap-3">
      <Badge variant={published ? "success" : "default"} className="w-fit">
        {published ? "Published" : "Unpublished"}
      </Badge>
      <form action={formAction}>
        <input type="hidden" name="service_id" value={serviceId} />
        <input type="hidden" name="published" value={(!published).toString()} />
        <Button type="submit" variant="outline" size="sm" loading={pending}>
          {published ? "Unpublish" : "Publish"}
        </Button>
      </form>
      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}
    </div>
  );
}
