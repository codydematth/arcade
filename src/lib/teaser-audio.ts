/** One-shot chiptune blip for arcade card hover — muted until user gesture. */
let ctx: AudioContext | null = null;
let unlocked = false;

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

export async function unlockTeaserAudio(): Promise<void> {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") await audio.resume();
    unlocked = true;
  } catch {
    // ignore
  }
}

export function playTeaserBlip(): void {
  const audio = getCtx();
  if (!audio || !unlocked) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(392, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  } catch {
    // ignore
  }
}
