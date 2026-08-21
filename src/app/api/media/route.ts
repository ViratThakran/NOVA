import { NextRequest, NextResponse } from "next/server";
import { writeFile, readdir, stat, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { createServerSideClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth";

const MEDIA_DIR = join(process.cwd(), "public", "media");

// Ensure local media directory exists for local dev fallback
async function ensureMediaDir() {
  try {
    if (!existsSync(MEDIA_DIR)) {
      await mkdir(MEDIA_DIR, { recursive: true });
    }
  } catch {
    // Ignore error if filesystem is read-only in serverless environment
  }
}

// Allowed MIME types and extensions
const ALLOWED_EXTENSIONS = new Set([
  ".mp4", ".webm", ".mov", ".ogg", ".m4v",
  ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"
]);

interface MediaFileResponse {
  name: string;
  url: string;
  sizeBytes: number;
  updatedAt: string;
  isVideo: boolean;
  isImage: boolean;
  isHeroVideo: boolean;
}

// GET: List all media files (combines Supabase Storage 'media' bucket & local public/media static fallback)
export async function GET() {
  try {
    const supabase = await createServerSideClient();
    const mediaMap = new Map<string, MediaFileResponse>();

    // 1. Fetch from Supabase Storage 'media' bucket
    const { data: storageFiles, error: storageError } = await supabase.storage.from("media").list();

    if (!storageError && storageFiles) {
      for (const item of storageFiles) {
        if (!item.name || item.name.startsWith(".")) continue;
        const ext = item.name.substring(item.name.lastIndexOf(".")).toLowerCase();
        const isVideo = [".mp4", ".webm", ".mov", ".ogg", ".m4v"].includes(ext);
        const isImage = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"].includes(ext);
        const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(item.name);

        mediaMap.set(item.name, {
          name: item.name,
          url: publicUrlData.publicUrl,
          sizeBytes: item.metadata?.size ?? 0,
          updatedAt: item.updated_at ?? item.created_at ?? new Date().toISOString(),
          isVideo,
          isImage,
          isHeroVideo: item.name === "hero.mp4",
        });
      }
    }

    // 2. Fallback check for local static assets in public/media/
    try {
      await ensureMediaDir();
      if (existsSync(MEDIA_DIR)) {
        const localFiles = await readdir(MEDIA_DIR);
        for (const fileName of localFiles) {
          if (fileName.startsWith(".") || fileName === "README.md" || mediaMap.has(fileName)) continue;

          const filePath = join(MEDIA_DIR, fileName);
          const fileStat = await stat(filePath);
          const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
          const isVideo = [".mp4", ".webm", ".mov", ".ogg", ".m4v"].includes(ext);
          const isImage = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"].includes(ext);

          mediaMap.set(fileName, {
            name: fileName,
            url: `/media/${fileName}`,
            sizeBytes: fileStat.size,
            updatedAt: fileStat.mtime.toISOString(),
            isVideo,
            isImage,
            isHeroVideo: fileName === "hero.mp4",
          });
        }
      }
    } catch {
      // Ignore filesystem read errors in serverless environments
    }

    const mediaList = Array.from(mediaMap.values());

    // Sort: Hero files first, then newest
    mediaList.sort((a, b) => {
      if (a.isHeroVideo) return -1;
      if (b.isHeroVideo) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({ success: true, files: mediaList });
  } catch (error) {
    console.error("Error listing media files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list media files" },
      { status: 500 }
    );
  }
}

// POST: Upload video or photo (Persists to Supabase Storage 'media' bucket + local fallback)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth || !auth.roles.some((r) => r === "admin" || r === "super_admin")) {
      return NextResponse.json({ success: false, error: "Admin authorization required to upload media." }, { status: 403 });
    }

    const { supabase } = auth;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("customName") as string | null;
    const targetSlot = formData.get("targetSlot") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    let finalFileName = file.name;

    if (targetSlot === "hero-video") {
      finalFileName = "hero.mp4";
    } else if (targetSlot === "hero-poster") {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase() || ".jpg";
      finalFileName = `hero-poster${ext}`;
    } else if (customName && customName.trim().length > 0) {
      const cleanCustomName = customName.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      finalFileName = cleanCustomName.endsWith(ext) ? cleanCustomName : `${cleanCustomName}${ext}`;
    } else {
      finalFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    }

    const fileExt = finalFileName.substring(finalFileName.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file extension: ${fileExt}. Allowed formats: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to Supabase Storage 'media' bucket
    const { error: storageError } = await supabase.storage.from("media").upload(finalFileName, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

    let publicUrl = `/media/${finalFileName}`;
    if (!storageError) {
      const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(finalFileName);
      if (publicUrlData?.publicUrl) {
        publicUrl = publicUrlData.publicUrl;
      }
    }

    // 2. Local filesystem write fallback for local development
    try {
      await ensureMediaDir();
      if (existsSync(MEDIA_DIR)) {
        const targetPath = join(MEDIA_DIR, finalFileName);
        await writeFile(targetPath, buffer);
      }
    } catch {
      // Ignore disk write failure in serverless environment
    }

    return NextResponse.json({
      success: true,
      message: `File uploaded successfully as ${finalFileName}`,
      file: {
        name: finalFileName,
        url: publicUrl,
        sizeBytes: buffer.length,
        isVideo: [".mp4", ".webm", ".mov", ".ogg", ".m4v"].includes(fileExt),
        isImage: [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"].includes(fileExt),
        isHeroVideo: finalFileName === "hero.mp4",
      },
    });
  } catch (error) {
    console.error("Error uploading media file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save uploaded file" },
      { status: 500 }
    );
  }
}

// DELETE: Remove media file (Deletes from Supabase Storage 'media' bucket + local fallback)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth || !auth.roles.some((r) => r === "admin" || r === "super_admin")) {
      return NextResponse.json({ success: false, error: "Admin authorization required to delete media." }, { status: 403 });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const safeName = fileName.replace(/(\.\.[/\\])+/g, "").replace(/[^a-zA-Z0-9._-]/g, "");

    // 1. Remove from Supabase Storage 'media' bucket
    await supabase.storage.from("media").remove([safeName]);

    // 2. Remove from local filesystem if present
    try {
      const targetPath = join(MEDIA_DIR, safeName);
      if (existsSync(targetPath)) {
        await unlink(targetPath);
      }
    } catch {
      // Ignore local disk unlink error on serverless
    }

    return NextResponse.json({
      success: true,
      message: `File ${safeName} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting media file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

