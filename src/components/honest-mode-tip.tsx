"use client";

import { getLocale } from "@/lib/locale";
import {
  markHonestTipSeen,
  WINS_FOR_HONEST_MODE,
} from "@/lib/career";

type HonestModeTipProps = {
  onDismiss: () => void;
};

export function HonestModeTip({ onDismiss }: HonestModeTipProps) {
  const pidgin = getLocale().dialect === "pidgin";

  function dismiss() {
    markHonestTipSeen();
    onDismiss();
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(7,10,18,0.84)] p-4 backdrop-blur-[2px]">
      <div className="animate-float-in w-full max-w-md border border-accent/40 bg-bg-elevated px-5 py-7 text-center sm:px-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          {pidgin ? "Secret end goal" : "Secret end goal"}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-ink sm:text-4xl">
          Honest Mode
        </h2>
        <p className="mt-4 text-sm text-muted sm:text-base">
          {pidgin
            ? `Win ${WINS_FOR_HONEST_MODE} times. Platforms go stop lying. Fake floors go rest. Na the fair ending we swear exist.`
            : `Win ${WINS_FOR_HONEST_MODE} times. Platforms stop lying. Fake floors retire. The fair ending we swear exists.`}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-fair">
          {pidgin
            ? `${WINS_FOR_HONEST_MODE} W · unlock Honest Mode`
            : `${WINS_FOR_HONEST_MODE} wins unlock Honest Mode`}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-7 inline-flex bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-accent-soft"
        >
          {pidgin ? "Make we start" : "Let's go"}
        </button>
      </div>
    </div>
  );
}
