import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { MediaUploader } from "@/components/ui/media-uploader";

export const metadata: Metadata = {
  title: "Media & Assets Studio — NOVA Admin",
  description: "Upload and manage website videos, hero cinematic assets, and photography.",
};

export default function AdminMediaPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Asset Management"
        title="Media & Video Studio"
        description="Upload, preview, and manage videos and photos for your website. Changes to the Hero Video (hero.mp4) immediately update the live homepage."
      />
      <MediaUploader />
    </div>
  );
}
