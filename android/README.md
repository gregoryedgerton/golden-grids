# Golden Grids — Android (Jetpack Compose)

A native Android port of `@gifcommit/golden-grids`, rendered with Jetpack Compose
over the **same** framework-agnostic render model as the web, React Native and
SwiftUI versions. The Kotlin core is verified against the shared
[`render-model.json`](../src/__fixtures__/render-model.json) golden master, so the
spiral proportions, HSL colour progression and slot↔child ordering are identical
across every platform.

## Installation

```kotlin
// settings.gradle.kts — mavenCentral() is usually already there
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
```

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.gifcommit:golden-grids-renderer:5.0.0")
}
```

`golden-grids-renderer` brings `golden-grids-core` with it — you only need the
second coordinate if you want the render model without Compose:

```kotlin
implementation("com.gifcommit:golden-grids-core:5.0.0")
```

The version is the same one npm and SwiftPM use, and it means the same thing:
all four renderers assert against the same committed fixtures, so `5.0.0` on
Gradle draws the identical spiral to `5.0.0` on npm.

## Modules

| Module      | Type                  | What it is                                                                 |
| ----------- | --------------------- | -------------------------------------------------------------------------- |
| `:core`     | Kotlin/JVM library    | Pure `computeRenderModel` (spiral layout, fibonacci range, hex→HSL). No Android dependency. |
| `:renderer` | Android library       | The `GoldenGrid` composable — a thin renderer over the core model.         |
| `:example`  | Android app           | A runnable showcase: a colour-progression grid and content-mapped slots.   |

## The composable

```kotlin
import com.gifcommit.goldengrids.GoldenGrid

// Proportional colour boxes:
GoldenGrid(from = 1, to = 5, color = "#7f7ec7", modifier = Modifier.fillMaxWidth())

// Map your own content into the slots — ordinal 0 = the largest slot:
GoldenGrid(from = 1, to = 4, modifier = Modifier.fillMaxWidth()) { ordinal ->
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("${ordinal + 1}")
    }
}
```

`GoldenGrid(from, to, color, clockwise, placement, modifier, placeholderContent, slotContent)`
mirrors the props of every other platform. When `from > 1`, the skipped-range
placeholder is filled by `placeholderContent`.

## Prerequisites

- **JDK 17 or 21** (an LTS — AGP/Compose do not support JDK 26 yet)
- **Android SDK** with platform 35 and build-tools 35 (set `sdk.dir` in
  `local.properties`, or `ANDROID_HOME`)

The pure `:core` module needs only a JDK — no Android SDK. `:renderer` and
`:example` are added to the build automatically when an SDK is configured
(`ANDROID_HOME` or `local.properties` `sdk.dir`), so `./gradlew :core:test` runs
on a JDK-only machine without evaluating the Android build scripts.

## Build & test

```bash
# Verify the Kotlin core against the cross-language golden master (no SDK needed):
./gradlew :core:test

# Build the example app:
./gradlew :example:assembleDebug
# -> example/build/outputs/apk/debug/example-debug.apk

# Install & launch on a running emulator/device:
adb install -r example/build/outputs/apk/debug/example-debug.apk
adb shell am start -n com.gifcommit.goldengrids.example/.MainActivity
```

Built and verified with Gradle 8.11.1, AGP 8.7.3, Kotlin 2.1.0, Compose BOM 2024.12.01.

## Example screens

`:example` mirrors `Examples/iOS` — five screens, icons-only bottom navigation, each
built with the library: a swipeable **Featured** carousel, a sky **Gallery**,
a stats **Dashboard** (count-up figures, a settling plot, a dusk→night gradient, gliding
selectors), a text-first **Editorial** article, and **Interactive Experiences** — the
depth dial over up to ninety-one squares (the Long ceiling): drag with flick
inertia, DUO/TRIO/QUAD quick sets each laid out and trail-solved for exactly
their count, per-tile `tileTransform` (never one matrix on a shared stage),
labels orientation-locked via `contentTransform`, and only outward squares
fading through `spiralWindow` — with a FADE TAIL switch that flips its `fade`
off, so the tail stays but stops fading, filling the negative space and
bleeding off the page. Squares that have left the viewport are culled by
`tileOnScreen` in either mode (the fade is a look, the cull is geometry).
Each screen builds itself in on appear.

<p align="center">
  <img src="../docs/android/featured.gif" width="200" alt="Featured — a swipeable card carousel" />
  <img src="../docs/android/galleries.gif" width="200" alt="Galleries — sky gradients with sun and moon" />
  <img src="../docs/android/dashboards.gif" width="200" alt="Dashboards — a bento of stats" />
  <img src="../docs/android/editorial.gif" width="200" alt="Editorial — a text-first copy grid" />
</p>

## Publishing

Artifacts go to Maven Central under the `com.gifcommit` namespace, published by
[`publish-android.yml`](../.github/workflows/publish-android.yml) when a GitHub
Release is created. The version is read from `package.json` rather than
declared here, so it cannot drift from the npm and SwiftPM lines.

Four repository secrets are required:

| Secret | Where it comes from |
| --- | --- |
| `MAVEN_CENTRAL_USERNAME` | Central Portal → Generate User Token (username half) — *not* the portal login |
| `MAVEN_CENTRAL_PASSWORD` | the same token's password half |
| `SIGNING_KEY` | `gpg --export-secret-keys --armor <key-id>` — the full ASCII-armored block |
| `SIGNING_PASSWORD` | that key's passphrase |

The workflow checks all four before it builds anything, so a missing secret
fails in seconds with its name rather than deep inside Gradle.

Publishing **stages** a deployment; it does not make it public. Releasing is a
click at [central.sonatype.com/publishing/deployments](https://central.sonatype.com/publishing/deployments).
Maven Central is immutable — a released version can never be changed or
withdrawn — which is why the last step is deliberately manual. Switching the
workflow's task to `publishAndReleaseToMavenCentral` makes it automatic once
you trust it.

To try the artifacts against a real consumer before any of that:

```bash
cd android && ./gradlew publishToMavenLocal
```

That works without signing keys (signing is gated on the key being present)
and puts both artifacts in `~/.m2`, resolvable by adding `mavenLocal()` to a
test project.
