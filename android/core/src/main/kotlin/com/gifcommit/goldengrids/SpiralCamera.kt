package com.gifcommit.goldengrids

import kotlinx.serialization.Serializable
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToLong
import kotlin.math.sin

// Port of src/utils/spiralCamera.ts — the continuous depth-dial camera over a
// golden-grid layout. Verified against the shared spiral-camera.json golden
// master, exactly as computeRenderModel is verified against render-model.json.

/**
 * The camera frame for one depth: how to transform the layout so the focused
 * square fills the viewport, with its neighbours composed around it exactly as
 * the spiral places them. Mirrors `SpiralCameraFrame`.
 */
@Serializable
data class SpiralCameraFrame(
    /** Layout units → viewport pixels multiplier for this depth. */
    val scale: Double,
    /** Stage rotation in degrees (advances ±90° per depth step). */
    val rotationDeg: Double,
    /** Focus point in layout coordinates — the point to pin at the anchor. */
    val centerX: Double,
    val centerY: Double,
)

private fun lerp(a: Double, b: Double, t: Double): Double = a + (b - a) * t

/** Continuous index of the focused square: the last square at depth 0. Mirrors `focusIndexAt`. */
fun focusIndexAt(depth: Double, squareCount: Int): Double = (squareCount - 1) - depth

/**
 * The camera frame for a depth in [0, squares.size - 1]. Depth 0 focuses the
 * LAST (largest) square; each whole step moves one square deeper. Scale
 * interpolates geometrically (Fibonacci squares shrink exponentially — linear
 * interpolation lurches) and rotation advances 90° per step. Mirrors
 * `spiralCamera`, including its refusal of degenerate inputs.
 */
fun spiralCamera(
    layout: GridLayout,
    depth: Double,
    viewportWidth: Double,
    viewportHeight: Double,
    fillRatio: Double = 0.62,
    clockwise: Boolean = true,
): SpiralCameraFrame {
    val count = layout.squares.size

    require(fillRatio.isFinite() && fillRatio > 0) {
        "fillRatio ($fillRatio) must be a positive finite number."
    }
    require(
        viewportWidth.isFinite() && viewportHeight.isFinite() &&
            viewportWidth > 0 && viewportHeight > 0,
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

    val target = fillRatio * min(viewportWidth, viewportHeight)
    val scale = target / focusSize
    // +90 per step for a clockwise layout — see the TS source for why the
    // stage rotates against the spiral's own quarter-turn.
    val rotationDeg = (if (clockwise) 90.0 else -90.0) * depth

    return SpiralCameraFrame(scale = scale, rotationDeg = rotationDeg, centerX = centerX, centerY = centerY)
}

/**
 * The frame decomposed for a Compose `Modifier.graphicsLayer` with
 * `TransformOrigin(0f, 0f)` — the analogue of `toCssTransform`, with the
 * translation pre-solved so translate ∘ rotate ∘ scale lands the focus point
 * on the anchor. Pure data: the core stays free of Android dependencies.
 */
data class GraphicsLayerTransform(
    val translationX: Double,
    val translationY: Double,
    val rotationDeg: Double,
    val scale: Double,
)

/**
 * `anchor` is where the focused square's CENTRE lands in viewport pixels — the
 * dial's pivot, defaulting to the viewport centre. Which edge to hug is the
 * consumer's layout decision, exactly as on the web.
 */
fun toGraphicsLayerTransform(
    frame: SpiralCameraFrame,
    viewportWidth: Double,
    viewportHeight: Double,
    anchorX: Double = viewportWidth / 2,
    anchorY: Double = viewportHeight / 2,
): GraphicsLayerTransform {
    require(anchorX.isFinite() && anchorY.isFinite()) {
        "Anchor ($anchorX, $anchorY) must be finite."
    }
    // graphicsLayer applies translation AFTER the pivot-anchored rotate+scale,
    // so T(anchor)·R·S·T(-center) folds into T(anchor - R·S·center)·R·S.
    val rad = frame.rotationDeg * PI / 180
    val rotatedX = frame.scale * (cos(rad) * frame.centerX - sin(rad) * frame.centerY)
    val rotatedY = frame.scale * (sin(rad) * frame.centerX + cos(rad) * frame.centerY)
    return GraphicsLayerTransform(
        translationX = anchorX - rotatedX,
        translationY = anchorY - rotatedY,
        rotationDeg = frame.rotationDeg,
        scale = frame.scale,
    )
}

/** The side of the focused square the spiral's interior trails toward. */
enum class SpiralTrail { right, bottom, left, top }

/**
 * The layout rotation that makes the dial trail toward a given side — which
 * side cycles with the square COUNT as well as the rotation, so a consumer
 * that filters its content must re-solve. Mirrors `trailToRotateDeg`.
 */
fun trailToRotateDeg(trail: SpiralTrail, clockwise: Boolean = true, squareCount: Int): Int {
    require(squareCount >= 2) { "squareCount ($squareCount) must be an integer of at least 2." }
    val wanted = trail.ordinal
    val natural = if (clockwise) squareCount else -squareCount
    return (((wanted - natural) % 4) + 4) % 4 * 90
}

/**
 * The side the interior trails toward for a layout that already exists — the
 * inverse of `trailToRotateDeg`. Mirrors `trailForRotation`.
 */
fun trailForRotation(rotateDeg: Int, clockwise: Boolean = true, squareCount: Int): SpiralTrail {
    require(rotateDeg in listOf(0, 90, 180, 270)) {
        "Invalid rotation value: $rotateDeg. Only 0, 90, 180, and 270 are allowed."
    }
    require(squareCount >= 2) { "squareCount ($squareCount) must be an integer of at least 2." }
    val natural = if (clockwise) squareCount else -squareCount
    return SpiralTrail.entries[(((rotateDeg / 90 + natural) % 4) + 4) % 4]
}

/**
 * The legibility window around the focus: how present square `index` is at
 * `depth`. One ramp gives "a few tiles at a time" and the crossfade; `hidden`
 * fires exactly when the RENDERED (3-decimal) opacity reaches zero, so
 * invisible content never stays hittable. Mirrors `SpiralWindow`.
 */
@Serializable
data class SpiralWindow(val opacity: Double, val hidden: Boolean, val focused: Boolean)

/**
 * Mirrors `spiralWindow` (holdSteps: how long a tile stays fully opaque;
 * fadeSteps: where opacity reaches zero — deliberately one number, not two).
 */
fun spiralWindow(
    index: Int,
    depth: Double,
    squareCount: Int,
    holdSteps: Double = 1.0,
    fadeSteps: Double = 2.5,
): SpiralWindow {
    require(holdSteps.isFinite() && fadeSteps.isFinite() && holdSteps >= 0 && fadeSteps > holdSteps) {
        "Legibility window needs 0 <= holdSteps ($holdSteps) < fadeSteps ($fadeSteps)."
    }
    require(
        depth.isFinite() && depth >= 0 && depth <= (squareCount - 1).toDouble() &&
            index >= 0 && index <= squareCount - 1,
    ) { "Legibility window needs depth ($depth) and index ($index) inside [0, ${squareCount - 1}]." }
    val delta = abs(focusIndexAt(depth, squareCount) - index)
    val raw = if (delta <= holdSteps) 1.0 else max(0.0, (fadeSteps - delta) / (fadeSteps - holdSteps))
    // Round to the value the consumer will actually render (TS: toFixed(3)).
    val opacity = (raw * 1000).roundToLong() / 1000.0
    return SpiralWindow(opacity = opacity, hidden = opacity <= 0, focused = delta < 0.5)
}

/** A point in layout coordinates. */
@Serializable
data class SpiralPoint(val x: Double, val y: Double)

/**
 * The spiral's eye: the point the squares converge on as they shrink —
 * approximated as the centre of the smallest square, exact in the φ-limit.
 * Mirrors `spiralEye`.
 */
fun spiralEye(layout: GridLayout): SpiralPoint {
    var smallest = layout.squares.first()
    for (square in layout.squares) {
        if (square.size < smallest.size) smallest = square
    }
    return SpiralPoint(
        x = smallest.x + smallest.size / 2.0,
        y = smallest.y + smallest.size / 2.0,
    )
}
