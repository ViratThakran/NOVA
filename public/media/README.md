# NOVA Website Media & Asset Directory

All website media (videos, hero background clips, photographic assets, badges, illustrations) placed in this folder are automatically served by Next.js at the `/media/` URL path.

---

## 🎬 Quick Media Naming Conventions

| File Name | Purpose | Recommended Format | Where It Appears |
| :--- | :--- | :--- | :--- |
| **`hero.mp4`** | **Primary Homepage Hero Video** | 1080p or 4K MP4 (H.264), 5-30s, muted loop, < 40MB | Plays automatically in the homepage hero header behind the title |
| **`hero-poster.jpg`** | **Hero Video Fallback Image** | High-res JPG / WebP (1920x1080) | Displays on low-bandwidth devices or when reduced-motion is enabled |
| **`logo.png` / `logo.svg`** | **Brand Logo** | Transparent SVG or PNG | Navigation header and footer |
| **`[custom-name].mp4`** | **Course / Program Videos** | MP4 or WebM | Available at `/media/[custom-name].mp4` |
| **`[custom-name].jpg`** | **Section Images & Photos** | JPG, PNG, WebP, SVG | Available at `/media/[custom-name].jpg` |

---

## 🚀 How to Upload & Manage Media

### Option 1: Web Interface (Recommended)
1. Navigate to **[http://localhost:3000/admin/media](http://localhost:3000/admin/media)**
2. Select **"Hero Video"**, **"Hero Poster"**, or **"General Media"**
3. Drag & drop your video or photo file
4. The file is uploaded immediately and live previewed in real time!

### Option 2: Direct File Explorer Drop
Drop any `.mp4`, `.webm`, `.jpg`, `.png`, or `.webp` file directly into this folder (`c:\Users\virat\NOVA\public\media\`).
- If you name it `hero.mp4`, it immediately becomes your homepage hero background video!
