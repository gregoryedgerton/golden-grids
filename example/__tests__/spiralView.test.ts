import { placementForRotation, buildSpiralStage } from "../spiralView";
import { generateGoldenGridLayout, placementToRotateDeg } from "../../src/utils/gridGenerator";
import { spiralCamera, trailToRotateDeg } from "../../src/utils/spiralCamera";
import type { PlacementValue } from "../../src/utils/renderModel";

const fib = (n: number): number[] => {
  const seq = [1, 1];
  while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  return seq;
};

describe("placementForRotation", () => {
  test("inverts placementToRotateDeg for every placement, handedness and start index", () => {
    const placements: PlacementValue[] = ["right", "bottom", "left", "top"];
    for (const placement of placements) {
      for (const clockwise of [true, false]) {
        for (let startIdx = 0; startIdx <= 6; startIdx++) {
          const rot = placementToRotateDeg(placement, clockwise, startIdx);
          expect(placementForRotation(rot, clockwise, startIdx)).toBe(placement);
        }
      }
    }
  });

  test("resolves a trail-solved rotation to a renderable placement", () => {
    // The spiral view's actual pipeline: solve the rotation for a trail side,
    // then find the placement that makes <GoldenGrid> build that same layout.
    for (const count of [2, 5, 15]) {
      const rot = trailToRotateDeg("bottom", true, count);
      const placement = placementForRotation(rot, true, 0);
      expect(placementToRotateDeg(placement, true, 0)).toBe(rot);
    }
  });

  test("normalises rotations outside [0, 360)", () => {
    expect(placementForRotation(360, true, 0)).toBe(placementForRotation(0, true, 0));
    expect(placementForRotation(-90, true, 0)).toBe(placementForRotation(270, true, 0));
  });
});

describe("buildSpiralStage", () => {
  test("normalises the layout to a zero origin", () => {
    const stage = buildSpiralStage(fib(10), true, 0);
    expect(stage.minX).toBe(0);
    expect(stage.minY).toBe(0);
    expect(Math.min(...stage.squares.map((s) => s.x))).toBeCloseTo(0, 9);
    expect(Math.min(...stage.squares.map((s) => s.y))).toBeCloseTo(0, 9);
  });

  test("scales the long side to the target while preserving the aspect ratio", () => {
    const raw = generateGoldenGridLayout(fib(10), true, 0);
    const stage = buildSpiralStage(fib(10), true, 0, 500);
    expect(Math.max(stage.width, stage.height)).toBeCloseTo(500, 9);
    expect(stage.width / stage.height).toBeCloseTo(raw.width / raw.height, 9);
  });

  test("keeps square proportions relative to the stage", () => {
    const raw = generateGoldenGridLayout(fib(8), true, 90);
    const stage = buildSpiralStage(fib(8), true, 90, 800);
    raw.squares.forEach((sq, i) => {
      expect(stage.squares[i].size / stage.width).toBeCloseTo(sq.size / raw.width, 9);
    });
  });

  test("produces a stage the camera accepts at every whole depth", () => {
    const stage = buildSpiralStage(fib(7), true, 180);
    for (let depth = 0; depth <= 6; depth++) {
      const frame = spiralCamera(stage, depth, 1200, 800);
      expect(Number.isFinite(frame.scale)).toBe(true);
      expect(frame.scale).toBeGreaterThan(0);
    }
  });

  test("tames a deep range that would otherwise overflow the browser", () => {
    // to = 30 → layout units in the hundreds of thousands; the stage keeps
    // CSS pixel coordinates at the target size.
    const stage = buildSpiralStage(fib(30), true, 0, 1024);
    expect(Math.max(stage.width, stage.height)).toBeCloseTo(1024, 6);
  });
});
