// Port of src/utils/colorUtils.ts. Only hexToHsl is needed by the render model;
// hslToCss is a web string formatter and is omitted (the SwiftUI renderer builds
// a Color from the HSL tuple directly).

/// Convert a hex colour to an (h, s, l) tuple — h in [0,360), s/l in [0,100].
/// Mirrors `hexToHsl` arithmetic exactly so it matches the JS golden master.
func hexToHsl(_ hex: String) -> (h: Double, s: Double, l: Double) {
    var clean = hex
    if clean.hasPrefix("#") { clean.removeFirst() }
    let chars = Array(clean)

    func component(_ start: Int) -> Double {
        guard start + 2 <= chars.count else { return 0 }
        let byte = String(chars[start..<start + 2])
        return Double(Int(byte, radix: 16) ?? 0) / 255.0
    }

    let r = component(0)
    let g = component(2)
    let b = component(4)

    let maxV = max(r, g, b)
    let minV = min(r, g, b)
    var h = 0.0
    var s = 0.0
    let l = (maxV + minV) / 2

    if maxV != minV {
        let d = maxV - minV
        s = l > 0.5 ? d / (2 - maxV - minV) : d / (maxV + minV)
        if maxV == r {
            h = (g - b) / d + (g < b ? 6 : 0)
        } else if maxV == g {
            h = (b - r) / d + 2
        } else {
            h = (r - g) / d + 4
        }
        h = h / 6
    }

    return (h * 360, s * 100, l * 100)
}
