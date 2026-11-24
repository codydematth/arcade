"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CongratsBanner } from "@/components/congrats-banner";
import { MascotPicker } from "@/components/mascot-picker";
import { createGameAudio } from "@/games/almost-there/audio";
import { createAlmostThereEngine } from "@/games/almost-there/engine";
import {
  loadMascot,
  saveMascot,
  type MascotId,
} from "@/games/almost-there/mascot";
import type { EngineSnapshot, RunResult } from "@/games/almost-there/types";

export function AlmostThereGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createAlmostThereEngine> | null>(
    null,
  );
  const audioRef = useRef<ReturnType<typeof createGameAudio> | null>(null);
  const shownResultKey = useRef<string | null>(null);
  const bannerOpenRef = useRef(false);

  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [shareCanvas, setShareCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(true);
  const [mascot, setMascot] = useState<MascotId | null>(() => loadMascot());
  const [picking, setPicking] = useState(() => loadMascot() === null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const engine = createAlmostThereEngine();
    const audio = createGameAudio();
    engineRef.current = engine;
    audioRef.current = audio;

    const saved = loadMascot();
    if (saved) {
      engine.setMascot(saved);
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let running = true;

    const resize = () => {
      const width = Math.max(280, Math.floor(wrap.clientWidth));
      const height = Math.max(320, Math.floor(wrap.clientHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(width, height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      last = performance.now();
      if (document.hidden) {
        audio.stopMusic();
      } else if (!audio.isMusicMuted()) {
        audio.startMusic();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const loop = (now: number) => {
      if (!running) return;
      const dt = document.hidden ? 0 : (now - last) / 1000;
      last = now;
      const next = engine.tick(dt);
      engine.draw(ctx);

      for (const event of engine.consumeEvents()) {
        audio.play(event);
      }

      setSnapshot((prev) => {
        if (
          prev &&
          prev.status === next.status &&
          prev.routeId === next.routeId &&
          prev.hint === next.hint &&
          Math.abs(prev.progress - next.progress) < 0.02 &&
          prev.result === next.result
        ) {
          return prev;
        }
        return next;
      });

      if (
        (next.status === "won" || next.status === "lost") &&
        next.result &&
        !bannerOpenRef.current
      ) {
        const key = `${next.result.seed}-${next.result.won}-${next.result.durationMs}`;
        if (shownResultKey.current !== key) {
          shownResultKey.current = key;
          bannerOpenRef.current = true;
          setShareCanvas(canvas);
          setResult(next.result);
          audio.play("congrats");
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    setSnapshot(engine.getSnapshot());

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      audio.stopMusic();
      engine.destroy();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, []);

  const applyMascot = useCallback((id: MascotId) => {
    saveMascot(id);
    setMascot(id);
    setPicking(false);
    engineRef.current?.setMascot(id);
    const audio = audioRef.current;
    if (audio) {
      void audio.unlock().then(() => {
        audio.play("start");
      });
    }
  }, []);

  const triggerJump = useCallback(() => {
    if (bannerOpenRef.current || picking) return;
    if (!mascot) {
      setPicking(true);
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      void audio.unlock().then(() => {
        if (!audio.isMusicMuted()) {
          audio.startMusic();
        }
      });
    }
    engineRef.current?.jump();
  }, [mascot, picking]);

  const continueNewRoute = useCallback(() => {
    bannerOpenRef.current = false;
    shownResultKey.current = null;
    setResult(null);
    const audio = audioRef.current;
    if (audio) {
      void audio.unlock().then(() => {
        audio.play("start");
      });
    }
    engineRef.current?.retryNewRoute();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picking) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (bannerOpenRef.current) {
          continueNewRoute();
          return;
        }
        triggerJump();
      }
      if (e.code === "KeyM") {
        const audio = audioRef.current;
        if (!audio) return;
        void audio.unlock().then(() => {
          const next = !audio.isSfxMuted();
          audio.setSfxMuted(next);
          setSfxMuted(next);
          if (!next) audio.play("coin");
        });
      }
      if (e.code === "KeyN") {
        const audio = audioRef.current;
        if (!audio) return;
        void audio.unlock().then(() => {
          const next = !audio.isMusicMuted();
          audio.setMusicMuted(next);
          setMusicMuted(next);
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [continueNewRoute, picking, triggerJump]);

  function toggleSfx() {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.unlock().then(() => {
      const next = !audio.isSfxMuted();
      audio.setSfxMuted(next);
      setSfxMuted(next);
      if (!next) audio.play("coin");
    });
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.unlock().then(() => {
      const next = !audio.isMusicMuted();
      audio.setMusicMuted(next);
      setMusicMuted(next);
    });
  }

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-muted transition hover:text-ink"
        >
          ← Arcade
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <p className="hidden text-xs text-muted md:block">
            {snapshot ? snapshot.routeName : "Loading"}
            {mascot ? ` · ${mascot}` : ""}
          </p>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-ink/40 hover:text-ink"
          >
            Mascot
          </button>
          <button
            type="button"
            onClick={toggleSfx}
            className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-ink/40 hover:text-ink"
          >
            {sfxMuted ? "SFX off" : "SFX on"}
          </button>
          <button
            type="button"
            onClick={toggleMusic}
            className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-ink/40 hover:text-ink"
          >
            {musicMuted ? "Music off" : "Music on"}
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative mx-auto min-h-0 w-full max-w-3xl flex-1 touch-none px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full rounded-sm border border-line bg-[#121821]"
        />

        <button
          type="button"
          aria-label="Jump"
          className={`absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0 ${
            result || picking ? "pointer-events-none" : ""
          }`}
          onPointerDown={(e) => {
            e.preventDefault();
            triggerJump();
          }}
        />

        {picking ? <MascotPicker onPick={applyMascot} /> : null}

        {result && mascot ? (
          <CongratsBanner
            result={result}
            mascot={mascot}
            gameCanvas={shareCanvas}
            onContinue={continueNewRoute}
          />
        ) : null}
      </div>
    </div>
  );
}
