import type { GridLayout } from './gridGenerator';

/**
 * A continuous "camera" over a golden-grid layout: give it a depth and it
 * tells you how to transform the layout so that one square — the focus —
 * fills the viewport, with its neighbours composed around it exactly as the
 * spiral places them.
 *
 * Depth 0 focuses the LAST square in the layout (the largest); each whole
 * step of depth moves the focus one square earlier — deeper into the spiral,
 * toward its eye. Because consecutive Fibonacci squares shrink by ~φ and turn
 * 90°, dialing depth feels like one continuous zoom rather than a slideshow:
 * scale interpolates geometrically between square sizes (they shrink
 * exponentially — linear interpolation lurches) and rotation advances 90° per
 * step, which is the spiral's own self-similarity doing the transition work.
 *
 * Framework-free by design: the camera answers "where is the viewport at
 * depth d" and nothing else. Scroll binding, styling, and what lives in the
 * squares belong to the consumer. Proven in production on
 * gregoryedgerton.com/timeline before being upstreamed here.
 */

export interface SpiralCameraOptions {
  /**
   * Fraction of the viewport's smaller side the focused square should fill.
   * Defaults to 0.62 — a nod to 1/φ.
   */
  fillRatio?: number;
  /**
   * Spiral handedness, matching the `clockwise` you passed to
   * `generateGoldenGridLayout`. Controls which way the dial turns.
   */
  clockwise?: boolean;
}

export interface SpiralCameraFrame {
  /** Layout units → viewport pixels multiplier for this depth. */
  scale: number;
  /** Stage rotation in degrees (advances ±90° per depth step). */
  rotationDeg: number;
  /** Focus point in layout coordinates — the point to pin at viewport centre. */
  centerX: number;
  centerY: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Continuous index of the focused square: the last square at depth 0. */
export function focusIndexAt(depth: number, squareCount: number): number {
  return squareCount - 1 - depth;
}

/**
 * The camera frame for a depth in [0, squares.length - 1].
 *
 * Works directly in the layout's own coordinates (normalized or not), since
 * it only ever measures square centres and sizes.
 */
export function spiralCamera(
  layout: GridLayout,
  depth: number,
  viewportWidth: number,
  viewportHeight: number,
  options: SpiralCameraOptions = {}
): SpiralCameraFrame {
  const { fillRatio = 0.62, clockwise = true } = options;
  const count = layout.squares.length;

  // Validate before any clamping: a depth of -0.5 would otherwise reuse the
  // largest square's centre while still applying a 45-degree rotation — an
  // inconsistent frame rather than the promised error.
  if (depth < 0 || depth > count - 1) {
    throw new Error(`Depth ${depth} is outside the layout's ${count} squares.`);
  }

  const focus = focusIndexAt(depth, count);
  const lower = Math.floor(focus);
  const upper = Math.ceil(focus);

  const t = focus - lower;
  const from = layout.squares[lower];
  const to = layout.squares[upper];

  const focusSize = Math.exp(lerp(Math.log(from.size), Math.log(to.size), t));
  const centerX = lerp(from.x + from.size / 2, to.x + to.size / 2, t);
  const centerY = lerp(from.y + from.size / 2, to.y + to.size / 2, t);

  const target = fillRatio * Math.min(viewportWidth, viewportHeight);
  const scale = target / focusSize;
  const rotationDeg = (clockwise ? -90 : 90) * depth;

  return { scale, rotationDeg, centerX, centerY };
}

/**
 * The frame as a CSS transform for an absolutely-positioned stage whose
 * children sit at layout coordinates used as pixels. Order matters: centre
 * the viewport, turn and zoom about it, then bring the focus point under it.
 *
 * The stage MUST have `transform-origin: 0 0` — the matrix assumes it. The
 * CSS default is the element's own centre, which silently shifts the focus
 * off viewport-centre once the stage has a box of its own.
 */
export function toCssTransform(
  frame: SpiralCameraFrame,
  viewportWidth: number,
  viewportHeight: number
): string {
  return (
    `translate(${viewportWidth / 2}px, ${viewportHeight / 2}px) ` +
    `rotate(${frame.rotationDeg}deg) scale(${frame.scale}) ` +
    `translate(${-frame.centerX}px, ${-frame.centerY}px)`
  );
}

export interface SpiralWindowOptions {
  /** Distance (in depth steps) a tile stays fully opaque. Default 1. */
  holdSteps?: number;
  /** Distance at which opacity reaches zero — and the tile should leave the
   * paint and the tab order. Deliberately one number, not two: a gap between
   * "invisible" and "gone" leaves fully transparent content focusable.
   * Default 2.5. */
  fadeSteps?: number;
}

export interface SpiralWindow {
  opacity: number;
  hidden: boolean;
  focused: boolean;
}

/**
 * The legibility window around the focus: how present square `index` is at
 * `depth`. One ramp gives you "a few tiles at a time" and the crossfade.
 */
export function spiralWindow(
  index: number,
  depth: number,
  squareCount: number,
  options: SpiralWindowOptions = {}
): SpiralWindow {
  const { holdSteps = 1, fadeSteps = 2.5 } = options;
  // A malformed window renders nonsense rather than failing visibly: an
  // inverted one reverses the ramp (opacity above 1, growing with distance),
  // and a negative hold hides the focus itself. Refuse both.
  if (
    !Number.isFinite(holdSteps) ||
    !Number.isFinite(fadeSteps) ||
    holdSteps < 0 ||
    fadeSteps <= holdSteps
  ) {
    throw new Error(
      `Legibility window needs 0 <= holdSteps (${holdSteps}) < fadeSteps (${fadeSteps}).`
    );
  }
  const delta = Math.abs(focusIndexAt(depth, squareCount) - index);
  const raw =
    delta <= holdSteps
      ? 1
      : Math.max(0, (fadeSteps - delta) / (fadeSteps - holdSteps));
  // hidden derives from the ROUNDED value the consumer will actually render:
  // a raw opacity of 0.0004 rounds to 0, and content rendered at 0 must also
  // leave the paint and the tab order.
  const opacity = Number(raw.toFixed(3));
  return {
    opacity,
    hidden: opacity <= 0,
    focused: delta < 0.5,
  };
}

/**
 * The spiral's eye: the point the squares converge on as they shrink.
 *
 * Approximated as the centre of the smallest square, which is exact in the
 * φ-limit and within half a unit for Fibonacci layouts — more than enough for
 * a transform origin or an annotation anchor.
 */
export function spiralEye(layout: GridLayout): { x: number; y: number } {
  const smallest = layout.squares.reduce((min, square) =>
    square.size < min.size ? square : min
  );
  return {
    x: smallest.x + smallest.size / 2,
    y: smallest.y + smallest.size / 2,
  };
}
