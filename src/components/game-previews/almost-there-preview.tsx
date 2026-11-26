"use client";

import { useEffect, useRef } from "react";
import { createAlmostThereEngine } from "@/games/almost-there/engine";
import { loadMascot } from "@/games/almost-there/mascot";

/** Stable seed so the shelf loop feels consistent across reloads. */
const DEMO_SEED = 0xaf41e;

type AlmostTherePreviewProps = {
  className?: string;
};

/**
 * Live Almost There engine on the arcade card — autopilot jumps, silent.
 */
export function AlmostTherePreview({ className }: AlmostTherePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = createAlmostThereEngine({ demo: true, seed: DEMO_SEED });
    const saved = loadMascot();
    if (saved) engine.setMascot(saved);

    let raf = 0;
    let running = true;
    let visible = true;
    let last = performance.now();
    let lastJumpAt = 0;
    let endHoldUntil = 0;
    let started = false;

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
      engine.resize(width, height);
      engine.draw(ctx);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) last = performance.now();
      },
      { threshold: 0.15 },
    );
    io.observe(canvas);

    if (!reduced) {
      engine.start(DEMO_SEED);
      started = true;
      lastJumpAt = performance.now();
    } else {
      // Static first-frame pose for reduced motion.
      engine.draw(ctx);
    }

    const loop = (now: number) => {
      if (!running) return;
      if (visible && !reduced && started) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const snap = engine.tick(dt);

        if (snap.status === "won" || snap.status === "lost") {
          if (endHoldUntil === 0) endHoldUntil = now + 1100;
          if (now >= endHoldUntil) {
            endHoldUntil = 0;
            engine.retryNewRoute();
            lastJumpAt = now;
          }
        } else if (
          snap.status === "playing" &&
          snap.onGround &&
          now - lastJumpAt > 420
        ) {
          engine.jump();
          lastJumpAt = now;
        }

        engine.consumeEvents();
        engine.draw(ctx);
      }
      raf = requestAnimationFrame(loop);
    };

    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      engine.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
