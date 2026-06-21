package com.gifcommit.goldengrids

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import java.io.File
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlin.test.fail

/**
 * Verifies the Kotlin `computeRenderModel` against the shared, cross-language
 * golden master at src/__fixtures__/render-model.json — the same fixture the web,
 * React Native and Swift ports are checked against. Numbers compare within 1e-9.
 */
class RenderModelFixtureTest {
    private val json = Json {
        classDiscriminator = "kind"
        encodeDefaults = true
    }

    @Test
    fun matchesGoldenMaster() {
        val fixture = locateFixture()
        val root = json.parseToJsonElement(fixture.readText()).jsonObject

        var checked = 0
        for ((name, entry) in root) {
            val obj = entry.jsonObject
            val input = json.decodeFromJsonElement(RenderModelInput.serializer(), obj.getValue("input"))
            val expected = obj.getValue("model")
            val actual = json.encodeToJsonElement(RenderModel.serializer(), computeRenderModel(input))
            if (!approxEqual(actual, expected)) {
                fail("Render model mismatch for \"$name\":\n  expected: $expected\n  actual:   $actual")
            }
            checked++
        }
        assertTrue(checked > 0, "No fixture entries were found")
        println("✓ Kotlin render model matches all $checked render-model.json entries")
    }

    /**
     * Fibonacci values exceed Int.MAX_VALUE at F(47); the README documents the
     * from/to range up to 78. With 32-bit coordinates these would overflow to
     * negative garbage — assert the full documented range stays valid (all rects
     * normalised in [0,1], positive finite aspect ratio).
     */
    @Test
    fun largeRangeDoesNotOverflow() {
        for (to in intArrayOf(46, 47, 60, 78)) {
            val model = computeRenderModel(RenderModelInput(to = to, color = "#7f7ec7"))
            assertTrue(model.kind == "grid", "to=$to should be a grid")
            val ar = model.aspectRatio
            assertTrue(
                ar.w > 0.0 && ar.h > 0.0 && ar.w.isFinite() && ar.h.isFinite(),
                "to=$to aspect ratio must be positive and finite, got $ar",
            )
            assertTrue(model.slots.isNotEmpty(), "to=$to must have slots")
            for (s in model.slots) {
                val r = s.rect
                assertTrue(
                    r.left >= 0.0 && r.top >= 0.0 &&
                        r.width > 0.0 && r.height > 0.0 &&
                        r.left + r.width <= 1.0 + 1e-9 && r.top + r.height <= 1.0 + 1e-9,
                    "to=$to produced an out-of-range (overflowed) rect: $r",
                )
            }
        }
    }

    private fun locateFixture(): File {
        val rel = "src/__fixtures__/render-model.json"
        val candidates = listOf("../$rel", "../../$rel", rel)
        return candidates.map { File(it) }.firstOrNull { it.exists() }
            ?: error("render-model.json not found (cwd ${File(".").absolutePath})")
    }

    private fun approxEqual(a: JsonElement, b: JsonElement, eps: Double = 1e-9): Boolean = when {
        a is JsonObject && b is JsonObject ->
            a.keys == b.keys && a.all { (k, v) -> approxEqual(v, b.getValue(k), eps) }
        a is JsonArray && b is JsonArray ->
            a.size == b.size && a.indices.all { approxEqual(a[it], b[it], eps) }
        a is JsonPrimitive && b is JsonPrimitive -> {
            if (a.isString || b.isString) {
                a.content == b.content
            } else {
                val an = a.content.toDoubleOrNull()
                val bn = b.content.toDoubleOrNull()
                if (an != null && bn != null) abs(an - bn) <= eps else a.content == b.content
            }
        }
        else -> a == b
    }
}
