# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

`@gifcommit/golden-grids` is an npm library that gives developers a **golden-ratio grid layout system for building websites**. A consumer installs the package, configures a grid via props, and uses the generated proportional boxes as layout areas to place their own content into.

The spiral grid is the product — not a visualisation tool. The `<div>` boxes that `GoldenGrid` renders are the slots a consuming site maps its content into.

## Consumer workflow

```bash
npm install @gifcommit/golden-grids
```

```tsx
import { GoldenGrid, GoldenBox } from '@gifcommit/golden-grids'
// CSS is auto-injected — no separate import needed

// Transparent layout slots:
<GoldenGrid from={1} to={5} />

// With HSL color progression:
<GoldenGrid from={1} to={5} color="#7f7ec7" clockwise={true} placement="right" />

// With outline (CSS border shorthand — no double borders on shared edges):
<GoldenGrid from={1} to={5} color="#7f7ec7" outline="2px solid #000000" />

// Compound component — children map largest-to-smallest (priority order):
<GoldenGrid from={3} to={5} color="#7f7ec7">
  <GoldenBox placeholder><p>Fills the skipped-range placeholder area</p></GoldenBox>
  <GoldenBox><h1>Largest visible slot</h1></GoldenBox>
  <GoldenBox><p>Smallest visible slot</p></GoldenBox>
</GoldenGrid>
```

`GoldenGridProps`:

```ts
{
  from?: number;              // FIB_STOPS start index (1–78), default 1
  to?: number;                // FIB_STOPS end index (1–78), default 4
  color?: string;             // Hex base color — presence = HSL progression, absence = transparent
  outline?: string;           // CSS border shorthand e.g. "2px solid #000000"
  clockwise?: boolean;        // Spiral direction, default true
  placement?: PlacementValue; // Starting orientation, default "right"
  children?: React.ReactNode; // GoldenBox children map largest-to-smallest — first child fills the largest box
}
```

Exported from the library: `GoldenGrid`, `GoldenGridProps`, `GoldenBox`, `GoldenBoxProps`, `generateGoldenGridLayout` (raw coordinates for non-React use cases), and types `Square`, `GridLayout`, `PlacementValue`.

`GridProvider`, `useGrid`, `InputControlType`, `generateGridHTML`, `FIB_STOPS`, and `getGridRange` are **not exported** — they are demo-only internals.

## Commands

```bash
npm run dev          # Start dev server / interactive demo (port 5173)
npm run build        # Build library to /dist/
npm run build:demo   # Build demo site to /dist-demo/ (GitHub Pages)
npm test             # Run Jest tests
npm run setup        # Install Husky git hooks (run once after cloning)
```

`npm run build` runs automatically via `prepare` on install and before `npm publish`. `prepublishOnly` runs tests before every publish.

## Publishing

Package is published to npm as `@gifcommit/golden-grids`. Publishing is triggered by creating a GitHub Release — see `.github/workflows/publish.yml`. Requires `NPM_TOKEN` set as a GitHub Actions secret. Uses semantic-release — a `feat!` commit with `BREAKING CHANGE:` footer triggers a major version bump.

## Architecture

### Repo structure

Library and demo are fully separated:

- **Library** (`src/` → `dist/`) — what consumers install from npm. No knowledge of the demo.
- **Demo app** (`example/` → `dist-demo/`) — interactive playground deployed to GitHub Pages. Imports `GoldenGrid`/`GoldenBox` from `@gifcommit/golden-grids`, and imports demo utilities directly from `../src/utils/*` (via Vite alias) rather than through the public API.

Vite switches between them via `VITE_BUILD_DEMO=1` (see `vite.config.ts`). A resolve alias maps `@gifcommit/golden-grids` → `src/index.ts` during dev and demo builds. `tsconfig.json` mirrors this via `paths` for IDE support.

### How the grid is generated

1. `from`/`to` indices are looked up in `FIB_STOPS` (79 pre-calculated Fibonacci values) via `getGridRange()` in `fibonacci.ts`
2. The full Fibonacci sequence up to the max value is computed via `fullFibonacciUpTo()`
3. `generateGoldenGridLayout()` in `gridGenerator.ts` places squares sequentially — first two explicitly, then each subsequent square flush against the current bounding box, cycling through 4 directions (CW or CCW). Rotation is applied as an integer coordinate transform. Coordinates are normalized to remove negative offsets.
4. `GoldenGrid` renders declarative JSX — a relative `<div class="golden-grid">` containing absolutely-positioned `<div class="golden-grid__box">` slots at percentage coordinates. If `color` is provided, an HSL progression is applied across slots. If `outline` is provided, borders are applied (right+bottom per box, top+left on the container) so shared edges never double up.
5. When `from > 1`, skipped leading squares are collapsed into a single placeholder `<div class="golden-grid__box golden-grid__box--placeholder">` to preserve spiral proportions
6. `GoldenBox` children map into slots in priority order — first child fills the largest (most prominent) box, last child fills the smallest. When `from > 1`, the first `<GoldenBox>` fills the skipped-range placeholder; remaining children map largest-to-smallest across visible slots. Extra children beyond the slot count are silently ignored.

### CSS strategy

There are three layers of CSS — only the first is "externalizable":

1. **`src/styles/grid.css`** — 5 structural rules (`position: relative`, `position: absolute`, `box-sizing`). Auto-injected into `<head>` at runtime via `vite-plugin-css-injected-by-js`. No separate CSS import needed.
2. **Inline `style=` attributes** — all slot positioning (`left`, `top`, `width`, `height`, `aspectRatio`, `background`, borders) are computed at render time from Fibonacci coordinates and user props. These cannot be externalized; they are inherently dynamic. This is standard practice for computed-layout libraries.
3. **`<style>` block in `generateGridHTML()`** — the demo's HTML export tool embeds structural CSS inline so the exported file is fully self-contained. This is correct by design and unrelated to the library's CSS strategy.

A dual CSS approach (injected + separate `dist/style.css`) was considered and rejected: the static CSS is trivially small and the dynamic inline styles can't be moved to a stylesheet anyway, so the complexity buys nothing.

### Key files

| File                              | Role                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `src/utils/fibonacci.ts`          | `FIB_STOPS`, `getGridRange()`, `fullFibonacciUpTo()` — internal, not exported    |
| `src/utils/gridGenerator.ts`      | Spiral layout algorithm — `generateGoldenGridLayout` is exported                 |
| `src/components/GoldenGrid.tsx`   | Main React component — declarative JSX, child mapping, color + outline logic     |
| `src/components/GoldenBox.tsx`    | Slot marker component — fills 100%×100% of its positioned parent                 |
| `src/utils/colorUtils.ts`         | `hexToHsl()`, `hslToCss()` — internal, not exported                              |
| `src/styles/grid.css`             | Library CSS — injected automatically by the bundler                               |
| `example/GridContext.tsx`         | Demo-only `GridProvider` + `useGrid()` hook + `InputControlType`                 |
| `example/exportGrid.ts`           | Demo-only — generates a self-contained HTML string for the export modal           |
| `example/index.tsx`               | Demo app — mad-lib UI, export modal, label cycle                                  |
| `example/golden-grid.css`         | Demo-only styles — not part of the distributed library                            |
| `src/__tests__/`                  | Library unit tests — 100% statement/branch/function/line coverage                 |
| `example/__tests__/`              | Demo unit tests — `exportGrid` and `GridContext` validation                       |
