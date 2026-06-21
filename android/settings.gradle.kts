rootProject.name = "golden-grids-android"

// Phase 2b: the pure render-model core is verifiable on its own (no Android SDK).
// The Compose :renderer and :example modules are added once the SDK is wired up.
include(":core")
