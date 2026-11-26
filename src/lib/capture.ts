import {
  stickerCanvasColor,
  type RoastSticker,
} from "@/lib/stickers";

export type RoastCardInput = {
  gameCanvas: HTMLCanvasElement;
  eyebrow: string;
  headline: string;
  /** Optional — omitted so the roast stays headline-first. */
  moneyLine?: string;
  mascotLabel: string;
  sticker?: RoastSticker;
  drawMascot: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ) => void;
};

/** Shrink font until the string fits maxWidth (handles long Pidgin headlines). */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxPx: number,
  minPx: number,
  weight: string,
): number {
  let size = maxPx;
  while (size > minPx) {
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  ctx.font = `${weight} ${minPx}px system-ui, sans-serif`;
  return minPx;
}

function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let draw = text;
  while (draw.length > 1 && ctx.measureText(`${draw}…`).width > maxWidth) {
    draw = draw.slice(0, -1);
  }
  return `${draw}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) {
        line = "";
        break;
      }
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  // If we overflowed maxLines, ellipsize the last kept line.
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = ellipsize(ctx, last, maxWidth);
  }

  let cursorY = y;
  for (const row of lines) {
    ctx.fillText(ellipsize(ctx, row, maxWidth), x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

export async function renderRoastCard(input: RoastCardInput): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create share canvas");
  }

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#101628");
  bg.addColorStop(0.5, "#0B0F19");
  bg.addColorStop(1, "#070A12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
  ctx.beginPath();
  ctx.arc(160, 140, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
  ctx.beginPath();
  ctx.arc(920, 1180, 240, 0, Math.PI * 2);
  ctx.fill();

  // Brand row
  ctx.fillStyle = "#10B981";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("ALMOST FAIR", 72, 70);
  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText(
    input.mascotLabel,
    width - 72 - ctx.measureText(input.mascotLabel).width,
    70,
  );

  // Game frame — taller so the fail is the hero
  const frameX = 72;
  const frameY = 100;
  const frameW = width - 144;
  const frameH = 720;
  ctx.fillStyle = "#070A12";
  ctx.fillRect(frameX - 8, frameY - 8, frameW + 16, frameH + 16);
  ctx.strokeStyle = "rgba(248,250,252,0.14)";
  ctx.lineWidth = 4;
  ctx.strokeRect(frameX - 8, frameY - 8, frameW + 16, frameH + 16);

  const src = input.gameCanvas;
  const scale = Math.max(frameW / src.width, frameH / src.height);
  const dw = src.width * scale;
  const dh = src.height * scale;
  const dx = frameX + (frameW - dw) / 2;
  const dy = frameY + (frameH - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();
  ctx.drawImage(src, dx, dy, dw, dh);
  ctx.restore();

  if (input.sticker) {
    const color = stickerCanvasColor(input.sticker.tone);
    ctx.save();
    ctx.translate(frameX + frameW - 132, frameY + 78);
    ctx.rotate((input.sticker.rotate * Math.PI) / 180);
    ctx.font = "800 34px system-ui, sans-serif";
    const label = input.sticker.label;
    const tw = ctx.measureText(label).width;
    const padX = 18;
    const w = tw + padX * 2;
    const h = 48;
    ctx.fillStyle = "rgba(11, 15, 25, 0.88)";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  // Lean roast strip — headline only (no green bait line)
  const panelY = 900;
  const panelH = 340;
  const padX = 110;
  const textW = width - padX * 2;
  ctx.fillStyle = "rgba(19, 25, 38, 0.96)";
  ctx.fillRect(72, panelY, width - 144, panelH);
  ctx.strokeStyle = "rgba(248,250,252,0.1)";
  ctx.strokeRect(72, panelY, width - 144, panelH);

  ctx.fillStyle = "#818CF8";
  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillText(input.eyebrow.toUpperCase(), padX, panelY + 52);

  input.drawMascot(ctx, width - 220, panelY + 55, 110);

  const headlineSize = fitFont(
    ctx,
    input.headline,
    textW - 140,
    58,
    34,
    "800",
  );
  ctx.fillStyle = "#F8FAFC";
  ctx.font = `800 ${headlineSize}px system-ui, sans-serif`;
  wrapText(
    ctx,
    input.headline,
    padX,
    panelY + 118,
    textW - 140,
    headlineSize + 8,
    2,
  );

  ctx.fillStyle = "rgba(248,250,252,0.35)";
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillText("games.matthiasamire.com", padX, panelY + panelH - 36);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode PNG"));
    }, "image/png");
  });
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    !window.ClipboardItem
  ) {
    return false;
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
