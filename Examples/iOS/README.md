# Golden Grids — iOS example app

A small runnable SwiftUI app that shows `GoldenGrid` (from the root Swift
package) used five different ways. It depends on the package via a local path
(`../..`), so it always builds against the source in this repo.

## Run it

The Xcode project is generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(the `.xcodeproj` is gitignored; `project.yml` is the source of truth):

```bash
brew install xcodegen          # once
cd Examples/iOS
xcodegen generate              # writes GoldenGridsExamples.xcodeproj
open GoldenGridsExamples.xcodeproj
# ⌘R on any iOS simulator
```

Or straight from the command line:

```bash
xcodebuild -project GoldenGridsExamples.xcodeproj -scheme GoldenGridsExamples \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' build
```

## The five screens

The first four are thin SwiftUI views over `GoldenGrid`. The slot closure is
keyed by child ordinal (`0` = the largest / most prominent slot). The grids keep
the box count low and use `placement:` to rotate the φ-rectangle into portrait
so it fills the phone instead of leaving dead space. The fifth drives the spiral
camera directly.

**Featured** — a two-box card (headline + standfirst) with faded ghost cards bleeding off either side to suggest a swipeable carousel:

```swift
GoldenGrid(from: 1, to: 2, placement: .top) { ordinal in
    ordinal == 0 ? Hero() : Standfirst()
}
```

**Galleries** — four sky gradients in transparent slots, each with its sun or moon placed for an east-coast, ocean-facing vantage:

```swift
GoldenGrid(from: 1, to: 4, placement: .bottom) { i in
    LinearGradient(colors: skies[i].stops, startPoint: .top, endPoint: .bottom)
        .overlay { celestialBody(skies[i]) }
}
```

**Dashboards** — a bento of stats: a tinted hero, a grayscale Sleep gradient, an abstract data plot, and two emoji-slider tiles:

```swift
GoldenGrid(from: 1, to: 4, placement: .top) { ordinal in
    statTile(for: ordinal)
}
```

**Editorial** — a line-less grid whose boxes hold copy (headline, platforms list, body), plus a second single-tile grid whose copy fades out under a gradient:

```swift
GoldenGrid(from: 1, to: 3, placement: .right) { ordinal in
    switch ordinal { case 0: Body(); case 1: Platforms(); default: Headline() }
}
```

**Spiral** — the depth camera rather than the flat grid: NINETY-ONE squares
(the Int64 ceiling — a 92-square layout's bounds overflow) laid out with the
trail solved for a portrait stage (`trailToRotateDeg`). Every tile carries its
own `toAffineTileTransform` (never one matrix on a shared stage — that
rasterizes the deep squares and upscales the mush), labels stay upright via
`contentTransform`, `spiralWindow` fades only the outward squares, and depth
is driven by a drag with long flick inertia (0.97/frame decay — the ride is
the demo). In the slider's old seat: segmented NUMBER FILTERS — ALL (1–91),
ODD, EVEN, PRIME — each re-dialing the same numbers through a spiral laid out
for exactly that count (layout and trail re-solved per count; the number is
the tile's content, its geometry comes from its filtered position):

```swift
let frame = spiralCamera(layout, depth: depth, viewportWidth: w, viewportHeight: h,
                         options: SpiralCameraOptions(fillRatio: 0.85, clockwise: true))
tileView.transformEffect(toAffineTileTransform(frame, square: square,
                                               viewportWidth: w, viewportHeight: h))
```

Screenshot hooks for this screen: `SIMCTL_CHILD_GG_DEPTH` starts the dial at
a depth, `SIMCTL_CHILD_GG_FILTER` selects a segment (all/odd/even/prime), and
`SIMCTL_CHILD_GG_AUTOSPIN` dials at N squares/second (how the README gif is
recorded).
