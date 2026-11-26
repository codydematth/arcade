import { drawMascot, type MascotId } from "@/games/almost-there/mascot";
import {
  BASE_SPEED,
  GRAVITY,
  JUMP_V,
  MAX_SPEED,
  SPEED_PER_PAD,
} from "@/games/almost-there/physics";
import { createSeed, generateRoute, nextRoute } from "@/games/almost-there/routes";
import type {
  EngineEvent,
  EngineOptions,
  EngineSnapshot,
  EngineStatus,
  FailReason,
  PlatformDef,
  RouteDef,
  RunResult,
} from "@/games/almost-there/types";
import { formatCash, getLocale, zeroCash } from "@/lib/locale";
import { getLossesToday, recordLossToday } from "@/lib/streak";

type RuntimePlatform = PlatformDef & {
  opacity: number;
  crumbled: boolean;
  crumbleAt: number | null;
  vanished: boolean;
  scored: boolean;
};

type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type Floater = {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
};

const MAX_FALL = 1700;
const PLAYER_W = 34;
const PLAYER_H = 34;
const WORLD_H = 520;
const GROUND_KILL = 560;
const COYOTE_MS = 110;
const JUMP_BUFFER_MS = 130;
const DESIGN_W = 390;
/** Cash earned per world-pixel traveled. */
const MONEY_PER_PX = 0.55;
/** Bonus when clearing a new platform. */
const MONEY_PER_PAD = 85;

export type AlmostThereEngine = {
  start: (seed?: number) => void;
  retryNewRoute: () => void;
  jump: () => void;
  setMascot: (mascot: MascotId) => void;
  resize: (width: number, height: number) => void;
  tick: (dt: number) => EngineSnapshot;
  draw: (ctx: CanvasRenderingContext2D) => void;
  getSnapshot: () => EngineSnapshot;
  consumeEvents: () => EngineEvent[];
  destroy: () => void;
};

export function createAlmostThereEngine(
  options: EngineOptions = {},
): AlmostThereEngine {
  const demo = Boolean(options.demo);
  let status: EngineStatus = "ready";
  let routeNumber = 1;
  let route: RouteDef = generateRoute(
    options.seed ?? createSeed(),
    routeNumber,
  );
  let money = 0;
  let platformsCleared = 0;
  let wipeFlash = 0;
  let cameraX = 0;
  let viewW = DESIGN_W;
  let viewH = 700;
  let startedAt = 0;
  let result: RunResult | null = null;
  let failReason: FailReason | undefined;
  let toast = "Tap to run. Jump is one button.";
  let toastUntil = 0;
  let shake = 0;
  let lossesToday = 0;
  let fairLie = 98;
  let coyoteUntil = 0;
  let jumpBufferedUntil = 0;
  let wasOnGround = false;
  let events: EngineEvent[] = [];
  let particles: Particle[] = [];
  let floaters: Floater[] = [];
  let bob = 0;
  let mascot: MascotId = "king";

  function hydrate(defs: PlatformDef[]): RuntimePlatform[] {
    return defs.map((p, index) => ({
      ...p,
      opacity: 1,
      crumbled: false,
      crumbleAt: null,
      vanished: false,
      // Start pad already "owned" so speed only rises after later blocks.
      scored: index === 0,
    }));
  }

  function currentSpeed(): number {
    return Math.min(MAX_SPEED, BASE_SPEED + platformsCleared * SPEED_PER_PAD);
  }

  let platforms: RuntimePlatform[] = hydrate(route.platforms);

  function spawnPlayer(): Player {
    const pad = platforms[0] ?? route.platforms[0];
    const y = pad ? pad.y - PLAYER_H : 380;
    return {
      x: 80,
      y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: currentSpeed(),
      vy: 0,
      onGround: true,
    };
  }

  let player = spawnPlayer();

  function emit(event: EngineEvent) {
    events.push(event);
  }

  function burst(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 320,
        vy: -Math.random() * 280 - 40,
        life: 0.45 + Math.random() * 0.4,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  function floatText(text: string, x: number, y: number, color: string) {
    floaters.push({ text, x, y, life: 1.1, color });
  }

  function progress(): number {
    const max = Math.max(1, route.goalX - 80);
    return Math.min(1, Math.max(0, (player.x - 80) / max));
  }

  function snapshot(): EngineSnapshot {
    return {
      status,
      routeId: route.id,
      routeName: route.name,
      seed: route.seed,
      hint: toast,
      progress: progress(),
      distance: Math.max(0, player.x - 80),
      money: Math.floor(money),
      platformsCleared,
      speed: currentSpeed(),
      onGround: player.onGround,
      result,
    };
  }

  function finish(won: boolean, reason?: FailReason) {
    if (status !== "playing") return;
    status = won ? "won" : "lost";
    failReason = reason;
    const peak = Math.floor(money);
    if (!won) {
      money = 0;
      wipeFlash = 1;
      if (!demo) {
        lossesToday = recordLossToday();
      }
      fairLie = 37;
      floatText(
        `${formatCash(peak)} → ${zeroCash()}`,
        player.x - 10,
        player.y - 28,
        "#6366F1",
      );
    } else {
      fairLie = 98;
    }
    result = {
      won,
      routeId: route.id,
      routeName: route.name,
      seed: route.seed,
      progress: progress(),
      distance: Math.max(0, player.x - 80),
      money: won ? peak : 0,
      moneyLost: won ? 0 : peak,
      platformsCleared,
      failReason: reason,
      durationMs: performance.now() - startedAt,
    };
    shake = won ? 6 : 14;
    burst(
      player.x + player.w / 2,
      player.y + player.h / 2,
      won ? "#10B981" : "#6366F1",
      won ? 18 : 22,
    );
    const pidgin = getLocale().dialect === "pidgin";
    floatText(
      won ? "WHAT?!" : pidgin ? "NO MONEY!" : "BROKE!",
      player.x,
      player.y - 48,
      won ? "#10B981" : "#6366F1",
    );
    emit(won ? "win" : "die");
  }

  function loadRoute(next: RouteDef) {
    route = next;
    platforms = hydrate(route.platforms);
    money = 0;
    platformsCleared = 0;
    wipeFlash = 0;
    player = spawnPlayer();
    cameraX = 0;
    result = null;
    failReason = undefined;
    particles = [];
    floaters = [];
    coyoteUntil = 0;
    jumpBufferedUntil = 0;
    wasOnGround = true;
    toast = route.hint;
  }

  function start(seed?: number) {
    if (seed !== undefined) {
      route = generateRoute(seed, routeNumber);
    } else if (status === "ready") {
      // keep preview route
    } else {
      route = generateRoute(createSeed(), routeNumber);
    }
    loadRoute(route);
    status = "playing";
    startedAt = performance.now();
    lossesToday = getLossesToday();
    fairLie = 98;
    toastUntil = startedAt + 2200;
    emit("start");
    // Start-tap should hop into the run, not stand still.
    tryJump(true);
  }

  function retryNewRoute() {
    routeNumber += 1;
    const generated = nextRoute(route.seed, routeNumber);
    loadRoute(generated);
    status = "playing";
    startedAt = performance.now();
    toast = `New route · ${route.name}`;
    toastUntil = startedAt + 2000;
    emit("start");
  }

  function tryJump(force = false) {
    const now = performance.now();
    const canCoyote = now <= coyoteUntil;
    if (!force && status !== "playing") return false;
    if (!(player.onGround || canCoyote)) return false;
    player.vy = JUMP_V;
    player.onGround = false;
    coyoteUntil = 0;
    jumpBufferedUntil = 0;
    emit("jump");
    burst(player.x + player.w / 2, player.y + player.h, "#F8FAFC", 6);
    return true;
  }

  function jump() {
    const now = performance.now();
    jumpBufferedUntil = now + JUMP_BUFFER_MS;

    if (status === "ready") {
      start(route.seed);
      return;
    }
    if (status === "won" || status === "lost") {
      return;
    }
    if (!tryJump()) {
      // buffer kept for landing
    }
  }

  function setMascot(next: MascotId) {
    mascot = next;
  }

  function resize(width: number, height: number) {
    viewW = Math.max(280, width);
    viewH = Math.max(320, height);
  }

  function solidPlatforms(): RuntimePlatform[] {
    return platforms.filter((p) => {
      if (p.kind === "fake") return false;
      if (p.crumbled) return false;
      if (p.vanished || p.opacity < 0.15) return false;
      return true;
    });
  }

  function updateHazards(now: number) {
    for (const p of platforms) {
      if (p.kind === "vanish" && !p.vanished) {
        const dist = Math.abs(p.x + p.w / 2 - (player.x + player.w / 2));
        const trigger = p.triggerDistance ?? 140;
        if (dist < trigger && player.x + player.w > p.x - 40) {
          p.opacity = Math.max(0, p.opacity - 0.05);
          if (p.opacity <= 0.05) {
            p.vanished = true;
            p.opacity = 0;
          }
        }
      }

      if (p.kind === "crumble" && p.crumbleAt !== null && !p.crumbled) {
        if (now >= p.crumbleAt) {
          p.crumbled = true;
          p.opacity = 0;
          burst(p.x + p.w / 2, p.y, "#818CF8", 8);
        } else {
          const left = p.crumbleAt - now;
          p.opacity =
            0.4 + 0.6 * Math.max(0, left / (p.crumbleDelayMs ?? 300));
        }
      }
    }
  }

  function resolveCollisions(prevY: number) {
    player.onGround = false;
    for (const p of solidPlatforms()) {
      const wasAbove = prevY + player.h <= p.y + 1;
      const overlapsX =
        player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2;
      const crossingDown =
        wasAbove &&
        player.y + player.h >= p.y &&
        player.y + player.h <= p.y + Math.max(20, player.vy * 0.02 + 14) &&
        player.vy >= 0;

      if (overlapsX && crossingDown) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        coyoteUntil = performance.now() + COYOTE_MS;

        if (!p.scored) {
          p.scored = true;
          platformsCleared += 1;
          money += MONEY_PER_PAD;
          emit("coin");
          floatText(
            `+${formatCash(MONEY_PER_PAD)}`,
            p.x + p.w * 0.2,
            p.y - 18,
            "#10B981",
          );
        }

        if (p.kind === "crumble" && p.crumbleAt === null) {
          p.crumbleAt = performance.now() + (p.crumbleDelayMs ?? 280);
        }
      }
    }

    if (!player.onGround && player.vy > 0) {
      for (const p of platforms) {
        if (p.kind !== "fake") continue;
        const wasAbove = prevY + player.h <= p.y + 1;
        const overlapsX =
          player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2;
        if (
          wasAbove &&
          overlapsX &&
          player.y + player.h >= p.y &&
          player.y + player.h <= p.y + 22
        ) {
          failReason = "fake";
          emit("fake");
          floatText("FAKE", p.x + p.w / 2, p.y - 10, "#6366F1");
        }
      }
    }
  }

  function detectFailCause(): FailReason {
    if (failReason) return failReason;
    for (const p of platforms) {
      if (p.kind === "vanish" && p.vanished && Math.abs(player.x - p.x) < 140) {
        return "vanish";
      }
      if (p.kind === "crumble" && p.crumbled && Math.abs(player.x - p.x) < 140) {
        return "crumble";
      }
      if (p.kind === "fake" && Math.abs(player.x - p.x) < 120) {
        return "fake";
      }
    }
    return "fell";
  }

  function tick(dt: number): EngineSnapshot {
    const clamped = Math.min(0.033, Math.max(0, dt));
    const now = performance.now();
    bob += clamped;

    if (shake > 0) shake *= 0.86;
    if (wipeFlash > 0) wipeFlash = Math.max(0, wipeFlash - clamped * 1.6);

    particles = particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * clamped,
        y: p.y + p.vy * clamped,
        vy: p.vy + 900 * clamped,
        life: p.life - clamped,
      }))
      .filter((p) => p.life > 0);

    floaters = floaters
      .map((f) => ({
        ...f,
        y: f.y - 40 * clamped,
        life: f.life - clamped,
      }))
      .filter((f) => f.life > 0);

    if (status !== "playing") {
      return snapshot();
    }

    if (now > toastUntil) {
      toast = route.name;
    }

    const prevY = player.y;
    player.vx = currentSpeed();
    player.x += player.vx * clamped;
    money += player.vx * clamped * MONEY_PER_PX;
    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * clamped);
    player.y += player.vy * clamped;

    updateHazards(now);
    resolveCollisions(prevY);

    if (player.onGround && !wasOnGround) {
      emit("land");
      burst(player.x + player.w / 2, player.y + player.h, "#10B981", 5);
      if (now <= jumpBufferedUntil) {
        tryJump();
      }
    }
    if (!player.onGround && wasOnGround) {
      coyoteUntil = now + COYOTE_MS;
    }
    wasOnGround = player.onGround;

    const targetCam = player.x - DESIGN_W * 0.3;
    cameraX += (targetCam - cameraX) * Math.min(1, clamped * 10);
    cameraX = Math.max(0, Math.min(cameraX, Math.max(0, route.width - DESIGN_W)));

    if (
      player.x + player.w > route.goalX &&
      player.y + player.h > route.goalY &&
      player.y < route.goalY + 110
    ) {
      finish(true);
      return snapshot();
    }

    if (player.y > GROUND_KILL) {
      finish(false, detectFailCause());
    }

    if (now - startedAt > 120000) {
      finish(false, "timeout");
    }

    return snapshot();
  }

  function worldScale(): { s: number; offsetY: number } {
    const s = Math.min(viewW / DESIGN_W, viewH / WORLD_H);
    const offsetY = (viewH - WORLD_H * s) / 2;
    return { s, offsetY };
  }

  function worldToScreen(x: number, y: number): { x: number; y: number } {
    const { s, offsetY } = worldScale();
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    return {
      x: (x - cameraX) * s + shakeX,
      y: y * s + offsetY + shakeY,
    };
  }

  function draw(ctx: CanvasRenderingContext2D) {
    const w = viewW;
    const h = viewH;
    const { s } = worldScale();
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#1c2533");
    grad.addColorStop(0.55, "#0B0F19");
    grad.addColorStop(1, "#0b0f14");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Moving grid for "dynamic" feel
    ctx.strokeStyle = "rgba(248,250,252,0.04)";
    ctx.lineWidth = 1;
    const grid = 48;
    const offset = -((cameraX * 0.5) % grid);
    for (let x = offset; x < w; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(99, 102, 241, 0.06)";
    for (let i = 0; i < 8; i++) {
      const hx = ((i * 160 - cameraX * 0.25) % (w + 220)) - 60;
      const hy = h * 0.7 + Math.sin(bob + i) * 6;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 40);
      ctx.lineTo(hx + 80, hy - 30);
      ctx.lineTo(hx + 160, hy + 40);
      ctx.fill();
    }

    for (const p of platforms) {
      if (p.opacity <= 0.02) continue;
      const a = worldToScreen(p.x, p.y);
      const pw = p.w * s;
      const ph = p.h * s;
      ctx.globalAlpha = p.opacity;

      if (p.kind === "fake") {
        ctx.fillStyle = "#10B981";
      } else if (p.kind === "vanish") {
        ctx.fillStyle = "#7cf0c2";
      } else if (p.kind === "crumble") {
        ctx.fillStyle = p.crumbleAt ? "#818CF8" : "#818CF8";
      } else {
        ctx.fillStyle = "#10B981";
      }
      ctx.fillRect(a.x, a.y, pw, ph);
      ctx.fillStyle = "rgba(16, 19, 26, 0.28)";
      ctx.fillRect(a.x + 3, a.y + 3, Math.max(0, pw - 6), 7);
      ctx.globalAlpha = 1;
    }

    const goal = worldToScreen(route.goalX, route.goalY);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(goal.x, goal.y, 6 * s, 90 * s);
    ctx.fillStyle = "#6366F1";
    ctx.beginPath();
    ctx.moveTo(goal.x + 6 * s, goal.y + Math.sin(bob * 6) * 2);
    ctx.lineTo(goal.x + 52 * s, goal.y + 16 * s);
    ctx.lineTo(goal.x + 6 * s, goal.y + 32 * s);
    ctx.fill();

    for (const p of particles) {
      const sp = worldToScreen(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(sp.x, sp.y, p.size * s, p.size * s);
    }
    ctx.globalAlpha = 1;

    for (const f of floaters) {
      const sp = worldToScreen(f.x, f.y);
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = `800 ${Math.round(16 * Math.max(1, s))}px system-ui, sans-serif`;
      ctx.fillText(f.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;

    const pl = worldToScreen(player.x, player.y);
    const pw = player.w * s;
    const ph = player.h * s;
    const mood =
      status === "lost"
        ? "rage"
        : status === "won"
          ? "smug"
          : !player.onGround && player.vy > 400
            ? "panic"
            : !player.onGround
              ? "idle"
              : "smug";

    drawMascot({
      ctx,
      x: pl.x,
      y: pl.y,
      w: pw,
      h: ph,
      mascot,
      airborne: !player.onGround,
      facing: 1,
      mood,
    });

    // Speed lines while airborne
    if (status === "playing" && !player.onGround) {
      ctx.strokeStyle = "rgba(246,239,228,0.15)";
      for (let i = 0; i < 4; i++) {
        const y = pl.y + 6 + i * 8;
        ctx.beginPath();
        ctx.moveTo(pl.x - 18 - i * 10, y);
        ctx.lineTo(pl.x - 4, y);
        ctx.stroke();
      }
    }

    // Live fairness lie — drifts with progress, crashes on loss.
    if (status === "playing") {
      const target = Math.min(99, Math.round(72 + progress() * 26));
      fairLie += (target - fairLie) * 0.08;
    }

    ctx.fillStyle = "rgba(246, 239, 228, 0.92)";
    ctx.font = `700 ${Math.round(13 * Math.max(1, s))}px system-ui, sans-serif`;
    ctx.fillText(route.name, 16, 28);

    const barW = Math.min(200, w - 160);
    ctx.fillStyle = "rgba(246, 239, 228, 0.12)";
    ctx.fillRect(16, 40, barW, 8);
    ctx.fillStyle = "#6366F1";
    ctx.fillRect(16, 40, barW * progress(), 8);
    ctx.fillStyle = "#94A3B8";
    ctx.font = `600 ${Math.round(11 * Math.max(1, s))}px system-ui, sans-serif`;
    ctx.fillText(`${Math.round(progress() * 100)}%`, 16 + barW + 8, 48);

    // Certified Fair™ gaslight strip
    const fairW = Math.min(160, w * 0.38);
    ctx.fillStyle = "rgba(246, 239, 228, 0.1)";
    ctx.fillRect(16, 56, fairW, 5);
    ctx.fillStyle = status === "lost" ? "#6366F1" : "#10B981";
    ctx.fillRect(16, 56, fairW * (Math.max(8, fairLie) / 100), 5);
    ctx.fillStyle = "#94A3B8";
    ctx.font = `600 ${Math.round(9 * Math.max(1, s))}px system-ui, sans-serif`;
    ctx.fillText(
      `Fair™ ${Math.round(fairLie)}%`,
      16 + fairW + 8,
      61,
    );

    // Currency HUD — counts up while running, reads ₦0/$0 after a wipe.
    const cashLabel = formatCash(money);
    const cashFont = `800 ${Math.round(22 * Math.max(1, s * 0.9))}px "IBM Plex Sans", "Segoe UI", system-ui, sans-serif`;
    ctx.font = cashFont;
    ctx.fillStyle = wipeFlash > 0 ? "#6366F1" : "#10B981";
    const cashX = w - 16 - ctx.measureText(cashLabel).width;
    ctx.fillText(cashLabel, cashX, 34);
    ctx.font = `600 ${Math.round(11 * Math.max(1, s))}px system-ui, sans-serif`;
    ctx.fillStyle = "#94A3B8";
    const streakLabel =
      lossesToday > 0
        ? `${lossesToday} loss${lossesToday === 1 ? "" : "es"} today`
        : `${platformsCleared} pads · ${Math.round(currentSpeed())} spd`;
    ctx.fillText(streakLabel, Math.max(16, cashX - 4), 52);
    if (lossesToday > 0) {
      ctx.fillText(
        `${platformsCleared} pads · ${Math.round(currentSpeed())} spd`,
        Math.max(16, cashX - 4),
        66,
      );
    }

    if (status === "ready" && !demo) {
      ctx.fillStyle = "rgba(7, 10, 18, 0.5)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#F8FAFC";
      ctx.font = `800 ${Math.round(30 * Math.max(1, s * 0.85))}px system-ui, sans-serif`;
      ctx.fillText("ALMOST THERE", 24, h * 0.38);
      ctx.font = `500 ${Math.round(15 * Math.max(1, s))}px system-ui, sans-serif`;
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("Tap / space — run & jump", 24, h * 0.38 + 34);
      ctx.fillStyle = "#10B981";
      ctx.fillText(
        mascot === "queen" ? "Queen mode engaged" : "King mode engaged",
        24,
        h * 0.38 + 58,
      );
    }

    if (!demo && status === "playing" && nowSafe() < toastUntil) {
      ctx.fillStyle = "rgba(7, 10, 18, 0.78)";
      ctx.fillRect(16, h - 68, Math.min(w - 32, 380), 40);
      ctx.fillStyle = "#F8FAFC";
      ctx.font = `600 ${Math.round(13 * Math.max(1, s))}px system-ui, sans-serif`;
      ctx.fillText(toast, 28, h - 42);
    }
  }

  // Warm boot streak for HUD before first run.
  lossesToday = typeof window !== "undefined" ? getLossesToday() : 0;

  function nowSafe() {
    return performance.now();
  }

  function consumeEvents(): EngineEvent[] {
    const out = events;
    events = [];
    return out;
  }

  function destroy() {
    status = "ready";
    particles = [];
    floaters = [];
    events = [];
  }

  // Preview current route on boot
  platforms = hydrate(route.platforms);
  player = spawnPlayer();

  return {
    start,
    retryNewRoute,
    jump,
    setMascot,
    resize,
    tick,
    draw,
    getSnapshot: snapshot,
    consumeEvents,
    destroy,
  };
}
