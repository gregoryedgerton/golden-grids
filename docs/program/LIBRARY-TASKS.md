# Library repo tasks

Work to do inside `golden-grids` itself, before any traffic is driven to it.
These are cheap and they fix the destination every later link points at.

**Read `PROGRAM.md` first.** The positioning section governs the writing tasks
below.

---

## 1. Package and repo metadata

The published keywords are `react`, `golden ratio`, `grid`, `layout` — four
words that omit most of what the library actually is. Nothing about React
Native, SwiftUI, Compose, Fibonacci, or the spiral. Someone searching npm for a
cross-platform layout solution cannot currently find this.

- Expand the npm keywords to cover the platforms and the mechanism.
- Apply matching GitHub topics. They are separate systems; fixing one does not
  fix the other.
- Add a social preview image to the repo settings. Every link shared anywhere —
  newsletters, social, link aggregators — renders this image. Without it the
  library shows a grey placeholder in every preview card. Use the generator or
  the spiral dial; show the thing working rather than a logo.
- Confirm the repo description matches the positioning, not just the package
  description.

## 2. The README opening

The first five lines decide whether a visitor evaluates the library or
pattern-matches it to "golden ratio blog post" and leaves. Currently they get a
Dr. Strangelove riff and a promise of not being boring. The joke is good and it
should survive — but it should not be doing the load-bearing work of the first
screen.

Rewrite the opening so that, before any joke, a reader learns:

- That this lays out React, React Native, SwiftUI, and Compose from one model.
- That the spiral camera exists and what it does.
- That there is a live generator they can open right now.

Directions worth trying, in order of how hard they are to dismiss as novelty:

- Lead on **one layout model, four platforms**. This is the claim a skeptical
  developer cannot wave away, and no aesthetic argument is required to land it.
- Lead on **the dial** — a layout you can zoom through rather than scroll past.
  Strongest if paired with a moving image immediately below.
- Lead on **the generator** — "define a range, see it, export it" — which
  converts a reader into a user before they have decided anything.

Keep the subtitle joke as a subtitle. Do not open with the golden ratio as a
concept; it is the mechanism, not the reason to install.

## 3. Showcase section

Studies live in their own repos, which keeps this one lean but makes them
orphans unless linking is deliberate in both directions.

Add a Showcase section to the README listing each study with its live URL, its
repo, and one line on what it demonstrates. Add it as a stub now, before Study
01 exists, so that publishing a study is an edit rather than a decision.

Note in the section — briefly — that the studies name the sites they rebuild,
are unaffiliated with them, and use entirely original imagery and copy. That
constraint should be visible from the library side too, not only inside each
study.

## 4. A ten-second trial path

Currently the fastest way to try the library is to create a project and install
it. Add a hosted sandbox — a StackBlitz or CodeSandbox starter — linked from
the README's installation section. The generator shows what the layouts look
like; the sandbox lets someone type into the API. Those are different
conversions and the library currently only supports the first.

## 5. Contribution surface

The program's success metric is issues opened by strangers. Make that possible:

- A brief `CONTRIBUTING.md`: how to run the library locally, how to run tests,
  what a useful bug report contains.
- Two or three issues labelled `good first issue`. Real ones — small, scoped,
  genuinely useful. Manufactured busywork is obvious and it costs trust.
- Confirm issue templates exist and ask for the version, platform, and range
  in use, since most layout reports are unactionable without them.

## 6. Verify before publishing anything

Several claims in these documents came from the published README rather than
the source. Before the writing above goes out, confirm against the code: the
platform list, the current major version, the spiral camera's public surface,
and the maximum usable range on each platform. Correct these documents where
they are wrong and say what changed.
