import { placementForRotation, placementForTrail } from "../spiralMode";
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
