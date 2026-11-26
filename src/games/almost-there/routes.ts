import {
  BASE_SPEED,
  jumpHeight,
  jumpReach,
  SPEED_PER_PAD,
} from "@/games/almost-there/physics";
import type { PlatformDef, PlatformKind, RouteDef } from "@/games/almost-there/types";

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function rand(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

const GROUND = 420;
const PLATFORM_H = 44;
const ROUTE_NAMES = [
  "Definitely Safe",
  "Trust Slope",
  "Honest Gap",
  "VIP Lane",
  "Tutorial+",
  "Skill Check",
  "Almost Legal",
  "Fairway",
] as const;

type PathBias = "low" | "high" | "wave";
/** Honest Mode shapes — readable patterns that still punish timing. */
type HonestShape = "ladder" | "stairs" | "spikes" | "scatter";

function platformKind(
  rng: Rng,
  index: number,
  total: number,
  forceSolid: boolean,
  honest: boolean,
): PlatformKind {
  if (forceSolid || honest) return "solid";
  const late = index / total;
  const roll = rng();
  // Keep early pads honest so the first jumps teach the controls.
  if (late < 0.25) return "solid";
  if (late > 0.72 && roll < 0.3) return "fake";
  if (late > 0.5 && roll < 0.24) return "vanish";
  if (late > 0.4 && roll < 0.2) return "crumble";
  if (roll < 0.06) return "fake";
  return "solid";
}

function clampY(y: number, maxRise: number): number {
  return Math.min(GROUND, Math.max(GROUND - maxRise, y));
}

function yForFair(
  rng: Rng,
  bias: PathBias,
  prevY: number,
  index: number,
  total: number,
): number {
  const maxRise = jumpHeight() * 0.72;
  const late = index / total;

  if (index < 3) {
    const delta = pick(rng, [0, 0, -20, 20]);
    return clampY(prevY + delta, maxRise);
  }

  if (bias === "low") {
    return pick(rng, [GROUND, GROUND - 20, GROUND - 35]);
  }

  if (bias === "high" && late > 0.35) {
    return pick(rng, [GROUND - 50, GROUND - 75, GROUND - 95]);
  }

  const step =
    late > 0.55
      ? pick(rng, [-45, -25, 0, 25, 40])
      : pick(rng, [-30, -15, 0, 15, 25]);
  return clampY(prevY + step, maxRise);
}

function yForHonest(
  rng: Rng,
  shape: HonestShape,
  prevY: number,
  index: number,
): number {
  // Push closer to full jump height so ladder/stairs feel like a gauntlet.
  const maxRise = jumpHeight() * 0.92;

  if (index < 2) {
    const delta = pick(rng, [0, -20, -30]);
    return clampY(prevY + delta, maxRise);
  }

  if (shape === "ladder") {
    // Grow up like a ladder — each pad higher than the last.
    const rise = rand(rng, 32, 52);
    return clampY(prevY - rise, maxRise);
  }

  if (shape === "stairs") {
    // Come down like stairs — start high, step toward ground.
    if (index === 2) {
      return clampY(GROUND - rand(rng, 110, 145), maxRise);
    }
    const drop = rand(rng, 28, 48);
    return clampY(prevY + drop, maxRise);
  }

  if (shape === "spikes") {
    // Alternating up/down teeth.
    const amp = rand(rng, 40, 68);
    return clampY(index % 2 === 0 ? prevY - amp : prevY + amp, maxRise);
  }

  // Scatter — chaotic but still clamped.
  const step = pick(rng, [-70, -55, -35, 35, 55, 70]);
  return clampY(prevY + step, maxRise);
}

function gapForIndex(
  rng: Rng,
  index: number,
  total: number,
  honest: boolean,
): number {
  const speed = BASE_SPEED + index * SPEED_PER_PAD;
  const reach = jumpReach(speed);
  const late = index / Math.max(1, total - 1);

  // Honest: late gaps sit near full jump reach — roast fuel, still landable.
  const difficulty = honest
    ? 0.8 + late * 0.16 // ~0.96 late
    : 0.55 + late * 0.23;
  const maxGap = reach * difficulty;
  const minGap = Math.max(48, maxGap * (honest ? 0.84 : 0.55));
  return rand(rng, minGap, maxGap);
}

function honestPadWidth(rng: Rng, index: number): number {
  // Tiny ledges often; occasional slightly wider breather.
  if (index < 2) return rand(rng, 110, 150);
  const roll = rng();
  if (roll < 0.45) return rand(rng, 68, 92); // small
  if (roll < 0.75) return rand(rng, 88, 118); // medium-small
  return rand(rng, 120, 150); // brief relief
}

export function createSeed(): number {
  return (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
}

export type GenerateRouteOptions = {
  /** Unlocked reward — no fake / vanish / crumble pads. */
  honest?: boolean;
};

export function generateRoute(
  seed = createSeed(),
  routeNumber = 1,
  options: GenerateRouteOptions = {},
): RouteDef {
  const honest = Boolean(options.honest);
  const rng = mulberry32(seed || 1);
  const bias = pick(rng, ["low", "high", "wave"] as const);
  const shape: HonestShape = pick(rng, [
    "ladder",
    "stairs",
    "spikes",
    "scatter",
  ] as const);
  const count = honest
    ? 18 + Math.floor(rng() * 10)
    : 12 + Math.floor(rng() * 6);
  const platforms: PlatformDef[] = [];

  let x = 0;
  let y = GROUND;

  // Wide launch pad — always solid
  platforms.push({
    x: 0,
    y: GROUND,
    w: 420,
    h: PLATFORM_H,
    kind: "solid",
  });
  x = 420;

  for (let i = 0; i < count; i++) {
    const gap = gapForIndex(rng, i, count, honest);
    x += gap;
    y = honest
      ? yForHonest(rng, shape, y, i)
      : yForFair(rng, bias, y, i, count);
    const w = honest ? honestPadWidth(rng, i) : rand(rng, 130, 210);
    const forceSolid = i < 3 || i === count - 1;
    const kind = platformKind(rng, i, count, forceSolid, honest);

    const platform: PlatformDef = {
      x,
      y,
      w,
      h: PLATFORM_H,
      kind,
    };

    if (kind === "vanish") {
      platform.triggerDistance = rand(rng, 110, 160);
    }
    if (kind === "crumble") {
      platform.crumbleDelayMs = rand(rng, 220, 420);
    }

    platforms.push(platform);
    x += w;
  }

  // Finish ledge — reachable gap
  const finishGap = gapForIndex(rng, count, count + 1, honest);
  const goalPadX = x + finishGap;
  platforms.push({
    x: goalPadX,
    y: GROUND,
    w: 280,
    h: PLATFORM_H,
    kind: "solid",
  });

  // Bait pad near the end only (still after early teaching zone)
  if (!honest && rng() > 0.4) {
    platforms.splice(platforms.length - 1, 0, {
      x: goalPadX - 160,
      y: GROUND,
      w: 130,
      h: PLATFORM_H,
      kind: "fake",
    });
  }

  const width = goalPadX + 340;
  const honestMeta: Record<
    HonestShape,
    { name: string; hint: string }
  > = {
    ladder: {
      name: "Ladder Climb",
      hint: "Grow up. Tiny pads. No scams.",
    },
    stairs: {
      name: "Stair Drop",
      hint: "Come down careful. Gaps still mean.",
    },
    spikes: {
      name: "Spike Path",
      hint: "Up-down teeth. Timing tax.",
    },
    scatter: {
      name: "Scatter Gauntlet",
      hint: "Chaos heights. Platforms no lie.",
    },
  };
  const label = honest
    ? honestMeta[shape].name
    : pick(rng, ROUTE_NAMES);

  return {
    seed,
    id: routeNumber,
    name: `${label} · #${seed.toString(16).slice(0, 4)}`,
    width,
    platforms,
    goalX: goalPadX + 50,
    goalY: GROUND - 90,
    hint: honest
      ? honestMeta[shape].hint
      : bias === "high"
        ? "High road later. Easy start."
        : bias === "low"
          ? "Low road. Learn the jump."
          : "Wave route. Start gentle.",
  };
}

export function nextRoute(
  previousSeed: number,
  routeNumber: number,
  options: GenerateRouteOptions = {},
): RouteDef {
  const nextSeed =
    (Math.imul(previousSeed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
  return generateRoute(nextSeed || createSeed(), routeNumber, options);
}
