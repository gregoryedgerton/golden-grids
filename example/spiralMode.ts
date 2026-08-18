import { placementToRotateDeg } from "../src/utils/gridGenerator";
import { trailToRotateDeg } from "../src/utils/spiralCamera";
import type { SpiralTrail } from "../src/utils/spiralCamera";
import { computeRenderModel } from "../src/utils/renderModel";
import { hslToCss } from "../src/utils/colorUtils";

/** The demo's spiral-mode helpers — pure, so they are testable without DOM. */

const PLACEMENTS = ["right", "bottom", "left", "top"] as const;
export type Placement = (typeof PLACEMENTS)[number];

/**
 * The `placement` that produces a given layout rotation — the inverse of
 * `placementToRotateDeg` for a fixed start index and handedness.
 *
 * Spiral mode solves its rotation from a TRAILING side (`trailToRotateDeg`),
 * but the export format and the flat renderer speak `placement`. Deriving the
 * equivalent placement keeps the exported HTML identical to what the dial
 * showed: same rotation, expressed in the mad-lib's own vocabulary. Total by
 * construction — the four placements map onto the four rotations bijectively
 * for any fixed (clockwise, startIdx).
 */
export function placementForRotation(
  rotateDeg: number,
  clockwise: boolean,
  startIdx: number
): Placement {
  for (const placement of PLACEMENTS) {
    if (placementToRotateDeg(placement, clockwise, startIdx) === rotateDeg) {
      return placement;
    }
  }
  // Unreachable for valid rotations; loud beats silently wrong.
  throw new Error(`No placement produces rotation ${rotateDeg}.`);
}

/**
 * The placement equivalent to trailing toward `trail` over `squareCount`
 * squares — the one spiral-mode export uses.
 */
export function placementForTrail(
  trail: SpiralTrail,
  clockwise: boolean,
  squareCount: number,
  startIdx: number
): Placement {
  return placementForRotation(
    trailToRotateDeg(trail, clockwise, squareCount),
    clockwise,
    startIdx
  );
}

/**
 * CSS fills for the dial, BY LAYOUT SQUARE INDEX, derived from the flat
 * renderer's own colour progression (`computeRenderModel`) rather than a
 * reimplementation — so toggling modes never recolours a square and the dial
 * previews exactly the colours the export will carry.
 *
 * The model's slots walk the requested squares smallest→largest, which is the
 * layout array's own order from `startIdx`; skipped leading squares take the
 * placeholder's fill (the raw base colour), since they ARE the placeholder
 * region seen from inside.
 */
export function fillsForSpiral(
  from: number,
  to: number,
  color: string | undefined,
  clockwise: boolean,
  placement: Placement,
  count: number,
  startIdx: number
): Array<string | undefined> {
  const fills: Array<string | undefined> = new Array<string | undefined>(count).fill(undefined);
  if (!color) return fills;
  const model = computeRenderModel({ from, to, color, clockwise, placement });
  const toCss = (fill: { kind: "hsl"; h: number; s: number; l: number } | { kind: "raw"; value: string } | null) =>
    fill == null ? undefined : fill.kind === "hsl" ? hslToCss(fill.h, fill.s, fill.l) : fill.value;
  for (let index = 0; index < startIdx; index += 1) {
    fills[index] = toCss(model.placeholder?.color ?? null);
  }
  model.slots.forEach((slot, i) => {
    if (startIdx + i < count) fills[startIdx + i] = toCss(slot.color);
  });
  return fills;
}
