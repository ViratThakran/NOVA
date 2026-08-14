"use client";

import { useActionState } from "react";
import { createServiceAction } from "../../actions";
import { initialAdminActionState } from "../../action-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function CreateServiceForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createServiceAction, initialAdminActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category_id">Category</Label>
        <Select id="category_id" name="category_id" required defaultValue="">
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={200} placeholder="AI Website Creation" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required maxLength={100} placeholder="ai-website-creation" />
        <p className="text-caption text-text-muted">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="short_description">Short description</Label>
        <Textarea id="short_description" name="short_description" required rows={2} maxLength={300} placeholder="One sentence summary shown on the catalog." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required rows={5} placeholder="What this service actually delivers..." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="automation_level">Automation level</Label>
        <Select id="automation_level" name="automation_level" required defaultValue="autonomous">
          <option value="autonomous">Autonomous</option>
          <option value="approval_required">Approval required</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="display_order">Display order</Label>
        <Input id="display_order" name="display_order" type="number" min={0} defaultValue={0} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-small text-error">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} className="self-start">
        Create service
      </Button>
    </form>
  );
}
