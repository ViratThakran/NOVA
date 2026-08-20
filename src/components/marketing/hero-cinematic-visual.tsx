"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function HeroCinematicVisual() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [videoLoaded, setVideoLoaded] = React.useState<boolean>(false);
  const [videoError, setVideoError] = React.useState<boolean>(false);

  // Subtle scroll reaction
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 600], [1, 1.05]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0.75]);

  // Handle Video autoplay, readyState check, and reduced-motion
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 2) {
      setVideoLoaded(true);
      setVideoError(false);
    }

    if (prefersReducedMotion) {
      video.pause();
    } else if (!videoError) {
      video.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [prefersReducedMotion, videoError]);

  // Generative Canvas Fallback (Only active while loading, on video error, or reduced motion)
  React.useEffect(() => {
    if (videoLoaded && !prefersReducedMotion) {
      // Free resources when video is playing
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
    let height = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };

    window.addEventListener("resize", handleResize);

    const startTime = performance.now();

    const particles = Array.from({ length: 36 }, (_, i) => ({
      baseX: (Math.random() - 0.5) * 440,
      baseY: (Math.random() - 0.5) * 320,
      baseZ: (Math.random() - 0.5) * 300,
      phaseOffset: (i / 36) * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.6,
      size: 1.5 + Math.random() * 2,
    }));

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const dpr = window.devicePixelRatio || 1;
      const centerX = width * 0.6;
      const centerY = height * 0.5;

      const horizonGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        10 * dpr,
        centerX,
        centerY,
        260 * dpr
      );
      horizonGlow.addColorStop(0, "rgba(59, 130, 246, 0.16)");
      horizonGlow.addColorStop(0.5, "rgba(37, 99, 235, 0.04)");
      horizonGlow.addColorStop(1, "rgba(12, 12, 12, 0)");
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, width, height);

      const rotationAngle = (elapsed * 0.15) % (Math.PI * 2);

      particles.forEach((p, idx) => {
        const t = (elapsed * 0.4 * p.speed + p.phaseOffset) % (Math.PI * 2);
        const cosR = Math.cos(rotationAngle);
        const sinR = Math.sin(rotationAngle);
        const x3D = p.baseX * cosR - p.baseZ * sinR;
        const z3D = p.baseZ * cosR + p.baseX * sinR + 380;
        const y3D = p.baseY + Math.sin(t * 2) * 16;

        const fov = 340 / z3D;
        const screenX = centerX + x3D * fov * dpr;
        const screenY = centerY + y3D * fov * dpr;

        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * dpr * fov * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = idx % 4 === 0 ? "rgba(255, 255, 255, 0.85)" : "rgba(147, 197, 253, 0.45)";
        ctx.fill();
      });

      if (!prefersReducedMotion && (!videoLoaded || videoError)) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion, videoLoaded, videoError]);

  return (
    <motion.div
      style={{
        scale: prefersReducedMotion ? 1 : scale,
        opacity: prefersReducedMotion ? 1 : opacity,
      }}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#0C0C0C]"
    >
      {/* 1. Primary Real Hero Video Asset */}
      <video
        ref={videoRef}
        src="/media/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/media/hero-poster.jpg"
        onLoadedMetadata={() => {
          setVideoLoaded(true);
          setVideoError(false);
        }}
        onLoadedData={() => {
          setVideoLoaded(true);
          setVideoError(false);
        }}
        onCanPlay={() => {
          setVideoLoaded(true);
          setVideoError(false);
        }}
        onPlay={() => {
          setVideoLoaded(true);
          setVideoError(false);
        }}
        onError={() => {
          setVideoError(true);
          setVideoLoaded(false);
        }}
        className={`absolute inset-0 h-full w-full object-cover object-center lg:object-[68%_center] transition-opacity duration-700 ${
          videoLoaded && !videoError && !prefersReducedMotion ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* 2. Fallback Generative Canvas (Active only while loading or if video fails) */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-opacity duration-700 ${
          videoLoaded && !videoError && !prefersReducedMotion ? "opacity-0 pointer-events-none" : "opacity-90"
        }`}
      />

      {/* 3. Targeted Typographic Shield: Left Gradient on Desktop, Bottom Gradient on Mobile */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />
      <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0C0C0C] via-[#0C0C0C]/50 to-transparent pointer-events-none" />
    </motion.div>
  );
}
