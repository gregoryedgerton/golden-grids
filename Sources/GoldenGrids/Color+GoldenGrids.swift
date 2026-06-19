import SwiftUI

/// Standard HSL → RGB (h 0..360, s/l 0..100, outputs 0..1). SwiftUI's
/// `Color(hue:saturation:brightness:)` is HSB, not HSL, so the render model's
/// HSL fills are converted here.
func hslToRGB(h: Double, s: Double, l: Double) -> (r: Double, g: Double, b: Double) {
    let hN = h / 360, sN = s / 100, lN = l / 100
    if sN == 0 { return (lN, lN, lN) }
    let q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN
    let p = 2 * lN - q
    func hue2rgb(_ t0: Double) -> Double {
        var t = t0
        if t < 0 { t += 1 }
        if t > 1 { t -= 1 }
        if t < 1.0 / 6 { return p + (q - p) * 6 * t }
        if t < 1.0 / 2 { return q }
        if t < 2.0 / 3 { return p + (q - p) * (2.0 / 3 - t) * 6 }
        return p
    }
    return (hue2rgb(hN + 1.0 / 3), hue2rgb(hN), hue2rgb(hN - 1.0 / 3))
}

extension Color {
    static func fromHSL(_ h: Double, _ s: Double, _ l: Double) -> Color {
        let rgb = hslToRGB(h: h, s: s, l: l)
        return Color(red: rgb.r, green: rgb.g, blue: rgb.b)
    }

    /// Build a Color from a "#rrggbb" hex string; falls back to clear.
    static func fromHex(_ hex: String) -> Color {
        var s = hex
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count >= 6, let v = Int(s.prefix(6), radix: 16) else { return .clear }
        return Color(
            red: Double((v >> 16) & 0xff) / 255,
            green: Double((v >> 8) & 0xff) / 255,
            blue: Double(v & 0xff) / 255
        )
    }
}

/// Resolve a render-model fill into a SwiftUI Color (clear when absent).
func resolveFill(_ fill: FillColor?) -> Color {
    switch fill {
    case nil: return .clear
    case let .hsl(h, s, l): return .fromHSL(h, s, l)
    case let .raw(value): return .fromHex(value)
    }
}
