import * as fs from "fs";
import * as path from "path";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import {
  spiralCamera,
  spiralEye,
  spiralWindow,
  trailForRotation,
  trailToRotateDeg,
} from "../utils/spiralCamera";
import type {
  SpiralCameraFrame,
  SpiralTrail,
  SpiralWindow,
} from "../utils/spiralCamera";

const FIXTURE_PATH = path.join(__dirname, "..", "__fixtures__", "spiral-camera.json");

/**
 * Golden-master fixtures for the spiral camera — the cross-language contract
 * the Swift (Sources/GoldenGrids/SpiralCamera.swift) and Kotlin
 * (android/core SpiralCamera.kt) ports assert against, exactly as
 * render-model.json anchors computeRenderModel. Each entry stores its full
 * input so the ports drive the same cases; numbers compare within 1e-9.
 *
 * Layouts are reconstructed from (fibCount, clockwise, rotate) via
 * generateGoldenGridLayout, so the camera fixtures also exercise the layout
 * ports. Options omitted from an input pin the DEFAULT on every platform
 * (fillRatio 0.62, clockwise true, holdSteps 1, fadeSteps 2.5).
 */

const fib = (n: number): number[] => {
  const seq = [1, 1];
  while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  return seq;
};

interface CameraInput {
  fibCount: number;
  clockwise: boolean;
  rotate: number;
  depth: number;
  viewportWidth: number;
  viewportHeight: number;
  fillRatio?: number;
}

interface WindowInput {
  index: number;
  depth: number;
  squareCount: number;
  holdSteps?: number;
  fadeSteps?: number;
}

interface TrailInput {
  trail: SpiralTrail;
  clockwise: boolean;
  squareCount: number;
}

interface EyeInput {
  fibCount: number;
  clockwise: boolean;
  rotate: number;
}

const CAMERA_CASES: { name: string; input: CameraInput }[] = [
  { name: "shallow-default-fill", input: { fibCount: 7, clockwise: true, rotate: 0, depth: 0, viewportWidth: 1024, viewportHeight: 768 } },
  { name: "fractional-depth", input: { fibCount: 7, clockwise: true, rotate: 0, depth: 1.25, viewportWidth: 1024, viewportHeight: 768, fillRatio: 0.62 } },
  { name: "rotated-portrait", input: { fibCount: 7, clockwise: true, rotate: 90, depth: 3.5, viewportWidth: 390, viewportHeight: 844, fillRatio: 0.5 } },
  { name: "deepest-square", input: { fibCount: 15, clockwise: true, rotate: 180, depth: 14, viewportWidth: 1200, viewportHeight: 800 } },
  { name: "counter-clockwise", input: { fibCount: 7, clockwise: false, rotate: 270, depth: 2.75, viewportWidth: 800, viewportHeight: 800 } },
  { name: "full-bleed", input: { fibCount: 5, clockwise: true, rotate: 0, depth: 4, viewportWidth: 500, viewportHeight: 900, fillRatio: 1 } },
];

const WINDOW_CASES: { name: string; input: WindowInput }[] = [
  { name: "focused-default", input: { index: 6, depth: 0, squareCount: 7 } },
  { name: "mid-fade", input: { index: 4, depth: 0, squareCount: 7 } },
  { name: "hidden", input: { index: 0, depth: 0, squareCount: 7 } },
  { name: "fractional-focus", input: { index: 3, depth: 3.2, squareCount: 7 } },
  { name: "custom-window", input: { index: 2, depth: 1.5, squareCount: 7, holdSteps: 0.5, fadeSteps: 3 } },
];

const TRAIL_CASES: TrailInput[] = (["right", "bottom", "left", "top"] as SpiralTrail[]).flatMap(
  (trail) =>
    [true, false].flatMap((clockwise) =>
      [2, 3, 5, 8, 15].map((squareCount) => ({ trail, clockwise, squareCount }))
    )
);

const EYE_CASES: { name: string; input: EyeInput }[] = [
  { name: "clockwise-flat", input: { fibCount: 10, clockwise: true, rotate: 0 } },
  { name: "counter-clockwise-rotated", input: { fibCount: 8, clockwise: false, rotate: 90 } },
];

interface Fixture {
  camera: { name: string; input: CameraInput; frame: SpiralCameraFrame }[];
  window: { name: string; input: WindowInput; window: SpiralWindow }[];
  trail: { input: TrailInput; rotateDeg: number }[];
  eye: { name: string; input: EyeInput; eye: { x: number; y: number } }[];
}

const runCamera = (input: CameraInput): SpiralCameraFrame =>
  spiralCamera(
    generateGoldenGridLayout(fib(input.fibCount), input.clockwise, input.rotate),
    input.depth,
    input.viewportWidth,
    input.viewportHeight,
    input.fillRatio === undefined
      ? { clockwise: input.clockwise }
      : { clockwise: input.clockwise, fillRatio: input.fillRatio }
  );

const runWindow = (input: WindowInput): SpiralWindow =>
  spiralWindow(
    input.index,
    input.depth,
    input.squareCount,
    input.holdSteps === undefined && input.fadeSteps === undefined
      ? {}
      : { holdSteps: input.holdSteps, fadeSteps: input.fadeSteps }
  );

const runEye = (input: EyeInput): { x: number; y: number } =>
  spiralEye(generateGoldenGridLayout(fib(input.fibCount), input.clockwise, input.rotate));

function buildAll(): Fixture {
  return {
    camera: CAMERA_CASES.map((c) => ({ ...c, frame: runCamera(c.input) })),
    window: WINDOW_CASES.map((c) => ({ ...c, window: runWindow(c.input) })),
    trail: TRAIL_CASES.map((input) => ({
      input,
      rotateDeg: trailToRotateDeg(input.trail, input.clockwise, input.squareCount),
    })),
    eye: EYE_CASES.map((c) => ({ ...c, eye: runEye(c.input) })),
  };
}

describe("spiral camera — golden-master fixtures", () => {
  // Bootstrap / regenerate: writes the contract file when missing or when
  // UPDATE_FIXTURES=1 (see `npm run gen:fixtures`). Normal runs only read it.
  if (process.env.UPDATE_FIXTURES || !fs.existsSync(FIXTURE_PATH)) {
    fs.writeFileSync(FIXTURE_PATH, JSON.stringify(buildAll(), null, 2) + "\n");
  }

  const committed: Fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

  test.each(CAMERA_CASES)("camera: $name reproduces the committed frame", (c) => {
    const entry = committed.camera.find((e) => e.name === c.name);
    expect(entry).toBeDefined();
    expect(entry!.input).toEqual(c.input);
    expect(runCamera(entry!.input)).toEqual(entry!.frame);
  });

  test.each(WINDOW_CASES)("window: $name reproduces the committed window", (c) => {
    const entry = committed.window.find((e) => e.name === c.name);
    expect(entry).toBeDefined();
    expect(entry!.input).toEqual(c.input);
    expect(runWindow(entry!.input)).toEqual(entry!.window);
  });

  test("trail: every committed solve reproduces and round-trips", () => {
    expect(committed.trail).toHaveLength(TRAIL_CASES.length);
    for (const { input, rotateDeg } of committed.trail) {
      expect(trailToRotateDeg(input.trail, input.clockwise, input.squareCount)).toBe(rotateDeg);
      expect(trailForRotation(rotateDeg, input.clockwise, input.squareCount)).toBe(input.trail);
    }
  });

  test.each(EYE_CASES)("eye: $name reproduces the committed point", (c) => {
    const entry = committed.eye.find((e) => e.name === c.name);
    expect(entry).toBeDefined();
    expect(entry!.input).toEqual(c.input);
    expect(runEye(entry!.input)).toEqual(entry!.eye);
  });

  test("committed fixtures cover exactly the known case sets", () => {
    expect(committed.camera.map((c) => c.name).sort()).toEqual(
      CAMERA_CASES.map((c) => c.name).sort()
    );
    expect(committed.window.map((c) => c.name).sort()).toEqual(
      WINDOW_CASES.map((c) => c.name).sort()
    );
    expect(committed.eye.map((c) => c.name).sort()).toEqual(
      EYE_CASES.map((c) => c.name).sort()
    );
  });
});
