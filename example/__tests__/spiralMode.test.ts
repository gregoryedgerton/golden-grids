import { fillsForSpiral, placementForRotation, placementForTrail } from "../spiralMode";
import { computeRenderModel } from "../../src/utils/renderModel";
import { hslToCss } from "../../src/utils/colorUtils";
import { edgeExposed, labelFor } from "../SpiralStage";
import { generateGoldenGridLayout } from "../../src/utils/gridGenerator";
import { placementToRotateDeg } from "../../src/utils/gridGenerator";
import { trailToRotateDeg } from "../../src/utils/spiralCamera";
import type { SpiralTrail } from "../../src/utils/spiralCamera";

const PLACEMENTS = ["right", "bottom", "left", "top"] as const;
const TRAILS: SpiralTrail[] = ["right", "bottom", "left", "top"];

describe("placementForRotation", () => {
  it("inverts placementToRotateDeg for every placement, handedness and start", () => {
    for (const clockwise of [true, false]) {
      for (const startIdx of [0, 1, 2, 3, 4, 5]) {
        for (const placement of PLACEMENTS) {
          const rotate = placementToRotateDeg(placement, clockwise, startIdx);
          expect(placementForRotation(rotate, clockwise, startIdx)).toBe(placement);
        }
      }
    }
  });

  it("throws on a rotation no placement produces", () => {
    expect(() => placementForRotation(45, true, 0)).toThrow(/No placement/);
  });
});

describe("placementForTrail", () => {
  it("derives the placement whose rotation IS the trail solve", () => {
    // The whole point of the derivation: the exported flat grid must carry
    // exactly the rotation the dial showed.
    for (const clockwise of [true, false]) {
      for (const squareCount of [4, 7, 15]) {
        for (const startIdx of [0, 2]) {
          for (const trail of TRAILS) {
            const placement = placementForTrail(trail, clockwise, squareCount, startIdx);
            expect(placementToRotateDeg(placement, clockwise, startIdx)).toBe(
              trailToRotateDeg(trail, clockwise, squareCount)
            );
          }
        }
      }
    }
  });

});

describe("labelFor", () => {
  it("labels largest = 1 descending when nothing is skipped, like the flat grid", () => {
    // 4 squares, smallest-first indexes: largest (index 3) carries I.
    expect(labelFor(3, 4, 0)).toBe(1);
    expect(labelFor(0, 4, 0)).toBe(4);
  });

  it("uses the ascending-with-placeholder order when the range skips", () => {
    // Flat mode: placeholder = 1, smallest visible = 2, … largest = boxCount.
    // startIdx 2 of 6: visible indexes 2..5 carry 2..5.
    expect(labelFor(2, 6, 2)).toBe(2);
    expect(labelFor(5, 6, 2)).toBe(5);
  });

});

describe("fillsForSpiral", () => {
  it("carries the flat renderer's exact slot colours onto the layout squares", () => {
    const model = computeRenderModel({ from: 1, to: 4, color: "#7f7ec7", clockwise: true, placement: "right" });
    const fills = fillsForSpiral(1, 4, "#7f7ec7", true, "right", model.slots.length, 0);
    model.slots.forEach((slot, i) => {
      const c = slot.color;
      expect(c && c.kind === "hsl" ? hslToCss(c.h, c.s, c.l) : undefined).toBe(fills[i]);
    });
  });

  it("paints the skipped range with the placeholder's fill", () => {
    // from index 3: layout has leading skipped squares; the flat renderer
    // paints the placeholder with the raw base colour.
    const model = computeRenderModel({ from: 3, to: 6, color: "#7f7ec7", clockwise: true, placement: "right" });
    const count = model.slots.length + 2; // two skipped leading squares (1, 1)
    const fills = fillsForSpiral(3, 6, "#7f7ec7", true, "right", count, 2);
    expect(fills[0]).toBe("#7f7ec7");
    expect(fills[1]).toBe("#7f7ec7");
    model.slots.forEach((slot, i) => {
      const c = slot.color;
      expect(c && c.kind === "hsl" ? hslToCss(c.h, c.s, c.l) : undefined).toBe(fills[2 + i]);
    });
  });

  it("returns no fills when colour is off", () => {
    expect(fillsForSpiral(1, 4, undefined, true, "right", 4, 0)).toEqual([
      undefined, undefined, undefined, undefined,
    ]);
  });

});

describe("edgeExposed", () => {
  const fib = [1, 1, 2, 3, 5];
  const layout = generateGoldenGridLayout(fib, true, 0);
  const all = layout.squares.map(() => true);

  it("leaves interior top/left edges to their rendered owners", () => {
    // Every square rendered: only boundary edges need their own line —
    // matching the flat renderer exactly.
    for (let index = 0; index < layout.squares.length; index += 1) {
      const square = layout.squares[index];
      expect(edgeExposed(layout, all, index, "top")).toBe(
        !layout.squares.some(
          (other, i) =>
            i !== index &&
            other.y + other.size === square.y &&
            other.x < square.x + square.size &&
            other.x + other.size > square.x,
        ),
      );
    }
  });

  it("paints an edge whose owning neighbour the window hid", () => {
    // Find a square with a neighbour above, hide that neighbour, and the
    // edge must become the visible square's own.
    const index = layout.squares.findIndex((square) =>
      layout.squares.some(
        (other, i) =>
          i !== layout.squares.indexOf(square) &&
          other.y + other.size === square.y &&
          other.x < square.x + square.size &&
          other.x + other.size > square.x,
      ),
    );
    expect(index).toBeGreaterThanOrEqual(0);
    const square = layout.squares[index];
    const rendered = layout.squares.map(
      (other, i) =>
        !(
          i !== index &&
          other.y + other.size === square.y &&
          other.x < square.x + square.size &&
          other.x + other.size > square.x
        ),
    );
    expect(edgeExposed(layout, all, index, "top")).toBe(false);
    expect(edgeExposed(layout, rendered, index, "top")).toBe(true);
  });
});