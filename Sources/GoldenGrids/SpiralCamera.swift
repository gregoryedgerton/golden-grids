// Port of src/utils/spiralCamera.ts — the continuous depth-dial camera over a
// golden-grid layout. Verified against the shared spiral-camera.json golden
// master, exactly as RenderModel is verified against render-model.json.

import Foundation
#if canImport(CoreGraphics)
import CoreGraphics
#endif

/// The camera frame for one depth: how to transform the layout so the focused
/// square fills the viewport, with its neighbours composed around it exactly
/// as the spiral places them. Mirrors `SpiralCameraFrame`.
public struct SpiralCameraFrame: Decodable, Equatable, Sendable {
    /// Layout units → viewport points multiplier for this depth.
    public var scale: Double
    /// Stage rotation in degrees (advances ±90° per depth step).
    public var rotationDeg: Double
    /// Focus point in layout coordinates — the point to pin at the anchor.
    public var centerX: Double
    public var centerY: Double

    public init(scale: Double, rotationDeg: Double, centerX: Double, centerY: Double) {
        self.scale = scale
        self.rotationDeg = rotationDeg
        self.centerX = centerX
        self.centerY = centerY
    }
}

private func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double {
    a + (b - a) * t
}

/// Continuous index of the focused square: the last square at depth 0.
/// Mirrors `focusIndexAt`.
public func focusIndexAt(depth: Double, squareCount: Int) -> Double {
    Double(squareCount - 1) - depth
}

/// The camera frame for a depth in [0, squares.count - 1]. Depth 0 focuses the
/// LAST (largest) square; each whole step moves one square deeper. Scale
/// interpolates geometrically (Fibonacci squares shrink exponentially — linear
/// interpolation lurches) and rotation advances 90° per step. Mirrors
/// `spiralCamera`, including its refusal of degenerate inputs.
public func spiralCamera(
    _ layout: GridLayout,
    depth: Double,
    viewportWidth: Double,
    viewportHeight: Double,
    fillRatio: Double = 0.62,
    clockwise: Bool = true
) -> SpiralCameraFrame {
    let count = layout.squares.count

    precondition(fillRatio.isFinite && fillRatio > 0,
                 "fillRatio (\(fillRatio)) must be a positive finite number.")
    precondition(
        viewportWidth.isFinite && viewportHeight.isFinite && viewportWidth > 0 && viewportHeight > 0,
        "Viewport (\(viewportWidth)x\(viewportHeight)) must have positive finite dimensions."
    )
    precondition(depth.isFinite && depth >= 0 && depth <= Double(count - 1),
                 "Depth \(depth) is outside the layout's \(count) squares.")

    let focus = focusIndexAt(depth: depth, squareCount: count)
    let lower = Int(focus.rounded(.down))
    let upper = Int(focus.rounded(.up))

    let t = focus - Double(lower)
    let from = layout.squares[lower]
    let to = layout.squares[upper]

    let focusSize = exp(lerp(log(Double(from.size)), log(Double(to.size)), t))
    let centerX = lerp(Double(from.x) + Double(from.size) / 2, Double(to.x) + Double(to.size) / 2, t)
    let centerY = lerp(Double(from.y) + Double(from.size) / 2, Double(to.y) + Double(to.size) / 2, t)

    let target = fillRatio * min(viewportWidth, viewportHeight)
    let scale = target / focusSize
    // +90 per step for a clockwise layout — see the TS source for why the
    // stage rotates against the spiral's own quarter-turn.
    let rotationDeg = (clockwise ? 90.0 : -90.0) * depth

    return SpiralCameraFrame(scale: scale, rotationDeg: rotationDeg, centerX: centerX, centerY: centerY)
}

#if canImport(CoreGraphics)
/// The frame as a `CGAffineTransform` for a stage whose children sit at layout
/// coordinates used as points — the analogue of `toCssTransform`. Apply it in
/// the stage's own top-leading coordinate space (e.g. SwiftUI
/// `.transformEffect`), the equivalent of CSS `transform-origin: 0 0`.
///
/// `anchor` is where the focused square's CENTRE lands in viewport points —
/// the dial's pivot, defaulting to the viewport centre. Which edge to hug is
/// the consumer's layout decision, exactly as on the web.
public func toAffineTransform(
    _ frame: SpiralCameraFrame,
    viewportWidth: Double,
    viewportHeight: Double,
    anchor: CGPoint? = nil
) -> CGAffineTransform {
    let pivot = anchor ?? CGPoint(x: viewportWidth / 2, y: viewportHeight / 2)
    precondition(pivot.x.isFinite && pivot.y.isFinite,
                 "Anchor (\(pivot.x), \(pivot.y)) must be finite.")
    return CGAffineTransform(translationX: pivot.x, y: pivot.y)
        .rotated(by: frame.rotationDeg * .pi / 180)
        .scaledBy(x: frame.scale, y: frame.scale)
        .translatedBy(x: -frame.centerX, y: -frame.centerY)
}
#endif

/// The side of the focused square the spiral's interior trails toward.
public enum SpiralTrail: String, Codable, Sendable, CaseIterable {
    case right, bottom, left, top
}

/// The layout rotation that makes the dial trail toward a given side — which
/// side cycles with the square COUNT as well as the rotation, so a consumer
/// that filters its content must re-solve. Mirrors `trailToRotateDeg`.
public func trailToRotateDeg(_ trail: SpiralTrail, clockwise: Bool = true, squareCount: Int) -> Int {
    precondition(squareCount >= 2, "squareCount (\(squareCount)) must be an integer of at least 2.")
    let wanted = SpiralTrail.allCases.firstIndex(of: trail)!
    let natural = clockwise ? squareCount : -squareCount
    return (((wanted - natural) % 4) + 4) % 4 * 90
}

/// The side the interior trails toward for a layout that already exists — the
/// inverse of `trailToRotateDeg`. Mirrors `trailForRotation`.
public func trailForRotation(_ rotateDeg: Int, clockwise: Bool = true, squareCount: Int) -> SpiralTrail {
    precondition([0, 90, 180, 270].contains(rotateDeg),
                 "Invalid rotation value: \(rotateDeg). Only 0, 90, 180, and 270 are allowed.")
    precondition(squareCount >= 2, "squareCount (\(squareCount)) must be an integer of at least 2.")
    let natural = clockwise ? squareCount : -squareCount
    return SpiralTrail.allCases[(((rotateDeg / 90 + natural) % 4) + 4) % 4]
}

/// The legibility window around the focus: how present square `index` is at
/// `depth`. One ramp gives "a few tiles at a time" and the crossfade; `hidden`
/// fires exactly when the RENDERED (3-decimal) opacity reaches zero, so
/// invisible content never stays hittable. Mirrors `SpiralWindow`.
public struct SpiralWindow: Decodable, Equatable, Sendable {
    public var opacity: Double
    public var hidden: Bool
    public var focused: Bool
}

/// Mirrors `spiralWindow` (holdSteps: how long a tile stays fully opaque;
/// fadeSteps: where opacity reaches zero — deliberately one number, not two).
public func spiralWindow(
    index: Int,
    depth: Double,
    squareCount: Int,
    holdSteps: Double = 1,
    fadeSteps: Double = 2.5
) -> SpiralWindow {
    precondition(holdSteps.isFinite && fadeSteps.isFinite && holdSteps >= 0 && fadeSteps > holdSteps,
                 "Legibility window needs 0 <= holdSteps (\(holdSteps)) < fadeSteps (\(fadeSteps)).")
    precondition(
        depth.isFinite && depth >= 0 && depth <= Double(squareCount - 1)
            && index >= 0 && index <= squareCount - 1,
        "Legibility window needs depth (\(depth)) and index (\(index)) inside "
            + "[0, \(squareCount - 1)]."
    )
    let delta = abs(focusIndexAt(depth: depth, squareCount: squareCount) - Double(index))
    let raw = delta <= holdSteps ? 1.0 : max(0, (fadeSteps - delta) / (fadeSteps - holdSteps))
    // Round to the value the consumer will actually render (TS: toFixed(3)).
    let opacity = (raw * 1000).rounded() / 1000
    return SpiralWindow(opacity: opacity, hidden: opacity <= 0, focused: delta < 0.5)
}

/// A point in layout coordinates.
public struct SpiralPoint: Decodable, Equatable, Sendable {
    public var x: Double
    public var y: Double

    public init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }
}

/// The spiral's eye: the point the squares converge on as they shrink —
/// approximated as the centre of the smallest square, exact in the φ-limit.
/// Mirrors `spiralEye`.
public func spiralEye(_ layout: GridLayout) -> SpiralPoint {
    let smallest = layout.squares.min(by: { $0.size < $1.size })!
    return SpiralPoint(
        x: Double(smallest.x) + Double(smallest.size) / 2,
        y: Double(smallest.y) + Double(smallest.size) / 2
    )
}
