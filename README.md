# Golden Grids

How I Learned to Stop Worrying about Rows and Columns and Love the Golden Ratio

[Live Demo](https://gregoryedgerton.github.io/golden-grids/)

## What is it?

Golden Grids is a responsive layout library driven by the Fibonacci Sequence. Instead of traditional rows and columns you get proportionally aligned boxes that follow the golden ratio. What you do with those boxes is your business, but at least you won't be boring.

## Installation

```bash
npm install @gifcommit/golden-grids
```

## Usage

```tsx
import { GoldenGrid, GoldenBox, GridProvider } from '@gifcommit/golden-grids'
// CSS is auto-injected — no separate import needed

// Transparent layout slots (no color):
<GoldenGrid from={1} to={5} />

// With HSL color progression:
<GoldenGrid from={1} to={5} color="#7f7ec7" />

// With outline:
<GoldenGrid from={1} to={5} color="#7f7ec7" outline="2px solid #000000" />

// Compound component — map your content into grid slots:
<GoldenGrid from={3} to={5} color="#7f7ec7">
  <GoldenBox placeholder><p>Fills the skipped-range area</p></GoldenBox>
  <GoldenBox><h1>First visible box</h1></GoldenBox>
  <GoldenBox><p>Second visible box</p></GoldenBox>
  <GoldenBox><p>Third visible box</p></GoldenBox>
</GoldenGrid>

// With provider for dynamic/interactive control:
<GridProvider initialConfig={myConfig}>
  <GoldenGrid />
</GridProvider>
```

Extra `<GoldenBox>` children beyond the visible slot count are silently ignored, so you can always declare the full set of 78 and let the config control what renders.

## Configuration

| Prop        | Type                                     | Description                                                                                                                      |
| ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `from`      | `number`                                 | Index position (1–78) in the Fibonacci Sequence. The library sorts your range smallest to largest automatically.                 |
| `to`        | `number`                                 | Another index position (1–78). Together with `from` this defines your slice of the sequence.                                     |
| `color`     | `string` (hex)                           | Optional base color for the HSL progression. When omitted, boxes are transparent layout slots.                                   |
| `outline`   | `string` (CSS border)                    | Optional border applied to all box edges — e.g. `"2px solid #000000"`. Shared edges draw a single line (no doubling).            |
| `placement` | `"right" \| "bottom" \| "left" \| "top"` | Starting direction of the spiral. Defaults to `"right"`.                                                                         |
| `clockwise` | `boolean`                                | Spiral direction — `true` for clockwise, `false` for counter-clockwise. Defaults to `true`.                                      |
| `children`  | `GoldenBox` elements                     | Optional slot content. Each `<GoldenBox>` maps to a visible square in order. Use `<GoldenBox placeholder>` for the skipped area. |

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

Instead, use `GridProvider` and `setInputControl` to swap configs dynamically. Drive it however fits your stack:

```tsx
// With a media query listener
const isNarrow = window.matchMedia('(max-width: 768px)').matches;

<GridProvider initialConfig={isNarrow ? mobileConfig : desktopConfig}>
  <GoldenGrid />
</GridProvider>

// Or reactively with a resize observer / matchMedia event
const { setInputControl } = useGrid();
useEffect(() => {
  const mq = window.matchMedia('(max-width: 768px)');
  const handler = (e: MediaQueryListEvent) =>
    setInputControl(e.matches ? mobileConfig : desktopConfig);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

This keeps the library as a pure layout primitive and gives you full control over what "responsive" means for your content.

## How big can I go?

The theoretical maximum is the 78th Fibonacci number: `8,944,394,323,791,464`. That's the largest value that fits within JavaScript's `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`). Beyond this threshold, integer arithmetic loses precision and the sequence values can't be trusted. The library generates all 78 valid stops automatically, giving you index positions 0 through 78 to work with.

To be honest it's less about the absolute number and more about controlling the range. After all, a similar range at the start and end of the sequence renders comparably — `8/16` is still `1/2`, same relative proportions. Shorter ranges are easier on the eyes and more practical to use. You can still reach for `5,702,887`, but pair it with the 32nd digit `2,178,309` for a lovely 4-box golden grid dawg.
