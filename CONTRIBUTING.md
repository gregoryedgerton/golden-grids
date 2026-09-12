# Contributing

Bug reports from people using the library are the most valuable thing this
repo receives. If a layout came out wrong, please say so.

## Running it locally

```bash
git clone https://github.com/gregoryedgerton/golden-grids
cd golden-grids
npm install
npm run setup     # once — installs the git hooks
npm run dev       # the generator, on http://localhost:5173
```

`npm run build` builds the library to `dist/` (web and `/native` entries).

## Running the tests

```bash
npm test
```

The web library has 100% coverage and the suite includes two golden masters,
`src/__fixtures__/render-model.json` and `src/__fixtures__/spiral-camera.json`,
that the Swift and Kotlin ports are asserted against. If you change layout or
camera math on purpose, regenerate them with `npm run gen:fixtures` and
re-run the native suites:

- iOS: `swift test` from the repo root.
- Android: `./gradlew test` from `android/`.

A change to the model that is not reflected in all three is a bug, not a
feature.

## What a useful bug report contains

Most layout reports cannot be acted on without these:

- **Version** — `npm ls @gifcommit/golden-grids`, or the Swift package /
  Gradle version.
- **Platform** — React web, React Native, SwiftUI, Compose, or the generator.
- **The range** — the exact `from`, `to`, `placement`, and `clockwise` values.
  Most reports reduce to one range that misbehaves.
- **What you expected and what you saw.** A screenshot helps; a screenshot
  from the [generator](https://gregoryedgerton.github.io/golden-grids/) with
  the same range helps more, because it isolates the library from your CSS.
- **A minimal reproduction**, if it is not just a range — a StackBlitz from the
  [study template](https://stackblitz.com/github/gregoryedgerton/golden-grids-study-template)
  is the quickest way to make one.

The issue template asks for all of this.

## Pull requests

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  `fix:`, `feat:`, `docs:`, `chore:`. Releases are cut automatically from
  them by semantic-release, so a `feat!:` with a `BREAKING CHANGE:` footer is a
  major bump. Say what changed for a consumer, not what changed in the code.
- Keep the library's restraint. It lays out boxes and nothing else — no
  breakpoints, no styling, no component library. See the README's position on
  responsiveness before proposing either.
- Anything that changes geometry must update the golden masters and pass on
  all four platforms.

## Where to start

Issues labelled
[`good first issue`](https://github.com/gregoryedgerton/golden-grids/labels/good%20first%20issue)
are small, scoped, and genuinely useful. Comment on one before starting so two
people do not do the same work.
