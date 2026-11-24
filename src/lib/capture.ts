export type RoastCardInput = {
  gameCanvas: HTMLCanvasElement;
  eyebrow: string;
  emoji: string;
  headline: string;
  subline: string;
  audience: string;
  progress: string;
  moneyLine: string;
  mascotLabel: string;
  drawMascot: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
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

  // Background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#1a1520");
  bg.addColorStop(0.45, "#121821");
  bg.addColorStop(1, "#0b0f14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Accent glows
  ctx.fillStyle = "rgba(255, 77, 46, 0.22)";
  ctx.beginPath();
  ctx.arc(180, 160, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(61, 255, 154, 0.12)";
  ctx.beginPath();
  ctx.arc(900, 1100, 260, 0, Math.PI * 2);
  ctx.fill();

  // Game snapshot frame
  const frameX = 72;
  const frameY = 120;
  const frameW = width - 144;
  const frameH = 520;
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(frameX - 8, frameY - 8, frameW + 16, frameH + 16);
  ctx.strokeStyle = "rgba(243,240,232,0.16)";
  ctx.lineWidth = 4;
  ctx.strokeRect(frameX - 8, frameY - 8, frameW + 16, frameH + 16);

  const src = input.gameCanvas;
  const srcW = src.width;
  const srcH = src.height;
  const scale = Math.max(frameW / srcW, frameH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  const dx = frameX + (frameW - dw) / 2;
  const dy = frameY + (frameH - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();
  ctx.drawImage(src, dx, dy, dw, dh);
  ctx.restore();

  // Brand
  ctx.fillStyle = "#3dff9a";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText("ALMOST FAIR", 72, 70);
  ctx.fillStyle = "#9aa3b5";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText(input.mascotLabel, width - 72 - ctx.measureText(input.mascotLabel).width, 70);

  // Roast panel
  const panelY = 680;
  ctx.fillStyle = "rgba(18, 24, 33, 0.96)";
  ctx.fillRect(72, panelY, width - 144, 560);
  ctx.strokeStyle = "rgba(243,240,232,0.12)";
  ctx.strokeRect(72, panelY, width - 144, 560);

  ctx.fillStyle = "#3dff9a";
  ctx.font = "700 26px system-ui, sans-serif";
  ctx.fillText(input.eyebrow.toUpperCase(), 110, panelY + 58);

  ctx.font = "120px system-ui, sans-serif";
  ctx.fillText(input.emoji, 110, panelY + 180);

  input.drawMascot(ctx, width - 250, panelY + 70, 150);

  ctx.fillStyle = "#f3f0e8";
  ctx.font = "800 64px system-ui, sans-serif";
  const afterHeadline = wrapText(ctx, input.headline, 110, panelY + 250, width - 320, 72);

  ctx.fillStyle = "rgba(243,240,232,0.88)";
  ctx.font = "500 32px system-ui, sans-serif";
  const afterSub = wrapText(ctx, input.subline, 110, afterHeadline + 18, width - 220, 42);

  ctx.fillStyle = "#ff7a63";
  ctx.font = "600 28px system-ui, sans-serif";
  const afterAudience = wrapText(
    ctx,
    input.audience,
    110,
    afterSub + 16,
    width - 220,
    38,
  );

  ctx.fillStyle = "#ff7a63";
  ctx.font = "800 30px system-ui, sans-serif";
  ctx.fillText(input.moneyLine, 110, afterAudience + 22);

  ctx.fillStyle = "#9aa3b5";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText(input.progress, 110, afterAudience + 58);

  // No UI buttons on the share image — only roast content + quiet brand mark.
  ctx.fillStyle = "rgba(243,240,232,0.35)";
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillText("almost fair", 110, panelY + 520);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode PNG"));
    }, "image/png");
  });
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard || !window.ClipboardItem) {
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
