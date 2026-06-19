import { assignChildren } from "../core/assignChildren";
import type { RenderModel, RenderSlot } from "../utils/renderModel";

const slot = (childIndex: number): RenderSlot => ({
  rect: { left: 0, top: 0, width: 0, height: 0 },
  color: null,
  childIndex,
});

function model(childIndices: number[], placeholder: boolean, kind: RenderModel["kind"] = "grid"): RenderModel {
  return {
    kind,
    aspectRatio: { w: 1, h: 1 },
    slots: childIndices.map(slot),
    placeholder: placeholder ? { rect: { left: 0, top: 0, width: 0, height: 0 }, color: null } : null,
  };
}

describe("assignChildren", () => {
  test("no placeholder: first child fills the largest slot (descending childIndex)", () => {
    const r = assignChildren(model([2, 1, 0], false), ["A", "B", "C"]);
    expect(r.slotChildren).toEqual(["C", "B", "A"]); // slot0=childIndex2="C" … largest slot (last) = "A"
    expect(r.placeholderChild).toBeNull();
  });

  test("placeholder claims the last child; visible slots draw from the rest", () => {
    const r = assignChildren(model([1, 0], true), ["A", "B", "C"]);
    expect(r.placeholderChild).toBe("C");
    expect(r.slotChildren).toEqual(["B", "A"]); // visible = [A,B]; slot0=childIndex1="B"
  });

  test("fewer children than slots: missing slots resolve to null", () => {
    const r = assignChildren(model([2, 1, 0], false), ["A"]);
    expect(r.slotChildren).toEqual([null, null, "A"]); // only the largest slot is filled
  });

  test("empty model: no slot children, no placeholder child", () => {
    const r = assignChildren(model([], false, "empty"), ["A", "B"]);
    expect(r.slotChildren).toEqual([]);
    expect(r.placeholderChild).toBeNull();
  });

  test("single: the one slot takes the first child", () => {
    const r = assignChildren(model([0], false, "single"), ["A", "B"]);
    expect(r.slotChildren).toEqual(["A"]);
    expect(r.placeholderChild).toBeNull();
  });
});
