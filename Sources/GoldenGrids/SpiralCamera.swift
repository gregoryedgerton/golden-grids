// Port of src/utils/spiralCamera.ts — the continuous depth-dial camera.
//
// TypeScript is the source of truth; SpiralCameraFixtureTests asserts this
// port against src/__fixtures__/spiral-camera.json within 1e-9, the same
// contract RenderModel carries.

import Foundation
#if canImport(CoreGraphics)
import CoreGraphics
#endif

public struct SpiralCameraOptions: Sendable {
    /// Fraction of the viewport's smaller side the focused square fills.
    public var fillRatio: Double
    /// Spiral handedness, matching the `clockwise` given to the generator.
    public var clockwise: Bool
    public init(fillRatio: Double = 0.62, clockwise: Bool = true) {
        self.fillRatio = fillRatio
        self.clockwise = clockwise
    }
}

public struct SpiralCameraFrame: Equatable, Sendable {
    /// Layout units → viewport pixels multiplier for this depth.
    public var scale: Double
    /// Stage rotation in degrees (advances ±90° per depth step).
    public var rotationDeg: Double
    /// Focus point in layout coordinates — pinned at the anchor.
    public var centerX: Double
    public var centerY: Double
}

/// Continuous index of the focused square: the last square at depth 0.
public func focusIndexAt(_ depth: Double, _ squareCount: Int) -> Double {
    Double(squareCount - 1) - depth
}

private func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double {
    a + (b - a) * t
}

/// The camera frame for a depth in [0, squares.count - 1].
/// Mirrors `spiralCamera`.
public func spiralCamera(
    _ layout: GridLayout,
    depth: Double,
    viewportWidth: Double,
    viewportHeight: Double,
    options: SpiralCameraOptions = SpiralCameraOptions()
) -> SpiralCameraFrame {
    let count = layout.squares.count
    precondition(
        options.fillRatio.isFinite && options.fillRatio > 0,
        "fillRatio (\(options.fillRatio)) must be a positive finite number."
    )
    precondition(
        viewportWidth.isFinite && viewportHeight.isFinite && viewportWidth > 0 && viewportHeight > 0,
        "Viewport (\(viewportWidth)x\(viewportHeight)) must have positive finite dimensions."
    )
    precondition(
        depth.isFinite && depth >= 0 && depth <= Double(count - 1),
        "Depth \(depth) is outside the layout's \(count) squares."
    )

    let focus = focusIndexAt(depth, count)
    let lower = Int(focus.rounded(.down))
    let upper = Int(focus.rounded(.up))
    let t = focus - Double(lower)
    let from = layout.squares[lower]
    let to = layout.squares[upper]

    let focusSize = exp(lerp(log(Double(from.size)), log(Double(to.size)), t))
    let centerX = lerp(Double(from.x) + Double(from.size) / 2, Double(to.x) + Double(to.size) / 2, t)
    let centerY = lerp(Double(from.y) + Double(from.size) / 2, Double(to.y) + Double(to.size) / 2, t)

    let target = options.fillRatio * min(viewportWidth, viewportHeight)
    let scale = target / focusSize
    // +90 per step for a clockwise layout — see the TS source for why the
    // sign cancels the spiral's own quarter-turn.
    let rotationDeg = (options.clockwise ? 90.0 : -90.0) * depth

    return SpiralCameraFrame(scale: scale, rotationDeg: rotationDeg, centerX: centerX, centerY: centerY)
}

#if canImport(CoreGraphics)
/// The frame as a `CGAffineTransform` for a stage whose children sit at
/// layout coordinates used as points — the analogue of `toCssTransform`.
///
/// `anchor` is where the focused square's CENTRE lands in viewport points,
/// defaulting to the viewport centre. The matrix maps
/// v = anchor + R·s·(p − center) about a 0 0 origin, so apply it to a
/// top-left-origin coordinate space (SwiftUI's default for `.transformEffect`
/// on an aligned stage).
public func toAffineTransform(
    _ frame: SpiralCameraFrame,
    viewportWidth: Double,
    viewportHeight: Double,
    anchor: CGPoint? = nil
) -> CGAffineTransform {
    let a = anchor ?? CGPoint(x: viewportWidth / 2, y: viewportHeight / 2)
    precondition(a.x.isFinite && a.y.isFinite, "Anchor (\(a.x), \(a.y)) must be finite.")
    let radians = frame.rotationDeg * .pi / 180
    let cosR = cos(radians)
    let sinR = sin(radians)
    let s = frame.scale
    return CGAffineTransform(
        a: s * cosR,
        b: s * sinR,
        c: -s * sinR,
        d: s * cosR,
        tx: Double(a.x) - s * (cosR * frame.centerX - sinR * frame.centerY),
        ty: Double(a.y) - s * (sinR * frame.centerX + cosR * frame.centerY)
    )
}
#endif

/// One tile's complete screen transform, decomposed about a TOP-LEFT pivot —
/// camera ∘ placement, composed flat per tile. Mirrors `tileTransform`: this
/// is the raster-clamp fix as an API — a single camera transform over a
/// shared stage rasterizes 1-unit squares and upscales them hundreds of
/// times; per tile, each renders into a fixed `texturePx` box at a net scale
/// near 1.
public struct TileTransform: Equatable, Sendable {
    public var translateX: Double
    public var translateY: Double
    public var rotationDeg: Double
    /// Net uniform scale: frame.scale × square.size / texturePx.
    public var scale: Double
}

public func tileTransform(
    _ frame: SpiralCameraFrame,
    square: Square,
    viewportWidth: Double,
    viewportHeight: Double,
    anchor: CGPoint? = nil,
    texturePx: Double = 512
) -> TileTransform {
    let a = anchor ?? CGPoint(x: viewportWidth / 2, y: viewportHeight / 2)
    precondition(a.x.isFinite && a.y.isFinite, "Anchor (\(a.x), \(a.y)) must be finite.")
    precondition(texturePx.isFinite && texturePx > 0, "texturePx (\(texturePx)) must be a positive finite number.")
    let radians = frame.rotationDeg * .pi / 180
    let cosR = cos(radians)
    let sinR = sin(radians)
    let dx = Double(square.x) - frame.centerX
    let dy = Double(square.y) - frame.centerY
    return TileTransform(
        translateX: Double(a.x) + frame.scale * (cosR * dx - sinR * dy),
        translateY: Double(a.y) + frame.scale * (sinR * dx + cosR * dy),
        rotationDeg: frame.rotationDeg,
        scale: frame.scale * Double(square.size) / texturePx
    )
}

/// Whether a square still covers any of the viewport at this frame — the
/// geometric cull a solid tail needs. Mirrors `tileOnScreen`.
///
/// Conservative: the four corners are projected and tested as an axis-aligned
/// box, exact at whole depths and slightly generous mid-turn, so it never
/// reports "off screen" for a square that is visible.
public func tileOnScreen(
    _ frame: SpiralCameraFrame,
    square: Square,
    viewportWidth: Double,
    viewportHeight: Double,
    anchor: CGPoint? = nil,
    margin: Double = 0
) -> Bool {
    let a = anchor ?? CGPoint(x: viewportWidth / 2, y: viewportHeight / 2)
    precondition(a.x.isFinite && a.y.isFinite, "Anchor (\(a.x), \(a.y)) must be finite.")
    precondition(
        margin.isFinite && margin >= 0,
        "margin (\(margin)) must be a non-negative finite number."
    )
    let radians = frame.rotationDeg * .pi / 180
    let cosR = cos(radians)
    let sinR = sin(radians)
    let sz = Double(square.size)
    let corners: [(Double, Double)] = [
        (Double(square.x), Double(square.y)),
        (Double(square.x) + sz, Double(square.y)),
        (Double(square.x) + sz, Double(square.y) + sz),
        (Double(square.x), Double(square.y) + sz),
    ]
    var minX = Double.infinity, maxX = -Double.infinity
    var minY = Double.infinity, maxY = -Double.infinity
    for (px, py) in corners {
        let dx = px - frame.centerX
        let dy = py - frame.centerY
        let x = Double(a.x) + frame.scale * (cosR * dx - sinR * dy)
        let y = Double(a.y) + frame.scale * (sinR * dx + cosR * dy)
        minX = min(minX, x); maxX = max(maxX, x)
        minY = min(minY, y); maxY = max(maxY, y)
    }
    return maxX >= -margin && minX <= viewportWidth + margin
        && maxY >= -margin && minY <= viewportHeight + margin
}

#if canImport(CoreGraphics)
/// The tile transform as a `CGAffineTransform` for a tile view of
/// `texturePx` square positioned at the stage origin (0 0 transform origin).
public func toAffineTileTransform(
    _ frame: SpiralCameraFrame,
    square: Square,
    viewportWidth: Double,
    viewportHeight: Double,
    anchor: CGPoint? = nil,
    texturePx: Double = 512
) -> CGAffineTransform {
    let tile = tileTransform(
        frame, square: square,
        viewportWidth: viewportWidth, viewportHeight: viewportHeight,
        anchor: anchor, texturePx: texturePx
    )
    let radians = tile.rotationDeg * .pi / 180
    let cosR = cos(radians)
    let sinR = sin(radians)
    let s = tile.scale
    return CGAffineTransform(
        a: s * cosR, b: s * sinR, c: -s * sinR, d: s * cosR,
        tx: tile.translateX, ty: tile.translateY
    )
}
#endif

/// The transform that keeps a tile's CONTENT readable while the dial turns —
/// counter-rotation about the content's own centre, with the |cos|+|sin|
/// cover swell. Mirrors `contentTransform`, including its two switches:
/// `counterRotate: false` is the identity (the whole feature is a
/// configuration detail), and `cover: false` skips the swell for content
/// that must never scale.
public struct ContentTransform: Equatable, Sendable {
    public var rotationDeg: Double
    public var scale: Double
}

public func contentTransform(
    _ frame: SpiralCameraFrame,
    counterRotate: Bool = true,
    cover: Bool = true
) -> ContentTransform {
    if !counterRotate { return ContentTransform(rotationDeg: 0, scale: 1) }
    let radians = frame.rotationDeg * .pi / 180
    let scale = cover ? abs(cos(radians)) + abs(sin(radians)) : 1
    return ContentTransform(rotationDeg: -frame.rotationDeg, scale: scale)
}

// MARK: - Trail solve

/// The side of the focused square the spiral's interior trails toward.
public enum SpiralTrail: String, Codable, Sendable, CaseIterable {
    case right, bottom, left, top
}

private let trailOrder: [SpiralTrail] = [.right, .bottom, .left, .top]

/// The layout rotation that makes the dial trail toward a given side.
/// Mirrors `trailToRotateDeg` — the trail direction cycles with the square
/// COUNT as well as the rotation, so a filtered consumer must re-solve.
public func trailToRotateDeg(_ trail: SpiralTrail, clockwise: Bool = true, squareCount: Int) -> Int {
    precondition(squareCount >= 2, "squareCount (\(squareCount)) must be an integer of at least 2.")
    let wanted = trailOrder.firstIndex(of: trail)!
    let natural = clockwise ? squareCount : -squareCount
    return (((wanted - natural) % 4) + 4) % 4 * 90
}

/// The side the interior trails toward for an existing layout — the inverse
/// of `trailToRotateDeg`. Mirrors `trailForRotation`.
public func trailForRotation(_ rotateDeg: Int, clockwise: Bool = true, squareCount: Int) -> SpiralTrail {
    precondition(
        [0, 90, 180, 270].contains(rotateDeg),
        "Invalid rotation value: \(rotateDeg). Only 0, 90, 180, and 270 are allowed."
    )
    precondition(squareCount >= 2, "squareCount (\(squareCount)) must be an integer of at least 2.")
    let natural = clockwise ? squareCount : -squareCount
    return trailOrder[(((rotateDeg / 90 + natural) % 4) + 4) % 4]
}

// MARK: - Legibility window

public struct SpiralWindowOptions: Sendable {
    /// Distance (in depth steps) a tile stays fully opaque.
    public var holdSteps: Double
    /// Distance at which opacity reaches zero — and the tile should leave
    /// the paint and the accessibility order. Unused when `fade` is false,
    /// but still validated, so turning the tail back on can never turn a
    /// working window into a trap.
    public var fadeSteps: Double
    /// Whether the outward tail FADES. False leaves the tail SOLID rather
    /// than removing it: every square keeps full presence at any distance,
    /// filling the negative space around the focus and bleeding off the page.
    /// Nothing hides, and `holdSteps`/`fadeSteps` mean nothing without a ramp.
    public var fade: Bool
    /// Shape of the ramp between `holdSteps` and `fadeSteps`. 1 is the
    /// straight line. The exponent applies to the tile's REMAINING presence,
    /// which falls from 1 to 0 — so it reads like gamma: above 1 fades early
    /// and lingers faint, below 1 holds and cuts away late. Ignored when
    /// `fade` is false.
    public var ease: Double
    public init(
        holdSteps: Double = 1,
        fadeSteps: Double = 2.5,
        fade: Bool = true,
        ease: Double = 1
    ) {
        self.holdSteps = holdSteps
        self.fadeSteps = fadeSteps
        self.fade = fade
        self.ease = ease
    }
}

public struct SpiralWindow: Equatable, Sendable {
    public var opacity: Double
    public var hidden: Bool
    public var focused: Bool
}

/// The raw opacity below which the three-decimal rounding yields zero — and
/// the tile leaves. Mirrors `HIDDEN_BELOW`.
private let hiddenBelow = 0.0005

/// Mirrors the TypeScript `assertWindow`: one definition of a legal window,
/// shared by every function that reads one.
private func assertWindow(_ options: SpiralWindowOptions) {
    let hold = options.holdSteps
    let fade = options.fadeSteps
    precondition(
        hold.isFinite && fade.isFinite && hold >= 0 && fade > hold,
        "Legibility window needs 0 <= holdSteps (\(hold)) < fadeSteps (\(fade))."
    )
    precondition(
        options.ease.isFinite && options.ease > 0,
        "Legibility window needs a positive finite ease (\(options.ease))."
    )
}

/// The legibility window around the focus. Mirrors `spiralWindow`: only
/// OUTWARD squares (larger than the focus) fade and leave; the interior
/// never fades — squares emerge from the centre small but fully present.
/// Includes the 3-decimal rounding that `hidden` derives from.
///
/// The fade is a configuration detail: `fade: false` keeps the cull but
/// drops the ghosting, and `ease` bends the ramp without moving either end.
public func spiralWindow(
    _ index: Int,
    depth: Double,
    squareCount: Int,
    options: SpiralWindowOptions = SpiralWindowOptions()
) -> SpiralWindow {
    assertWindow(options)
    let hold = options.holdSteps
    let fade = options.fadeSteps
    precondition(
        depth.isFinite && depth >= 0 && depth <= Double(squareCount - 1)
            && index >= 0 && index <= squareCount - 1,
        "Legibility window needs depth (\(depth)) and index (\(index)) inside "
            + "[0, \(squareCount - 1)] for a finite squareCount (\(squareCount))."
    )
    let outward = Double(index) - focusIndexAt(depth, squareCount)
    // A solid tail is full presence everywhere — the ramp is skipped, not
    // replaced by a cut.
    let raw: Double
    if !options.fade || outward <= hold {
        raw = 1
    } else {
        raw = pow(max(0, (fade - outward) / (fade - hold)), options.ease)
    }
    // Same rounding the TS does with Number(raw.toFixed(3)): hidden follows
    // the value the consumer will actually render.
    let opacity = (raw * 1000).rounded() / 1000
    return SpiralWindow(opacity: opacity, hidden: opacity <= 0, focused: abs(outward) < 0.5)
}

/// The depth at which `index` sits exactly on the window's outward boundary
/// — where its opacity first reaches zero. Mirrors `windowFadeDepth`: the
/// inverse of the window, and the depth a consumer freezes a departing tile
/// at so its retained raster matches what re-entry asks for. The boundary
/// follows the ROUNDED opacity, not the ramp's endpoint: an eased ramp
/// rounds to zero well before it reaches `fadeSteps`, so the cutoff is
/// `fadeSteps - hiddenBelow^(1/ease) * (fadeSteps - holdSteps)`. With
/// `fade: false` there is no boundary at all — a solid tail never drops a
/// square — so the answer is the dial's deepest depth. Clamped to that depth
/// — no clamp is needed at the shallow end, since the solve cannot go below
/// zero.
public func windowFadeDepth(
    _ index: Int,
    squareCount: Int,
    options: SpiralWindowOptions = SpiralWindowOptions()
) -> Double {
    assertWindow(options)
    precondition(
        index >= 0 && index <= squareCount - 1,
        "Legibility window needs index (\(index)) inside [0, \(squareCount - 1)] "
            + "for a finite squareCount (\(squareCount))."
    )
    // A solid tail has no boundary to solve for: no square ever leaves.
    if !options.fade { return Double(squareCount - 1) }
    let boundary = options.fadeSteps - pow(hiddenBelow, 1 / options.ease)
        * (options.fadeSteps - options.holdSteps)
    let depth = boundary + Double(squareCount) - 1 - Double(index)
    return min(depth, Double(squareCount - 1))
}

// MARK: - Eye

/// The spiral's convergence point: the centre of the smallest square —
/// exact in the φ-limit. Mirrors `spiralEye`.
public func spiralEye(_ layout: GridLayout) -> (x: Double, y: Double) {
    let smallest = layout.squares.min { $0.size < $1.size }!
    return (
        x: Double(smallest.x) + Double(smallest.size) / 2,
        y: Double(smallest.y) + Double(smallest.size) / 2
    )
}
