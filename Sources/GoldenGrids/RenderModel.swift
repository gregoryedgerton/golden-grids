// Port of src/utils/renderModel.ts — the pure, platform-neutral render model.
// Types are Decodable so the Swift port can be verified against the shared
// render-model.json golden master, and Equatable for comparison.

public struct RenderModelInput: Decodable, Sendable {
    public var from: Int?
    public var to: Int?
    public var color: String?
    public var clockwise: Bool?
    public var placement: PlacementValue?

    public init(from: Int? = nil, to: Int? = nil, color: String? = nil,
                clockwise: Bool? = nil, placement: PlacementValue? = nil) {
        self.from = from
        self.to = to
        self.color = color
        self.clockwise = clockwise
        self.placement = placement
    }
}

/// A positioned box, normalised to the [0, 1] range of the bounding box.
public struct Rect: Decodable, Equatable, Sendable {
    public var left: Double
    public var top: Double
    public var width: Double
    public var height: Double
}

/// Platform-neutral fill. `.hsl` is the computed progression; `.raw` passes the
/// user's colour string through verbatim (placeholder). `nil` = transparent.
public enum FillColor: Equatable, Sendable {
    case hsl(h: Double, s: Double, l: Double)
    case raw(value: String)
}

extension FillColor: Decodable {
    private enum CodingKeys: String, CodingKey { case kind, h, s, l, value }
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        switch try c.decode(String.self, forKey: .kind) {
        case "hsl":
            self = .hsl(h: try c.decode(Double.self, forKey: .h),
                        s: try c.decode(Double.self, forKey: .s),
                        l: try c.decode(Double.self, forKey: .l))
        case "raw":
            self = .raw(value: try c.decode(String.self, forKey: .value))
        case let other:
            throw DecodingError.dataCorruptedError(forKey: .kind, in: c,
                debugDescription: "Unknown fill kind \(other)")
        }
    }
}

public struct RenderSlot: Decodable, Equatable, Sendable {
    public var rect: Rect
    public var color: FillColor?
    public var childIndex: Int
}

public struct RenderPlaceholder: Decodable, Equatable, Sendable {
    public var rect: Rect
    public var color: FillColor?
}

public struct AspectRatio: Decodable, Equatable, Sendable {
    public var w: Double
    public var h: Double
}

public struct RenderModel: Decodable, Equatable, Sendable {
    public var kind: String   // "empty" | "single" | "grid"
    public var aspectRatio: AspectRatio
    public var slots: [RenderSlot]
    public var placeholder: RenderPlaceholder?
}

/// Pure, framework-agnostic translation of grid props into a render model.
/// Mirrors `computeRenderModel` exactly (note: integer divisions in the TS are
/// JS float divisions, so every ratio here is computed in Double).
public func computeRenderModel(_ input: RenderModelInput) -> RenderModel {
    let from = input.from ?? 1
    let to = input.to ?? 4
    let clockwise = input.clockwise ?? true
    let placement = input.placement ?? .right

    let baseColor: String? = (input.color?.isEmpty == false) ? input.color : nil
    let hsl: (h: Double, s: Double, l: Double) = baseColor != nil ? hexToHsl(baseColor!) : (0, 0, 50)

    var start = from
    var end = to
    if start > end { swap(&start, &end) }

    guard let range = getGridRange(start, end) else {
        return RenderModel(kind: "empty", aspectRatio: AspectRatio(w: 1, h: 1), slots: [], placeholder: nil)
    }

    let startIdx = range.startIdx
    let endIdx = range.endIdx

    // Single square — no skipped squares, no spiral.
    if startIdx == 0 && endIdx == 0 {
        let slot = RenderSlot(
            rect: Rect(left: 0, top: 0, width: 1, height: 1),
            color: baseColor != nil ? .hsl(h: hsl.h, s: hsl.s, l: hsl.l) : nil,
            childIndex: 0
        )
        return RenderModel(kind: "single", aspectRatio: AspectRatio(w: 1, h: 1), slots: [slot], placeholder: nil)
    }

    let rotateDeg = placementToRotateDeg(placement, clockwise, startIdx)
    let maxRequested = range.userSequence.max()!
    let fullSequence = fullFibonacciUpTo(maxRequested)

    let layout = generateGoldenGridLayout(fullSequence, clockwise: clockwise, rotate: rotateDeg)
    let requestedSquares = Array(layout.squares[startIdx...endIdx])
    let skippedSquares = Array(layout.squares[0..<startIdx])
    let width = Double(layout.width)
    let height = Double(layout.height)

    // --- placeholder bounds (collapsed skipped squares) ---
    let placeholderExists = !skippedSquares.isEmpty
    var placeholder: RenderPlaceholder? = nil
    if placeholderExists {
        var pMinX = Int.max, pMaxX = Int.min, pMinY = Int.max, pMaxY = Int.min
        for sq in skippedSquares {
            if sq.x < pMinX { pMinX = sq.x }
            if sq.x + sq.size - 1 > pMaxX { pMaxX = sq.x + sq.size - 1 }
            if sq.y < pMinY { pMinY = sq.y }
            if sq.y + sq.size - 1 > pMaxY { pMaxY = sq.y + sq.size - 1 }
        }
        let pWidth = pMaxX - pMinX + 1
        let pHeight = pMaxY - pMinY + 1
        placeholder = RenderPlaceholder(
            rect: Rect(
                left: Double(pMinX - layout.minX) / width,
                top: Double(pMinY - layout.minY) / height,
                width: Double(pWidth) / width,
                height: Double(pHeight) / height
            ),
            color: baseColor != nil ? .raw(value: baseColor!) : nil
        )
    }

    // --- colour progression ---
    let totalRequested = requestedSquares.count
    let hueRange = min(330.0, 180.0 + Double(max(0, totalRequested - 4)) * 15.0)
    let lightnessSpread = min(50.0, Double(totalRequested) * 3.0)

    let slots: [RenderSlot] = requestedSquares.enumerated().map { (i, sq) in
        var color: FillColor? = nil
        if baseColor != nil {
            var fraction = 0.0
            if totalRequested > 1 {
                fraction = placeholderExists
                    ? Double(i + 1) / Double(totalRequested + 1)
                    : Double(i) / Double(totalRequested - 1)
            } else if placeholderExists {
                fraction = 0.5
            }
            let currentHue = (hsl.h + hueRange * fraction).truncatingRemainder(dividingBy: 360)
            let currentL = max(10.0, min(90.0, hsl.l + lightnessSpread / 2 - fraction * lightnessSpread))
            color = .hsl(h: currentHue, s: hsl.s, l: currentL)
        }
        return RenderSlot(
            rect: Rect(
                left: Double(sq.x - layout.minX) / width,
                top: Double(sq.y - layout.minY) / height,
                width: Double(sq.size) / width,
                height: Double(sq.size) / height
            ),
            color: color,
            childIndex: totalRequested - 1 - i
        )
    }

    return RenderModel(
        kind: "grid",
        aspectRatio: AspectRatio(w: width, h: height),
        slots: slots,
        placeholder: placeholder
    )
}
