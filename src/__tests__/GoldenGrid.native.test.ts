import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import GoldenGrid from "../native/GoldenGrid";
import { GoldenBox } from "../native/GoldenBox";

// `react-native` resolves to the dev shim (jest moduleNameMapper), so the native
// renderer runs in plain node — no Metro, no simulator. View renders as a host
// element named "View", which react-test-renderer serialises.

// `el`/`r` are typed loosely: @types/react-test-renderer bundles its own
// @types/react (v18) which clashes with this project's v19 at the create()
// boundary. Runtime behaviour is unaffected; we only assert on the JSON tree.
function render(el: any): any {
  let r: any;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r.toJSON();
}

describe("GoldenGrid (native)", () => {
  test("empty range renders a bare View", () => {
    const t = render(React.createElement(GoldenGrid, { from: 0, to: 0 }));
    expect(t.type).toBe("View");
    expect(t.children).toBeNull();
  });

  test("single square: square aspect, one absolute child with an hsl fill", () => {
    const t = render(React.createElement(GoldenGrid, { from: 1, to: 1, color: "#7f7ec7" }));
    expect(t.props.style.aspectRatio).toBe(1);
    const inner = t.children[0];
    expect(inner.props.style.position).toBe("absolute");
    expect(inner.props.style.backgroundColor).toMatch(/^hsl\(/);
  });

  test("grid aspect ratio is numeric and slots are percent-positioned", () => {
    const t = render(React.createElement(GoldenGrid, { from: 1, to: 4, color: "#7f7ec7" }));
    expect(typeof t.props.style.aspectRatio).toBe("number");
    expect(t.props.style.aspectRatio).toBeGreaterThan(0);
    for (const child of t.children) {
      expect(typeof child.props.style.left).toBe("string");
      expect(child.props.style.left).toMatch(/%$/);
    }
  });

  test("placeholder adds one extra View (from > 1)", () => {
    const withPh = render(React.createElement(GoldenGrid, { from: 3, to: 6, color: "#7f7ec7" }));
    const noPh = render(React.createElement(GoldenGrid, { from: 1, to: 4 }));
    expect(withPh.children).toHaveLength(5); // placeholder + 4 slots
    expect(noPh.children).toHaveLength(4); // 4 slots
  });

  test("no colour ⇒ no backgroundColor on slots", () => {
    const t = render(React.createElement(GoldenGrid, { from: 1, to: 4 }));
    for (const child of t.children) {
      expect(child.props.style.backgroundColor).toBeUndefined();
    }
  });

  test("outline parses into split RN border props", () => {
    const t = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline: "2px solid #000000" }));
    expect(t.props.style.borderStyle).toBe("solid");
    expect(t.props.style.borderTopWidth).toBe(2);
    expect(t.props.style.borderTopColor).toBe("#000000");
    const child = t.children[0];
    expect(child.props.style.borderStyle).toBe("solid");
    expect(child.props.style.borderRightWidth).toBe(2);
    expect(child.props.style.borderBottomColor).toBe("#000000");
  });

  test("dashed/dotted outline styles are preserved (mirrors web)", () => {
    const dashed = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline: "2px dashed #000000" }));
    expect(dashed.props.style.borderStyle).toBe("dashed");
    expect(dashed.children[0].props.style.borderStyle).toBe("dashed");

    const dotted = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline: "1px dotted #ff0000" }));
    expect(dotted.props.style.borderStyle).toBe("dotted");
    expect(dotted.children[0].props.style.borderStyle).toBe("dotted");
  });

  test("outline tokens are order-independent (CSS shorthand)", () => {
    for (const outline of ["2px solid #000000", "solid 2px #000000", "#000000 2px solid"]) {
      const t = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline }));
      expect(t.props.style.borderStyle).toBe("solid");
      expect(t.props.style.borderTopWidth).toBe(2);
      expect(t.props.style.borderTopColor).toBe("#000000");
    }
    // style token in a non-leading position is still honoured
    const dashed = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline: "2px #000000 dashed" }));
    expect(dashed.props.style.borderStyle).toBe("dashed");
    expect(dashed.props.style.borderTopColor).toBe("#000000");
  });

  test("functional colours with spaces survive parsing", () => {
    const t = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline: "2px solid rgb(0, 0, 0)" }));
    expect(t.props.style.borderTopColor).toBe("rgb(0, 0, 0)");
    expect(t.props.style.borderTopWidth).toBe(2);
    expect(t.props.style.borderStyle).toBe("solid");
  });

  test("container gets an explicit width so it doesn't collapse in non-stretching parents", () => {
    const grid = render(React.createElement(GoldenGrid, { from: 1, to: 4 }));
    expect(grid.props.style.width).toBe("100%");
    const single = render(React.createElement(GoldenGrid, { from: 1, to: 1 }));
    expect(single.props.style.width).toBe("100%");
  });

  test("none/hidden outline styles draw no border (mirrors web)", () => {
    for (const outline of ["2px none #000000", "2px hidden #000000"]) {
      const t = render(React.createElement(GoldenGrid, { from: 1, to: 4, outline }));
      expect(t.props.style.borderTopWidth).toBeUndefined();
      expect(t.props.style.borderStyle).toBeUndefined();
      expect(t.children[0].props.style.borderRightWidth).toBeUndefined();
    }
  });

  test("first child fills the largest slot (largest-to-smallest)", () => {
    const boxes = ["0", "1", "2", "3"].map((txt, i) =>
      React.createElement(GoldenBox, { key: i }, txt)
    );
    const t = render(React.createElement(GoldenGrid, { from: 1, to: 4 }, ...boxes));
    // slot i (0 = smallest square … last = largest) receives child (count-1-i)
    const texts = t.children.map((slotView: any) => slotView.children?.[0]?.children?.[0] ?? null);
    expect(texts).toEqual(["3", "2", "1", "0"]); // largest slot (last) holds the first child "0"
  });
});
