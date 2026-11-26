type FullscreenCapable = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type DocumentFs = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
}

export function isFullscreenActive(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as DocumentFs;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

async function enterFullscreen(el: HTMLElement): Promise<boolean> {
  const node = el as FullscreenCapable;
  try {
    if (typeof node.requestFullscreen === "function") {
      await node.requestFullscreen();
      return true;
    }
    if (typeof node.webkitRequestFullscreen === "function") {
      await node.webkitRequestFullscreen();
      return true;
    }
  } catch {
    // Denied or unsupported
  }
  return false;
}

/**
 * Auto-immersive path after a gesture — mobile only.
 * Desktop stays optional via toggleGameFullscreen.
 */
export async function requestGameFullscreen(
  el: HTMLElement | null,
): Promise<boolean> {
  if (!el || typeof document === "undefined") return false;
  if (!isMobileViewport()) return false;
  if (isFullscreenActive()) return true;
  return enterFullscreen(el);
}

export async function exitGameFullscreen(): Promise<void> {
  if (!isFullscreenActive()) return;
  const doc = document as DocumentFs;
  try {
    if (typeof document.exitFullscreen === "function") {
      await document.exitFullscreen();
      return;
    }
    if (typeof doc.webkitExitFullscreen === "function") {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // ignore
  }
}

/** Explicit user control — works on desktop and mobile. */
export async function toggleGameFullscreen(
  el: HTMLElement | null,
): Promise<boolean> {
  if (!el || typeof document === "undefined") return false;
  if (isFullscreenActive()) {
    await exitGameFullscreen();
    return false;
  }
  return enterFullscreen(el);
}
