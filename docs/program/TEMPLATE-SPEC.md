# Spec: the layout study template repo

**Goal:** one template repo that every layout study forks, so that starting a
study costs minutes of setup instead of an afternoon.

**Read `PROGRAM.md` first.** This document assumes its framing.

**No implementation is prescribed here.** Choose the libraries, file layout,
and component structure yourself. What follows is what the result must be true
of.

---

## Step zero: verify the API

Before building anything, read the actual source of the library in this
workspace and confirm how consumers use it. Specifically resolve:

- The props `GoldenGrid` accepts, and their defaults.
- The order in which `GoldenBox` children map to slots.
- What happens when the range does not start at the first sequence position —
  whether a placeholder slot is produced, and where in the child order it sits.
- Whether CSS is injected automatically or requires a separate import.
- Whether `GoldenBox` applies any styling of its own, or whether all of it
  belongs to the consumer.

Anything in these documents that contradicts the source is wrong. Correct the
documents and say what you changed.

## What the template must be true of

### Stack

- A React application that builds to static files and deploys to GitHub Pages.
- TypeScript, so that type errors in the library's public API surface during a
  study rather than after publishing.
- The library consumed **from the npm registry**, at the published version —
  not linked from the local working copy. Studies must exercise what the
  public actually installs. If a study reveals a bug, that is a finding worth
  having, and it belongs in an issue.

### The stacked-bands structure

This is the load-bearing idea of the whole series, and the template exists
mainly to encode it.

A study is not one enormous grid. It is a short vertical stack of **bands**,
each band a single small-range grid with one editorial job. Bands stack; they
do not nest.

Small ranges are what make this work. A four-box band stays legible on a phone.
A twelve-box band is a smear at any width, and it collapses all at once.
Stacking also distributes the responsive problem: each band decides
independently what to drop as the viewport narrows.

The template's example page must demonstrate this with roughly three bands, and
must vary `placement` between them so the spiral does not advance in the same
direction three times running. Treat the example content as scaffolding a study
author will delete — make it obviously placeholder, not a finished design.

### How media fills a slot

Images and video frames fill their box with `object-fit: cover`. The layout
owns the crop; nothing is exported to match a box and no band is reshaped to
suit a photograph. The template must demonstrate this so no study author
reinvents it, and must leave per-image `object-position` available as the
escape hatch for a subject that centre-cropping would lose.

Confirm first whether the library's box component applies any sizing of its
own, or whether the fill behaviour belongs entirely to consumer CSS. Build
against what the source actually does.

### Breakpoint ownership

The library owns no breakpoints. The template must show where that decision
lives in a consumer: one place, shared, with each band choosing its own
behaviour from it. Provide for all three reference widths rather than a single
narrow/wide boolean — the tablet range is the one a two-state hook handles
worst, and it is the range where the series expects to win. Do not scatter media queries through the markup, and do not
build an abstraction more elaborate than the problem.

### The skipped-range case

The example must include at least one band that does not start at the first
sequence position, because that is the part of the API a new user is most
likely to get wrong. Make the placeholder slot and its position in the child
order impossible to miss.

### Deployment

- Pushing to the default branch builds and publishes to GitHub Pages.
- The base path must derive from the repository name automatically. A study
  author forking the template should never have to edit a build config.
- Document the one manual step — pointing the repo's Pages source at Actions —
  in the README, since it cannot be automated from within the repo.

### Quality floor

Every study inherits this, so it belongs in the template rather than in each
study's checklist:

- Checked and legible at 390px, 820px, and 1440px — the same three widths the
  reference captures use, so every side-by-side compares like with like.
  Tablet is the one that gets skipped and the one that matters most; see the
  capture section in `STUDY-BRIEF.md` for why.
- Visible keyboard focus.
- `prefers-reduced-motion` respected.
- Sufficient contrast.
- Images that carry meaning have alt text; purely decorative ones do not.

### The README

The template's README is a fill-in-the-blank instrument. It must contain:

- A named reference slot: which page this study rebuilds, with a link, and the
  captured screenshots that form the left half of the side-by-side.
- The disclaimer boilerplate, written once so no study author reinvents it —
  unaffiliated study, original assets, original copy.
- An asset spec section: image slots by resolution, subject placement, and
  role; copy slots by word count and role. This is the handoff artifact Greg
  works from, so it belongs in the repo rather than in a message.
- Links back to the library repo, the npm package, and the generator. Studies
  are standalone repos, which is right for keeping the library repo lean, but
  it means they are orphans unless the linking is deliberate in both
  directions.
- A slot for the live URL.
- A table of the bands used: range, placement, and the editorial job of each.
  This is the part readers actually want, and it is the part a study author
  will skip unless the README asks for it.
- Sections for what worked and what did not, with a note that a study where
  everything worked is an advertisement.
- A pre-publish checklist covering the brand constraints from `PROGRAM.md` and
  the quality floor above.

### Repo configuration

- Marked as a template repository on GitHub.
- MIT licensed.
- Topics applied: `golden-grids`, `fibonacci`, `layout`, `react`.

## Non-goals

- No CSS framework, no component library, no design system. Each study has its
  own visual identity; a shared one would make the series look like one site
  repeated.
- No routing, no state management, no test harness. A study is one page.
- No abstraction over `GoldenGrid`. A reader should be able to open a study's
  source and see the library's real API being used directly. A wrapper
  component would hide the exact thing the series exists to demonstrate.

## Done when

- A fresh fork runs with an install and a dev command, nothing else.
- Pushing to the default branch produces a live Pages URL with no config edit.
- The example page shows the stacked-bands structure, including one
  skipped-range band, and holds up at 390px, 820px, and 1440px.
- The README's fill-in-the-blanks are obvious enough that a study author cannot
  accidentally publish with placeholders intact.
