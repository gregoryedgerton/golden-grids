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
                options = SpiralWindowOptions(fade = input.getValue("fade").jsonPrimitive.boolean),
            )
            assertClose(expected.getValue("opacity").jsonPrimitive.double, window.opacity, "window opacity")
            assertEquals(expected.getValue("hidden").jsonPrimitive.boolean, window.hidden, "window hidden")
            assertEquals(expected.getValue("focused").jsonPrimitive.boolean, window.focused, "window focused")
        }
    }

    @Test
    fun onScreenCullsMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val onScreens = root.getValue("onScreens").jsonArray
        assertTrue(onScreens.isNotEmpty(), "no on-screen fixtures loaded")
        val frames = root.getValue("frames").jsonArray

        for (element in onScreens) {
            val entry = element.jsonObject
            val name = entry.getValue("frameName").jsonPrimitive.content
            val frameCase = frames.first { it.jsonObject.getValue("name").jsonPrimitive.content == name }.jsonObject
            val input = frameCase.getValue("input").jsonObject
            val f = frameCase.getValue("frame").jsonObject
            val count = input.getValue("count").jsonPrimitive.int
            val layout = generateGoldenGridLayout(
                fib(count),
                clockwise = input.getValue("clockwise").jsonPrimitive.boolean,
                rotate = input.getValue("rotate").jsonPrimitive.int,
            )
            val anchor = input.getValue("anchor").jsonObject
            val on = tileOnScreen(
                SpiralCameraFrame(
                    scale = f.getValue("scale").jsonPrimitive.double,
                    rotationDeg = f.getValue("rotationDeg").jsonPrimitive.double,
                    centerX = f.getValue("centerX").jsonPrimitive.double,
                    centerY = f.getValue("centerY").jsonPrimitive.double,
                ),
                square = layout.squares[entry.getValue("squareIndex").jsonPrimitive.int],
                viewportWidth = input.getValue("viewportWidth").jsonPrimitive.double,
                viewportHeight = input.getValue("viewportHeight").jsonPrimitive.double,
                anchorX = anchor.getValue("x").jsonPrimitive.double,
                anchorY = anchor.getValue("y").jsonPrimitive.double,
                margin = entry.getValue("margin").jsonPrimitive.double,
            )
            assertEquals(entry.getValue("onScreen").jsonPrimitive.boolean, on, "on-screen $name")
        }
    }

    @Test
    fun fadeDepthsMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val fadeDepths = root.getValue("fadeDepths").jsonArray
        assertTrue(fadeDepths.isNotEmpty(), "no fade-depth fixtures loaded")

        for (element in fadeDepths) {
            val entry = element.jsonObject
            val input = entry.getValue("input").jsonObject
            val depth = windowFadeDepth(
                index = input.getValue("index").jsonPrimitive.int,
                squareCount = input.getValue("count").jsonPrimitive.int,
                options = SpiralWindowOptions(fade = input.getValue("fade").jsonPrimitive.boolean),
            )
            assertClose(entry.getValue("depth").jsonPrimitive.double, depth, "fade depth")
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

    @Test
    fun tilesMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val frames = root.getValue("frames").jsonArray.associateBy {
            it.jsonObject.getValue("name").jsonPrimitive.content
        }
        val tiles = root.getValue("tiles").jsonArray
        assertTrue(tiles.isNotEmpty(), "no tile fixtures loaded")

        for (element in tiles) {
            val entry = element.jsonObject
            val frameName = entry.getValue("frameName").jsonPrimitive.content
            val frameCase = frames.getValue(frameName).jsonObject
            val input = frameCase.getValue("input").jsonObject
            val f = frameCase.getValue("frame").jsonObject
            val expected = entry.getValue("tile").jsonObject
            val squareIndex = entry.getValue("squareIndex").jsonPrimitive.int
            val anchor = input.getValue("anchor").jsonObject

            val layout = generateGoldenGridLayout(
                fib(input.getValue("count").jsonPrimitive.int),
                clockwise = input.getValue("clockwise").jsonPrimitive.boolean,
                rotate = input.getValue("rotate").jsonPrimitive.int,
            )
            val tile = tileTransform(
                SpiralCameraFrame(
                    scale = f.getValue("scale").jsonPrimitive.double,
                    rotationDeg = f.getValue("rotationDeg").jsonPrimitive.double,
                    centerX = f.getValue("centerX").jsonPrimitive.double,
                    centerY = f.getValue("centerY").jsonPrimitive.double,
                ),
                square = layout.squares[squareIndex],
                viewportWidth = input.getValue("viewportWidth").jsonPrimitive.double,
                viewportHeight = input.getValue("viewportHeight").jsonPrimitive.double,
                anchorX = anchor.getValue("x").jsonPrimitive.double,
                anchorY = anchor.getValue("y").jsonPrimitive.double,
                texturePx = entry.getValue("texturePx").jsonPrimitive.double,
            )
            assertClose(expected.getValue("translateX").jsonPrimitive.double, tile.translateX, "[$frameName#$squareIndex] tx")
            assertClose(expected.getValue("translateY").jsonPrimitive.double, tile.translateY, "[$frameName#$squareIndex] ty")
            assertClose(expected.getValue("rotationDeg").jsonPrimitive.double, tile.rotationDeg, "[$frameName#$squareIndex] rot")
            assertClose(expected.getValue("scale").jsonPrimitive.double, tile.scale, "[$frameName#$squareIndex] scale")
        }
    }

    @Test
    fun contentsMatchGoldenMaster() {
        val root = Json.parseToJsonElement(locateFixture().readText()).jsonObject
        val frames = root.getValue("frames").jsonArray.associateBy {
            it.jsonObject.getValue("name").jsonPrimitive.content
        }
        val contents = root.getValue("contents").jsonArray
        assertTrue(contents.isNotEmpty(), "no content fixtures loaded")

        for (element in contents) {
            val entry = element.jsonObject
            val frameCase = frames.getValue(entry.getValue("frameName").jsonPrimitive.content).jsonObject
            val f = frameCase.getValue("frame").jsonObject
            val expected = entry.getValue("content").jsonObject
            val content = contentTransform(
                SpiralCameraFrame(
                    scale = f.getValue("scale").jsonPrimitive.double,
                    rotationDeg = f.getValue("rotationDeg").jsonPrimitive.double,
                    centerX = f.getValue("centerX").jsonPrimitive.double,
                    centerY = f.getValue("centerY").jsonPrimitive.double,
                ),
                counterRotate = entry.getValue("counterRotate").jsonPrimitive.boolean,
                cover = entry.getValue("cover").jsonPrimitive.boolean,
            )
            assertClose(expected.getValue("rotationDeg").jsonPrimitive.double, content.rotationDeg, "content rot")
            assertClose(expected.getValue("scale").jsonPrimitive.double, content.scale, "content scale")
        }
    }
}