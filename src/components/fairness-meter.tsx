"use client";

import { useEffect, useState } from "react";

/**
 * Fake Certified Fair™ meter — fills confidently, then gaslights.
 */
export function FairnessMeter({ className = "" }: { className?: string }) {
  const [pct, setPct] = useState(12);
  const [label, setLabel] = useState("Calibrating fairness…");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let timer = 0;

    if (reduced) {
      timer = window.setTimeout(() => {
        setPct(98);
        setLabel("Certified Fair™ 98%");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const cycle = t % 6.5;
      if (cycle < 2.2) {
        const u = cycle / 2.2;
        setPct(Math.round(12 + u * u * 86));
        setLabel("Measuring fairness…");
      } else if (cycle < 3.4) {
        setPct(98);
        setLabel("Certified Fair™ 98%");
      } else if (cycle < 4.2) {
        const u = (cycle - 3.4) / 0.8;
        setPct(Math.round(98 - u * 61));
        setLabel("Recalculating…");
      } else if (cycle < 5.2) {
        setPct(37);
        setLabel("Still fair. Trust us.");
      } else {
        setPct(98);
        setLabel("Certified Fair™ 98%");
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
        <p className="font-[family-name:var(--font-display)] text-sm text-accent">
          {pct}%
        </p>
      </div>
      <div className="h-2 w-full border border-line bg-bg">
        <div
          className="h-full bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
