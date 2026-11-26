"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CongratsBanner } from "@/components/congrats-banner";
import { HonestModeTip } from "@/components/honest-mode-tip";
import { MascotPicker } from "@/components/mascot-picker";
import { createGameAudio } from "@/games/almost-there/audio";
import { createAlmostThereEngine } from "@/games/almost-there/engine";
import {
  loadMascot,
  saveMascot,
  type MascotId,
} from "@/games/almost-there/mascot";
import type { EngineSnapshot, RunResult } from "@/games/almost-there/types";
import {
  getCareer,
  hasSeenHonestTip,
  isHonestModeActive,
  setHonestModeEnabled,
} from "@/lib/career";
import { requestGameFullscreen } from "@/lib/fullscreen";

const WIN_BANNER_DELAY_MS = 1400;
const LOSS_BANNER_DELAY_MS = 1800;
const STAGE_WIDTH_KEY = "almost-fair-stage-wide-v1";

function loadWideStage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STAGE_WIDTH_KEY) === "1";
  } catch {
    return false;
  }
}

function saveWideStage(wide: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STAGE_WIDTH_KEY, wide ? "1" : "0");
  } catch {
    // ignore
  }
}

export function AlmostThereGame() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createAlmostThereEngine> | null>(
    null,
  );
  const audioRef = useRef<ReturnType<typeof createGameAudio> | null>(null);
  const shownResultKey = useRef<string | null>(null);
  const finishLockRef = useRef(false);
  const bannerOpenRef = useRef(false);
  const bannerTimerRef = useRef<number | null>(null);
  const fullscreenTriedRef = useRef(false);

  const tryFullscreen = useCallback(() => {
    if (fullscreenTriedRef.current) return;
    fullscreenTriedRef.current = true;
    void requestGameFullscreen(shellRef.current);
  }, []);

  const clearBannerTimer = useCallback(() => {
    if (bannerTimerRef.current !== null) {
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [shareCanvas, setShareCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [wideStage, setWideStage] = useState(loadWideStage);
  const [honestUnlocked, setHonestUnlocked] = useState(
    () => getCareer().honestUnlocked,
  );
  const [honestOn, setHonestOn] = useState(() => isHonestModeActive());
  const [mascot, setMascot] = useState<MascotId | null>(() => loadMascot());
  const [picking, setPicking] = useState(() => loadMascot() === null);
  const [showHonestTip, setShowHonestTip] = useState(() => {
    if (typeof window === "undefined") return false;
    return !hasSeenHonestTip();
  });

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
        !finishLockRef.current
      ) {
        const key = `${next.result.seed}-${next.result.won}-${next.result.durationMs}`;
        if (shownResultKey.current !== key) {
          shownResultKey.current = key;
          finishLockRef.current = true;
          bannerOpenRef.current = false;
          setShareCanvas(canvas);
          const delay = next.result.won
            ? WIN_BANNER_DELAY_MS
            : LOSS_BANNER_DELAY_MS;
          const pending = next.result;
          clearBannerTimer();
          bannerTimerRef.current = window.setTimeout(() => {
            if (!running) return;
            bannerOpenRef.current = true;
            const career = getCareer();
            setHonestUnlocked(career.honestUnlocked);
            setHonestOn(career.honestUnlocked && career.honestEnabled);
            setResult(pending);
            audio.play("congrats");
          }, delay);
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    setSnapshot(engine.getSnapshot());

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearBannerTimer();
      ro.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      engine.destroy();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, [clearBannerTimer]);

  const applyMascot = useCallback(
    (id: MascotId) => {
      tryFullscreen();
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
    },
    [tryFullscreen],
  );

  const triggerJump = useCallback(() => {
    if (finishLockRef.current || picking || showHonestTip) return;
    if (!mascot) {
      setPicking(true);
      return;
    }
    tryFullscreen();
    const audio = audioRef.current;
    if (audio) {
      void audio.unlock();
    }
    engineRef.current?.jump();
  }, [mascot, picking, showHonestTip, tryFullscreen]);

  const continueNewRoute = useCallback(() => {
    clearBannerTimer();
    finishLockRef.current = false;
    bannerOpenRef.current = false;
    shownResultKey.current = null;
    setResult(null);
    const career = getCareer();
    setHonestUnlocked(career.honestUnlocked);
    setHonestOn(career.honestUnlocked && career.honestEnabled);
    const audio = audioRef.current;
    if (audio) {
      void audio.unlock().then(() => {
        audio.play("start");
      });
    }
    engineRef.current?.retryNewRoute();
  }, [clearBannerTimer]);

  const setPlayMode = useCallback(
    (honest: boolean) => {
      if (!getCareer().honestUnlocked) return;
      if (picking || showHonestTip) return;
      const next = setHonestModeEnabled(honest);
      setHonestUnlocked(next.honestUnlocked);
      setHonestOn(next.honestEnabled);
      // Drop any result card and start a fresh route in the chosen mode.
      clearBannerTimer();
      finishLockRef.current = false;
      bannerOpenRef.current = false;
      shownResultKey.current = null;
      setResult(null);
      engineRef.current?.refreshForMode();
    },
    [clearBannerTimer, picking, showHonestTip],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (picking) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (bannerOpenRef.current) {
          continueNewRoute();
          return;
        }
        if (finishLockRef.current) return;
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

  function toggleWideStage() {
    setWideStage((prev) => {
      const next = !prev;
      saveWideStage(next);
      return next;
    });
  }

  const roundOver =
    snapshot?.status === "won" || snapshot?.status === "lost";

  return (
    <div
      ref={shellRef}
      className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#0B0F19] pt-[env(safe-area-inset-top)]"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-3">
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
          {honestUnlocked ? (
            <div
              className="flex shrink-0 overflow-hidden border border-line"
              role="group"
              aria-label="Play mode"
            >
              <button
                type="button"
                onClick={() => setPlayMode(false)}
                className={`px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  !honestOn
                    ? "bg-accent text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                Chaos
              </button>
              <button
                type="button"
                onClick={() => setPlayMode(true)}
                className={`px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                  honestOn
                    ? "bg-fair text-[#0B0F19]"
                    : "text-muted hover:text-ink"
                }`}
              >
                Honest
              </button>
            </div>
          ) : null}
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
            onClick={toggleWideStage}
            className="hidden border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-ink/40 hover:text-ink sm:inline-flex"
          >
            {wideStage ? "Default size" : "Wide"}
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={`relative mx-auto min-h-0 flex-1 touch-none pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-[max-width] duration-300 ${
          wideStage
            ? "w-[90%] max-w-[90vw] px-0 sm:px-2"
            : "w-full max-w-3xl px-2 sm:px-4"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full rounded-sm border border-line bg-[#0B0F19]"
        />

        <button
          type="button"
          aria-label="Jump"
          className={`absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0 ${
            result || picking || showHonestTip || roundOver
              ? "pointer-events-none"
              : ""
          }`}
          onPointerDown={(e) => {
            e.preventDefault();
            triggerJump();
          }}
        />

        {picking ? <MascotPicker onPick={applyMascot} /> : null}

        {!picking && showHonestTip ? (
          <HonestModeTip onDismiss={() => setShowHonestTip(false)} />
        ) : null}

        {result && mascot ? (
          <CongratsBanner
            result={result}
            mascot={mascot}
            gameCanvas={shareCanvas}
            onContinue={continueNewRoute}
            honestUnlocked={honestUnlocked}
            honestActive={honestOn}
            onSwitchMode={setPlayMode}
          />
        ) : null}
      </div>
    </div>
  );
}
