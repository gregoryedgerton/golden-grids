# Golden Grids

### How I Learned to Stop Worrying about Rows and Columns and Love the Golden Ratio

Try the [Golden Grid Generator](https://gregoryedgerton.github.io/golden-grids/) — Explore the sequence, define your inputs and export what you create.

## What is it?

Golden Grids is a responsive layout library driven by the Fibonacci Sequence. Instead of traditional rows and columns you get proportionally aligned boxes that follow the golden ratio. What you do with those boxes is your business, but at least you won't be boring.

## Installation

```bash
npm install @gifcommit/golden-grids
```

or visit [![npm](https://img.shields.io/npm/v/@gifcommit/golden-grids)](https://www.npmjs.com/package/@gifcommit/golden-grids) for the latest published package

## Usage

```tsx
import { GoldenGrid, GoldenBox } from '@gifcommit/golden-grids'
// CSS is auto-injected — no separate import needed

// Transparent layout slots:
<GoldenGrid from={1} to={5} />

// With outline:
<GoldenGrid from={1} to={5} outline="2px solid #000000" />

// With HSL color progression:
<GoldenGrid from={1} to={5} color="#7f7ec7" />

// Map your content into grid slots — children map largest to smallest:
<GoldenGrid from={1} to={3}>
  <GoldenBox><h1>Largest box</h1></GoldenBox>
  <GoldenBox><p>Second box</p></GoldenBox>
  <GoldenBox><p>Smallest box</p></GoldenBox>
</GoldenGrid>

// When from > 1, the skipped range becomes a placeholder slot — declare it last:
<GoldenGrid from={3} to={5}>
  <GoldenBox><h1>Largest visible box</h1></GoldenBox>
  <GoldenBox><p>Second visible box</p></GoldenBox>
  <GoldenBox><p>Smallest visible box</p></GoldenBox>
  <GoldenBox><p>Skipped-range area</p></GoldenBox>
</GoldenGrid>
```

Children map in priority order — first child fills the largest box, last child fills the smallest. When `from > 1`, the final `<GoldenBox>` fills the skipped-range placeholder. Extra `<GoldenBox>` children beyond the slot count are silently ignored, so you can always declare the full set and let `from`/`to` control what renders.

## Spiral dial

`spiralCamera` turns a layout into a dialable view: give it a depth and it
returns the transform that fills the viewport with one square — the focus —
composed exactly as the spiral places its neighbours. Depth 0 focuses the last
(largest) square; each whole step moves one square deeper, toward the eye.
Scale interpolates geometrically and rotation advances 90° per step, so a
scroll-bound depth feels like one continuous dial. Framework-free: bind it to
scroll, a slider, or a clock — the camera only answers "where is the viewport
at depth d".

```ts
import {
  generateGoldenGridLayout,
  spiralCamera,
  spiralEye,
  spiralWindow,
  toCssContentTransform,
  toCssTileTransform,
} from '@gifcommit/golden-grids';

const layout = generateGoldenGridLayout([1, 1, 2, 3, 5, 8, 13], true, 0);
const frame = spiralCamera(layout, depth, innerWidth, innerHeight);

// RENDER PER TILE — not one camera transform on a shared stage. A stage
// transform rasterizes the 1-unit deep squares and upscales the raster
// hundreds of times, so the deep dial goes to mush. toCssTileTransform
// composes camera ∘ placement flat per tile: render each square into a
// fixed texture box (512px by default) and its net raster scale stays near
// 1 at focus. The tiles sit at the stage origin, untransformed stage.
for (const [k, square] of layout.squares.entries()) {
  const tile = tiles[k];
  tile.style.width = tile.style.height = '512px';
  tile.style.transformOrigin = '0 0'; // the decomposition assumes it
  tile.style.transform = toCssTileTransform(frame, square, innerWidth, innerHeight);

  // How present is square k at this depth? One ramp gives you "a few tiles
  // at a time" and the crossfade; hidden fires exactly when opacity reaches
  // zero, so invisible content never stays focusable. Deliberately
  // asymmetric: only OUTWARD squares (larger than the focus, behind the
  // camera) fade — the interior never does, so squares emerge from the
  // centre small but fully present instead of materializing through a
  // fade-in.
  const { opacity, hidden } = spiralWindow(k, depth, layout.squares.length);
  tile.style.opacity = String(opacity);
  tile.style.visibility = hidden ? 'hidden' : 'visible';

  // Keep the CONTENT readable while the dial turns: counter-rotate the
  // tile's content element against the stage about its own centre
  // (transform-origin 50% 50% — not the tile's 0 0), so it orbits with its
  // tile but never spins. The |cosθ|+|sinθ| cover swell keeps the clip box
  // full mid-turn (exactly 1 at rest, √2 at worst). A configuration detail:
  // { counterRotate: false } is the identity for consumers who want content
  // to ride the spiral; { cover: false } for content that must never scale.
  const art = tile.firstElementChild as HTMLElement;
  art.style.transformOrigin = '50% 50%';
  art.style.transform = toCssContentTransform(frame);
}
// (React Native: toNativeTileTransform / toNativeContentTransform;
//  Swift: toAffineTileTransform + contentTransform;
//  Kotlin: tileTransform + contentTransform, graphicsLayer pivots.)

// Optional anchor: where the focused square's centre lands, defaulting to
// the viewport centre. Pass a point to pin the dial against an edge — half
// the RENDERED focus size (fillRatio × min side, from the same fillRatio you
// gave spiralCamera) pins its edge flush AT WHOLE DEPTHS, where a dial
// rests. Mid-turn the rotated square's half-extent grows by
// |cosθ| + |sinθ| (up to √2 at 45°), so its corner sweeps past the edge —
// usually the desired bleed. Which edge to hug, and when, is your layout's
// decision:
const fillRatio = 0.62; // must match the spiralCamera call
const focusHalf = (fillRatio * Math.min(innerWidth, innerHeight)) / 2;
const flushLeft = { x: focusHalf, y: innerHeight / 2 };
toCssTileTransform(frame, layout.squares[0], innerWidth, innerHeight, {
  anchor: flushLeft, // pass the same anchor for every tile in the loop above
});

// The spiral's convergence point, e.g. as a transform origin or annotation
// anchor (centre of the smallest square; exact in the φ-limit).
const eye = spiralEye(layout);
```

(`toCssTransform` — one matrix for a whole stage — still exists for cases
where every square is a similar size on screen; for a deep dial, use the
per-tile form above.)

<p align="center">
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/ios/spiral.gif" width="240" alt="The spiral dial — ninety-one squares, per-tile transforms, orientation-locked labels" />
</p>

### Which way the dial trails

At depth 0 the whole spiral — everything the reader is about to dial through —
sits to ONE side of the focused square, and which side cycles with the square
count as well as `rotate`: fifteen squares at `rotate: 180` trail downward,
five squares at the same rotation trail *upward*, off the top. Anything that
filters its content is picking a direction by accident unless it solves for
one. `trailToRotateDeg` is that solve, and `trailForRotation` reads it back.

```ts
import { trailToRotateDeg, trailForRotation } from '@gifcommit/golden-grids';

// Grow into the open space: to the right of a side column, below a stacked
// header. Which side is open is your layout's decision, like the anchor.
const trail = innerWidth >= innerHeight ? 'right' : 'bottom';
// Solve for the count you are about to LAY OUT — the same sequence, not the
// unfiltered one. A mismatch here targets the wrong side, and filtering is
// exactly when it happens.
const fib = fibonacciFor(items.length);
const rotate = trailToRotateDeg(trail, /* clockwise */ true, fib.length);
const layout = generateGoldenGridLayout(fib, true, rotate);

trailForRotation(180, true, 15); // 'bottom'
trailForRotation(180, true, 5);  // 'top' — same rotation, different count
```

Proven in production on [gregoryedgerton.com/projects](https://www.gregoryedgerton.com/projects/)
before being upstreamed.

## Cross-platform

The grid is computed from one shared, framework-agnostic model, so the same component renders four ways:

- **Web (React)** — `@gifcommit/golden-grids` (everything above)
- **React Native** — `@gifcommit/golden-grids/native`
- **Native iOS (SwiftUI)** — a Swift package, `import GoldenGrids`
- **Native Android (Jetpack Compose)** — a Kotlin module, `import com.gifcommit.goldengrids.GoldenGrid`

### Web (React)

The package ships an interactive playground — the **Golden Grid Generator** — where you tune the grid through a mad-lib of dials and toggles (range, colour, outline, spiral direction, labels) and export the result. [Try it live.](https://gregoryedgerton.github.io/golden-grids/)

For the spiral camera on the web, the production dial at [gregoryedgerton.com/projects](https://www.gregoryedgerton.com/projects/) is the reference implementation; a standalone web example is planned. (The generator stays a flat-grid tool — its mad-lib chrome is built around the static composition, and a dial deserves a page of its own.)

<p align="center">
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/web/golden-grids.gif" width="600" alt="The Golden Grid Generator — tuning range, colour, outline and labels live" />
</p>

### React Native

Same API, rendered with native `<View>`s — just import from the `/native` entry:

```tsx
import { GoldenGrid, GoldenBox } from '@gifcommit/golden-grids/native'

<GoldenGrid from={1} to={5} color="#7f7ec7" />
```

The spiral camera ships from the `/native` entry too, plus `toNativeTransform` — the frame as an RN `transform` array, because RN pivots about the view centre and offers no transform origin, so the web decomposition can't be reused directly:

```tsx
import { generateGoldenGridLayout, spiralCamera, toNativeTransform } from '@gifcommit/golden-grids/native'

const frame = spiralCamera(layout, depth, width, height)
// The stage View must BE the size passed as `stage` — RN pivots about the
// view's own centre, so a flex- or content-sized View would pivot somewhere
// else and the focus would miss its anchor.
<View
  style={{
    width: layout.width,
    height: layout.height,
    transform: toNativeTransform(frame, width, height, { width: layout.width, height: layout.height }),
  }}
/>
```

### iOS (SwiftUI)

Add the Swift package (Xcode → _File ▸ Add Package Dependencies…_, or in `Package.swift`):

```swift
.package(url: "https://github.com/gregoryedgerton/golden-grids", from: "4.0.0")
```

Then drop your views into the slots — the closure is keyed by child ordinal (`0` = the largest slot):

```swift
import GoldenGrids

GoldenGrid(from: 1, to: 5, color: "#7f7ec7") { ordinal in
    Image(photos[ordinal]).resizable().scaledToFill()
}
```

The camera is ported to Swift — `spiralCamera`, `spiralWindow`, `spiralEye`, the trail solves, and `toAffineTransform`, which hands back a `CGAffineTransform` for a top-left-origin stage (the analogue of `toCssTransform`). All of it is asserted against the same `spiral-camera.json` golden master as the web within 1e-9.

A runnable example app lives in [`Examples/iOS`](Examples/iOS) — five screens: a swipeable featured carousel, a sky gallery, a stats dashboard, a line-less editorial layout, and a **Spiral** depth dial (drag or slide to dial through fifteen squares).

<p align="center">
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/ios/featured.gif" width="200" alt="Featured — a swipeable card carousel" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/ios/galleries.gif" width="200" alt="Galleries — sky gradients with sun and moon" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/ios/dashboards.gif" width="200" alt="Dashboards — a bento of stats" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/ios/editorial.gif" width="200" alt="Editorial — a line-less copy grid" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/ios/spiral.gif" width="200" alt="Spiral — dialing through ninety-one squares with inertia and number filters" />
</p>

### Android (Jetpack Compose)

The same proportional model, rendered with Compose. The `GoldenGrid` composable takes the same props and fills each slot via a `slotContent` lambda keyed by child ordinal (`0` = the largest slot):

```kotlin
import com.gifcommit.goldengrids.GoldenGrid

GoldenGrid(from = 1, to = 5, color = "#7f7ec7", modifier = Modifier.fillMaxWidth()) { ordinal ->
    Image(painterResource(photos[ordinal]), contentDescription = null, contentScale = ContentScale.Crop)
}
```

The camera is ported to Kotlin too — the same functions, plus `toGraphicsLayerTransform`, a decomposition suited to `Modifier.graphicsLayer` with a `TransformOrigin(0f, 0f)` pivot — and asserted against the shared `spiral-camera.json` golden master within 1e-9.

A runnable example app lives in [`android/example`](android/example) — the same five screens as the iOS example, rebuilt in Compose, including the **Interactive Experiences** depth dial (91 squares, flick inertia, DUO/TRIO/QUAD quick sets — full parity with the iOS screen). The renderer is verified against the same `render-model.json` golden master as every other platform. See [`android/README.md`](android/README.md) to build and run it.

<p align="center">
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/android/featured.gif" width="200" alt="Featured — a swipeable card carousel" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/android/galleries.gif" width="200" alt="Galleries — sky gradients with sun and moon" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/android/dashboards.gif" width="200" alt="Dashboards — a bento of stats" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/android/editorial.gif" width="200" alt="Editorial — a text-first copy grid" />
  <img src="https://raw.githubusercontent.com/gregoryedgerton/golden-grids/main/docs/android/spiral.gif" width="200" alt="Interactive Experiences — dialing through ninety-one squares with inertia and quick sets" />
</p>

## Configuration

| Prop        | Type                                     | Description                                                                                                                                                         |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from`      | `number`                                 | Index position (1–78) in the Fibonacci Sequence. The library sorts your range smallest to largest automatically.                                                    |
| `to`        | `number`                                 | Another index position (1–78). Together with `from` this defines your slice of the sequence.                                                                        |
| `color`     | `string` (hex)                           | Optional base color for the HSL progression. When omitted, boxes are transparent layout slots.                                                                      |
| `outline`   | `string` (CSS border)                    | Optional border applied to all box edges — e.g. `"2px solid #000000"`. Shared edges draw a single line (no doubling).                                               |
| `placement` | `"right" \| "bottom" \| "left" \| "top"` | Starting direction of the spiral. Defaults to `"right"`.                                                                                                            |
| `clockwise` | `boolean`                                | Spiral direction — `true` for clockwise, `false` for counter-clockwise. Defaults to `true`.                                                                         |
| `children`  | `GoldenBox` elements                     | Optional slot content. Children map largest-to-smallest — first child fills the largest box. When `from > 1`, the last `<GoldenBox>` fills the skipped-range placeholder. |

## How it works

Based on your `from` and `to` index positions, the library calculates the corresponding slice of the Fibonacci Sequence (`1`, `1`, `2`, `3`, `5`, `8`, `13`, `21`, `34`, `55`, ...) and creates a responsive grid based on the golden ratio. Each number in your selected range becomes a proportionally sized square box in the grid.

A `1, 1` grid gives you two equal squares (side by side or stacked depending on your `placement` value), while a `1, 3` grid produces 4 boxes where each gets progressively larger (`1`, `1`, `2`, `3`). The Fibonacci values are used as relative ratios for each box.

### Skipping digits

Golden Grids lets you skip numbers in the sequence and that can add just the [right amount of flair](https://www.youtube.com/watch?v=F7SNEdjftno) to your grid. When your range doesn't start at the 1st digit, the preceding space is still accounted for — not as a perfect 1:1 square, but as a single irregular box that proportionally represents all the sequenced values that were skipped. This keeps the grid golden.

### Placement and spiral direction

The `placement` prop determines which side the spiral builds out from (`"right"`, `"bottom"`, `"left"`, or `"top"`) and `clockwise` controls the spiral direction. Using these values you can create landscape and portrait grids. Think of how we declare `padding` or `margin` — we list values top, right, bottom, left. Golden Grids uses this same approach to place boxes which create our spiral. By default the first grid item is placed to the `"right"`, then the next box goes to the `"bottom"`, then `"left"`, then `"top"`, and repeat. With `placement` you shift that starting direction and `clockwise` reverses the flow.

### Responsiveness

Golden Grids fill 100% of their container width and maintain proportions at any size. Overflow is not clipped — that's the consumer's responsibility.

The library deliberately does not enforce responsive breakpoints or automatically adjust the grid range as the viewport narrows. Deciding which boxes to show at which breakpoint is a content and product decision, not a layout math decision — the library has no way of knowing which of your boxes matters most on a small screen.

`GoldenGrid` is a prop-driven component. Own your state, pass `from` and `to`, and drive changes however fits your stack:

```tsx
// Static — derive from viewport at render time
const isMobile = window.matchMedia("(max-width: 768px)").matches;
<GoldenGrid from={1} to={isMobile ? 3 : 5} color="#7f7ec7" />;

// Reactive — update state on breakpoint change
const [to, setTo] = useState(5);
useEffect(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  const handler = (e: MediaQueryListEvent) => setTo(e.matches ? 3 : 5);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}, []);
<GoldenGrid from={1} to={to} color="#7f7ec7" />;
```

## How big can I go?

On the web, the maximum is the 78th Fibonacci number: `8,944,394,323,791,464`. That's the largest value that fits within JavaScript's `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`). Beyond this threshold, integer arithmetic loses precision and the sequence values can't be trusted. The library generates all 78 valid stops automatically, giving you index positions 0 through 78 to work with.

The native ports carry further — Swift `Int` and Kotlin `Long` are true 64-bit integers — but the LAYOUT walls before the values do: a 92-square layout's bounding box is F(93) ≈ 1.22 × 10¹⁹, past `Int64.max`, so **91 squares is the native ceiling** (the iOS example's spiral dial ships at exactly that). Dialing past it — a true 100 — needs a float-coordinate layout, tracked in [#31](https://github.com/gregoryedgerton/golden-grids/issues/31).

To be honest it's less about the absolute number and more about controlling the range. After all, a similar range at the start and end of the sequence renders comparably — `8/16` is still `1/2`, same relative proportions. Shorter ranges are easier on the eyes and more practical to use. You can still reach for `5,702,887`, but pair it with the 32nd digit `2,178,309` for a lovely 4-box golden grid dawg.
