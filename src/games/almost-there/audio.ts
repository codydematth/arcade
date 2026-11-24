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

/** Original bright chiptune loop — not a Mario melody. */
const MUSIC_MELODY = [
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0, 440.0, 493.88,
  523.25, 493.88, 440.0, 392.0, 349.23, 392.0,
];

const NOTE_GAP = 0.18;

export type GameAudio = {
  unlock: () => Promise<void>;
  play: (name: SfxName) => void;
  setSfxMuted: (muted: boolean) => void;
  setMusicMuted: (muted: boolean) => void;
  isSfxMuted: () => boolean;
  isMusicMuted: () => boolean;
  startMusic: () => void;
  stopMusic: () => void;
};

export function createGameAudio(): GameAudio {
  let ctx: AudioContext | null = null;
  let sfxMuted = false;
  let musicMuted = true;
  let musicStep = 0;
  let musicGain: GainNode | null = null;
  let nextNoteTime = 0;
  let musicTimer: number | null = null;
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
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.14;
      musicGain.connect(ctx.destination);
    }
    return ctx;
  }

  async function unlock(): Promise<void> {
    const audio = getCtx();
    if (!audio) return;

    // Always try resume; don't cache a failed unlock forever.
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

  function scheduleMusicNote(at: number) {
    const audio = getCtx();
    if (!audio || musicMuted || !musicGain) return;

    const freq = MUSIC_MELODY[musicStep % MUSIC_MELODY.length]!;
    musicStep += 1;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(at);
    osc.stop(at + 0.17);
  }

  function musicTick() {
    const audio = getCtx();
    if (!audio || musicMuted || audio.state !== "running") return;

    // Schedule a short horizon of notes ahead of the playhead.
    const horizon = audio.currentTime + 0.35;
    while (nextNoteTime < horizon) {
      scheduleMusicNote(nextNoteTime);
      nextNoteTime += NOTE_GAP;
    }
  }

  function clearMusicTimer() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function beginMusic() {
    const audio = getCtx();
    if (!audio || musicMuted || audio.state !== "running") return;
    clearMusicTimer();
    musicStep = 0;
    nextNoteTime = audio.currentTime + 0.05;
    // Audible kick so toggling Music on is obvious.
    scheduleMusicNote(nextNoteTime);
    nextNoteTime += NOTE_GAP;
    scheduleMusicNote(nextNoteTime);
    nextNoteTime += NOTE_GAP;
    musicTick();
    musicTimer = window.setInterval(musicTick, 50);
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
    setMusicMuted(next) {
      musicMuted = next;
      if (musicMuted) {
        clearMusicTimer();
        return;
      }
      void unlock().then(() => {
        if (!musicMuted) beginMusic();
      });
    },
    isSfxMuted() {
      return sfxMuted;
    },
    isMusicMuted() {
      return musicMuted;
    },
    startMusic() {
      if (musicMuted) return;
      void unlock().then(() => {
        if (!musicMuted) beginMusic();
      });
    },
    stopMusic() {
      clearMusicTimer();
    },
  };
}
