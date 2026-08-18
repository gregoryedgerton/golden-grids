import { placementToRotateDeg } from "../src/utils/gridGenerator";
import { trailToRotateDeg } from "../src/utils/spiralCamera";
import type { SpiralTrail } from "../src/utils/spiralCamera";

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
