plugins {
    id("com.android.library")
    kotlin("android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.vanniktech.maven.publish")
}

android {
    namespace = "com.gifcommit.goldengrids"
    compileSdk = 35
    defaultConfig { minSdk = 24 }
    buildFeatures { compose = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    api(project(":core"))
    // GoldenGrid's public signature exposes Compose types — Modifier (ui) and
    // @Composable (runtime) — so those plus the BOM are `api`, putting them on a
    // consumer's compile classpath transitively. foundation is internal-only
    // (Box / BoxWithConstraints / background), so it stays `implementation`.
    api(platform("androidx.compose:compose-bom:2024.12.01"))
    api("androidx.compose.ui:ui")
    api("androidx.compose.runtime:runtime")
    implementation("androidx.compose.foundation:foundation")
}


// The artifact most consumers want: the composable. `api(project(":core"))`
// above resolves to the published golden-grids-core coordinate in the POM, so
// depending on this one is enough.
mavenPublishing {
    // AGP's javadoc jar is switched OFF and replaced by an empty one below.
    // Maven Central requires the artifact to EXIST; it does not require
    // content. AGP's bundled Dokka cannot generate one here — it dies with
    // "PermittedSubclasses requires ASM9" on the sealed types in the Compose
    // classpath, on JDK 17 and 21 alike — and Javadoc is the wrong format for
    // Kotlin regardless. The sources jar carries the KDoc, which is what a
    // consumer's IDE actually reads.
    configure(
        com.vanniktech.maven.publish.AndroidSingleVariantLibrary(
            variant = "release",
            sourcesJar = true,
            publishJavadocJar = false,
        ),
    )

    publishToMavenCentral()
    // Maven Central requires a PGP signature, supplied in CI from
    // ORG_GRADLE_PROJECT_signingInMemoryKey. Gated on the key actually being
    // present so `publishToMavenLocal` still works on a machine without one —
    // useful for trying the artifacts against a real consumer before release.
    // An unsigned bundle cannot reach Central regardless: the Portal rejects
    // it, and publish-android.yml fails before it starts if the secret is
    // missing.
    if (providers.gradleProperty("signingInMemoryKey").isPresent) {
        signAllPublications()
    }
    coordinates("com.gifcommit", "golden-grids-renderer", version.toString())
    pom {
        name.set("Golden Grids for Jetpack Compose")
        description.set("A golden-ratio grid layout for Jetpack Compose. The GoldenGrid composable renders proportional slots over the shared golden-grids render model, identical to the web, React Native and SwiftUI versions.")
        inceptionYear.set("2025")
        url.set("https://github.com/gregoryedgerton/golden-grids")
        licenses {
            license {
                name.set("MIT License")
                url.set("https://github.com/gregoryedgerton/golden-grids/blob/main/LICENSE")
                distribution.set("repo")
            }
        }
        developers {
            developer {
                id.set("gregoryedgerton")
                name.set("Gregory Edgerton")
                url.set("https://github.com/gregoryedgerton")
            }
        }
        scm {
            url.set("https://github.com/gregoryedgerton/golden-grids")
            connection.set("scm:git:https://github.com/gregoryedgerton/golden-grids.git")
            developerConnection.set("scm:git:ssh://git@github.com/gregoryedgerton/golden-grids.git")
        }
    }
}

// The empty javadoc jar itself. Added by hand rather than through the publish
// plugin's `JavadocJar.Empty()` because that parameter arrived after 0.34.0,
// and 0.34.0 is the newest release that still supports this project's Kotlin
// 2.1 — upgrading the Kotlin toolchain to reach a newer plugin is a change
// that does not belong in a publishing PR.
val emptyJavadocJar by tasks.registering(Jar::class) {
    archiveClassifier.set("javadoc")
}

afterEvaluate {
    publishing.publications.withType<MavenPublication>().configureEach {
        artifact(emptyJavadocJar)
    }
}
