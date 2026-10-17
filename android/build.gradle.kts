plugins {
    id("com.android.application") version "8.7.3" apply false
    id("com.android.library") version "8.7.3" apply false
    id("com.vanniktech.maven.publish") version "0.34.0" apply false
    kotlin("jvm") version "2.1.0" apply false
    kotlin("android") version "2.1.0" apply false
    kotlin("plugin.serialization") version "2.1.0" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.0" apply false
}

// The published version is the REPO's version, read straight from package.json
// rather than declared again here.
//
// golden-grids ships one render model to four consumers, and they assert
// against the same committed fixtures — so "5.0.0" has to mean the same
// geometry whether it arrives by npm, SwiftPM or Gradle. A second version line
// for Android would make that unanswerable. SwiftPM already works this way
// (it resolves the `v*` tags semantic-release cuts), so this makes Android the
// third consumer on one line rather than the one exception.
//
// The cost, stated plainly: a release that only touches web still publishes
// identical Android artifacts, and Maven Central is immutable — they cannot be
// cleaned up later. The alternative leaves gaps (5.1.0 on npm, absent on
// Maven), which is worse to explain than a few duplicate bytes.
@Suppress("UNCHECKED_CAST")
val packageJson = groovy.json.JsonSlurper().parse(file("../package.json")) as Map<String, Any>

allprojects {
    group = "com.gifcommit"
    version = packageJson["version"] as String
}
