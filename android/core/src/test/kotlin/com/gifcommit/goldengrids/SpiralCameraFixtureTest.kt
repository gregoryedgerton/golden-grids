package com.gifcommit.goldengrids

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.io.File
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.fail

/**
 * Verifies the Kotlin spiral camera against the shared, cross-language golden
 * master at src/__fixtures__/spiral-camera.json — the same fixture the web and
 * Swift ports are checked against. Numbers compare within 1e-9.
 */
class SpiralCameraFixtureTest {
    private val tol = 1e-9

    private fun fib(n: Int): List<Long> {
        val seq = mutableListOf(1L, 1L)
        while (seq.size < n) seq.add(seq[seq.size - 1] + seq[seq.size - 2])
        return seq
    }

    private fun locateFixture(): File {
        var dir: File? = File(System.getProperty("user.dir"))
        while (dir != null) {
            val candidate = File(dir, "src/__fixtures__/spiral-camera.json")
            if (candidate.exists()) return candidate
            dir = dir.parentFile
        }
        fail("spiral-camera.json not found above ${System.getProperty("user.dir")}")
    }

    private fun assertClose(expected: Double, actual: Double, label: String) {
        assertTrue(abs(expected - actual) <= tol, "$label: expected $expected got $actual")
    }

    @Test
    fun framesMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val frames = root.getValue("frames").jsonArray
        assertTrue(frames.isNotEmpty(), "no frame fixtures loaded")

        for (element in frames) {
            val entry = element.jsonObject
            val name = entry.getValue("name").jsonPrimitive.content
            val input = entry.getValue("input").jsonObject
            val expected = entry.getValue("frame").jsonObject
            val affine = entry.getValue("affine").jsonArray.map { it.jsonPrimitive.double }
            val anchor = input.getValue("anchor").jsonObject

            val layout = generateGoldenGridLayout(
                fib(input.getValue("count").jsonPrimitive.int),
                clockwise = input.getValue("clockwise").jsonPrimitive.boolean,
                rotate = input.getValue("rotate").jsonPrimitive.int,
            )
            val frame = spiralCamera(
                layout,
                depth = input.getValue("depth").jsonPrimitive.double,
                viewportWidth = input.getValue("viewportWidth").jsonPrimitive.double,
                viewportHeight = input.getValue("viewportHeight").jsonPrimitive.double,
                options = SpiralCameraOptions(
                    fillRatio = input.getValue("fillRatio").jsonPrimitive.double,
                    clockwise = input.getValue("clockwise").jsonPrimitive.boolean,
                ),
            )
            assertClose(expected.getValue("scale").jsonPrimitive.double, frame.scale, "[$name] scale")
            assertClose(expected.getValue("rotationDeg").jsonPrimitive.double, frame.rotationDeg, "[$name] rotationDeg")
            assertClose(expected.getValue("centerX").jsonPrimitive.double, frame.centerX, "[$name] centerX")
            assertClose(expected.getValue("centerY").jsonPrimitive.double, frame.centerY, "[$name] centerY")

            val transform = toGraphicsLayerTransform(
                frame,
                viewportWidth = input.getValue("viewportWidth").jsonPrimitive.double,
                viewportHeight = input.getValue("viewportHeight").jsonPrimitive.double,
                anchorX = anchor.getValue("x").jsonPrimitive.double,
                anchorY = anchor.getValue("y").jsonPrimitive.double,
            )
            val got = transform.affine
            for (i in affine.indices) {
                assertClose(affine[i], got[i], "[$name] affine[$i]")
            }
        }
    }

    @Test
    fun windowsMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val windows = root.getValue("windows").jsonArray
        assertTrue(windows.isNotEmpty(), "no window fixtures loaded")

        for (element in windows) {
            val entry = element.jsonObject
            val input = entry.getValue("input").jsonObject
            val expected = entry.getValue("window").jsonObject
            val window = spiralWindow(
                index = input.getValue("index").jsonPrimitive.int,
                depth = input.getValue("depth").jsonPrimitive.double,
                squareCount = input.getValue("count").jsonPrimitive.int,
                options = SpiralWindowOptions(
                    holdSteps = input.getValue("holdSteps").jsonPrimitive.double,
                    fadeSteps = input.getValue("fadeSteps").jsonPrimitive.double,
                ),
            )
            assertClose(expected.getValue("opacity").jsonPrimitive.double, window.opacity, "window opacity")
            assertEquals(expected.getValue("hidden").jsonPrimitive.boolean, window.hidden, "window hidden")
            assertEquals(expected.getValue("focused").jsonPrimitive.boolean, window.focused, "window focused")
        }
    }

    @Test
    fun trailSolvesMatchTheMatrixAndInvert() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val trails = root.getValue("trails").jsonArray
        assertTrue(trails.isNotEmpty(), "no trail fixtures loaded")

        for (element in trails) {
            val entry = element.jsonObject
            val count = entry.getValue("count").jsonPrimitive.int
            val clockwise = entry.getValue("clockwise").jsonPrimitive.boolean
            val trail = SpiralTrail.valueOf(entry.getValue("trail").jsonPrimitive.content)
            val rotate = entry.getValue("rotate").jsonPrimitive.int

            assertEquals(rotate, trailToRotateDeg(trail, clockwise, count), "trail $trail count $count cw $clockwise")
            assertEquals(trail, trailForRotation(rotate, clockwise, count), "inverse rotate $rotate count $count cw $clockwise")
        }
    }

    @Test
    fun eyesMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val eyes = root.getValue("eyes").jsonArray
        assertTrue(eyes.isNotEmpty(), "no eye fixtures loaded")

        for (element in eyes) {
            val entry = element.jsonObject
            val input = entry.getValue("input").jsonObject
            val expected = entry.getValue("eye").jsonObject
            val layout = generateGoldenGridLayout(
                fib(input.getValue("count").jsonPrimitive.int),
                clockwise = input.getValue("clockwise").jsonPrimitive.boolean,
                rotate = input.getValue("rotate").jsonPrimitive.int,
            )
            val (x, y) = spiralEye(layout)
            assertClose(expected.getValue("x").jsonPrimitive.double, x, "eye x")
            assertClose(expected.getValue("y").jsonPrimitive.double, y, "eye y")
        }
    }
}
