/** Shared jump/run constants so route gaps stay reachable. */

export const GRAVITY = 2400;
export const JUMP_V = -860;
export const BASE_SPEED = 235;
export const SPEED_PER_PAD = 14;
export const MAX_SPEED = 420;

/** Approximate airborne time for a full jump (up + down). */
export function jumpHangTime(): number {
  return (2 * Math.abs(JUMP_V)) / GRAVITY;
}

/** Horizontal distance covered during a full jump at a given run speed. */
export function jumpReach(speed: number): number {
  return speed * jumpHangTime();
}

/** Max vertical rise of a jump. */
export function jumpHeight(): number {
  return (JUMP_V * JUMP_V) / (2 * GRAVITY);
}
