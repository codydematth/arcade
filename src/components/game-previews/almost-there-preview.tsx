"use client";

import { useEffect, useRef } from "react";
import { drawMascot } from "@/games/almost-there/mascot";
import { formatCash, zeroCash } from "@/lib/locale";

const LOOP_MS = 3400;

type Pad = { x: number; y: number; w: number; fake?: boolean };

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function scenePads(w: number, h: number): Pad[] {
  const ground = h * 0.72;
  return [
    { x: w * 0.06, y: ground, w: w * 0.28 },
    { x: w * 0.42, y: ground - h * 0.08, w: w * 0.22 },
    { x: w * 0.72, y: ground - h * 0.02, w: w * 0.2, fake: true },
  ];
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#151a24");
  bg.addColorStop(1, "#0b0f14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Soft accent wash
  ctx.fillStyle = "rgba(255, 77, 46, 0.08)";
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.15, w * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(61, 255, 154, 0.06)";
  ctx.beginPath();
  ctx.arc(w * 0.1, h * 0.9, w * 0.3, 0, Math.PI * 2);
  ctx.fill();

  const pads = scenePads(w, h);
  const cycle = t % 1;

  // Timeline: run → jump → almost land on fake → fall → wipe
  let px = pads[0]!.x + pads[0]!.w * 0.35;
  let py = pads[0]!.y;
  let airborne = false;
  const facing: 1 | -1 = 1;
  let showFake = true;
  let wipe = 0;

  if (cycle < 0.28) {
    const u = easeInOut(cycle / 0.28);
    px = pads[0]!.x + pads[0]!.w * 0.2 + (pads[1]!.x - pads[0]!.x) * u * 0.55;
    py = pads[0]!.y;
  } else if (cycle < 0.52) {
    const u = (cycle - 0.28) / 0.24;
    const startX = pads[0]!.x + pads[0]!.w * 0.55;
    const endX = pads[1]!.x + pads[1]!.w * 0.45;
    px = startX + (endX - startX) * easeInOut(u);
    py = pads[0]!.y - Math.sin(u * Math.PI) * h * 0.22;
    airborne = true;
  } else if (cycle < 0.68) {
    const u = (cycle - 0.52) / 0.16;
    const startX = pads[1]!.x + pads[1]!.w * 0.45;
    const endX = pads[2]!.x + pads[2]!.w * 0.35;
    px = startX + (endX - startX) * easeInOut(Math.min(1, u * 1.15));
    py = pads[1]!.y - Math.sin(Math.min(1, u) * Math.PI) * h * 0.18;
    airborne = true;
  } else if (cycle < 0.82) {
    // Foot kisses the fake pad, then it vanishes
    const u = (cycle - 0.68) / 0.14;
    px = pads[2]!.x + pads[2]!.w * 0.35;
    py = pads[2]!.y + u * u * h * 0.35;
    airborne = true;
    showFake = u < 0.35;
    wipe = u > 0.4 ? (u - 0.4) / 0.6 : 0;
  } else {
    const u = (cycle - 0.82) / 0.18;
    px = pads[2]!.x + pads[2]!.w * 0.35 + u * w * 0.04;
    py = pads[2]!.y + h * 0.35 + u * h * 0.25;
    airborne = true;
    showFake = false;
    wipe = 1;
  }

  for (const pad of pads) {
    if (pad.fake && !showFake) continue;
    ctx.fillStyle = pad.fake ? "rgba(61, 255, 154, 0.55)" : "#2a3344";
    ctx.fillRect(pad.x, pad.y, pad.w, Math.max(10, h * 0.035));
    ctx.fillStyle = pad.fake ? "rgba(61, 255, 154, 0.9)" : "#3dff9a";
    ctx.fillRect(pad.x, pad.y, pad.w, 3);
    if (pad.fake && showFake) {
      ctx.fillStyle = "rgba(243, 240, 232, 0.35)";
      ctx.font = `600 ${Math.max(9, Math.round(h * 0.035))}px system-ui, sans-serif`;
      ctx.fillText("trust me", pad.x + 8, pad.y - 8);
    }
  }

  const mw = Math.max(18, w * 0.055);
  const mh = Math.max(28, h * 0.14);
  drawMascot({
    ctx,
    x: px - mw / 2,
    y: py - mh,
    w: mw,
    h: mh,
    mascot: "king",
    airborne,
    facing,
  });

  // Cash tease (follows silent locale)
  ctx.font = `800 ${Math.max(12, Math.round(h * 0.055))}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.fillStyle = wipe > 0.5 ? "#ff4d2e" : "#3dff9a";
  const cash = wipe > 0.5 ? zeroCash() : formatCash(240);
  const cashW = ctx.measureText(cash).width;
  ctx.fillText(cash, w - 14 - cashW, 22);

  if (wipe > 0.55) {
    ctx.fillStyle = `rgba(255, 77, 46, ${0.12 + wipe * 0.15})`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f3f0e8";
    ctx.font = `800 ${Math.max(16, Math.round(h * 0.08))}px Syne, system-ui, sans-serif`;
    ctx.fillText("ALMOST", 16, h * 0.28);
  }
}

type AlmostTherePreviewProps = {
  className?: string;
};

export function AlmostTherePreview({ className }: AlmostTherePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    let start = performance.now();
    let visible = true;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = Math.max(240, Math.floor(parent.clientWidth));
      const height = Math.max(140, Math.floor(parent.clientHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(ctx, width, height, reduced ? 0.7 : ((performance.now() - start) % LOOP_MS) / LOOP_MS);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start = performance.now() - ((performance.now() - start) % LOOP_MS);
      },
      { threshold: 0.2 },
    );
    io.observe(canvas);

    const loop = (now: number) => {
      if (!running) return;
      if (visible && !reduced) {
        const parent = canvas.parentElement;
        const width = parent ? Math.max(240, Math.floor(parent.clientWidth)) : 320;
        const height = parent ? Math.max(140, Math.floor(parent.clientHeight)) : 180;
        drawFrame(ctx, width, height, ((now - start) % LOOP_MS) / LOOP_MS);
      }
      raf = requestAnimationFrame(loop);
    };

    if (!reduced) {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
    />
  );
}
