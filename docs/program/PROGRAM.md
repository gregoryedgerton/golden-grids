# Golden Grids — Marketing Program Brief

**Audience for this document:** an agent working in the `golden-grids` repo and
in the study repos that surround it. Read this first. It explains why the work
exists and what "good" means. The other documents in this folder tell you what
to build.

**This document contains no code by design.** Every implementation decision
belongs to you, made against the real source in this repo. Where this brief
names an API (`from`, `to`, `placement`, `clockwise`, `GoldenBox` ordering,
`spiralCamera`), treat it as a claim to verify, not a fact to trust. It was
written from the published README, which may have drifted from the source.

---

## The product, stated plainly

Golden Grids is a layout library driven by the Fibonacci sequence. You give it
a range and it returns proportionally sized boxes arranged on a golden spiral.
It ships for React, React Native, SwiftUI, and Jetpack Compose. It includes a
spiral camera — a dial that treats the layout as a zoomable, rotatable space
rather than a static arrangement. There is a live generator on GitHub Pages.
Twenty-four releases since February 2026.

## The problem marketing has to solve

Every visitor arrives with the same unspoken objection: *this is a novelty.*

Golden-ratio design is a well-worn internet topic with a reputation for being
more aesthetic theory than working tool. A reader who lands on the README, sees
a joke headline and a claim about not being boring, and leaves within fifteen
seconds has not rejected the library — they have never evaluated it. They
pattern-matched it to a genre and moved on.

Everything in this program exists to interrupt that pattern-match. The goal is
not awareness. It is **credibility**: a developer who believes they could ship
this.

## What to lead with

The two things that are hard to dismiss as novelty:

1. **Cross-platform parity.** React, React Native, SwiftUI, and Compose from
   one layout model. Almost no layout library does this. A developer who has
   ever tried to keep a web layout and a native layout in agreement understands
   the value instantly, with no aesthetic argument required.
2. **The spiral dial.** It is not a grid feature. It is a capability nobody
   else ships, and it is visually arresting in a way that survives compression
   to a fifteen-second loop.

The golden ratio is the *mechanism*, not the pitch. Lead with what it lets
someone build.

## The engine: layout studies

The program's recurring content is a series of standalone repos, each one
rebuilding **a specific, well-known page** using stacked golden grids. The
reference site is named openly — that is the point of the exercise and most of
its reach. Each study ships as a live deploy, a public repo, and a written post
that argues a structural case about the original's layout.

Studies answer the credibility objection in the only way that works: by showing
real, recognizable layouts built with the thing.

### Three rules that govern every study

**1. Select by content hierarchy, not by fame.**

Golden Grids imposes a hierarchy — one dominant box, progressively smaller
ones. Content that is genuinely flat (a news front page, a documentation index,
a pricing comparison table) fights that hierarchy and will look worse remade.
Choosing a famous flat site because it is famous produces published evidence
against the library. Choose patterns whose content already has one hero, two
seconds, and a few tertiary items.

**2. Name the target. Substitute the assets.**

Say which page you rebuilt. Screenshot the original for the side-by-side,
critique its layout, reference it by name throughout. That is ordinary
commentary and it is where the series gets its reach — "we rebuilt Airbnb's
listing page with Fibonacci grids" is a headline, and the generic version of
that sentence is a shrug.

What does not carry over is the original's photography, wordmarks, and
marketing copy. Republishing those as a live deploy is infringement regardless
of the project being free and educational, and the practical cost is that a
takedown erases the asset you spent weeks building.

This costs the argument nothing, because the argument is **structural**. The
claim is that a twelve-column grid flattens a hierarchy Fibonacci proportions
express better, and that claim is carried by block structure, relative sizes,
box proportions, and word counts — not by which specific photograph sits in the
hero. Match the original's structure exactly and substitute the content.

Each study therefore produces an **asset specification** before it produces a
page: the inventory of image slots and the copy slots at their required word
counts. Greg generates the assets and copy against that spec separately.

Media does not need matching aspect ratios. Images and video frames fill their
slot with `object-fit: cover` and the layout owns the crop. That is a real
advantage worth stating in the posts: the original sites had to commission
photography at specific crops because their grid demanded specific crops. Here
the slot crops for you, so the spec only has to name resolution, subject
placement, and role. Do not invent placeholder content and call it done, and
do not adjust the structure to suit content that has not arrived yet.

Every study carries a visible line, on the page and in the README, stating it
is an unaffiliated study and that the assets are original.

**3. Publish at least one failure.**

A series where every study succeeds reads as advertising and readers discount
all of it. One study should honestly document a pattern the library handles
badly, with a clear account of why. That study buys credibility for the rest.

## Sequence

Work in this order. Each step makes the next one land harder.

1. **Library metadata and pitch.** See `LIBRARY-TASKS.md`. Cheap, fast, and it
   fixes the destination every later link points at. Do not drive traffic
   before this is done.
2. **The study template repo.** See `TEMPLATE-SPEC.md`. One scaffold that every
   study forks, so studies cost hours rather than days.
3. **Studies 01, 02, and 03.** See `STUDY-BRIEF.md`. Study 01 proves utility,
   Study 02 proves range, and Study 03 reconciles the two in one page. The
   third is not optional — without it a reader can take the first two as
   evidence of two separate products.
4. **Distribution.** Only once all three are live, so submitted links are not
   lonely and the argument arrives whole.

## Distribution, in leverage order

- Developer newsletters — React Status, Frontend Focus, JavaScript Weekly,
  Bytes. They accept open submissions, cost nothing, and reach exactly the
  right readers.
- A single Show HN. You get one good attempt. Lead with the generator or the
  spiral dial, not with the library.
- Subreddits and link communities: r/reactjs, r/web_design, Lobsters, Designer
  News, Sidebar.
- A pull request adding the library to awesome-react-components.
- Short-form video of the spiral dial. That asset is currently wasted inside a
  README.

## How success is measured

Downloads and stars are the numbers everyone looks at and neither one tells you
whether the credibility problem is solved. **The number that matters is issues
and discussions opened by people you do not know.** Someone filing a bug has
built something. Track that first; treat the rest as context.

## Non-goals

- Do not build a component library, a design system, or a CSS framework around
  Golden Grids. The library's restraint — it lays out boxes and nothing else —
  is a strength. Studies style their own content.
- Do not add breakpoint handling to the library. The README's position on this
  is correct and defensible: which box matters at 390px is a content decision.
  Studies demonstrate how a consumer owns it.
- Do not write marketing copy that argues aesthetics. Show layouts instead.
