import { generateGoldenGridLayout, placementToRotateDeg } from "./gridGenerator";
import { fullFibonacciUpTo, getGridRange } from "./fibonacci";
import { hexToHsl } from "./colorUtils";

export type PlacementValue = "right" | "bottom" | "left" | "top";

/** Input to the pure render-model computation — the subset of GoldenGridProps
 *  that affects geometry and colour. Children and `outline` are rendering-layer
 *  concerns and are intentionally absent. */
export interface RenderModelInput {
  from?: number;
  to?: number;
  color?: string;
  clockwise?: boolean;
  placement?: PlacementValue;
}

/** A positioned box, normalised to the [0, 1] range of the grid's bounding box. */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Platform-neutral fill. `hsl` is the computed colour progression; `raw` passes
 *  the user's colour string through verbatim (used for the placeholder). */
export type FillColor =
  | { kind: "hsl"; h: number; s: number; l: number }
  | { kind: "raw"; value: string }
  | null;

export interface RenderSlot {
  rect: Rect;
  color: FillColor;
  /** Index into the visible-children list. Slot 0 is the largest/most prominent
   *  box; renderers fill it from the first child (largest-to-smallest). */
  childIndex: number;
}

export interface RenderPlaceholder {
  rect: Rect;
  color: FillColor;
}

/** Everything a renderer needs, free of React/DOM/CSS concepts.
 *  - `empty`  → nothing to draw (degenerate range)
 *  - `single` → one full-bleed box
 *  - `grid`   → spiral of slots, optionally preceded by a placeholder
 *  When `placeholder` is present the renderer reserves the last child for it and
 *  draws the visible slots from the remaining children. */
export interface RenderModel {
  kind: "empty" | "single" | "grid";
  aspectRatio: { w: number; h: number };
  slots: RenderSlot[];
  placeholder: RenderPlaceholder | null;
}

/**
 * Pure, framework-agnostic translation of grid props into a render model.
 * The web component (and any native renderer) is a thin layer over this.
 */
export function computeRenderModel(input: RenderModelInput): RenderModel {
  const from = input.from ?? 1;
  const to = input.to ?? 4;
  const clockwise = input.clockwise ?? true;
  const placement = input.placement ?? "right";

  const baseColor = input.color || undefined;
  const [h, s, l] = baseColor ? hexToHsl(baseColor) : [0, 0, 50];

  let start = from;
  let end = to;
  if (start > end) [start, end] = [end, start];

  const range = getGridRange(start, end);
  if (!range) {
    return { kind: "empty", aspectRatio: { w: 1, h: 1 }, slots: [], placeholder: null };
  }

  const { userSequence, startIdx, endIdx } = range;

  // Single square — no skipped squares, no spiral.
  if (startIdx === 0 && endIdx === 0) {
    return {
      kind: "single",
      aspectRatio: { w: 1, h: 1 },
      slots: [
        {
          rect: { left: 0, top: 0, width: 1, height: 1 },
          color: baseColor ? { kind: "hsl", h, s, l } : null,
          childIndex: 0,
        },
      ],
      placeholder: null,
    };
  }

  const rotateDeg = placementToRotateDeg(placement, clockwise, startIdx);
  const maxRequested = Math.max(...userSequence);
  const fullSequence = fullFibonacciUpTo(maxRequested);

  const layout = generateGoldenGridLayout(fullSequence, clockwise, rotateDeg);
  const requestedSquares = layout.squares.slice(startIdx, endIdx + 1);
  const skippedSquares = layout.squares.slice(0, startIdx);

  // --- placeholder bounds (collapsed skipped squares) ---
  const placeholderExists = skippedSquares.length > 0;
  let placeholder: RenderPlaceholder | null = null;
  if (placeholderExists) {
    let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity;
    for (const sq of skippedSquares) {
      if (sq.x < pMinX) pMinX = sq.x;
      if (sq.x + sq.size - 1 > pMaxX) pMaxX = sq.x + sq.size - 1;
      if (sq.y < pMinY) pMinY = sq.y;
      if (sq.y + sq.size - 1 > pMaxY) pMaxY = sq.y + sq.size - 1;
    }
    const pWidth = pMaxX - pMinX + 1;
    const pHeight = pMaxY - pMinY + 1;
    placeholder = {
      rect: {
        left: (pMinX - layout.minX) / layout.width,
        top: (pMinY - layout.minY) / layout.height,
        width: pWidth / layout.width,
        height: pHeight / layout.height,
      },
      color: baseColor ? { kind: "raw", value: baseColor } : null,
    };
  }

  // --- colour progression ---
  const totalRequested = requestedSquares.length;
  const hueRange = Math.min(330, 180 + Math.max(0, totalRequested - 4) * 15);
  const lightnessSpread = Math.min(50, totalRequested * 3);

  const slots: RenderSlot[] = requestedSquares.map((sq, i) => {
    let color: FillColor = null;
    if (baseColor) {
      let fraction = 0;
      if (totalRequested > 1) {
        fraction = placeholderExists
          ? (i + 1) / (totalRequested + 1)
          : i / (totalRequested - 1);
      } else if (placeholderExists) {
        fraction = 0.5;
      }
      const currentHue = (h + hueRange * fraction) % 360;
      const currentL = Math.max(10, Math.min(90, l + lightnessSpread / 2 - fraction * lightnessSpread));
      color = { kind: "hsl", h: currentHue, s, l: currentL };
    }
    return {
      rect: {
        left: (sq.x - layout.minX) / layout.width,
        top: (sq.y - layout.minY) / layout.height,
        width: sq.size / layout.width,
        height: sq.size / layout.height,
      },
      color,
      childIndex: totalRequested - 1 - i,
    };
  });

  return {
    kind: "grid",
    aspectRatio: { w: layout.width, h: layout.height },
    slots,
    placeholder,
  };
}
