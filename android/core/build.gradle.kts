plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    id("com.vanniktech.maven.publish")
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
    testLogging { showStandardStreams = true }
}


// Published to Maven Central so an Android consumer can depend on the pure
// model without pulling in Compose. `publishToMavenCentral()` stages the
// deployment; releasing it is the `publishAndReleaseToMavenCentral` task, and
// which one CI runs is the workflow's decision — see publish-android.yml.
mavenPublishing {
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
    coordinates("com.gifcommit", "golden-grids-core", version.toString())
    pom {
        name.set("Golden Grids Core")
        description.set("The framework-agnostic golden-ratio render model — spiral layout, Fibonacci range, hex to HSL, and the spiral depth camera. Verified against the same golden-master fixtures as the web, React Native and SwiftUI versions.")
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
