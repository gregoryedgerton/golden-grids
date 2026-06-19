import type { RenderModelInput } from "../utils/renderModel";

export interface FixtureCase {
  name: string;
  input: RenderModelInput;
}

/**
 * Golden-master input matrix for `computeRenderModel`. Each entry is rendered to
 * a render model and stored in `render-model.json`, which is the cross-language
 * contract: native (Swift/Kotlin) ports assert against the same fixtures so they
 * cannot drift from this TypeScript source of truth.
 *
 * Covers every branch of computeRenderModel: empty range, single square (±colour),
 * multi-square spirals with/without placeholder, the single-visible-slot placeholder
 * case (fraction = 0.5), all four placements, counter-clockwise, and reversed bounds.
 */
export const FIXTURE_CASES: FixtureCase[] = [
  { name: "empty", input: { from: 0, to: 0 } },
  { name: "single", input: { from: 1, to: 1 } },
  { name: "single-color", input: { from: 1, to: 1, color: "#7f7ec7" } },
  { name: "multi-default", input: { from: 1, to: 4 } },
  { name: "multi-color", input: { from: 1, to: 6, color: "#7f7ec7" } },
  { name: "multi-color-ccw", input: { from: 1, to: 5, color: "#7f7ec7", clockwise: false } },
  { name: "placeholder", input: { from: 3, to: 5 } },
  { name: "placeholder-color", input: { from: 3, to: 7, color: "#7f7ec7" } },
  { name: "placeholder-single-slot", input: { from: 3, to: 3, color: "#7f7ec7" } },
  { name: "placement-right", input: { from: 3, to: 6, placement: "right" } },
  { name: "placement-bottom", input: { from: 3, to: 6, placement: "bottom" } },
  { name: "placement-left", input: { from: 3, to: 6, placement: "left" } },
  { name: "placement-top", input: { from: 3, to: 6, placement: "top" } },
  { name: "reversed-bounds", input: { from: 5, to: 3, color: "#7f7ec7" } },
];
