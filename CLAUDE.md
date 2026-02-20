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
import { GoldenGrid, GridProvider } from '@gifcommit/golden-grids'
// CSS is auto-injected — no separate import needed

// Minimal usage (no provider required):
<GoldenGrid from={1} to={5} color="#7f7ec7" clockwise={true} rotate={0} />

// From a JSON config file:
import myConfig from './grid.config.json'
<GoldenGrid {...myConfig} />

// With provider for dynamic/interactive control:
<GridProvider initialConfig={myConfig}>
  <GoldenGrid />
</GridProvider>
```

`InputControlType` is the config schema:

```ts
{
  from: number; // FIB_STOPS start index (1–78)
  to: number; // FIB_STOPS end index (1–78)
  color: string; // Hex base color for the progression
  clockwise: boolean; // Spiral direction
  rotate: number; // Starting orientation — 0 | 90 | 180 | 270
}
```

Also exported for headless use: `generateGoldenGridLayout` (returns raw coordinates), `generateGridHTML` (standalone HTML string), `useGrid`, and types `GoldenGridProps`, `InputControlType`, `Square`, `GridLayout`.

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

Two targets share the same source:

- **Library** (`src/index.ts` → `dist/`) — what consumers install from npm
- **Demo app** (`src/example/index.tsx` → `dist-demo/`) — interactive playground deployed to GitHub Pages

Vite switches between them via `VITE_BUILD_DEMO=1` (see `vite.config.ts`).

### How the grid is generated

1. `from`/`to` indices are looked up in `FIB_STOPS` (79 pre-calculated Fibonacci values) via `getGridRange()` in `fibonacci.ts`
2. The full Fibonacci sequence up to the max value is computed via `fullFibonacciUpTo()`
3. `generateGoldenGridLayout()` in `gridGenerator.ts` places squares sequentially — first two explicitly, then each subsequent square flush against the current bounding box, cycling through 4 directions (CW or CCW). Rotation is applied as an integer coordinate transform. Coordinates are normalized to remove negative offsets.
4. `GoldenGrid` renders the layout as a relative containing `<div>` with absolutely-positioned `<div>` boxes at percentage coordinates, with an HSL color progression across boxes
5. When `from > 1`, skipped leading squares are collapsed into a single placeholder `<div>` to preserve spiral proportions

### Key files

| File                            | Role                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| `src/utils/fibonacci.ts`        | `FIB_STOPS`, `getGridRange()`, `fullFibonacciUpTo()`        |
| `src/utils/gridGenerator.ts`    | Spiral layout algorithm                                     |
| `src/components/GoldenGrid.tsx` | React component — accepts props or reads from context       |
| `src/context/GridContext.tsx`   | `GridProvider` (accepts `initialConfig`) + `useGrid()` hook |
| `src/utils/colorUtils.ts`       | `hexToHsl()`, `hslToCss()`                                  |
| `src/utils/exportGrid.ts`       | Generates a self-contained HTML file mirroring the grid     |
| `src/example/index.tsx`         | Demo app with `Dial` slider, mad-lib UI, and export modal   |
| `src/__tests__/`                | Unit tests — 100% statement/line/function coverage          |
