package com.gifcommit.goldengrids

import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
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

/**
 * One tile's complete screen transform, decomposed about a TOP-LEFT pivot —
 * camera ∘ placement, composed flat per tile. Mirrors `tileTransform`: the
 * raster-clamp fix as an API. Apply via `Modifier.graphicsLayer` with
 * `TransformOrigin(0f, 0f)` on a tile box of `texturePx` square at the stage
 * origin.
 */
data class TileTransform(
    val translateX: Double,
    val translateY: Double,
    val rotationDeg: Double,
    /** Net uniform scale: frame.scale × square.size / texturePx. */
    val scale: Double,
)

fun tileTransform(
    frame: SpiralCameraFrame,
    square: Square,
    viewportWidth: Double,
    viewportHeight: Double,
    anchorX: Double = viewportWidth / 2,
    anchorY: Double = viewportHeight / 2,
    texturePx: Double = 512.0,
): TileTransform {
    require(anchorX.isFinite() && anchorY.isFinite()) { "Anchor ($anchorX, $anchorY) must be finite." }
    require(texturePx.isFinite() && texturePx > 0) { "texturePx ($texturePx) must be a positive finite number." }
    val radians = Math.toRadians(frame.rotationDeg)
    val cosR = cos(radians)
    val sinR = sin(radians)
    val dx = square.x - frame.centerX
    val dy = square.y - frame.centerY
    return TileTransform(
        translateX = anchorX + frame.scale * (cosR * dx - sinR * dy),
        translateY = anchorY + frame.scale * (sinR * dx + cosR * dy),
        rotationDeg = frame.rotationDeg,
        scale = frame.scale * square.size / texturePx,
    )
}

/**
 * Whether a square still covers any of the viewport at this frame — the
 * geometric cull a solid tail needs. Mirrors `tileOnScreen`.
 *
 * Conservative: the four corners are projected and tested as an axis-aligned
 * box, exact at whole depths and slightly generous mid-turn, so it never
 * reports "off screen" for a square that is visible.
 */
fun tileOnScreen(
    frame: SpiralCameraFrame,
    square: Square,
    viewportWidth: Double,
    viewportHeight: Double,
    anchorX: Double = viewportWidth / 2,
    anchorY: Double = viewportHeight / 2,
    margin: Double = 0.0,
): Boolean {
    require(anchorX.isFinite() && anchorY.isFinite()) { "Anchor ($anchorX, $anchorY) must be finite." }
    require(margin.isFinite() && margin >= 0) {
        "margin ($margin) must be a non-negative finite number."
    }
    val radians = Math.toRadians(frame.rotationDeg)
    val cosR = cos(radians)
    val sinR = sin(radians)
    val sz = square.size.toDouble()
    val corners = listOf(
        square.x.toDouble() to square.y.toDouble(),
        (square.x + sz) to square.y.toDouble(),
        (square.x + sz) to (square.y + sz),
        square.x.toDouble() to (square.y + sz),
    )
    var minX = Double.POSITIVE_INFINITY; var maxX = Double.NEGATIVE_INFINITY
    var minY = Double.POSITIVE_INFINITY; var maxY = Double.NEGATIVE_INFINITY
    for ((px, py) in corners) {
        val dx = px - frame.centerX
        val dy = py - frame.centerY
        val x = anchorX + frame.scale * (cosR * dx - sinR * dy)
        val y = anchorY + frame.scale * (sinR * dx + cosR * dy)
        minX = min(minX, x); maxX = max(maxX, x)
        minY = min(minY, y); maxY = max(maxY, y)
    }
    return maxX >= -margin && minX <= viewportWidth + margin &&
        maxY >= -margin && minY <= viewportHeight + margin
}

/**
 * The transform that keeps a tile's CONTENT readable while the dial turns —
 * counter-rotation about the content's own centre (Compose's default pivot),
 * with the |cos|+|sin| cover swell. Mirrors `contentTransform`, including
 * its two switches: `counterRotate = false` is the identity, `cover = false`
 * skips the swell.
 */
data class ContentTransform(
    val rotationDeg: Double,
    val scale: Double,
)

fun contentTransform(
    frame: SpiralCameraFrame,
    counterRotate: Boolean = true,
    cover: Boolean = true,
): ContentTransform {
    if (!counterRotate) return ContentTransform(rotationDeg = 0.0, scale = 1.0)
    val radians = Math.toRadians(frame.rotationDeg)
    val scale = if (cover) abs(cos(radians)) + abs(sin(radians)) else 1.0
    return ContentTransform(rotationDeg = -frame.rotationDeg, scale = scale)
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
     * paint and the accessibility order. Unused when [fade] is false, but
     * still validated, so turning the tail back on can never turn a working
     * window into a throw. */
    val fadeSteps: Double = 2.5,
    /** Whether the outward tail FADES. False leaves the tail SOLID rather than
     * removing it: every square keeps full presence at any distance, filling
     * the negative space around the focus and bleeding off the page. Nothing
     * hides, and [holdSteps]/[fadeSteps] mean nothing without a ramp. */
    val fade: Boolean = true,
    /** Shape of the ramp between [holdSteps] and [fadeSteps]. 1 is the
     * straight line. The exponent applies to the tile's REMAINING presence,
     * which falls from 1 to 0 — so it reads like gamma: above 1 fades early
     * and lingers faint, below 1 holds and cuts away late. Ignored when
     * [fade] is false. */
    val ease: Double = 1.0,
)

data class SpiralWindow(
    val opacity: Double,
    val hidden: Boolean,
    val focused: Boolean,
)

/**
 * The raw opacity below which the three-decimal rounding yields zero — and the
 * tile leaves. Mirrors `HIDDEN_BELOW`.
 */
private const val HIDDEN_BELOW = 0.0005

/**
 * Mirrors the TypeScript `assertWindow`: one definition of a legal window,
 * shared by every function that reads one.
 */
private fun assertWindow(options: SpiralWindowOptions) {
    val hold = options.holdSteps
    val fade = options.fadeSteps
    require(hold.isFinite() && fade.isFinite() && hold >= 0 && fade > hold) {
        "Legibility window needs 0 <= holdSteps ($hold) < fadeSteps ($fade)."
    }
    require(options.ease.isFinite() && options.ease > 0) {
        "Legibility window needs a positive finite ease (${options.ease})."
    }
}

/**
 * The legibility window around the focus. Mirrors `spiralWindow`: only
 * OUTWARD squares (larger than the focus) fade and leave; the interior never
 * fades — squares emerge from the centre small but fully present. Includes
 * the 3-decimal rounding that `hidden` derives from.
 *
 * The fade is a configuration detail: `fade = false` keeps the cull but drops
 * the ghosting, and [SpiralWindowOptions.ease] bends the ramp without moving
 * either end.
 */
fun spiralWindow(
    index: Int,
    depth: Double,
    squareCount: Int,
    options: SpiralWindowOptions = SpiralWindowOptions(),
): SpiralWindow {
    assertWindow(options)
    val hold = options.holdSteps
    val fade = options.fadeSteps
    require(
        depth.isFinite() && depth >= 0 && depth <= (squareCount - 1).toDouble() &&
            index >= 0 && index <= squareCount - 1
    ) {
        "Legibility window needs depth ($depth) and index ($index) inside " +
            "[0, ${squareCount - 1}] for a finite squareCount ($squareCount)."
    }
    val outward = index - focusIndexAt(depth, squareCount)
    // A solid tail is full presence everywhere — the ramp is skipped, not
    // replaced by a cut.
    val raw = if (!options.fade || outward <= hold) {
        1.0
    } else {
        max(0.0, (fade - outward) / (fade - hold)).pow(options.ease)
    }
    // Same rounding the TS does with Number(raw.toFixed(3)) — HALF AWAY FROM
    // ZERO on a midpoint (raw is never negative here, so floor(x + 0.5)).
    // Kotlin's round() ties to even, which disagrees with JS and Swift at
    // exact .0005 boundaries.
    val opacity = floor(raw * 1000 + 0.5) / 1000
    return SpiralWindow(opacity = opacity, hidden = opacity <= 0, focused = abs(outward) < 0.5)
}

/**
 * The depth at which [index] sits exactly on the window's outward boundary —
 * where its opacity first reaches zero. Mirrors `windowFadeDepth`: the
 * inverse of the window, and the depth a consumer freezes a departing tile at
 * so its retained raster matches what re-entry asks for. The boundary follows
 * the ROUNDED opacity, not the ramp's endpoint: an eased ramp rounds to zero
 * well before it reaches [SpiralWindowOptions.fadeSteps], so the cutoff is
 * `fadeSteps - HIDDEN_BELOW^(1/ease) * (fadeSteps - holdSteps)`. With
 * `fade = false` there is no boundary at all — a solid tail never drops a
 * square — so the answer is the dial's deepest depth. Clamped to that depth —
 * no clamp is needed at the shallow end, since the solve cannot go below
 * zero.
 */
fun windowFadeDepth(
    index: Int,
    squareCount: Int,
    options: SpiralWindowOptions = SpiralWindowOptions(),
): Double {
    assertWindow(options)
    require(index >= 0 && index <= squareCount - 1) {
        "Legibility window needs index ($index) inside [0, ${squareCount - 1}] " +
            "for a finite squareCount ($squareCount)."
    }
    // A solid tail has no boundary to solve for: no square ever leaves.
    if (!options.fade) return (squareCount - 1).toDouble()
    val boundary = options.fadeSteps -
        HIDDEN_BELOW.pow(1.0 / options.ease) * (options.fadeSteps - options.holdSteps)
    val depth = boundary + squareCount - 1 - index
    return min(depth, (squareCount - 1).toDouble())
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
