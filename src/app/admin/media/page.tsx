import type { Metadata } from "next";
import { Film } from "lucide-react";
import { MediaUploader } from "@/components/ui/media-uploader";

export const metadata: Metadata = {
  title: "Media & Assets Studio | NOVA Admin",
};

export default function AdminMediaPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Film className="h-5 w-5 text-indigo-400" />
            MEDIA &amp; ASSET STUDIO
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Upload, preview, and manage website videos, hero cinematic background assets, and photos.
          </p>
        </div>
      </div>

      <MediaUploader />
    </div>
  );
}
