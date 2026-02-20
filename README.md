# Golden Grids

How I Learned to Stop Worrying about Rows and Columns and Love the Golden Ratio

[Live Demo](https://gregoryedgerton.github.io/golden-grids/)

## What is it?

Golden Grids is a responsive CSS Grid layout library driven by the Fibonacci Sequence. Instead of traditional rows and columns you get proportionally aligned boxes that follow the golden ratio. What you do with those boxes is your business, but at least you won't be boring.

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

| Prop        | Type                    | Description                                                                                                                      |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `from`      | `number`                | Index position (1–78) in the Fibonacci Sequence. The library sorts your range smallest to largest automatically.                 |
| `to`        | `number`                | Another index position (1–78). Together with `from` this defines your slice of the sequence.                                     |
| `color`     | `string` (hex)          | Optional base color for the HSL progression. When omitted, boxes are transparent layout slots.                                   |
| `outline`   | `string` (CSS border)   | Optional border applied to all box edges — e.g. `"2px solid #000000"`. Shared edges draw a single line (no doubling).            |
| `rotate`    | `0 \| 90 \| 180 \| 270` | Starting direction of the spiral — `0` (RIGHT), `90` (BOTTOM), `180` (LEFT), `270` (TOP). Defaults to `0`.                       |
| `clockwise` | `boolean`               | Spiral direction — `true` for clockwise, `false` for counter-clockwise. Defaults to `true`.                                      |
| `children`  | `GoldenBox` elements    | Optional slot content. Each `<GoldenBox>` maps to a visible square in order. Use `<GoldenBox placeholder>` for the skipped area. |

## How it works

Based on your `from` and `to` index positions, the library calculates the corresponding slice of the Fibonacci Sequence (`1`, `1`, `2`, `3`, `5`, `8`, `13`, `21`, `34`, `55`, ...) and creates a responsive grid based on the golden ratio. Each number in your selected range becomes a proportionally sized square box in the grid.

A `1, 1` grid gives you two equal squares (side by side or stacked depending on your `rotation` value), while a `1, 3` grid produces 4 boxes where each gets progressively larger (`1`, `1`, `2`, `3`). The Fibonacci values are used as relative ratios for each box.

### Skipping digits

Golden Grids lets you skip numbers in the sequence and that can add just the [right amount of flair](https://www.youtube.com/watch?v=F7SNEdjftno) to your grid. When your range doesn't start at the 1st digit, the preceding space is still accounted for — not as a perfect 1:1 square, but as a single irregular box that proportionally represents all the sequenced values that were skipped. This keeps the grid golden.

### Rotation and spiral direction

The `rotation` input determines which side the spiral builds out from (RIGHT, BOTTOM, LEFT, or TOP) and `clockwise` controls the spiral direction. Using these values you can create landscape and portrait grids. Think of how we declare `padding` or `margin` — we list values top, right, bottom, left. Golden Grids uses this same approach to place boxes which create our spiral. By default the first grid item is placed to the RIGHT, then the next box goes to the BOTTOM, then LEFT, then TOP, and repeat. With `rotation` you shift that starting direction and `clockwise` reverses the flow.

### Responsiveness

Golden Grids are responsive and fill 100% of their container width. The proportions of the grid shouldn't break but I intentionally do not clip the box. Overflow management is the importers responsiblity.

## How big can I go?

The theoretical maximum is the 78th Fibonacci number: `8,944,394,323,791,464`. That's the largest value that fits within JavaScript's `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`). Beyond this threshold, integer arithmetic loses precision and the sequence values can't be trusted. The library generates all 78 valid stops automatically, giving you index positions 0 through 78 to work with.

To be honest it's less about the absolute number and more about controlling the range. After all, a similar range at the start and end of the sequence renders comparably — `8/16` is still `1/2`, same relative proportions. Shorter ranges are easier on the eyes and more practical to use. You can still reach for `5,702,887`, but pair it with the 32nd digit `2,178,309` for a lovely 4-box golden grid dawg.

## Why did I make this?

Part of me doesn't accept myself as a true engineer. It's harsh, but It's how I feel. If I was a musician I would feel the same if I hadn't wrote a song. I'm not saying that's your life, but that's mine. While coding has been my trade for many years, there's one last hurtle I have yet to climb. One last mountain to climb. The release of an open-source project. I have a lot of things I want to make with this repo, but time is precisious. Better the community have it then keep it to myself and wait another decade.

This library is meant to challenge the status quo that all things web must submit to rows and columns. Fuck that, this isn't 1984, I was born in 83, [think different](https://www.youtube.com/watch?v=5sMBhDv4sik). Ask yourself [is Golden Grids for you?](https://youtu.be/pRIIwJh1DDQ?si=LHKhOkO-RctUPEGA&t=210).

## A long standing obsession with the Golden Ratio

The golden ratio has been a passion of mine since Philly. The 1931 commercial piece [l'Atlantique](https://www.singulart.com/en/blog/2024/11/18/latlantique-by-a-m-cassandre-bc/) by A.M. Years later I would walk into a quaint shore antingue shop while scouting locations for a music video and saw a lithograph tucked away cover in dust, it now hangs on my wall at home produly framed. I first saw it in the pages of [The History of Graphic Design (3rd Edition)](https://www.amazon.com/History-Graphic-Design-Philip-Meggs/dp/0471291986) while at college, even then it reaced out. Hidden in the smoke stack, trailing off towards the tugboat in the lower frame, is the golden ratio. It spoke to me.

During the record label years I often made 1-off landing pages for album releases and always tried to sneak the golden ratio in, placing the album art as the dominant square and using the remaining space for navigation. My first attempt at a true layout based solely on the golden ratio was in May 2016 with flexbox — a `1` to `8` golden grid built from `100vw`. It was cool but it didn't do much. I tried to use jQuery to do an infinite inward spiral but I didn't have the chops to make it happen. From there the idea sat for a while.

It wasn't until September 2024 when I saw [Mads Stoumann](https://stoumann.dk/)'s post on [Golden Ratio with CSS Grid](https://dev.to/madsstoumann/the-golden-ratio-in-css-53d0) that I rekindled my curiosity. I began by sketching a 5 box grid in my notebook and having a moment of claity on what input variables would yield the most results. From their I built a basic example and did a lot of browser sessions with chatGPT where I provided it hard coded grids in vanilla HTML/JS/CSS then prompted the model to extend variable inputs. Around March copy/pasta was getting old and the models was hitting its complexity as I attempted to port my suprisly accurate vanilla file into a react library of substance. I got few days in and waived the white flag. I had hit The Tower of Hanoi problem.

Maybe it was the [the suber bowl](https://www.youtube.com/watch?v=kQRu7DdTTVA) commericals, maybe it was more usage at work, maybe it was the fact I was 3 months sober, but on Friday Feb 13th I decided that it was time to dive back into Golden Grids. Me and my son were going camping on a frozen lake (shout-out [Pack 137](https://www.hazletcubscouts.org/)) and I had take off to preo. I finished early so I setup Claude Code in my IDE and proposed this simple question. Why was my vanillr version always a perfect fit but the ported library version not consitently accruate as input variables changed? Within seconds Claude identified the error in my logic, it was a simple bounding box issue.

[Dillon!](https://www.youtube.com/watch?v=txuWGoZF3ew). Ever since then I've been pushing the library forward. I try not to use Claude for everything, some of the commits we share, the harder ones I just direct. I wouldn't be at 100% code coverage without it, that's for sure. My tell is a spelling mistake. I have mixed feeling and I still belive that creativty is sacred and that AI it's just another tool in my belt.
