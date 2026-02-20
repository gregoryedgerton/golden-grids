# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

`@gifcommit/golden-grids` is an npm library that gives developers a **golden-ratio grid layout system for building websites**. A consumer installs the package, configures a grid (via props or a JSON config file), and uses the generated proportional boxes as layout areas to place their own content into.

The spiral grid is the product — not a visualisation tool. The `<div>` boxes that `GoldenGrid` renders are the slots a consuming site maps its content into.

## Consumer workflow

```bash
npm install @gifcommit/golden-grids
```

```tsx
import { GoldenGrid, GoldenBox, GridProvider } from '@gifcommit/golden-grids'
// CSS is auto-injected — no separate import needed

// Transparent layout slots:
<GoldenGrid from={1} to={5} />

// With HSL color progression:
<GoldenGrid from={1} to={5} color="#7f7ec7" clockwise={true} placement="right" />

// With outline (CSS border shorthand — no double borders on shared edges):
<GoldenGrid from={1} to={5} color="#7f7ec7" outline="2px solid #000000" />

// Compound component — map consumer content into grid slots:
<GoldenGrid from={3} to={5} color="#7f7ec7">
  <GoldenBox placeholder><p>Fills the skipped-range placeholder area</p></GoldenBox>
  <GoldenBox><h1>First visible slot</h1></GoldenBox>
  <GoldenBox><p>Second visible slot</p></GoldenBox>
</GoldenGrid>

// With provider for dynamic/interactive control:
<GridProvider initialConfig={myConfig}>
  <GoldenGrid />
</GridProvider>
```

`GoldenGridProps`:

```ts
{
  from?: number;              // FIB_STOPS start index (1–78)
  to?: number;                // FIB_STOPS end index (1–78)
  color?: string;             // Hex base color — presence = HSL progression, absence = transparent
  outline?: string;           // CSS border shorthand e.g. "2px solid #000000"
  clockwise?: boolean;        // Spiral direction
  placement?: "right" | "bottom" | "left" | "top"; // Starting orientation
  children?: React.ReactNode; // GoldenBox children map to grid slots in order
}
```

`InputControlType` is the context/provider config schema (all fields required):

```ts
{
  from: number;       // FIB_STOPS start index (1–78)
  to: number;         // FIB_STOPS end index (1–78)
  color: string;      // Hex base color
  clockwise: boolean;   // Spiral direction
  placement: PlacementValue; // Starting orientation — "right" | "bottom" | "left" | "top"
}
```

Also exported: `GoldenBox`, `GoldenBoxProps`, `generateGoldenGridLayout` (raw coordinates), `generateGridHTML` (standalone HTML string), `FIB_STOPS` (array of 79 pre-calculated values), `getGridRange` (range resolver), `useGrid`, and types `Square`, `GridLayout`, `InputControlType`, `PlacementValue`.

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

Package is published to npm as `@gifcommit/golden-grids`. Publishing is triggered by creating a GitHub Release — see `.github/workflows/publish.yml`. Requires `NPM_TOKEN` set as a GitHub Actions secret.

## Architecture

### Repo structure

Library and demo are fully separated:

- **Library** (`src/` → `dist/`) — what consumers install from npm. No knowledge of the demo.
- **Demo app** (`example/` → `dist-demo/`) — interactive playground deployed to GitHub Pages. Imports only from `@gifcommit/golden-grids` exactly as a real consumer would.

Vite switches between them via `VITE_BUILD_DEMO=1` (see `vite.config.ts`). A resolve alias maps `@gifcommit/golden-grids` → `src/index.ts` during dev and demo builds. `tsconfig.json` mirrors this via `paths` for IDE support.

### How the grid is generated

1. `from`/`to` indices are looked up in `FIB_STOPS` (79 pre-calculated Fibonacci values) via `getGridRange()` in `fibonacci.ts`
2. The full Fibonacci sequence up to the max value is computed via `fullFibonacciUpTo()`
3. `generateGoldenGridLayout()` in `gridGenerator.ts` places squares sequentially — first two explicitly, then each subsequent square flush against the current bounding box, cycling through 4 directions (CW or CCW). Rotation is applied as an integer coordinate transform. Coordinates are normalized to remove negative offsets.
4. `GoldenGrid` renders declarative JSX — a relative `<div class="golden-grid">` containing absolutely-positioned `<div class="golden-grid__box">` slots at percentage coordinates. If `color` is provided, an HSL progression is applied across slots. If `outline` is provided, borders are applied (right+bottom per box, top+left on the container) so shared edges never double up.
5. When `from > 1`, skipped leading squares are collapsed into a single placeholder `<div class="golden-grid__box golden-grid__box--placeholder">` to preserve spiral proportions
6. `GoldenBox` children map into slots in order. A `<GoldenBox placeholder>` targets the placeholder slot. Extra children beyond the visible count are silently ignored.

### Key files

| File                            | Role                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `src/utils/fibonacci.ts`        | `FIB_STOPS`, `getGridRange()`, `fullFibonacciUpTo()`                          |
| `src/utils/gridGenerator.ts`    | Spiral layout algorithm                                                       |
| `src/components/GoldenGrid.tsx` | Main React component — declarative JSX, child mapping, color + outline logic  |
| `src/components/GoldenBox.tsx`  | Slot marker component — fills 100%×100% of its positioned parent              |
| `src/context/GridContext.tsx`   | `GridProvider` (accepts `initialConfig`) + `useGrid()` hook                   |
| `src/utils/colorUtils.ts`       | `hexToHsl()`, `hslToCss()`                                                    |
| `src/utils/exportGrid.ts`       | Generates a self-contained HTML string mirroring the grid (color + outline)   |
| `src/styles/grid.css`           | Library CSS — injected automatically by the bundler                           |
| `example/index.tsx`             | Demo app — consumes `@gifcommit/golden-grids` only, mad-lib UI, export modal  |
| `example/golden-grid.css`       | Demo-only styles — not part of the distributed library                        |
| `src/__tests__/`                | Unit tests — 100% statement/branch/function/line coverage                     |
