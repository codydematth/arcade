"use client";

import { useEffect, useRef } from "react";
import {
  drawMascotPreview,
  MASCOT_OPTIONS,
  type MascotId,
} from "@/games/almost-there/mascot";

type MascotPickerProps = {
  onPick: (id: MascotId) => void;
};

function MascotCard({
  id,
  label,
  blurb,
  onPick,
}: {
  id: MascotId;
  label: string;
  blurb: string;
  onPick: (id: MascotId) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 140;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#1a2230");
    grad.addColorStop(1, "#0B0F19");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    drawMascotPreview(ctx, id, size / 2, size / 2 + 8, 96);
  }, [id]);

  return (
    <button
      type="button"
      onClick={() => onPick(id)}
      className="flex flex-1 flex-col items-center border border-line bg-bg-elevated/80 p-4 transition hover:border-accent/60 hover:bg-bg-elevated"
    >
      <canvas ref={canvasRef} className="rounded-sm" />
      <span className="mt-3 font-[family-name:var(--font-display)] text-2xl text-ink">
        {label}
      </span>
      <span className="mt-1 text-center text-xs text-muted">{blurb}</span>
    </button>
  );
}

export function MascotPicker({ onPick }: MascotPickerProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(8,10,14,0.82)] p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg border border-line bg-bg-elevated p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fair">
          Pick your pain avatar
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink sm:text-4xl">
          King or Queen?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Same unfair platforms. Choose who eats the loss.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {MASCOT_OPTIONS.map((option) => (
            <MascotCard
              key={option.id}
              id={option.id}
              label={option.label}
              blurb={option.blurb}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
