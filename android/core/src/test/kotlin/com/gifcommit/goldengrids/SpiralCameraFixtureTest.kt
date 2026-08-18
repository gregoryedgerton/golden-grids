package com.gifcommit.goldengrids

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Verifies the Kotlin spiral camera against the shared, cross-language golden
 * master at src/__fixtures__/spiral-camera.json — the same fixture the web and
 * Swift ports are checked against. Layouts are rebuilt from each entry's
 * (fibCount, clockwise, rotate), so the camera fixtures also exercise the
 * layout port. Numbers compare within 1e-9.
 */
class SpiralCameraFixtureTest {
    @Serializable
    private data class CameraInput(
        val fibCount: Int,
        val clockwise: Boolean,
        val rotate: Int,
        val depth: Double,
        val viewportWidth: Double,
        val viewportHeight: Double,
        val fillRatio: Double? = null,
    )

    @Serializable
    private data class WindowInput(
        val index: Int,
        val depth: Double,
        val squareCount: Int,
        val holdSteps: Double? = null,
        val fadeSteps: Double? = null,
    )

    @Serializable
    private data class TrailInput(val trail: SpiralTrail, val clockwise: Boolean, val squareCount: Int)

    @Serializable
    private data class EyeInput(val fibCount: Int, val clockwise: Boolean, val rotate: Int)

    @Serializable
    private data class CameraCase(val name: String, val input: CameraInput, val frame: SpiralCameraFrame)

    @Serializable
    private data class WindowCase(val name: String, val input: WindowInput, val window: SpiralWindow)

    @Serializable
    private data class TrailCase(val input: TrailInput, val rotateDeg: Int)

    @Serializable
    private data class EyeCase(val name: String, val input: EyeInput, val eye: SpiralPoint)

    @Serializable
    private data class Fixture(
        val camera: List<CameraCase>,
        val window: List<WindowCase>,
        val trail: List<TrailCase>,
        val eye: List<EyeCase>,
    )

    private val tol = 1e-9

    private fun fib(n: Int): List<Long> {
        val seq = mutableListOf(1L, 1L)
        while (seq.size < n) seq.add(seq[seq.size - 1] + seq[seq.size - 2])
        return seq
    }

    private fun loadFixture(): Fixture {
        val rel = "src/__fixtures__/spiral-camera.json"
        val candidates = listOf("../$rel", "../../$rel", rel)
        val file = candidates.map { File(it) }.firstOrNull { it.exists() }
            ?: error("spiral-camera.json not found (cwd ${File(".").absolutePath})")
        return Json.decodeFromString(Fixture.serializer(), file.readText())
    }

    private fun assertNear(expected: Double, actual: Double, label: String) {
        assertTrue(abs(expected - actual) <= tol, "$label: expected $expected, got $actual")
    }

    @Test
    fun cameraFramesMatchGoldenMaster() {
        val fixture = loadFixture()
        assertTrue(fixture.camera.isNotEmpty(), "no camera fixtures loaded")

        for (entry in fixture.camera) {
            val input = entry.input
            val layout = generateGoldenGridLayout(fib(input.fibCount), input.clockwise, input.rotate)
            val got = spiralCamera(
                layout,
                depth = input.depth,
                viewportWidth = input.viewportWidth,
                viewportHeight = input.viewportHeight,
                fillRatio = input.fillRatio ?: 0.62,
                clockwise = input.clockwise,
            )
            assertNear(entry.frame.scale, got.scale, "[${entry.name}] scale")
            assertNear(entry.frame.rotationDeg, got.rotationDeg, "[${entry.name}] rotationDeg")
            assertNear(entry.frame.centerX, got.centerX, "[${entry.name}] centerX")
            assertNear(entry.frame.centerY, got.centerY, "[${entry.name}] centerY")
        }
        println("✓ Kotlin spiral camera matches all ${fixture.camera.size} camera fixtures")
    }

    @Test
    fun windowsMatchGoldenMaster() {
        val fixture = loadFixture()
        assertTrue(fixture.window.isNotEmpty(), "no window fixtures loaded")

        for (entry in fixture.window) {
            val input = entry.input
            val got = spiralWindow(
                index = input.index,
                depth = input.depth,
                squareCount = input.squareCount,
                holdSteps = input.holdSteps ?: 1.0,
                fadeSteps = input.fadeSteps ?: 2.5,
            )
            assertNear(entry.window.opacity, got.opacity, "[${entry.name}] opacity")
            assertEquals(entry.window.hidden, got.hidden, "[${entry.name}] hidden")
            assertEquals(entry.window.focused, got.focused, "[${entry.name}] focused")
        }
    }

    @Test
    fun trailSolvesMatchGoldenMasterAndRoundTrip() {
        val fixture = loadFixture()
        assertTrue(fixture.trail.isNotEmpty(), "no trail fixtures loaded")

        for (entry in fixture.trail) {
            val input = entry.input
            assertEquals(
                entry.rotateDeg,
                trailToRotateDeg(input.trail, input.clockwise, input.squareCount),
                "trail ${input.trail} cw=${input.clockwise} n=${input.squareCount}",
            )
            assertEquals(
                input.trail,
                trailForRotation(entry.rotateDeg, input.clockwise, input.squareCount),
                "round-trip ${entry.rotateDeg} cw=${input.clockwise} n=${input.squareCount}",
            )
        }
    }

    @Test
    fun eyesMatchGoldenMaster() {
        val fixture = loadFixture()
        assertTrue(fixture.eye.isNotEmpty(), "no eye fixtures loaded")

        for (entry in fixture.eye) {
            val input = entry.input
            val layout = generateGoldenGridLayout(fib(input.fibCount), input.clockwise, input.rotate)
            val got = spiralEye(layout)
            assertNear(entry.eye.x, got.x, "[${entry.name}] x")
            assertNear(entry.eye.y, got.y, "[${entry.name}] y")
        }
    }

    @Test
    fun graphicsLayerTransformLandsTheFocusOnTheAnchor() {
        // Not fixture-backed (the decomposition is Compose-specific): applying
        // translate ∘ rotate ∘ scale to the focus point must land it exactly
        // on the anchor, whole and fractional depths alike.
        val layout = generateGoldenGridLayout(fib(9), true, 90)
        for (depth in listOf(0.0, 1.0, 2.4, 6.75)) {
            val frame = spiralCamera(layout, depth, 1080.0, 1920.0)
            val t = toGraphicsLayerTransform(frame, 1080.0, 1920.0)
            val rad = Math.toRadians(t.rotationDeg)
            val x = t.translationX + t.scale * (Math.cos(rad) * frame.centerX - Math.sin(rad) * frame.centerY)
            val y = t.translationY + t.scale * (Math.sin(rad) * frame.centerX + Math.cos(rad) * frame.centerY)
            assertTrue(abs(x - 540.0) < 1e-6 && abs(y - 960.0) < 1e-6, "depth $depth: focus landed at ($x, $y)")
        }
    }
}
