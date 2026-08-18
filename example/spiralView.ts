import { generateGoldenGridLayout, placementToRotateDeg } from "../src/utils/gridGenerator";
import type { GridLayout } from "../src/utils/gridGenerator";
import type { PlacementValue } from "../src/utils/renderModel";

export const PLACEMENT_ORDER: readonly PlacementValue[] = ["right", "bottom", "left", "top"];

/**
 * The placement whose layout rotation equals `rotateDeg` — the inverse of
 * placementToRotateDeg. The generator's spiral view solves its rotation with
 * trailToRotateDeg (the camera-side solve, which supersedes the placement
 * control), then maps that rotation back to a placement so the
 * placement-driven <GoldenGrid> renders the exact layout the camera was
 * solved for — and so the export reproduces what is on screen.
 */
export function placementForRotation(
  rotateDeg: number,
  clockwise: boolean,
  startIdx: number
): PlacementValue {
  const wanted = ((rotateDeg % 360) + 360) % 360;
  const match = PLACEMENT_ORDER.find(
    (p) => placementToRotateDeg(p, clockwise, startIdx) === wanted
  );
  if (!match) {
    throw new Error(`No placement maps to rotation ${rotateDeg}.`);
  }
  return match;
}

/**
 * The camera stage for the generator: the full-sequence layout, normalised to
 * a zero origin (matching how <GoldenGrid> positions its boxes) and scaled so
 * the long side is `targetLongSide` CSS pixels — Fibonacci coordinates grow
 * exponentially, and a raw `to` of 78 would ask the browser for a
 * 9-quadrillion-pixel stage.
 */
export function buildSpiralStage(
  fullSequence: number[],
  clockwise: boolean,
  rotateDeg: number,
  targetLongSide: number = 1024
): GridLayout {
  const layout = generateGoldenGridLayout(fullSequence, clockwise, rotateDeg);
  const k = targetLongSide / Math.max(layout.width, layout.height);
  return {
    squares: layout.squares.map((s) => ({
      x: (s.x - layout.minX) * k,
      y: (s.y - layout.minY) * k,
      size: s.size * k,
    })),
    width: layout.width * k,
    height: layout.height * k,
    minX: 0,
    minY: 0,
  };
}
