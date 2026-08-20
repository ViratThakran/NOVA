import type { Metadata } from "next";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { MediaUploader } from "@/components/ui/media-uploader";

export const metadata: Metadata = {
  title: "Media & Video Studio — NOVA",
  description: "Upload and manage website videos, hero cinematic background assets, and photos.",
};

export default function MediaStudioPage() {
  return (
    <PublicPageShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Website Asset Studio
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
            Media & Hero Video Uploader
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Upload your homepage hero video, background cinematic loops, and photos. Uploaded files are immediately served from <code className="text-indigo-300 font-mono">public/media/</code>.
          </p>
        </div>

        <MediaUploader />
      </div>
    </PublicPageShell>
  );
}
