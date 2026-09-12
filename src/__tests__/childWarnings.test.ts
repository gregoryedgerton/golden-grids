import React from "react";
import TestRenderer from "react-test-renderer";
import WebGrid from "../components/GoldenGrid";
import { GoldenBox as WebBox } from "../components/GoldenBox";
import NativeGrid from "../native/GoldenGrid";
import { GoldenBox as NativeBox } from "../native/GoldenBox";

jest.mock("../styles/grid.css", () => ({}));

const renderers: [string, React.ComponentType<any>, React.ComponentType<any>][] = [
  ["web", WebGrid, WebBox],
  ["native", NativeGrid, NativeBox],
];

describe.each(renderers)("%s child warnings", (_platform, Grid, Box) => {
  let warn: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => {
    process.env.NODE_ENV = "development";
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
  });

  function render(children: React.ReactNode) {
    return TestRenderer.create(React.createElement(Grid, { from: 1, to: 1 }, children) as any);
  }

  test("names discarded children once while retaining valid boxes", () => {
    function Wrapper() { return React.createElement(Box, null, "wrapped"); }
    const invalid = [React.createElement("div", { key: "d" }),
      React.createElement(React.Fragment, { key: "f" }, React.createElement(Box)),
      React.createElement(Wrapper, { key: "w" }), "text", 42];
    const tree = render([...invalid, React.createElement(Box, { key: "valid" }, "kept")]);
    expect(warn).toHaveBeenCalledTimes(1);
    for (const name of ["div", "React.Fragment", "Wrapper", "string", "number"])
      expect(warn.mock.calls[0][0]).toContain(name);
    expect(JSON.stringify(tree.toJSON())).toContain("kept");
    expect(JSON.stringify(tree.toJSON())).not.toContain("wrapped");
    tree.unmount();
  });

  test("production stays silent and renders the same tree", () => {
    const children = [React.createElement("div", { key: "d" }), React.createElement(Box, { key: "b" }, "kept")];
    const development = render(children);
    warn.mockClear();
    process.env.NODE_ENV = "production";
    const production = render(children);
    expect(warn).not.toHaveBeenCalled();
    expect(production.toJSON()).toEqual(development.toJSON());
    development.unmount();
    production.unmount();
  });

  test("uses display names and identifies anonymous wrappers once on each render", () => {
    const Named = () => null;
    Named.displayName = "NamedWrapper";
    const Anonymous = React.memo(() => null);
    const children = [React.createElement(Named, { key: "named" }), React.createElement(Anonymous, { key: "anon" })];
    const tree = render(children);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("NamedWrapper");
    expect(warn.mock.calls[0][0]).toContain("anonymous component");
    tree.update(React.createElement(Grid, { from: 1, to: 1 }, children) as any);
    expect(warn).toHaveBeenCalledTimes(2);
    tree.unmount();
  });

  test("extra boxes and empty conditional children stay quiet", () => {
    const tree = render([null, false, undefined, React.createElement(Box, { key: "1" }), React.createElement(Box, { key: "2" })]);
    expect(warn).not.toHaveBeenCalled();
    tree.unmount();
  });
});
