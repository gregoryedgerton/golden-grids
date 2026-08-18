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
    /// the paint and the accessibility order.
    public var fadeSteps: Double
    public init(holdSteps: Double = 1, fadeSteps: Double = 2.5) {
        self.holdSteps = holdSteps
        self.fadeSteps = fadeSteps
    }
}

public struct SpiralWindow: Equatable, Sendable {
    public var opacity: Double
    public var hidden: Bool
    public var focused: Bool
}

/// The legibility window around the focus. Mirrors `spiralWindow`, including
/// the 3-decimal rounding that `hidden` derives from.
public func spiralWindow(
    _ index: Int,
    depth: Double,
    squareCount: Int,
    options: SpiralWindowOptions = SpiralWindowOptions()
) -> SpiralWindow {
    let hold = options.holdSteps
    let fade = options.fadeSteps
    precondition(
        hold.isFinite && fade.isFinite && hold >= 0 && fade > hold,
        "Legibility window needs 0 <= holdSteps (\(hold)) < fadeSteps (\(fade))."
    )
    precondition(
        depth.isFinite && depth >= 0 && depth <= Double(squareCount - 1)
            && index >= 0 && index <= squareCount - 1,
        "Legibility window needs depth (\(depth)) and index (\(index)) inside "
            + "[0, \(squareCount - 1)] for a finite squareCount (\(squareCount))."
    )
    let delta = abs(focusIndexAt(depth, squareCount) - Double(index))
    let raw = delta <= hold ? 1 : max(0, (fade - delta) / (fade - hold))
    // Same rounding the TS does with Number(raw.toFixed(3)): hidden follows
    // the value the consumer will actually render.
    let opacity = (raw * 1000).rounded() / 1000
    return SpiralWindow(opacity: opacity, hidden: opacity <= 0, focused: delta < 0.5)
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
