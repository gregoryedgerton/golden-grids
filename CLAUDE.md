# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (example app on port 5173)
npm run build        # Build library for distribution to /dist/
npm run build:demo   # Build demo site to /dist-demo/ (GitHub Pages)
npm test             # Run Jest tests
npm run serve        # Preview production build
npm run setup        # Install Husky git hooks (run once after cloning)
```

After cloning, run `npm run setup` to install git hooks. `npm run build` runs automatically on `npm install` (via `prepare`) and before `npm publish` (via `prepublishOnly`, which also runs tests).

## Architecture

**Golden Grids** is a React library that generates CSS Grid layouts using Fibonacci sequence proportions arranged in a golden spiral.

### Consumer API

```tsx
import myConfig from './grid.config.json'
import { GoldenGrid, GridProvider } from 'golden-grids'

// Props-only (no provider needed):
<GoldenGrid from={1} to={5} color="#7f7ec7" clockwise={true} rotate={0} />

// From a JSON config file:
<GoldenGrid {...myConfig} />

// With provider (for dynamic/interactive use):
<GridProvider initialConfig={myConfig}>
  <GoldenGrid />
</GridProvider>
```

CSS is auto-injected when the module loads — no separate CSS import required.

Also exported for headless use: `generateGoldenGridLayout`, `generateGridHTML`, `useGrid`, and types `GoldenGridProps`, `InputControlType`, `Square`, `GridLayout`.

### Library vs. Demo

The repo serves two purposes:
- **Library** (`src/index.ts` → `dist/`) — exports `GoldenGrid`, `GridProvider`, `useGrid`, `generateGridHTML`
- **Demo app** (`src/example/index.tsx` → `dist-demo/`) — interactive playground, deployed to GitHub Pages via `.github/workflows/deploy.yml`

Vite switches between these modes via the `VITE_BUILD_DEMO=1` env variable (see `vite.config.ts`).

### Core Data Flow

1. User configures grid via `InputControlType` (`from`, `to` as FIB_STOPS indices, `color` hex, `clockwise` bool, `rotate` 0/90/180/270)
2. `GridContext` holds this state; `GridProvider` wraps the app
3. `GoldenGrid` component reads context, calls `fibonacci.ts` → `gridGenerator.ts` to compute layout
4. Layout is rendered as an `<ol>` with absolutely-positioned `<li>` items using percentage coordinates
5. Colors computed in HSL space via `colorUtils.ts`, varying hue across boxes

### Key Files

| File | Role |
|------|------|
| `src/utils/fibonacci.ts` | `FIB_STOPS` (79 pre-calculated values), `getGridRange()`, `fullFibonacciUpTo()` |
| `src/utils/gridGenerator.ts` | Golden spiral layout algorithm — places squares sequentially, tracks bounding box, normalizes coordinates |
| `src/components/GoldenGrid.tsx` | Renders the grid; also handles placeholder box for skipped leading digits |
| `src/context/GridContext.tsx` | React Context + `useGrid()` hook |
| `src/utils/colorUtils.ts` | `hexToHsl()`, `hslToCss()` |
| `src/utils/exportGrid.ts` | Generates standalone HTML mirroring GoldenGrid rendering |
| `src/example/index.tsx` | Full demo UI with custom `Dial` slider component and export modal |

### Spiral Layout Algorithm (`gridGenerator.ts`)

Squares are placed sequentially:
1. First square at (0,0), second adjacent based on initial direction
2. Each subsequent square placed flush against the current bounding box
3. Direction cycles through 4 positions (CW or CCW)
4. Rotation (0°/90°/180°/270°) is applied as integer coordinate transformation
5. Final coordinates normalized to remove negative offsets

### Skipped Digits

When `from > 1`, a placeholder square is prepended that represents the combined area of skipped Fibonacci numbers. This maintains golden ratio proportions in the spiral.

### Types

```typescript
// src/types/InputControlType.ts
interface InputControlType {
  from: number;       // FIB_STOPS start index (1–78)
  to: number;         // FIB_STOPS end index (1–78)
  color: string;      // Hex color for progression base
  clockwise: boolean;
  rotate: number;     // 0 | 90 | 180 | 270
}

// src/types/UserSequence.ts
interface Square { x: number; y: number; size: number; }
interface UserSequence { width: number; height: number; squares: Square[]; }
```
