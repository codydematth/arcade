export type SfxName =
  | "jump"
  | "land"
  | "fake"
  | "die"
  | "win"
  | "start"
  | "congrats"
  | "coin";

type Tone = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  slide?: number;
};

const PATTERNS: Record<SfxName, Tone[]> = {
  start: [
    { freq: 220, duration: 0.07, type: "square", gain: 0.09 },
    { freq: 330, duration: 0.09, type: "square", gain: 0.1 },
  ],
  jump: [{ freq: 420, duration: 0.1, type: "square", gain: 0.1, slide: 680 }],
  land: [{ freq: 180, duration: 0.06, type: "triangle", gain: 0.09 }],
  fake: [
    { freq: 520, duration: 0.06, type: "sawtooth", gain: 0.08 },
    { freq: 140, duration: 0.16, type: "sawtooth", gain: 0.1, slide: 70 },
  ],
  die: [
    { freq: 300, duration: 0.09, type: "square", gain: 0.1, slide: 90 },
    { freq: 90, duration: 0.2, type: "triangle", gain: 0.11 },
  ],
  win: [
    { freq: 523, duration: 0.09, type: "square", gain: 0.1 },
    { freq: 659, duration: 0.09, type: "square", gain: 0.1 },
    { freq: 784, duration: 0.16, type: "square", gain: 0.11 },
  ],
  congrats: [
    { freq: 392, duration: 0.08, type: "square", gain: 0.09 },
    { freq: 523, duration: 0.08, type: "square", gain: 0.09 },
    { freq: 312, duration: 0.18, type: "sawtooth", gain: 0.09, slide: 160 },
  ],
  coin: [
    { freq: 880, duration: 0.05, type: "square", gain: 0.07 },
    { freq: 1175, duration: 0.07, type: "square", gain: 0.08 },
  ],
};

export type GameAudio = {
  unlock: () => Promise<void>;
  play: (name: SfxName) => void;
  setSfxMuted: (muted: boolean) => void;
  isSfxMuted: () => boolean;
};

export function createGameAudio(): GameAudio {
  let ctx: AudioContext | null = null;
  let sfxMuted = false;
  let unlocking: Promise<void> | null = null;

  function getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    }
    return ctx;
  }

  async function unlock(): Promise<void> {
    const audio = getCtx();
    if (!audio) return;

    unlocking = (async () => {
      try {
        if (audio.state === "suspended") {
          await audio.resume();
        }
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(audio.destination);
        const t = audio.currentTime;
        osc.start(t);
        osc.stop(t + 0.02);
      } catch {
        // ignore
      }
    })();

    await unlocking;
  }

  function beep(tone: Tone, when: number) {
    const audio = getCtx();
    if (!audio || sfxMuted || audio.state !== "running") return;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = tone.type ?? "square";
    osc.frequency.setValueAtTime(tone.freq, when);
    if (tone.slide) {
      osc.frequency.linearRampToValueAtTime(tone.slide, when + tone.duration);
    }

    const g = Math.max(0.001, tone.gain ?? 0.09);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(g, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + tone.duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(when);
    osc.stop(when + tone.duration + 0.03);
  }

  return {
    unlock,
    play(name) {
      const audio = getCtx();
      if (!audio || sfxMuted) return;

      const run = () => {
        const ready = getCtx();
        if (!ready || ready.state !== "running" || sfxMuted) return;
        const tones = PATTERNS[name];
        let t = ready.currentTime;
        for (const tone of tones) {
          beep(tone, t);
          t += Math.min(0.1, tone.duration * 0.85);
        }
      };

      if (audio.state !== "running") {
        void unlock().then(run);
        return;
      }
      run();
    },
    setSfxMuted(next) {
      sfxMuted = next;
    },
    isSfxMuted() {
      return sfxMuted;
    },
  };
}
