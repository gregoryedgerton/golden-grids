package com.gifcommit.goldengrids

import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

// Port of src/utils/spiralCamera.ts — the continuous depth-dial camera.
//
// TypeScript is the source of truth; SpiralCameraFixtureTest asserts this port
// against src/__fixtures__/spiral-camera.json within 1e-9, the same contract
// RenderModel carries.

data class SpiralCameraOptions(
    /** Fraction of the viewport's smaller side the focused square fills. */
    val fillRatio: Double = 0.62,
    /** Spiral handedness, matching the `clockwise` given to the generator. */
    val clockwise: Boolean = true,
)

data class SpiralCameraFrame(
    /** Layout units → viewport pixels multiplier for this depth. */
    val scale: Double,
    /** Stage rotation in degrees (advances ±90° per depth step). */
    val rotationDeg: Double,
    /** Focus point in layout coordinates — pinned at the anchor. */
    val centerX: Double,
    val centerY: Double,
)

/** Continuous index of the focused square: the last square at depth 0. */
fun focusIndexAt(depth: Double, squareCount: Int): Double = (squareCount - 1) - depth

private fun lerp(a: Double, b: Double, t: Double): Double = a + (b - a) * t

/** The camera frame for a depth in [0, squares.size - 1]. Mirrors `spiralCamera`. */
fun spiralCamera(
    layout: GridLayout,
    depth: Double,
    viewportWidth: Double,
    viewportHeight: Double,
    options: SpiralCameraOptions = SpiralCameraOptions(),
): SpiralCameraFrame {
    val count = layout.squares.size
    require(options.fillRatio.isFinite() && options.fillRatio > 0) {
        "fillRatio (${options.fillRatio}) must be a positive finite number."
    }
    require(
        viewportWidth.isFinite() && viewportHeight.isFinite() &&
            viewportWidth > 0 && viewportHeight > 0
    ) { "Viewport (${viewportWidth}x$viewportHeight) must have positive finite dimensions." }
    require(depth.isFinite() && depth >= 0 && depth <= (count - 1).toDouble()) {
        "Depth $depth is outside the layout's $count squares."
    }

    val focus = focusIndexAt(depth, count)
    val lower = floor(focus).toInt()
    val upper = ceil(focus).toInt()
    val t = focus - lower
    val from = layout.squares[lower]
    val to = layout.squares[upper]

    val focusSize = exp(lerp(ln(from.size.toDouble()), ln(to.size.toDouble()), t))
    val centerX = lerp(from.x + from.size / 2.0, to.x + to.size / 2.0, t)
    val centerY = lerp(from.y + from.size / 2.0, to.y + to.size / 2.0, t)

    val target = options.fillRatio * min(viewportWidth, viewportHeight)
    val scale = target / focusSize
    // +90 per step for a clockwise layout — see the TS source for why the
    // sign cancels the spiral's own quarter-turn.
    val rotationDeg = (if (options.clockwise) 90.0 else -90.0) * depth

    return SpiralCameraFrame(scale = scale, rotationDeg = rotationDeg, centerX = centerX, centerY = centerY)
}

/**
 * The frame decomposed for `Modifier.graphicsLayer` with a TOP-LEFT pivot
 * (`TransformOrigin(0f, 0f)`): set translationX/Y, rotationZ and both scales
 * from these fields and the stage reproduces the web mapping
 * v = anchor + R·s·(p − center) exactly. The affine entries [a b c d tx ty]
 * of that same mapping are also exposed for anything matrix-shaped.
 */
data class GraphicsLayerTransform(
    val translationX: Double,
    val translationY: Double,
    val rotationZ: Double,
    val scale: Double,
) {
    /** Row-major CGAffineTransform-style entries [a, b, c, d, tx, ty]. */
    val affine: DoubleArray
        get() {
            val radians = Math.toRadians(rotationZ)
            val cosR = cos(radians)
            val sinR = sin(radians)
            return doubleArrayOf(
                scale * cosR, scale * sinR, -scale * sinR, scale * cosR,
                translationX, translationY,
            )
        }
}

/**
 * The frame as a top-left-pivot graphicsLayer decomposition — the analogue of
 * `toCssTransform`. `anchorX`/`anchorY` are where the focused square's centre
 * lands, defaulting to the viewport centre. With a 0 0 pivot the layer order
 * translate → rotate → scale composes exactly like the CSS list, so the
 * translation is the matrix's own [tx, ty].
 */
fun toGraphicsLayerTransform(
    frame: SpiralCameraFrame,
    viewportWidth: Double,
    viewportHeight: Double,
    anchorX: Double = viewportWidth / 2,
    anchorY: Double = viewportHeight / 2,
): GraphicsLayerTransform {
    require(anchorX.isFinite() && anchorY.isFinite()) { "Anchor ($anchorX, $anchorY) must be finite." }
    val radians = Math.toRadians(frame.rotationDeg)
    val cosR = cos(radians)
    val sinR = sin(radians)
    val s = frame.scale
    return GraphicsLayerTransform(
        translationX = anchorX - s * (cosR * frame.centerX - sinR * frame.centerY),
        translationY = anchorY - s * (sinR * frame.centerX + cosR * frame.centerY),
        rotationZ = frame.rotationDeg,
        scale = s,
    )
}

// ---- trail solve ----

/** The side of the focused square the spiral's interior trails toward. */
enum class SpiralTrail { right, bottom, left, top }

private val trailOrder = listOf(SpiralTrail.right, SpiralTrail.bottom, SpiralTrail.left, SpiralTrail.top)

/**
 * The layout rotation that makes the dial trail toward a given side. Mirrors
 * `trailToRotateDeg` — the trail direction cycles with the square COUNT as
 * well as the rotation, so a filtered consumer must re-solve.
 */
fun trailToRotateDeg(trail: SpiralTrail, clockwise: Boolean = true, squareCount: Int): Int {
    require(squareCount >= 2) { "squareCount ($squareCount) must be an integer of at least 2." }
    val wanted = trailOrder.indexOf(trail)
    val natural = if (clockwise) squareCount else -squareCount
    return (((wanted - natural) % 4) + 4) % 4 * 90
}

/**
 * The side the interior trails toward for an existing layout — the inverse of
 * `trailToRotateDeg`. Mirrors `trailForRotation`.
 */
fun trailForRotation(rotateDeg: Int, clockwise: Boolean = true, squareCount: Int): SpiralTrail {
    require(rotateDeg in listOf(0, 90, 180, 270)) {
        "Invalid rotation value: $rotateDeg. Only 0, 90, 180, and 270 are allowed."
    }
    require(squareCount >= 2) { "squareCount ($squareCount) must be an integer of at least 2." }
    val natural = if (clockwise) squareCount else -squareCount
    return trailOrder[(((rotateDeg / 90 + natural) % 4) + 4) % 4]
}

// ---- legibility window ----

data class SpiralWindowOptions(
    /** Distance (in depth steps) a tile stays fully opaque. */
    val holdSteps: Double = 1.0,
    /** Distance at which opacity reaches zero — and the tile should leave the
     * paint and the accessibility order. */
    val fadeSteps: Double = 2.5,
)

data class SpiralWindow(
    val opacity: Double,
    val hidden: Boolean,
    val focused: Boolean,
)

/**
 * The legibility window around the focus. Mirrors `spiralWindow`, including
 * the 3-decimal rounding that `hidden` derives from.
 */
fun spiralWindow(
    index: Int,
    depth: Double,
    squareCount: Int,
    options: SpiralWindowOptions = SpiralWindowOptions(),
): SpiralWindow {
    val hold = options.holdSteps
    val fade = options.fadeSteps
    require(hold.isFinite() && fade.isFinite() && hold >= 0 && fade > hold) {
        "Legibility window needs 0 <= holdSteps ($hold) < fadeSteps ($fade)."
    }
    require(
        depth.isFinite() && depth >= 0 && depth <= (squareCount - 1).toDouble() &&
            index >= 0 && index <= squareCount - 1
    ) {
        "Legibility window needs depth ($depth) and index ($index) inside " +
            "[0, ${squareCount - 1}] for a finite squareCount ($squareCount)."
    }
    val delta = abs(focusIndexAt(depth, squareCount) - index)
    val raw = if (delta <= hold) 1.0 else max(0.0, (fade - delta) / (fade - hold))
    // Same rounding the TS does with Number(raw.toFixed(3)) — HALF AWAY FROM
    // ZERO on a midpoint (raw is never negative here, so floor(x + 0.5)).
    // Kotlin's round() ties to even, which disagrees with JS and Swift at
    // exact .0005 boundaries.
    val opacity = floor(raw * 1000 + 0.5) / 1000
    return SpiralWindow(opacity = opacity, hidden = opacity <= 0, focused = delta < 0.5)
}

// ---- eye ----

/**
 * The spiral's convergence point: the centre of the smallest square — exact
 * in the φ-limit. Mirrors `spiralEye`.
 */
fun spiralEye(layout: GridLayout): Pair<Double, Double> {
    val smallest = layout.squares.minByOrNull { it.size }!!
    return Pair(smallest.x + smallest.size / 2.0, smallest.y + smallest.size / 2.0)
}
