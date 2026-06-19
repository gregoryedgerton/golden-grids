import * as fs from "fs";
import * as path from "path";
import { computeRenderModel } from "../utils/renderModel";
import type { RenderModel, RenderModelInput } from "../utils/renderModel";
import { FIXTURE_CASES } from "../__fixtures__/cases";

const FIXTURE_PATH = path.join(__dirname, "..", "__fixtures__", "render-model.json");

interface FixtureEntry {
  input: RenderModelInput;
  model: RenderModel;
}

function buildAll(): Record<string, FixtureEntry> {
  const out: Record<string, FixtureEntry> = {};
  for (const c of FIXTURE_CASES) out[c.name] = { input: c.input, model: computeRenderModel(c.input) };
  return out;
}

describe("computeRenderModel — golden-master fixtures", () => {
  // Bootstrap / regenerate: writes the contract file when missing or when
  // UPDATE_FIXTURES=1 (see `npm run gen:fixtures`). Normal runs only read it.
  if (process.env.UPDATE_FIXTURES || !fs.existsSync(FIXTURE_PATH)) {
    fs.writeFileSync(FIXTURE_PATH, JSON.stringify(buildAll(), null, 2) + "\n");
  }

  const committed: Record<string, FixtureEntry> = JSON.parse(
    fs.readFileSync(FIXTURE_PATH, "utf8")
  );

  // Self-contained contract: each entry stores its input and expected model, so
  // native (Swift/Kotlin) ports drive the same cases. Assert the current code
  // reproduces the stored model from the stored input.
  test.each(FIXTURE_CASES.map((c) => c.name))(
    "%s reproduces the committed fixture",
    (name) => {
      const { input, model } = committed[name];
      expect(computeRenderModel(input)).toEqual(model);
    }
  );

  test("committed fixtures cover exactly the known case set", () => {
    expect(Object.keys(committed).sort()).toEqual(
      FIXTURE_CASES.map((c) => c.name).sort()
    );
  });
});

describe("computeRenderModel — behaviour", () => {
  test("degenerate range yields an empty model", () => {
    const m = computeRenderModel({ from: 0, to: 0 });
    expect(m.kind).toBe("empty");
    expect(m.slots).toHaveLength(0);
    expect(m.placeholder).toBeNull();
    expect(m.aspectRatio).toEqual({ w: 1, h: 1 });
  });

  test("single square: one full-bleed slot, square aspect, no placeholder", () => {
    const m = computeRenderModel({ from: 1, to: 1 });
    expect(m.kind).toBe("single");
    expect(m.aspectRatio).toEqual({ w: 1, h: 1 });
    expect(m.slots).toHaveLength(1);
    expect(m.slots[0].rect).toEqual({ left: 0, top: 0, width: 1, height: 1 });
    expect(m.slots[0].childIndex).toBe(0);
    expect(m.slots[0].color).toBeNull();
    expect(m.placeholder).toBeNull();
  });

  test("single square colour resolves to an hsl fill", () => {
    const m = computeRenderModel({ from: 1, to: 1, color: "#7f7ec7" });
    expect(m.slots[0].color).toMatchObject({ kind: "hsl" });
  });

  test("multi without placeholder: slots map largest-to-smallest, no placeholder", () => {
    const m = computeRenderModel({ from: 1, to: 4 });
    expect(m.kind).toBe("grid");
    expect(m.placeholder).toBeNull();
    expect(m.slots).toHaveLength(4);
    // childIndex descends so the first child fills the largest (slot 0) box.
    expect(m.slots.map((s) => s.childIndex)).toEqual([3, 2, 1, 0]);
  });

  test("from > 1 produces a placeholder filled with the raw base colour", () => {
    const m = computeRenderModel({ from: 3, to: 5, color: "#7f7ec7" });
    expect(m.kind).toBe("grid");
    expect(m.placeholder).not.toBeNull();
    expect(m.placeholder!.color).toEqual({ kind: "raw", value: "#7f7ec7" });
  });

  test("placeholder with no colour leaves the fill null", () => {
    const m = computeRenderModel({ from: 3, to: 5 });
    expect(m.placeholder).not.toBeNull();
    expect(m.placeholder!.color).toBeNull();
  });

  test("single visible slot beside a placeholder still gets a colour (fraction 0.5)", () => {
    const m = computeRenderModel({ from: 3, to: 3, color: "#7f7ec7" });
    expect(m.kind).toBe("grid");
    expect(m.slots).toHaveLength(1);
    expect(m.placeholder).not.toBeNull();
    expect(m.slots[0].color).toMatchObject({ kind: "hsl" });
  });

  test("reversed bounds (from > to) equal the normalised order", () => {
    expect(computeRenderModel({ from: 5, to: 3, color: "#7f7ec7" })).toEqual(
      computeRenderModel({ from: 3, to: 5, color: "#7f7ec7" })
    );
  });

  test("all rects are normalised within the unit bounding box", () => {
    const m = computeRenderModel({ from: 1, to: 6, color: "#7f7ec7" });
    for (const s of m.slots) {
      expect(s.rect.left).toBeGreaterThanOrEqual(0);
      expect(s.rect.top).toBeGreaterThanOrEqual(0);
      expect(s.rect.left + s.rect.width).toBeLessThanOrEqual(1 + 1e-9);
      expect(s.rect.top + s.rect.height).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  test("placement changes the layout orientation", () => {
    const right = computeRenderModel({ from: 3, to: 6, placement: "right" });
    const bottom = computeRenderModel({ from: 3, to: 6, placement: "bottom" });
    expect(right).not.toEqual(bottom);
  });
});
