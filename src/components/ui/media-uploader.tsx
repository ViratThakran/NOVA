"use client";

import * as React from "react";
import {
  UploadCloud,
  Video,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Film,
  Eye,
  CheckCircle2,
} from "lucide-react";

interface MediaItem {
  name: string;
  url: string;
  sizeBytes: number;
  updatedAt: string;
  isVideo: boolean;
  isImage: boolean;
  isHeroVideo: boolean;
}

interface MediaUploaderProps {
  onMediaChanged?: () => void;
  showHeroPreview?: boolean;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function MediaUploader({ onMediaChanged, showHeroPreview = true }: MediaUploaderProps) {
  const [mediaList, setMediaList] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);
  const [targetSlot, setTargetSlot] = React.useState<"hero-video" | "hero-poster" | "custom">("hero-video");
  const [customName, setCustomName] = React.useState<string>("");
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null);
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMedia = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.success) {
        setMediaList(data.files);
        // Find hero video for initial preview if available
        const hero = data.files.find((f: MediaItem) => f.isHeroVideo);
        if (hero && !previewItem) {
          setPreviewItem(hero);
        }
      }
    } catch (err) {
      console.error("Failed to load media list:", err);
    } finally {
      setLoading(false);
    }
  }, [previewItem]);

  React.useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setUploadProgress(`Uploading ${file.name}...`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetSlot", targetSlot);
      if (targetSlot === "custom" && customName) {
        formData.append("customName", customName);
      }

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccessMessage(
        targetSlot === "hero-video"
          ? "🎉 Hero video successfully updated! It is now live on your website."
          : `✓ Successfully uploaded ${data.file.name}`
      );
      setCustomName("");
      await fetchMedia();
      if (onMediaChanged) onMediaChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMessage(msg);
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const res = await fetch(`/api/media?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Deleted ${fileName}`);
        await fetchMedia();
        if (previewItem?.name === fileName) {
          setPreviewItem(null);
        }
        if (onMediaChanged) onMediaChanged();
      } else {
        setErrorMessage(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMessage("Delete request failed");
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const hasHeroVideo = mediaList.some((m) => m.isHeroVideo);

  return (
    <div className="w-full space-y-8">
      {/* Top Banner Alert / Status */}
      {hasHeroVideo ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div className="text-sm">
            <span className="font-semibold text-emerald-200">Active Hero Video Detected:</span>{" "}
            Your website is actively using <code className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-xs font-mono text-emerald-300">/media/hero.mp4</code> in the homepage header.
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="text-sm">
            <span className="font-semibold text-amber-200">No Hero Video Uploaded Yet:</span>{" "}
            The homepage is currently displaying the interactive 3D particle canvas fallback. Upload a video below as <strong>&quot;Hero Video (hero.mp4)&quot;</strong> to activate cinematic background playback.
          </div>
        </div>
      )}

      {/* Upload Box Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Film className="h-5 w-5 text-indigo-400" />
              Upload Website Media & Hero Video
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Upload videos (.mp4, .webm, .mov) or photos (.png, .jpg, .webp, .svg) directly to your website.
            </p>
          </div>

          {/* Slot Switcher Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTargetSlot("hero-video")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                targetSlot === "hero-video"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Hero Video (hero.mp4)
            </button>
            <button
              type="button"
              onClick={() => setTargetSlot("hero-poster")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                targetSlot === "hero-poster"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Hero Poster Image
            </button>
            <button
              type="button"
              onClick={() => setTargetSlot("custom")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                targetSlot === "custom"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              General Media
            </button>
          </div>
        </div>

        {/* Custom file name input if custom selected */}
        {targetSlot === "custom" && (
          <div className="mb-6">
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
              Custom File Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. features-preview, team-photo, about-banner"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
              : "border-neutral-700 bg-neutral-950/60 hover:border-neutral-500 hover:bg-neutral-950/90"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg,image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUpload(e.target.files[0]);
              }
            }}
          />

          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800/80 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
            {targetSlot === "hero-video" ? (
              <Video className="h-8 w-8" />
            ) : targetSlot === "hero-poster" ? (
              <ImageIcon className="h-8 w-8" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
          </div>

          <p className="text-base font-semibold text-white">
            {uploading ? (
              <span className="flex items-center gap-2 text-indigo-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
                {uploadProgress || "Uploading asset..."}
              </span>
            ) : (
              <span>
                Click to browse or drop your {targetSlot === "hero-video" ? "hero video (.mp4)" : "media file"} here
              </span>
            )}
          </p>

          <p className="mt-2 text-xs text-neutral-400 max-w-sm">
            {targetSlot === "hero-video" ? (
              <>
                Target: <span className="text-indigo-300 font-mono">public/media/hero.mp4</span> (Recommended: 1080p or 4K MP4, h264/h265, 5-30s loop, under 50MB)
              </>
            ) : targetSlot === "hero-poster" ? (
              <>
                Target: <span className="text-indigo-300 font-mono">public/media/hero-poster.jpg</span> (High-res JPG or WebP)
              </>
            ) : (
              <>
                Supports MP4, WebM, MOV, PNG, JPG, WebP, SVG, GIF. Saved directly into <span className="text-neutral-300 font-mono">public/media/</span>
              </>
            )}
          </p>
        </div>

        {/* Feedback Notifications */}
        {successMessage && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 font-medium ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-400 hover:text-rose-200 font-medium ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Live Hero Simulation Section */}
      {showHeroPreview && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Live Hero Section Simulation</h3>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Live preview with website typography overlay
            </span>
          </div>

          <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl">
            {previewItem?.isVideo || hasHeroVideo ? (
              <video
                src={previewItem?.url || "/media/hero.mp4"}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : previewItem?.isImage ? (
              <img
                src={previewItem.url}
                alt="Preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900">
                <Video className="h-10 w-10 text-neutral-700 mb-2" />
                <p className="text-sm text-neutral-400 font-medium">No video selected for preview</p>
                <p className="text-xs text-neutral-600 mt-1">Upload a hero video above or pick an item from the gallery below.</p>
              </div>
            )}

            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Hero Mockup Text Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 pointer-events-none">
              <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-300 mb-1">
                HERO PREVIEW • {previewItem?.name || "hero.mp4"}
              </span>
              <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-none">
                Building What Comes Next.
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-md line-clamp-2">
                NOVA is building the foundational ecosystem connecting technology, learning and career opportunity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Media Gallery */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 md:p-8 backdrop-blur-xl shadow-xl">
        <div className="mb-6 flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Media Library ({mediaList.length})</h3>
          </div>
          <button
            onClick={fetchMedia}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
            <UploadCloud className="h-12 w-12 mb-3 text-neutral-600" />
            <p className="text-sm font-medium text-neutral-400">No media assets in public/media/</p>
            <p className="text-xs text-neutral-600 mt-1">Use the upload box above to add your hero video or images.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.name}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-neutral-950 p-3 transition-all ${
                  item.isHeroVideo
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/40"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900 mb-3 border border-neutral-800/80">
                  {item.isVideo ? (
                    <video
                      src={item.url}
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  ) : item.isImage ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : null}

                  {/* Badge */}
                  {item.isHeroVideo && (
                    <div className="absolute top-2 left-2 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      Active Hero Video
                    </div>
                  )}

                  {/* Video Play Overlay Hint */}
                  {item.isVideo && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300 backdrop-blur-sm flex items-center gap-1">
                      <Play className="h-2.5 w-2.5" /> Video
                    </div>
                  )}
                </div>

                {/* File Information */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate max-w-[180px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {formatBytes(item.sizeBytes)}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 truncate">
                    Path: {item.url}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.url)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors"
                  >
                    {copiedUrl === item.url ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    title="Preview in Hero simulation"
                    className="inline-flex items-center justify-center rounded-md bg-neutral-900 hover:bg-neutral-800 p-1.5 text-neutral-300 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.name)}
                    title="Delete media file"
                    className="inline-flex items-center justify-center rounded-md bg-rose-950/40 hover:bg-rose-900/60 p-1.5 text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
