export type MascotId = "king" | "queen";

export const MASCOT_STORAGE_KEY = "almost-fair-mascot";

export const MASCOT_OPTIONS: Array<{
  id: MascotId;
  label: string;
  blurb: string;
}> = [
  { id: "king", label: "King", blurb: "Short fade. Long fall." },
  { id: "queen", label: "Queen", blurb: "Ponytail. Same physics. Same loss." },
];

export function loadMascot(): MascotId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MASCOT_STORAGE_KEY);
    if (raw === "king" || raw === "queen") return raw;
  } catch {
    // ignore
  }
  return null;
}

export function saveMascot(id: MascotId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MASCOT_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export type MascotMood = "idle" | "panic" | "rage" | "smug";

type DrawMascotOptions = {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  mascot: MascotId;
  airborne?: boolean;
  facing?: 1 | -1;
  mood?: MascotMood;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawMascot(options: DrawMascotOptions) {
  const {
    ctx,
    x,
    y,
    w,
    h,
    mascot,
    airborne = false,
    facing = 1,
    mood = "idle",
  } = options;

  const squash = airborne ? 0.9 : 1;
  const stretch = airborne ? 1.08 : 1;
  const bodyH = h * squash;
  const bodyW = w * stretch;
  const bx = x - (bodyW - w) / 2;
  const by = y + (h - bodyH);

  const skin = mascot === "queen" ? "#f7d7c4" : "#f0c8a8";
  const accent = mascot === "queen" ? "#818CF8" : "#6366F1";
  const hair = mascot === "queen" ? "#2a1d14" : "#1a1410";
  const shirt = mascot === "queen" ? "#6366F1" : "#10B981";
  // Pants need strong contrast on dark stages (hair-black looked "transparent").
  const pants = mascot === "queen" ? "#3d2a6d" : "#1f4d6d";
  const shoes = mascot === "queen" ? "#818CF8" : "#6366F1";

  ctx.save();
  if (facing < 0) {
    ctx.translate(bx + bodyW, by);
    ctx.scale(-1, 1);
    ctx.translate(-bx, -by);
  }

  // Soft ground contact only — keep under the feet, not beside the body.
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(
    bx + bodyW / 2,
    by + bodyH + 1,
    bodyW * 0.28,
    3.5,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // legs + shoes (drawn solid, below a shorter torso so they stay visible)
  const legW = Math.max(6, bodyW * 0.22);
  const legH = Math.max(8, bodyH * 0.3);
  const legY = by + bodyH * 0.62;
  const leftX = bx + bodyW * 0.22;
  const rightX = bx + bodyW * 0.56;

  ctx.fillStyle = pants;
  roundRect(ctx, leftX, legY, legW, legH, 3);
  ctx.fill();
  roundRect(ctx, rightX, legY, legW, legH, 3);
  ctx.fill();

  ctx.fillStyle = shoes;
  roundRect(ctx, leftX - 1, legY + legH - bodyH * 0.08, legW + 3, bodyH * 0.1, 3);
  ctx.fill();
  roundRect(ctx, rightX - 1, legY + legH - bodyH * 0.08, legW + 3, bodyH * 0.1, 3);
  ctx.fill();

  // body / torso sits above the legs
  ctx.fillStyle = shirt;
  roundRect(ctx, bx + bodyW * 0.14, by + bodyH * 0.36, bodyW * 0.72, bodyH * 0.34, 10);
  ctx.fill();

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(bx + bodyW / 2, by + bodyH * 0.28, bodyW * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // blush
  ctx.fillStyle = "rgba(255, 90, 120, 0.35)";
  ctx.beginPath();
  ctx.ellipse(bx + bodyW * 0.32, by + bodyH * 0.32, bodyW * 0.07, bodyH * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bx + bodyW * 0.68, by + bodyH * 0.32, bodyW * 0.07, bodyH * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes — mood shifts the expression for previews / fails
  const eyeY = by + bodyH * (mood === "rage" ? 0.255 : 0.26);
  const eyeR = bodyW * (mood === "panic" ? 0.07 : 0.055);
  ctx.fillStyle = "#0B0F19";
  ctx.beginPath();
  ctx.arc(bx + bodyW * 0.4, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(bx + bodyW * 0.6, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  if (mood !== "rage") {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(bx + bodyW * 0.42, eyeY - bodyH * 0.015, bodyW * 0.02, 0, Math.PI * 2);
    ctx.arc(bx + bodyW * 0.62, eyeY - bodyH * 0.015, bodyW * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mood === "panic") {
    // sweat drop
    ctx.fillStyle = "rgba(180, 220, 255, 0.85)";
    ctx.beginPath();
    ctx.ellipse(
      bx + bodyW * 0.78,
      by + bodyH * 0.2,
      bodyW * 0.04,
      bodyH * 0.06,
      0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // mouth
  ctx.strokeStyle = "#0B0F19";
  ctx.lineWidth = Math.max(1.2, bodyW * 0.04);
  ctx.lineCap = "round";
  ctx.beginPath();
  if (mood === "rage") {
    ctx.moveTo(bx + bodyW * 0.4, by + bodyH * 0.34);
    ctx.lineTo(bx + bodyW * 0.6, by + bodyH * 0.34);
  } else if (mood === "panic") {
    ctx.arc(bx + bodyW / 2, by + bodyH * 0.36, bodyW * 0.08, Math.PI + 0.2, -0.2);
  } else if (mood === "smug") {
    ctx.arc(bx + bodyW / 2, by + bodyH * 0.32, bodyW * 0.1, 0.35, Math.PI - 0.05);
  } else {
    ctx.arc(bx + bodyW / 2, by + bodyH * 0.33, bodyW * 0.1, 0.15, Math.PI - 0.15);
  }
  ctx.stroke();

  if (mascot === "queen") {
    // ponytail
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(
      bx + bodyW * 0.78,
      by + bodyH * 0.34,
      bodyW * 0.12,
      bodyH * 0.28,
      0.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // bangs
    roundRect(ctx, bx + bodyW * 0.22, by + bodyH * 0.08, bodyW * 0.56, bodyH * 0.12, 8);
    ctx.fill();
    // bow
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(bx + bodyW * 0.72, by + bodyH * 0.12);
    ctx.lineTo(bx + bodyW * 0.84, by + bodyH * 0.08);
    ctx.lineTo(bx + bodyW * 0.84, by + bodyH * 0.18);
    ctx.closePath();
    ctx.fill();
  } else {
    // short hair / cap
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(bx + bodyW / 2, by + bodyH * 0.16, bodyW * 0.34, bodyH * 0.16, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, bx + bodyW * 0.2, by + bodyH * 0.08, bodyW * 0.6, bodyH * 0.1, 6);
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(bx + bodyW * 0.42, by + bodyH * 0.05, bodyW * 0.16, bodyH * 0.06);
  }

  // arm
  ctx.fillStyle = skin;
  roundRect(ctx, bx + bodyW * 0.78, by + bodyH * 0.44, bodyW * 0.14, bodyH * 0.22, 5);
  ctx.fill();

  ctx.restore();
}

/** Larger preview for picker / share card. */
export function drawMascotPreview(
  ctx: CanvasRenderingContext2D,
  mascot: MascotId,
  cx: number,
  cy: number,
  size: number,
) {
  drawMascot({
    ctx,
    x: cx - size / 2,
    y: cy - size / 2,
    w: size,
    h: size,
    mascot,
    airborne: false,
  });
}
