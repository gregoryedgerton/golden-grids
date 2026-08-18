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

**Spiral** — the depth camera rather than the flat grid: fifteen squares laid
out with the trail solved for a portrait stage (`trailToRotateDeg`), one
`toAffineTransform` on the stage, `spiralWindow` fading tiles in and out, and
depth bound to a slider or a vertical drag:

```swift
let frame = spiralCamera(layout, depth: depth, viewportWidth: w, viewportHeight: h,
                         options: SpiralCameraOptions(fillRatio: 0.62, clockwise: true))
stage.transformEffect(toAffineTransform(frame, viewportWidth: w, viewportHeight: h))
```
