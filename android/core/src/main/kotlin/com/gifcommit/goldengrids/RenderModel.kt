package com.gifcommit.goldengrids

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Pure, framework-agnostic render model — Kotlin port of src/utils/renderModel.ts
// (and its Swift counterpart in Sources/GoldenGrids). All ratios are computed in
// Double so the output matches the shared render-model.json golden master.

enum class PlacementValue { right, bottom, left, top }

@Serializable
data class Rect(val left: Double, val top: Double, val width: Double, val height: Double)

/** Platform-neutral fill. `Hsl` is the computed progression; `Raw` passes the
 *  user's colour string through verbatim (placeholder). `null` = transparent. */
@Serializable
sealed class FillColor {
    @Serializable @SerialName("hsl")
    data class Hsl(val h: Double, val s: Double, val l: Double) : FillColor()

    @Serializable @SerialName("raw")
    data class Raw(val value: String) : FillColor()
}

@Serializable
data class RenderSlot(val rect: Rect, val color: FillColor? = null, val childIndex: Int)

@Serializable
data class RenderPlaceholder(val rect: Rect, val color: FillColor? = null)

@Serializable
data class AspectRatio(val w: Double, val h: Double)

@Serializable
data class RenderModel(
    val kind: String, // "empty" | "single" | "grid"
    val aspectRatio: AspectRatio,
    val slots: List<RenderSlot>,
    val placeholder: RenderPlaceholder? = null,
)

@Serializable
data class RenderModelInput(
    val from: Int? = null,
    val to: Int? = null,
    val color: String? = null,
    val clockwise: Boolean? = null,
    val placement: PlacementValue? = null,
)

// ---- spiral layout (port of gridGenerator.ts) ----

data class Square(var x: Int, var y: Int, val size: Int)

data class GridLayout(
    val squares: List<Square>,
    val width: Int,
    val height: Int,
    val minX: Int,
    val minY: Int,
)

internal fun placementToRotateDeg(placement: PlacementValue, clockwise: Boolean, startIdx: Int): Int {
    val placementDeg = mapOf(
        PlacementValue.right to 0, PlacementValue.bottom to 90,
        PlacementValue.left to 180, PlacementValue.top to 270,
    )
    val desiredDeg = placementDeg.getValue(placement)
    if (startIdx < 2) return (desiredDeg + 360) % 360
    val cwNatural = intArrayOf(90, 180, 270, 0)
    val ccwNatural = intArrayOf(270, 180, 90, 0)
    val naturalDeg = (if (clockwise) cwNatural else ccwNatural)[(startIdx - 2) % 4]
    return (desiredDeg - naturalDeg + 360) % 360
}

fun generateGoldenGridLayout(fibSequence: List<Int>, clockwise: Boolean = true, rotate: Int = 0): GridLayout {
    require(fibSequence.size >= 2) { "Need at least two numbers in the sequence." }
    require(rotate in listOf(0, 90, 180, 270)) { "Invalid rotation value: $rotate." }

    val squares = mutableListOf<Square>()
    var minX = Int.MAX_VALUE; var maxX = Int.MIN_VALUE; var minY = Int.MAX_VALUE; var maxY = Int.MIN_VALUE

    fun expandBounds(sq: Square) {
        if (sq.x < minX) minX = sq.x
        if (sq.x + sq.size - 1 > maxX) maxX = sq.x + sq.size - 1
        if (sq.y < minY) minY = sq.y
        if (sq.y + sq.size - 1 > maxY) maxY = sq.y + sq.size - 1
    }
    fun recalcBounds() {
        minX = Int.MAX_VALUE; maxX = Int.MIN_VALUE; minY = Int.MAX_VALUE; maxY = Int.MIN_VALUE
        for (s in squares) expandBounds(s)
    }

    squares.add(Square(0, 0, fibSequence[0]))
    squares.add(Square(fibSequence[0], 0, fibSequence[1]))
    expandBounds(squares[0]); expandBounds(squares[1])

    // CW: bottom → left → top → right ; CCW: top → left → bottom → right
    val directions = if (clockwise) listOf(0 to 1, -1 to 0, 0 to -1, 1 to 0)
    else listOf(0 to -1, -1 to 0, 0 to 1, 1 to 0)
    var dirIndex = 0

    for (i in 2 until fibSequence.size) {
        val size = fibSequence[i]
        val (dx, dy) = directions[dirIndex]
        val xPos: Int; val yPos: Int
        when {
            dx == 0 && dy == 1 -> { xPos = minX; yPos = maxY + 1 }              // bottom
            dx == -1 && dy == 0 -> { xPos = minX - size; yPos = maxY - size + 1 } // left
            dx == 0 && dy == -1 -> { xPos = maxX - size + 1; yPos = minY - size } // top
            else -> { xPos = maxX + 1; yPos = minY }                            // right
        }
        val sq = Square(xPos, yPos, size)
        squares.add(sq)
        expandBounds(sq)
        dirIndex = (dirIndex + 1) % directions.size
    }

    if (rotate != 0) {
        for (sq in squares) {
            val tempX = sq.x; val tempY = sq.y; val size = sq.size
            when (rotate) {
                90 -> { sq.x = -tempY - size + 1; sq.y = tempX }
                180 -> { sq.x = -tempX - size + 1; sq.y = -tempY - size + 1 }
                270 -> { sq.x = tempY; sq.y = -tempX - size + 1 }
            }
        }
        recalcBounds()
    }

    return GridLayout(squares.toList(), maxX - minX + 1, maxY - minY + 1, minX, minY)
}

// ---- fibonacci (port of fibonacci.ts subset) ----

internal fun fullFibonacciUpTo(n: Int): List<Int> {
    val arr = mutableListOf(1, 1)
    while (arr.last() < n) arr.add(arr[arr.size - 1] + arr[arr.size - 2])
    return arr.filter { it <= n }
}

internal data class GridRange(val userSequence: List<Int>, val startIdx: Int, val endIdx: Int)

internal fun getGridRange(fromIdx: Int, toIdx: Int): GridRange? {
    var startPos = minOf(fromIdx, toIdx)
    val endPos = maxOf(fromIdx, toIdx)
    if (endPos == 0) return null
    if (startPos == 0) startPos = 1
    val startIdx = startPos - 1
    val endIdx = endPos - 1
    val fib = mutableListOf(1, 1)
    while (fib.size <= endIdx) fib.add(fib[fib.size - 1] + fib[fib.size - 2])
    return GridRange(fib.subList(startIdx, endIdx + 1).toList(), startIdx, endIdx)
}

// ---- colour (port of colorUtils.ts: hexToHsl) ----

internal fun hexToHsl(hex: String): Triple<Double, Double, Double> {
    val clean = if (hex.startsWith("#")) hex.substring(1) else hex
    val chars = clean.toCharArray()
    fun component(start: Int): Double {
        if (start + 2 > chars.size) return 0.0
        return (String(chars, start, 2).toIntOrNull(16) ?: 0) / 255.0
    }
    val r = component(0); val g = component(2); val b = component(4)
    val maxV = maxOf(r, g, b); val minV = minOf(r, g, b)
    var h = 0.0; var s = 0.0; val l = (maxV + minV) / 2
    if (maxV != minV) {
        val d = maxV - minV
        s = if (l > 0.5) d / (2 - maxV - minV) else d / (maxV + minV)
        h = when (maxV) {
            r -> (g - b) / d + (if (g < b) 6 else 0)
            g -> (b - r) / d + 2
            else -> (r - g) / d + 4
        }
        h /= 6
    }
    return Triple(h * 360, s * 100, l * 100)
}

// ---- computeRenderModel (port of renderModel.ts) ----

fun computeRenderModel(input: RenderModelInput): RenderModel {
    val from = input.from ?: 1
    val to = input.to ?: 4
    val clockwise = input.clockwise ?: true
    val placement = input.placement ?: PlacementValue.right

    val baseColor: String? = if (input.color?.isNotEmpty() == true) input.color else null
    val hsl = if (baseColor != null) hexToHsl(baseColor) else Triple(0.0, 0.0, 50.0)

    var start = from; var end = to
    if (start > end) { val t = start; start = end; end = t }

    val range = getGridRange(start, end)
        ?: return RenderModel("empty", AspectRatio(1.0, 1.0), emptyList(), null)

    val startIdx = range.startIdx
    val endIdx = range.endIdx

    // Single square — no skipped squares, no spiral.
    if (startIdx == 0 && endIdx == 0) {
        val slot = RenderSlot(
            rect = Rect(0.0, 0.0, 1.0, 1.0),
            color = if (baseColor != null) FillColor.Hsl(hsl.first, hsl.second, hsl.third) else null,
            childIndex = 0,
        )
        return RenderModel("single", AspectRatio(1.0, 1.0), listOf(slot), null)
    }

    val rotateDeg = placementToRotateDeg(placement, clockwise, startIdx)
    val maxRequested = range.userSequence.max()
    val fullSequence = fullFibonacciUpTo(maxRequested)

    val layout = generateGoldenGridLayout(fullSequence, clockwise, rotateDeg)
    val requestedSquares = layout.squares.subList(startIdx, endIdx + 1)
    val skippedSquares = layout.squares.subList(0, startIdx)
    val width = layout.width.toDouble()
    val height = layout.height.toDouble()

    // --- placeholder bounds (collapsed skipped squares) ---
    val placeholderExists = skippedSquares.isNotEmpty()
    var placeholder: RenderPlaceholder? = null
    if (placeholderExists) {
        var pMinX = Int.MAX_VALUE; var pMaxX = Int.MIN_VALUE; var pMinY = Int.MAX_VALUE; var pMaxY = Int.MIN_VALUE
        for (sq in skippedSquares) {
            if (sq.x < pMinX) pMinX = sq.x
            if (sq.x + sq.size - 1 > pMaxX) pMaxX = sq.x + sq.size - 1
            if (sq.y < pMinY) pMinY = sq.y
            if (sq.y + sq.size - 1 > pMaxY) pMaxY = sq.y + sq.size - 1
        }
        val pWidth = pMaxX - pMinX + 1
        val pHeight = pMaxY - pMinY + 1
        placeholder = RenderPlaceholder(
            rect = Rect(
                (pMinX - layout.minX) / width,
                (pMinY - layout.minY) / height,
                pWidth / width,
                pHeight / height,
            ),
            color = if (baseColor != null) FillColor.Raw(baseColor) else null,
        )
    }

    // --- colour progression ---
    val totalRequested = requestedSquares.size
    val hueRange = minOf(330.0, 180.0 + maxOf(0, totalRequested - 4) * 15.0)
    val lightnessSpread = minOf(50.0, totalRequested * 3.0)

    val slots = requestedSquares.mapIndexed { i, sq ->
        var color: FillColor? = null
        if (baseColor != null) {
            var fraction = 0.0
            if (totalRequested > 1) {
                fraction = if (placeholderExists) (i + 1).toDouble() / (totalRequested + 1)
                else i.toDouble() / (totalRequested - 1)
            } else if (placeholderExists) {
                fraction = 0.5
            }
            val currentHue = (hsl.first + hueRange * fraction) % 360.0
            val currentL = maxOf(10.0, minOf(90.0, hsl.third + lightnessSpread / 2 - fraction * lightnessSpread))
            color = FillColor.Hsl(currentHue, hsl.second, currentL)
        }
        RenderSlot(
            rect = Rect(
                (sq.x - layout.minX) / width,
                (sq.y - layout.minY) / height,
                sq.size / width,
                sq.size / height,
            ),
            color = color,
            childIndex = totalRequested - 1 - i,
        )
    }

    return RenderModel("grid", AspectRatio(width, height), slots, placeholder)
}
