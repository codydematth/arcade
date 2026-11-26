export type PlatformKind = "solid" | "fake" | "vanish" | "crumble";

export type PlatformDef = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  triggerDistance?: number;
  crumbleDelayMs?: number;
};

export type RouteDef = {
  seed: number;
  id: number;
  name: string;
  width: number;
  platforms: PlatformDef[];
  goalX: number;
  goalY: number;
  hint: string;
};

export type FailReason =
  | "fell"
  | "fake"
  | "vanish"
  | "crumble"
  | "timeout";

export type RunResult = {
  won: boolean;
  routeId: number;
  routeName: string;
  seed: number;
  progress: number;
  distance: number;
  /** Cash held at the end (0 after a loss wipe). */
  money: number;
  /** Peak cash before wipe — used to roast the loss. */
  moneyLost: number;
  platformsCleared: number;
  failReason?: FailReason;
  durationMs: number;
};

export type EngineStatus = "ready" | "playing" | "won" | "lost";

export type EngineEvent =
  | "jump"
  | "land"
  | "fake"
  | "die"
  | "win"
  | "start"
  | "coin";

export type EngineSnapshot = {
  status: EngineStatus;
  routeId: number;
  routeName: string;
  seed: number;
  hint: string;
  progress: number;
  distance: number;
  money: number;
  platformsCleared: number;
  speed: number;
  onGround: boolean;
  result: RunResult | null;
};

export type EngineOptions = {
  /** Card/shelf autopilot — quieter HUD, no loss streak writes. */
  demo?: boolean;
  seed?: number;
};
