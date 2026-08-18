import * as fs from "fs";
import * as path from "path";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import {
  contentTransform,
  spiralCamera,
  spiralEye,
  spiralWindow,
  tileTransform,
  trailForRotation,
  trailToRotateDeg,
} from "../utils/spiralCamera";
import type { SpiralTrail } from "../utils/spiralCamera";

const FIXTURE_PATH = path.join(__dirname, "..", "__fixtures__", "spiral-camera.json");

const fib = (n: number): number[] => {
  const seq = [1, 1];
  while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  return seq;
};

/**
 * The cross-language contract for the spiral camera, mirroring
 * render-model.json: TypeScript is the source of truth, and the Swift and
 * Kotlin ports assert against this file within 1e-9. Every entry is
 * self-contained — input beside expected output — so a port never needs the
 * case matrix, only the JSON.
 *
 * Frames also carry the affine matrix [a, b, c, d, tx, ty] for the mapping
 * v = anchor + R·s·(p − center) about a 0 0 origin — the platform transform
 * helpers (toCssTransform, CGAffineTransform, graphicsLayer) are thin
 * decompositions of exactly this matrix, so asserting it pins them all.
 */

interface FrameCase {
  name: string;
  input: {
    count: number;
    clockwise: boolean;
    rotate: number;
    depth: number;
    viewportWidth: number;
    viewportHeight: number;
    fillRatio: number;
    anchor: { x: number; y: number };
  };
  frame: { scale: number; rotationDeg: number; centerX: number; centerY: number };
  affine: [number, number, number, number, number, number];
}

const FRAME_INPUTS: FrameCase["input"][] = [];
for (const clockwise of [true, false]) {
  for (const rotate of [0, 90, 180, 270]) {
    for (const depth of [0, 0.5, 1, 3.25, 7, 13.999]) {
      FRAME_INPUTS.push({
        count: 15,
        clockwise,
        rotate,
        depth,
        viewportWidth: 960,
        viewportHeight: 720,
        fillRatio: 1,
        anchor: { x: 360, y: 360 },
      });
    }
  }
}
// Small layouts, the default fill ratio, and a centred anchor.
for (const count of [2, 3, 5]) {
  for (const depth of [0, count - 1, (count - 1) / 2]) {
    FRAME_INPUTS.push({
      count,
      clockwise: true,
      rotate: 0,
      depth,
      viewportWidth: 375,
      viewportHeight: 812,
      fillRatio: 0.62,
      anchor: { x: 187.5, y: 406 },
    });
  }
}

// JSON has no negative zero: -0 round-trips as 0 (ccw at depth 0 rotates -0),
// so normalize every number before deep-equality against the parsed file.
const z = (value: number): number => (value === 0 ? 0 : value);

function frameCase(input: FrameCase["input"]): FrameCase {
  const layout = generateGoldenGridLayout(fib(input.count), input.clockwise, input.rotate);
  const raw = spiralCamera(
    layout,
    input.depth,
    input.viewportWidth,
    input.viewportHeight,
    { fillRatio: input.fillRatio, clockwise: input.clockwise }
  );
  const frame = {
    scale: z(raw.scale),
    rotationDeg: z(raw.rotationDeg),
    centerX: z(raw.centerX),
    centerY: z(raw.centerY),
  };
  const radians = (frame.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const s = frame.scale;
  const affine: FrameCase["affine"] = [
    z(s * cos),
    z(s * sin),
    z(-s * sin),
    z(s * cos),
    z(input.anchor.x - s * (cos * frame.centerX - sin * frame.centerY)),
    z(input.anchor.y - s * (sin * frame.centerX + cos * frame.centerY)),
  ];
  const name =
    `count${input.count}_${input.clockwise ? "cw" : "ccw"}_rot${input.rotate}` +
    `_depth${input.depth}_fill${input.fillRatio}`;
  return { name, input, frame, affine };
}

interface WindowCase {
  input: {
    index: number;
    depth: number;
    count: number;
    holdSteps: number;
    fadeSteps: number;
  };
  window: { opacity: number; hidden: boolean; focused: boolean };
}

const WINDOW_INPUTS: WindowCase["input"][] = [];
for (const depth of [0, 1.5, 7, 14]) {
  for (const index of [0, 3, 7, 10, 14]) {
    WINDOW_INPUTS.push({ index, depth, count: 15, holdSteps: 1, fadeSteps: 2.5 });
  }
}
// A custom window shape.
WINDOW_INPUTS.push({ index: 2, depth: 0, count: 8, holdSteps: 0.5, fadeSteps: 4 });
WINDOW_INPUTS.push({ index: 6, depth: 6, count: 8, holdSteps: 0.5, fadeSteps: 4 });
// Rounding-tie cases: raw lands exactly on a .0005 boundary, where JS
// toFixed / Swift round half AWAY FROM ZERO but a ties-to-even port would
// disagree (0.345 vs 0.344). Pins the tie-breaking rule cross-language.
WINDOW_INPUTS.push({ index: 12, depth: 0.01675, count: 15, holdSteps: 1, fadeSteps: 2.5 });
WINDOW_INPUTS.push({ index: 10, depth: 2.01675, count: 15, holdSteps: 1, fadeSteps: 2.5 });

interface TrailCase {
  count: number;
  clockwise: boolean;
  trail: SpiralTrail;
  rotate: number;
}

const TRAIL_SIDES: SpiralTrail[] = ["right", "bottom", "left", "top"];
const TRAIL_CASES: TrailCase[] = [];
for (let count = 2; count <= 20; count += 1) {
  for (const clockwise of [true, false]) {
    for (const trail of TRAIL_SIDES) {
      TRAIL_CASES.push({
        count,
        clockwise,
        trail,
        rotate: trailToRotateDeg(trail, clockwise, count),
      });
    }
  }
}

interface EyeCase {
  input: { count: number; clockwise: boolean; rotate: number };
  eye: { x: number; y: number };
}

const EYE_CASES: EyeCase[] = [];
for (const count of [5, 10, 15]) {
  for (const rotate of [0, 180]) {
    const layout = generateGoldenGridLayout(fib(count), true, rotate);
    EYE_CASES.push({ input: { count, clockwise: true, rotate }, eye: spiralEye(layout) });
  }
}

interface TileCase {
  frameName: string;
  squareIndex: number;
  texturePx: number;
  tile: { translateX: number; translateY: number; rotationDeg: number; scale: number };
}

interface ContentCase {
  frameName: string;
  counterRotate: boolean;
  cover: boolean;
  content: { rotationDeg: number; scale: number };
}

interface Fixture {
  frames: FrameCase[];
  windows: WindowCase[];
  trails: TrailCase[];
  eyes: EyeCase[];
  tiles: TileCase[];
  contents: ContentCase[];
}

function tileCases(): TileCase[] {
  // Per-tile transforms for a spread of frames and squares — smallest,
  // middle and largest — pinning the flat camera∘placement composition every
  // platform's tile helper decomposes (the raster-clamp fix as a contract).
  const cases: TileCase[] = [];
  for (const input of [FRAME_INPUTS[0], FRAME_INPUTS[5], FRAME_INPUTS[30], FRAME_INPUTS[50]]) {
    if (!input) continue;
    const layout = generateGoldenGridLayout(fib(input.count), input.clockwise, input.rotate);
    const current = frameCase(input);
    for (const squareIndex of [0, Math.floor(input.count / 2), input.count - 1]) {
      const square = layout.squares[squareIndex];
      const tile = tileTransform(
        { ...current.frame },
        square,
        input.viewportWidth,
        input.viewportHeight,
        { anchor: input.anchor, texturePx: 512 }
      );
      cases.push({
        frameName: current.name,
        squareIndex,
        texturePx: 512,
        tile: {
          translateX: z(tile.translateX),
          translateY: z(tile.translateY),
          rotationDeg: z(tile.rotationDeg),
          scale: z(tile.scale),
        },
      });
    }
  }
  return cases;
}

function contentCases(): ContentCase[] {
  const cases: ContentCase[] = [];
  for (const input of [FRAME_INPUTS[0], FRAME_INPUTS[1], FRAME_INPUTS[3], FRAME_INPUTS[30]]) {
    if (!input) continue;
    const current = frameCase(input);
    for (const counterRotate of [true, false]) {
      for (const cover of [true, false]) {
        const content = contentTransform({ ...current.frame }, { counterRotate, cover });
        cases.push({
          frameName: current.name,
          counterRotate,
          cover,
          content: { rotationDeg: z(content.rotationDeg), scale: z(content.scale) },
        });
      }
    }
  }
  return cases;
}

function buildAll(): Fixture {
  return {
    frames: FRAME_INPUTS.map(frameCase),
    windows: WINDOW_INPUTS.map((input) => ({
      input,
      window: spiralWindow(input.index, input.depth, input.count, {
        holdSteps: input.holdSteps,
        fadeSteps: input.fadeSteps,
      }),
    })),
    trails: TRAIL_CASES,
    eyes: EYE_CASES,
    tiles: tileCases(),
    contents: contentCases(),
  };
}

describe("spiral camera — golden-master fixtures", () => {
  // Bootstrap / regenerate: writes the contract file when missing or when
  // UPDATE_FIXTURES=1 (see `npm run gen:fixtures`). Normal runs only read it.
  if (process.env.UPDATE_FIXTURES || !fs.existsSync(FIXTURE_PATH)) {
    fs.writeFileSync(FIXTURE_PATH, JSON.stringify(buildAll(), null, 2) + "\n");
  }

  const committed: Fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

  test("committed fixtures cover exactly the current case matrix", () => {
    expect(committed.frames.map((f) => f.name)).toEqual(
      FRAME_INPUTS.map((i) => frameCase(i).name)
    );
    expect(committed.windows.map((w) => w.input)).toEqual(WINDOW_INPUTS);
    expect(committed.trails).toHaveLength(TRAIL_CASES.length);
    expect(committed.eyes.map((e) => e.input)).toEqual(EYE_CASES.map((e) => e.input));
  });

  test.each(FRAME_INPUTS.map((input) => [frameCase(input).name, input] as const))(
    "frame %s reproduces the committed fixture",
    (name, input) => {
      const entry = committed.frames.find((f) => f.name === name);
      expect(entry).toBeDefined();
      const current = frameCase(input);
      expect(current.frame).toEqual(entry!.frame);
      expect(current.affine).toEqual(entry!.affine);
    }
  );

  test("windows reproduce the committed fixture", () => {
    for (const entry of committed.windows) {
      expect(
        spiralWindow(entry.input.index, entry.input.depth, entry.input.count, {
          holdSteps: entry.input.holdSteps,
          fadeSteps: entry.input.fadeSteps,
        })
      ).toEqual(entry.window);
    }
  });

  test("trail solves reproduce the committed matrix, and invert", () => {
    for (const entry of committed.trails) {
      expect(trailToRotateDeg(entry.trail, entry.clockwise, entry.count)).toBe(entry.rotate);
      expect(trailForRotation(entry.rotate, entry.clockwise, entry.count)).toBe(entry.trail);
    }
  });

  test("tiles reproduce the committed fixture", () => {
    expect(committed.tiles.length).toBeGreaterThan(0);
    const current = tileCases();
    expect(current).toEqual(committed.tiles);
  });

  test("contents reproduce the committed fixture", () => {
    expect(committed.contents.length).toBeGreaterThan(0);
    expect(contentCases()).toEqual(committed.contents);
  });

  test("eyes reproduce the committed fixture", () => {
    for (const entry of committed.eyes) {
      const layout = generateGoldenGridLayout(
        fib(entry.input.count),
        entry.input.clockwise,
        entry.input.rotate
      );
      expect(spiralEye(layout)).toEqual(entry.eye);
    }
  });
});
