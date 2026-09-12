# Layout study briefs

Each study is a standalone repo forked from the template. This document holds
the brief format, the three studies already committed to, and the backlog.

**Read `PROGRAM.md` first**, particularly the three rules governing studies:
select by content hierarchy rather than fame, name the target while
substituting the assets, and publish at least one failure.

---

## How the content split works

Every study names a real reference site and matches its structure. It does not
carry over the original's photography or copy.

That means a study is built in two passes:

1. **Structure and spec.** Capture the reference, derive the block inventory,
   build the layout, and emit an asset specification — every image slot with
   its resolution and role, every copy slot with its word count and role.
2. **Content.** Greg generates the images and copy against that spec
   separately and hands them back.

Do not fill slots with invented placeholder content and treat the study as
finished. Do not loosen the structure because the real content has not arrived.
The spec is the deliverable of pass one, and its precision is what makes pass
two possible.

## How media fills a slot

Every image and video frame fills its box with `object-fit: cover`. The layout
owns the crop. Nothing is commissioned or exported to match a box, and no band
is reshaped to suit a photograph.

This is a point worth making in the posts rather than just implementing
quietly. The reference sites commission photography at fixed crops because
their grids demand fixed crops — Airbnb's 1:1 and 3:2, Netflix's 16:9 and 2:3.
Those ratios are a production cost the grid imposes upstream, on people
shooting and editing, long before any code runs. Here the slot does it.

Three things the spec still has to say:

- **Resolution.** Cover scales; it does not invent pixels. Source at or above
  the largest rendered size of the slot, and for dial studies at the tile
  texture dimension, since oversized sources are what cost the dial its
  smoothness.
- **Subject placement.** Cover crops from the centre by default. A hero shot
  with an off-centre subject will lose it. The escape hatch is per-image
  `object-position`, which is one declaration and not an architectural
  problem — but the spec should say where the subject sits so it is a choice
  rather than a surprise.
- **Safe area.** What must survive the crop at all three widths. The same box
  can be wide at 1440 and tall at 390, taking very different slices of the same
  source, so the safe area is the intersection of the three — not the desktop
  crop with a note attached.

**One case needs a decision rather than a default.** Film frames are 16:9 and
spiral tiles are square, so cover discards roughly forty percent of each
frame's width. For a scrub that may be acceptable — the subject usually sits
centre-frame — but it means the study is scrubbing a centre slice, not the
film. Decide deliberately in Study 03 and say which you chose.

## Capture the reference before describing it

The descriptions below were written from memory of these sites and they are
probably out of date — large products redesign continuously. Before building,
open the live page and capture it at three widths. Derive the block inventory
from what is actually there. Where a brief below contradicts the live page, the
live page wins. Correct the brief and say what changed.

**Capture at all three, every time:**

| | Width | Why |
| --- | --- | --- |
| Mobile | 390px | Where the original's grid collapses to a single column and the hierarchy is carried entirely by order. |
| Tablet | 820px | The awkward middle, and the most interesting one. |
| Desktop | 1440px | The width the grid was actually designed for. |

Full-page captures, not viewport crops, and the same content state at each
width so the three are comparable.

**Pay particular attention to tablet.** It is where twelve-column grids are
weakest and where nobody looks. A layout built for twelve columns at 1440 and
one column at 390 usually resolves the middle by picking one of those two
badly — a desktop layout squeezed until the boxes are cramped, or a mobile
stack floating in enormous side margins. Golden grids resize continuously
rather than snapping between breakpoints, so tablet is where the difference
should be most visible and the argument easiest to make. If a study's
side-by-side only shows desktop, it is leaving its strongest evidence on the
floor.

Keep all three captures in the study repo. They are the left half of every
side-by-side and the evidence for the structural argument.

## Brief format

- **Reference** — the specific page, named, with a URL.
- **Why this page** — what its content hierarchy looks like, and the specific
  reason it should or should not suit Fibonacci proportions.
- **What it proves** — the one claim a reader should leave with. If a study has
  no distinct claim, it is redundant.
- **Structural inventory** — the original's blocks, their relative weights, and
  what its grid does with them.
- **Bands** — the proposed stack replacing that grid: range, placement,
  editorial job, and what each band does at 390, 820, and 1440. Provisional
  until the build.
- **Asset spec** — images by resolution and role, copy by word count and role.
  The handoff artifact.
- **The honest risk** — what is most likely to look worse than the original,
  named in advance so the writeup cannot quietly omit it.
- **Post angle** — the structural argument, in one sentence.

---

## Study 01 — Airbnb listing page

**Reference:** a single-property listing page on airbnb.com.

**Why this page:** its content hierarchy is already golden without anyone
intending it. One hero photograph dominates, a few secondary shots support it,
then a descending tail — price and capacity, host, amenities, location,
reviews. That is a Fibonacci descent expressed in content. Airbnb's grid
renders it as a hero mosaic followed by stacked full-width rows, which flattens
the descent into equal-weight bands after the gallery. That gap between the
content's hierarchy and the grid's treatment of it is the whole argument.

**What it proves:** production viability. This is the credibility study and it
does the heaviest lifting in the program.

**Bands (provisional):**

| Band | Job |
| --- | --- |
| Gallery | Hero photograph plus supporting shots. The dominant box carries the room that sells the place. |
| Facts | Price, capacity, and the two or three details that decide a booking. |
| Description and location | Prose and a map area, quieter. |
| Reviews | Small and deliberately restrained, closing the page. |

Vary `placement` between bands. Resolve exact ranges during the build, once
real photographs are sitting in real boxes.

**Asset spec to emit:** interior and exterior photographs at resolution, with
subject placement and safe area noted. No aspect ratios — the slots crop. Call
out in the post that Airbnb's 1:1 and 3:2 crops are a cost its grid pushes
upstream onto whoever shoots the property, and that this rebuild imposes none.
Plus property name, location line, host blurb, amenity list, and review
excerpts, each at the word count its box can hold.

**The honest risk:** the facts band. Price and capacity are peer information —
nothing about a nightly rate outranks the guest count — and Fibonacci boxes
will insist one dominates. If it looks forced, say so rather than shrinking the
type to hide it. Naming a real constraint costs less than concealing it.

**Post angle:** listing pages already have a golden hierarchy; the twelve-column
grid flattens it below the fold.

---

## Study 02 — Spotify on the spiral dial

**Reference:** the spotify.com album and library views.

**Why this page, and why it replaces the earlier Unsplash proposal.** Album
covers are square and Fibonacci tiles are square, so nothing is lost. That is a
content argument, not a production one — the slots crop either way, so the
question is not whether cropping is *work* but whether cropping *destroys
something*. A photograph is a composition; take a square out of the middle of a
landscape and you have discarded the composition along with sixty percent of
the frame. Album art has no outside to lose. It is also designed to survive
thumbnail scale, which is precisely the demand the dial makes of it. Better
showpiece, same effort.

**Framing.** Still a capability demonstration, not a rebuild. Spotify's grid is
a scannable wall of equal squares and the dial is not a substitute for one.
Say so in the first paragraph. The claim is not "Spotify should ship this" —
it is "here is a way of moving through a collection that a grid cannot
express."

**Structure:** one deep layout driven by the spiral camera, bound to scroll,
the dial doing the navigating. No bands.

**Two decisions to make early:**

1. **Whether covers counter-rotate or turn with the tiles.** Upright is
   conservative and the library appears to support it. Turning is more dramatic
   and probably the version that travels. Album art is also more forgiving of
   rotation than a photograph — it reads as an object rather than a window.
   Recommendation: let the covers turn, counter-rotate only track titles and
   interface text. Try both before committing.
2. **Image resolution matched to the tile texture box.** Each tile renders into
   a fixed texture box, and full-resolution art costs exactly the smoothness
   that makes the dial worth showing. Source at the texture size and confirm on
   a mid-range phone, not a development machine.

**Companion build.** This is the natural candidate for a React Native version.
The same dial, the same covers, running natively, is the cheapest possible
demonstration of the cross-platform claim — and demonstrating it beats
asserting it in a README. Ship the web study first; add the native build as a
follow-up post if the first lands.

**Asset spec to emit:** a coherent set of cover images at the texture-box
dimension. Square sources are ideal and cost nothing to the crop, but cover
handles anything — the point is that square art happens to lose nothing.
Strong, simple compositions that read at small scale; a busy cover becomes
noise at depth. Specify count, dimension, and the artist and album names.

**The honest risk:** performance on mid-range mobile, and motion comfort.
Scroll-bound rotation is genuinely unpleasant for some people.
`prefers-reduced-motion` must produce a real static fallback layout, not a
slower dial. Requirement, not polish.

**Post angle:** a collection of squares is the case the grid handles worst and
the spiral handles natively.

---

## Study 03 — Netflix, hybrid

**Reference:** the netflix.com browse homepage and a title detail page.

**Why this page:** Netflix is the clearest example in the world of a grid
ignoring content hierarchy. Rows of identical thumbnails assert that every
title carries equal weight, which is false — the row exists precisely because
some titles are being promoted. The featured hero at the top is the product
admitting this, then the layout forgets it immediately below.

**Why hybrid, and why this is the most important study in the series.** Studies
01 and 02 argue opposite halves of the case: one proves the library is
shippable, the other proves it does something nobody else can. A reader can
take those as two separate products. Netflix reconciles them in one page:

- **Bands** for browse. Featured title, then descending tiers replacing the
  equal-weight carousels. This is the shippable half, and it carries the
  structural argument.
- **The dial** for a single title, moving through frames of the film itself.
  This is the spectacle half, and it is doing real work here rather than
  performing — spiralling through a film's frames is a genuinely better way to
  scrub than a timeline strip, because it shows context at multiple scales at
  once.

One page, both capabilities, each where it belongs. That is the argument the
whole program is trying to make, and this is the only study that makes it
without a reader having to assemble it themselves.

**Bands (provisional):**

| Band | Job |
| --- | --- |
| Featured | The promoted title, dominant. Replaces the hero billboard. |
| Tier one | The three or four titles the row was actually promoting. |
| Tier two | The tail, at genuinely smaller weight. |
| Title detail | Synopsis, cast, metadata, leading into the dial. |

**The dial section:** frames from one film, deep enough that the spiral reads
as a continuous scrub. Decide whether it lives inline in the title page or as
a separate view — inline is the stronger argument and the harder build.

**Asset spec to emit:** key art at resolution with subject placement noted; the
slots crop, so Netflix's 16:9 and 2:3 crops are irrelevant here except as
evidence that its grid was shaping the artwork upstream. Plus the frame
sequence for the dial: count, texture-box dimension, and sampling interval —
and a decision on the 16:9-into-square question from the media section above.

**A constraint on the frames.** Frames of a film are the film. They are the
most protected asset in the entire series and the one most likely to draw a
notice. Two clean routes: use a public-domain film, or use original footage.
The public-domain route is the better story — dialling through *Nosferatu* or
*Metropolis* on a Netflix-shaped page is a genuinely charming juxtaposition,
the frames are visually strong, and the legal question disappears entirely.
Recommend it in the spec.

**The honest risk:** the hybrid could read as two demos bolted together. The
writeup has to do the reconciling work explicitly — state why bands suit browse
and the dial suits a single title, and why using either for both would be
worse. If the post cannot make that case cleanly, the study has failed even if
the page looks good.

**Post angle:** rows of identical thumbnails are a layout lying about what the
product is doing.

---

## Backlog

- **A design studio portfolio** — Pentagram or similar. The genre that already
  wants to look like this, which makes it an easy win and slightly less
  interesting for exactly that reason.
- **A Wikipedia article page** — the committed failure study. Flat,
  text-heavy, no hierarchy to exploit, and long-form reading has requirements
  about measure and vertical rhythm that proportional boxes actively fight.
  Write it honestly; it is the study that makes the others believable. Its
  content is also openly licensed, so it is the one study that can legitimately
  use the original's actual text — which sharpens the comparison precisely
  where the library performs worst.
- **Unsplash** — dropped as a dial subject in favour of Spotify. If it returns,
  it should return as a *bands* study of the masonry wall, not as a dial.

## A constraint on the dial

Three studies now include the spiral camera and only one so far does not. Watch
that ratio. If the series becomes mostly dial, the library reads as a
spectacle engine and Study 01's credibility work is diluted — which is the
exact failure mode the whole program exists to avoid. Keep the next two studies
after Netflix band-only, including the Wikipedia failure study.

Do not start a backlog study until 01, 02, and 03 are live and the first
distribution round has run. Three finished studies with a written argument beat
six half-built ones.
