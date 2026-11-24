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

function platformKind(
  rng: Rng,
  index: number,
  total: number,
  forceSolid: boolean,
): PlatformKind {
  if (forceSolid) return "solid";
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

function yForIndex(
  rng: Rng,
  bias: PathBias,
  prevY: number,
  index: number,
  total: number,
): number {
  const maxRise = jumpHeight() * 0.72;
  const late = index / total;

  // First pads: mostly flat / tiny steps so the opening jump is fair.
  if (index < 3) {
    const delta = pick(rng, [0, 0, -20, 20]);
    return Math.min(GROUND, Math.max(GROUND - maxRise, prevY + delta));
  }

  if (bias === "low") {
    return pick(rng, [GROUND, GROUND - 20, GROUND - 35]);
  }

  if (bias === "high" && late > 0.35) {
    const highs = [GROUND - 50, GROUND - 75, GROUND - 95];
    return pick(rng, highs);
  }

  const step = late > 0.55 ? pick(rng, [-45, -25, 0, 25, 40]) : pick(rng, [-30, -15, 0, 15, 25]);
  return Math.min(GROUND, Math.max(GROUND - maxRise, prevY + step));
}

function gapForIndex(rng: Rng, index: number, total: number): number {
  // Speed the player will roughly have after clearing `index` pads.
  const speed = BASE_SPEED + index * SPEED_PER_PAD;
  const reach = jumpReach(speed);
  const late = index / Math.max(1, total - 1);

  // Leave landing margin: early ~55% of reach, later up to ~78%.
  const difficulty = 0.55 + late * 0.23;
  const maxGap = reach * difficulty;
  const minGap = Math.max(48, maxGap * 0.55);
  return rand(rng, minGap, maxGap);
}

export function createSeed(): number {
  return (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
}

export function generateRoute(seed = createSeed(), routeNumber = 1): RouteDef {
  const rng = mulberry32(seed || 1);
  const bias = pick(rng, ["low", "high", "wave"] as const);
  const count = 12 + Math.floor(rng() * 6);
  const platforms: PlatformDef[] = [];

  let x = 0;
  let y = GROUND;

  // Wide launch pad — always honest
  platforms.push({
    x: 0,
    y: GROUND,
    w: 420,
    h: PLATFORM_H,
    kind: "solid",
  });
  x = 420;

  for (let i = 0; i < count; i++) {
    const gap = gapForIndex(rng, i, count);
    x += gap;
    y = yForIndex(rng, bias, y, i, count);
    const w = rand(rng, 130, 210);
    const forceSolid = i < 3 || i === count - 1;
    const kind = platformKind(rng, i, count, forceSolid);

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
  const finishGap = gapForIndex(rng, count, count + 1);
  const goalPadX = x + finishGap;
  platforms.push({
    x: goalPadX,
    y: GROUND,
    w: 280,
    h: PLATFORM_H,
    kind: "solid",
  });

  // Bait pad near the end only (still after early teaching zone)
  if (rng() > 0.4) {
    platforms.splice(platforms.length - 1, 0, {
      x: goalPadX - 160,
      y: GROUND,
      w: 130,
      h: PLATFORM_H,
      kind: "fake",
    });
  }

  const width = goalPadX + 340;
  const label = pick(rng, ROUTE_NAMES);

  return {
    seed,
    id: routeNumber,
    name: `${label} · #${seed.toString(16).slice(0, 4)}`,
    width,
    platforms,
    goalX: goalPadX + 50,
    goalY: GROUND - 90,
    hint:
      bias === "high"
        ? "High road later. Easy start."
        : bias === "low"
          ? "Low road. Learn the jump."
          : "Wave route. Start gentle.",
  };
}

export function nextRoute(previousSeed: number, routeNumber: number): RouteDef {
  const nextSeed =
    (Math.imul(previousSeed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
  return generateRoute(nextSeed || createSeed(), routeNumber);
}
