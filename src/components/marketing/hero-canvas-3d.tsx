"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";

interface Node3D {
  x: number;
  y: number;
  z: number;
  isCore?: boolean;
}

interface Edge3D {
  from: number;
  to: number;
  opacity?: number;
}

export function HeroCanvas3D() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = React.useRef(0);

  React.useEffect(() => {
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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = x * 1.2;
      mouseRef.current.targetY = y * 1.2;
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Geometric structure: Pure abstract architectural lattice (no overlapping text)
    const nodes: Node3D[] = [
      // Central NOVA Core Hub
      { x: 0, y: 0, z: 0, isCore: true },
      // Four Primary Orbital Anchors
      { x: 0, y: -150, z: 50 },
      { x: 150, y: 0, z: -50 },
      { x: 0, y: 150, z: 50 },
      { x: -150, y: 0, z: -50 },
      // Inner Octahedron Lattice
      { x: 85, y: -85, z: 90 },
      { x: 85, y: 85, z: -90 },
      { x: -85, y: 85, z: 90 },
      { x: -85, y: -85, z: -90 },
      // Outer Geometric Enclosure
      { x: 180, y: -110, z: 20 },
      { x: -180, y: 110, z: 20 },
      { x: 110, y: 180, z: -60 },
      { x: -110, y: -180, z: -60 },
      // Zenith & Nadir Poles
      { x: 0, y: 0, z: 180 },
      { x: 0, y: 0, z: -180 },
    ];

    const edges: Edge3D[] = [
      // Core Star Struts
      { from: 0, to: 1, opacity: 0.6 },
      { from: 0, to: 2, opacity: 0.6 },
      { from: 0, to: 3, opacity: 0.6 },
      { from: 0, to: 4, opacity: 0.6 },
      { from: 0, to: 13, opacity: 0.5 },
      { from: 0, to: 14, opacity: 0.5 },
      // Inner Lattice Web
      { from: 1, to: 5, opacity: 0.35 },
      { from: 2, to: 5, opacity: 0.35 },
      { from: 2, to: 6, opacity: 0.35 },
      { from: 3, to: 6, opacity: 0.35 },
      { from: 3, to: 7, opacity: 0.35 },
      { from: 4, to: 7, opacity: 0.35 },
      { from: 4, to: 8, opacity: 0.35 },
      { from: 1, to: 8, opacity: 0.35 },
      // Pole Bracing
      { from: 13, to: 5, opacity: 0.25 },
      { from: 13, to: 7, opacity: 0.25 },
      { from: 14, to: 6, opacity: 0.25 },
      { from: 14, to: 8, opacity: 0.25 },
      // Outer Geometric Shell
      { from: 5, to: 9, opacity: 0.15 },
      { from: 7, to: 10, opacity: 0.15 },
      { from: 6, to: 11, opacity: 0.15 },
      { from: 8, to: 12, opacity: 0.15 },
      { from: 9, to: 1, opacity: 0.15 },
      { from: 10, to: 4, opacity: 0.15 },
      { from: 11, to: 3, opacity: 0.15 },
      { from: 12, to: 1, opacity: 0.15 },
    ];

    let angleX = 0.18;
    let angleY = 0.25;
    let time = 0;

    const render = () => {
      time += 0.006;

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      const scrollFactor = scrollRef.current * 0.0008;

      if (!prefersReducedMotion) {
        angleY = time * 0.3 + mouseRef.current.x * 0.6 + scrollFactor;
        angleX = Math.sin(time * 0.25) * 0.1 - mouseRef.current.y * 0.4 + scrollFactor * 0.3;
      }

      ctx.clearRect(0, 0, width, height);

      const dpr = window.devicePixelRatio || 1;
      const fov = 420 * (width / (1100 * dpr));
      const centerX = width / 2;
      const centerY = height / 2;

      // Project 3D coordinates
      const projectedNodes = nodes.map((node) => {
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX + 460;

        const scale = fov / z2;
        const x2D = centerX + x1 * scale * dpr;
        const y2D = centerY + y2 * scale * dpr;

        return { x: x2D, y: y2D, z: z2, scale, node };
      });

      // Draw Edges
      edges.forEach((edge) => {
        const p1 = projectedNodes[edge.from];
        const p2 = projectedNodes[edge.to];
        if (!p1 || !p2) return;

        const depthAlpha = Math.max(0.04, Math.min(0.5, (edge.opacity || 0.3) * (420 / ((p1.z + p2.z) / 2))));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(79, 124, 255, ${depthAlpha})`;
        ctx.lineWidth = Math.max(0.8, 1.0 * dpr);
        ctx.stroke();

        // Subtle moving telemetry particle on primary struts
        if (!prefersReducedMotion && edge.opacity && edge.opacity >= 0.5) {
          const pulseT = (time * 1.2 + edge.from * 0.15) % 1;
          const px = p1.x + (p2.x - p1.x) * pulseT;
          const py = p1.y + (p2.y - p1.y) * pulseT;

          ctx.beginPath();
          ctx.arc(px, py, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 195, 255, ${depthAlpha * 1.6})`;
          ctx.fill();
        }
      });

      // Draw Nodes
      projectedNodes.forEach((p) => {
        const { x, y, node, scale } = p;
        const isCore = node.isCore;
        const radius = isCore ? 4.5 * scale * dpr : 2.2 * scale * dpr;

        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.2, radius), 0, Math.PI * 2);
        ctx.fillStyle = isCore
          ? "rgba(255, 255, 255, 0.85)"
          : "rgba(124, 155, 255, 0.5)";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-45">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/60 to-background pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
    </div>
  );
}
