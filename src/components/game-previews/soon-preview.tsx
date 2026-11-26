"use client";

import { useEffect, useRef } from "react";
import { PALETTE } from "@/lib/palette";

type SoonKind = "dont-blink" | "one-more-second";

type SoonPreviewProps = {
  kind: SoonKind;
  className?: string;
};

function drawDontBlink(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);

  const blink = t % 1;
  const open = blink < 0.72 || blink > 0.86;
  const eyeY = h * 0.46;
  const eyeR = Math.min(w, h) * 0.09;

  ctx.fillStyle = "rgba(248, 250, 252, 0.06)";
  ctx.fillRect(w * 0.18, h * 0.22, w * 0.64, h * 0.5);

  for (const cx of [w * 0.38, w * 0.62]) {
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    if (open) {
      ctx.ellipse(cx, eyeY, eyeR * 1.15, eyeR, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(cx, eyeY, eyeR * 1.15, eyeR * 0.12, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    if (open) {
      ctx.fillStyle = PALETTE.accent;
      ctx.beginPath();
      ctx.arc(cx + eyeR * 0.15, eyeY, eyeR * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle =
    blink > 0.72 && blink < 0.9 ? PALETTE.accent : PALETTE.muted;
  ctx.font = `700 ${Math.max(11, Math.round(h * 0.06))}px system-ui, sans-serif`;
  ctx.fillText(
    blink > 0.72 && blink < 0.9 ? "YOU BLINKED" : "HOLD STILL",
    16,
    h - 16,
  );
}

function drawOneMoreSecond(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);

  const cycle = t % 1;
  let display = "1.00";
  if (cycle < 0.55) {
    const left = 1 - cycle / 0.55;
    display = left.toFixed(2);
  } else if (cycle < 0.78) {
    display = "0.01";
  } else if (cycle < 0.9) {
    display = "0.00";
  } else {
    display = "NOPE";
  }

  ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.45, Math.min(w, h) * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = display === "NOPE" ? PALETTE.accent : PALETTE.fair;
  ctx.font = `800 ${Math.max(28, Math.round(h * 0.22))}px Syne, system-ui, sans-serif`;
  const tw = ctx.measureText(display).width;
  ctx.fillText(display, (w - tw) / 2, h * 0.52);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 ${Math.max(10, Math.round(h * 0.05))}px system-ui, sans-serif`;
  ctx.fillText("totally fair timer", 16, h - 16);
}

export function SoonPreview({ kind, className }: SoonPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loopMs = kind === "dont-blink" ? 2800 : 3200;
    let raf = 0;
    let running = true;
    const start = performance.now();
    let visible = true;

    const paint = (now: number) => {
      const parent = canvas.parentElement;
      const width = parent ? Math.max(160, Math.floor(parent.clientWidth)) : 240;
      const height = parent ? Math.max(100, Math.floor(parent.clientHeight)) : 140;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = reduced ? 0.4 : ((now - start) % loopMs) / loopMs;
      if (kind === "dont-blink") drawDontBlink(ctx, width, height, t);
      else drawOneMoreSecond(ctx, width, height, t);
    };

    paint(performance.now());
    const ro = new ResizeObserver(() => paint(performance.now()));
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.15 },
    );
    io.observe(canvas);

    const loop = (now: number) => {
      if (!running) return;
      if (visible && !reduced) paint(now);
      raf = requestAnimationFrame(loop);
    };
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [kind]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
