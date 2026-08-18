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
 * gregoryedgerton.com/projects before being upstreamed here.
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

  // A non-finite or non-positive ratio produces an invalid scale(); browsers
  // discard the declaration and silently keep the previous frame on screen.
  if (!Number.isFinite(fillRatio) || fillRatio <= 0) {
    throw new Error(`fillRatio (${fillRatio}) must be a positive finite number.`);
  }

  // Same failure shape for an unmeasured viewport: NaN or zero dimensions
  // reach scale() as an invalid or degenerate value. A zero-sized container
  // is a real state during layout — the consumer should skip the frame, not
  // render one.
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    throw new Error(
      `Viewport (${viewportWidth}x${viewportHeight}) must have positive finite dimensions.`
    );
  }

  // Validate before any clamping: a depth of -0.5 would otherwise reuse the
  // largest square's centre while still applying a 45-degree rotation — an
  // inconsistent frame rather than the promised error. NaN (a scroll ratio
  // computed against a zero-sized container) fails every comparison, so it is
  // checked for explicitly.
  if (!Number.isFinite(depth) || depth < 0 || depth > count - 1) {
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
  // +90 per step for a clockwise layout: stepping from square n to n-1
  // already turns the neighbourhood -90 degrees, so the stage rotates the
  // OTHER way to cancel it — which is what keeps every whole-depth frame
  // oriented identically (the next-deeper square always enters from the same
  // side). The naive -90 doubles the turn instead and flips the visible
  // neighbourhood ~180 degrees between frames.
  const rotationDeg = (clockwise ? 90 : -90) * depth;

  return { scale, rotationDeg, centerX, centerY };
}

/**
 * The frame as a CSS transform for an absolutely-positioned stage whose
 * children sit at layout coordinates used as pixels. Order matters: anchor
 * the viewport, turn and zoom about that point, then bring the focus point
 * under it.
 *
 * `anchor` is where the focused square's CENTRE lands in viewport pixels —
 * the dial's pivot. It defaults to the viewport centre; a consumer that
 * wants the focus flush against an edge passes the point directly (e.g.
 * `{ x: focusSize / 2, y: viewportHeight / 2 }` pins the focused square's
 * left edge to x = 0). Which edge to hug is the consumer's layout decision —
 * proven on gregoryedgerton.com/projects, where the dial hugs the nav column
 * on desktop and the header line on mobile.
 *
 * The stage MUST have `transform-origin: 0 0` — the matrix assumes it. The
 * CSS default is the element's own centre, which silently shifts the focus
 * off its anchor once the stage has a box of its own.
 */
export function toCssTransform(
  frame: SpiralCameraFrame,
  viewportWidth: number,
  viewportHeight: number,
  anchor: { x: number; y: number } = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
  }
): string {
  if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
    throw new Error(`Anchor (${anchor.x}, ${anchor.y}) must be finite.`);
  }
  return (
    `translate(${anchor.x}px, ${anchor.y}px) ` +
    `rotate(${frame.rotationDeg}deg) scale(${frame.scale}) ` +
    `translate(${-frame.centerX}px, ${-frame.centerY}px)`
  );
}

/** One entry of a React Native `transform` array. */
export type NativeTransformPart =
  | { translateX: number }
  | { translateY: number }
  | { rotate: string }
  | { scale: number };

/**
 * The frame as a React Native `transform` array — the exact composition of
 * `toCssTransform`, expressed as RN transform entries so a native stage can
 * consume the frame without parsing a CSS string. The stage view MUST set
 * `transformOrigin: 'top left'` (React Native defaults to the view's centre)
 * — the analogue of the CSS `transform-origin: 0 0` requirement.
 */
export function toNativeTransform(
  frame: SpiralCameraFrame,
  viewportWidth: number,
  viewportHeight: number,
  anchor: { x: number; y: number } = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
  }
): NativeTransformPart[] {
  if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
    throw new Error(`Anchor (${anchor.x}, ${anchor.y}) must be finite.`);
  }
  return [
    { translateX: anchor.x },
    { translateY: anchor.y },
    { rotate: `${frame.rotationDeg}deg` },
    { scale: frame.scale },
    { translateX: -frame.centerX },
    { translateY: -frame.centerY },
  ];
}

/** The side of the focused square the spiral's interior trails toward. */
export type SpiralTrail = 'right' | 'bottom' | 'left' | 'top';

const TRAIL_ORDER: readonly SpiralTrail[] = ['right', 'bottom', 'left', 'top'];

/**
 * The layout rotation that makes the dial trail toward a given side.
 *
 * At depth 0 the camera focuses the LAST square and the rest of the spiral —
 * everything the reader is about to dial through — sits to one side of it.
 * Which side is not free: each square is placed one quarter-turn on from the
 * last, so the answer cycles with the square COUNT as well as the layout's
 * `rotate`. A layout built for fifteen squares trails downward at rotate 180;
 * the same rotation over five squares trails upward, off the top of the
 * viewport. A consumer that filters its content is therefore choosing a trail
 * direction by accident unless it solves for one.
 *
 * That solve is this function — the camera-side counterpart to
 * `placementToRotateDeg`, which answers the same question for the layout's
 * FIRST square. Pass the count you are about to lay out and the side you want
 * the composition to grow into; pass the result as `generateGoldenGridLayout`'s
 * `rotate`.
 *
 * Which side actually is the open one — the reader's viewport, the chrome
 * around it — stays the consumer's decision, exactly as the camera's `anchor`
 * does.
 *
 * `clockwise` defaults to true, matching `generateGoldenGridLayout` and the
 * camera: an omitted handedness must mean the same thing in all three, or a
 * JavaScript caller gets a rotation solved for the layout it did not build.
 */
export function trailToRotateDeg(
  trail: SpiralTrail,
  clockwise: boolean = true,
  squareCount: number
): number {
  const wanted = TRAIL_ORDER.indexOf(trail);
  if (wanted < 0) {
    throw new Error(`Unknown trail side: ${trail}.`);
  }
  if (!Number.isInteger(squareCount) || squareCount < 2) {
    throw new Error(`squareCount (${squareCount}) must be an integer of at least 2.`);
  }
  // Stepping the count by one turns the trail one quarter — the same
  // quarter-turn cycle the placement walks — so the rotation has to unwind it.
  const natural = clockwise ? squareCount : -squareCount;
  return (((wanted - natural) % 4) + 4) % 4 * 90;
}

/**
 * The side the interior trails toward for a layout that already exists — the
 * inverse of `trailToRotateDeg`, and the direct way to assert a composition
 * grows the way it was meant to.
 */
export function trailForRotation(
  rotateDeg: number,
  clockwise: boolean = true,
  squareCount: number
): SpiralTrail {
  if (![0, 90, 180, 270].includes(rotateDeg)) {
    throw new Error(`Invalid rotation value: ${rotateDeg}. Only 0, 90, 180, and 270 are allowed.`);
  }
  if (!Number.isInteger(squareCount) || squareCount < 2) {
    throw new Error(`squareCount (${squareCount}) must be an integer of at least 2.`);
  }
  const natural = clockwise ? squareCount : -squareCount;
  return TRAIL_ORDER[(((rotateDeg / 90 + natural) % 4) + 4) % 4];
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
  // A NaN depth or index propagates to opacity NaN with hidden false —
  // stale-painted, still-focusable content. Same failure loudness as the
  // distances above.
  if (
    !Number.isFinite(depth) ||
    !Number.isFinite(index) ||
    !Number.isFinite(squareCount) ||
    depth < 0 ||
    depth > squareCount - 1 ||
    index < 0 ||
    index > squareCount - 1
  ) {
    throw new Error(
      `Legibility window needs depth (${depth}) and index (${index}) inside ` +
        `[0, ${squareCount - 1}] for a finite squareCount (${squareCount}).`
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
