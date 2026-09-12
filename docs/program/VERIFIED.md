# Verification log

`PROGRAM.md`, `STUDY-BRIEF.md`, `LIBRARY-TASKS.md`, and `TEMPLATE-SPEC.md` were
written from the published README. This log records what was checked against
the source and what changed as a result. Update it whenever a claim in those
documents is re-verified or corrected.

## 2026-09-12 — checked against `@gifcommit/golden-grids` 5.0.0

| Claim | Source of truth | Result |
| --- | --- | --- |
| Platforms: React, React Native, SwiftUI, Compose | `src/index.ts`, `src/native/`, `Sources/GoldenGrids/`, `android/` | Correct. |
| Twenty-four releases since February 2026 | `git tag` (24 tags, `v1.0.0` dated 2026-02-26) | Correct. |
| Current major version | `package.json`, npm `latest` | 5.0.0. |
| `GoldenGrid` props and defaults | `src/core/types.ts`, `src/utils/renderModel.ts` | `from` 1, `to` 4, `clockwise` true, `placement` `"right"`; plus `color`, `outline`, `children`. |
| `GoldenBox` child order | `src/core/assignChildren.ts` | Largest slot takes the first child. When `from > 1` the **last** child fills the placeholder, which is rendered first in the DOM. Extra children ignored. Children that are not direct `GoldenBox` elements (fragments, wrappers) are silently dropped. |
| CSS injection | `vite.config.ts` (`vite-plugin-css-injected-by-js`) | Automatic. No stylesheet import. |
| `GoldenBox` styling | `src/components/GoldenBox.tsx` | Renders a `100% × 100%`, `position: relative` div and nothing else. `object-fit` belongs to the consumer. |
| Spiral camera public surface | `src/index.ts` | `spiralCamera`, `toCssTransform`, `toNativeTransform`, `spiralWindow`, `windowFadeDepth`, `spiralEye`, `focusIndexAt`, `trailToRotateDeg`, `trailForRotation`, `tileTransform`, `toCssTileTransform`, `toNativeTileTransform`, `tileOnScreen`, `contentTransform`, `toCssContentTransform`, `toNativeContentTransform`. Also exported from `/native`. |
| Maximum usable range | README "How big can I go?", `src/utils/fibonacci.ts` | Web: sequence positions 1–78 (`Number.MAX_SAFE_INTEGER`). Native: 91 squares is the layout ceiling (`Int64`). |
| Type resolution from npm | Template build; `tsc` under `bundler` and `node16` resolution | Both resolve `dist/index.d.ts` despite `types` being listed last in `exports`. No issue. |
| npm keywords | `package.json` | Were `react`, `golden ratio`, `grid`, `layout`. Expanded in the library-metadata change. |
| GitHub topics, description, homepage | `gh repo view` | Were empty / stale. Set in the library-metadata change. |

**Changes to the documents:** none of the claims above were wrong. The
template spec's step-zero questions are answered in the table. `PROGRAM.md`'s
API names (`from`, `to`, `placement`, `clockwise`, `GoldenBox` ordering,
`spiralCamera`) all exist as described.

**Found while verifying, filed as issues:** the npm tarball ships a stray
`dist/index.html`; non-`GoldenBox` children are dropped without a warning.
