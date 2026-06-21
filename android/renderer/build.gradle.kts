plugins {
    id("com.android.library")
    kotlin("android")
    id("org.jetbrains.kotlin.plugin.compose")
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
