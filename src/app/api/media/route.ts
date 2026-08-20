import { NextRequest, NextResponse } from "next/server";
import { writeFile, readdir, stat, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MEDIA_DIR = join(process.cwd(), "public", "media");

// Ensure media directory exists
async function ensureMediaDir() {
  if (!existsSync(MEDIA_DIR)) {
    await mkdir(MEDIA_DIR, { recursive: true });
  }
}

// Allowed MIME types and extensions
const ALLOWED_EXTENSIONS = new Set([
  ".mp4", ".webm", ".mov", ".ogg", ".m4v",
  ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"
]);

// GET: List all media files in public/media
export async function GET() {
  try {
    await ensureMediaDir();
    const files = await readdir(MEDIA_DIR);
    
    const mediaList = await Promise.all(
      files
        .filter((file) => !file.startsWith(".") && file !== "README.md")
        .map(async (fileName) => {
          const filePath = join(MEDIA_DIR, fileName);
          const fileStat = await stat(filePath);
          const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
          const isVideo = [".mp4", ".webm", ".mov", ".ogg", ".m4v"].includes(ext);
          const isImage = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"].includes(ext);

          return {
            name: fileName,
            url: `/media/${fileName}`,
            sizeBytes: fileStat.size,
            updatedAt: fileStat.mtime.toISOString(),
            isVideo,
            isImage,
            isHeroVideo: fileName === "hero.mp4",
          };
        })
    );

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

// POST: Upload video or photo
export async function POST(request: NextRequest) {
  try {
    await ensureMediaDir();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("customName") as string | null;
    const targetSlot = formData.get("targetSlot") as string | null; // e.g. "hero-video"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    let finalFileName = file.name;

    // Handle dedicated slots
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
      // Clean standard filename
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
    const targetPath = join(MEDIA_DIR, finalFileName);

    await writeFile(targetPath, buffer);

    return NextResponse.json({
      success: true,
      message: `File uploaded successfully as ${finalFileName}`,
      file: {
        name: finalFileName,
        url: `/media/${finalFileName}`,
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

// DELETE: Remove media file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "Filename is required" },
        { status: 400 }
      );
    }

    // Security: prevent directory traversal
    const safeName = fileName.replace(/(\.\.[/\\])+/g, "").replace(/[^a-zA-Z0-9._-]/g, "");
    const targetPath = join(MEDIA_DIR, safeName);

    if (existsSync(targetPath)) {
      await unlink(targetPath);
      return NextResponse.json({
        success: true,
        message: `File ${safeName} deleted successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting media file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
