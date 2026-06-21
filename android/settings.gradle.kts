pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "golden-grids-android"

// :core is pure Kotlin/JVM and needs no Android SDK.
include(":core")

// :renderer (Compose library) and :example (app) need the Android SDK. Include
// them only when an SDK is configured — Gradle's configuration phase evaluates
// every participating project's build script, and AGP fails without sdk.dir /
// ANDROID_HOME. Gating the include keeps `./gradlew :core:test` buildable with
// only a JDK; the modules appear automatically once an SDK is present.
val hasAndroidSdk = System.getenv("ANDROID_HOME") != null ||
    System.getenv("ANDROID_SDK_ROOT") != null ||
    file("local.properties").let { it.exists() && it.readText().contains("sdk.dir") }

if (hasAndroidSdk) {
    include(":renderer", ":example")
} else {
    println("golden-grids: no Android SDK detected — configuring :core only. Set ANDROID_HOME or local.properties 'sdk.dir' to build :renderer and :example.")
}
