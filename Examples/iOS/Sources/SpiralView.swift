import SwiftUI
import GoldenGrids

/// Spiral — the depth dial. Twelve Fibonacci squares laid out by the library,
/// viewed through `spiralCamera`: drag up (or scrub the dial) to travel one
/// square deeper per step, exactly as the camera composes it. The rotation is
/// solved with `trailToRotateDeg(.bottom, …)` so everything still to be dialed
/// through trails off the bottom of the portrait screen, and each tile's
/// presence comes from `spiralWindow`. Tiles are composed from the frame
/// directly (position, rotation, size) so their labels stay crisp at any
/// zoom; a stage already sized in points can apply `toAffineTransform` to a
/// single container instead.
struct SpiralView: View {
    private static let count = 12
    private static let sequence: [Int] = {
        var seq = [1, 1]
        while seq.count < SpiralView.count { seq.append(seq[seq.count - 1] + seq[seq.count - 2]) }
        return seq
    }()
    private static let layout = generateGoldenGridLayout(
        SpiralView.sequence,
        clockwise: true,
        rotate: trailToRotateDeg(.bottom, clockwise: true, squareCount: SpiralView.count)
    )

    @State private var depth: Double = 0
    @State private var dragBase: Double? = nil

    private let maxDepth = Double(SpiralView.count - 1)

    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                // A zero-sized pass mid-layout is a real state — skip the frame
                // rather than hand the camera a degenerate viewport.
                if geo.size.width > 0 && geo.size.height > 0 {
                    let frame = spiralCamera(
                        Self.layout,
                        depth: depth,
                        viewportWidth: geo.size.width,
                        viewportHeight: geo.size.height
                    )
                    ZStack {
                        Color(white: 0.97)
                        ForEach(Self.layout.squares.indices, id: \.self) { i in
                            let window = spiralWindow(index: i, depth: depth, squareCount: Self.count)
                            if !window.hidden {
                                tile(i, frame: frame, in: geo.size)
                                    .opacity(window.opacity)
                            }
                        }
                    }
                    .clipped()
                    .contentShape(Rectangle())
                    .gesture(dial(in: geo.size))
                }
            }
            .overlay(alignment: .bottom) { hud }
            .navigationTitle("Spiral")
        }
    }

    /// One square, composed from the camera frame: rendered at its final
    /// on-screen size so the label stays sharp however deep the dial goes.
    private func tile(_ i: Int, frame: SpiralCameraFrame, in size: CGSize) -> some View {
        let sq = Self.layout.squares[i]
        let side = Double(sq.size) * frame.scale
        let rad = frame.rotationDeg * .pi / 180
        let dx = (Double(sq.x) + Double(sq.size) / 2 - frame.centerX) * frame.scale
        let dy = (Double(sq.y) + Double(sq.size) / 2 - frame.centerY) * frame.scale
        // The anchor: the focused square's centre lands at the viewport centre.
        let center = CGPoint(
            x: size.width / 2 + dx * cos(rad) - dy * sin(rad),
            y: size.height / 2 + dx * sin(rad) + dy * cos(rad)
        )
        return ZStack {
            Rectangle().fill(color(i))
            Rectangle().strokeBorder(Color.white.opacity(0.55), lineWidth: max(1, side * 0.008))
            Text("\(Self.sequence[i])")
                .font(.system(size: side * 0.3, weight: .bold, design: .rounded))
                .foregroundStyle(.white.opacity(0.92))
        }
        .frame(width: side, height: side)
        .rotationEffect(.degrees(frame.rotationDeg))
        .position(center)
    }

    /// The same idea as the web HSL progression: walk the hue away from the
    /// example app's indigo, darkening toward the spiral's eye.
    private func color(_ i: Int) -> Color {
        let fraction = Double(Self.count - 1 - i) / Double(Self.count - 1)
        return Color(
            hue: (0.66 + 0.45 * fraction).truncatingRemainder(dividingBy: 1),
            saturation: 0.38,
            brightness: 0.84 - 0.22 * fraction
        )
    }

    /// Drag up to dial deeper — one depth step per sixth of the screen.
    private func dial(in size: CGSize) -> some Gesture {
        DragGesture()
            .onChanged { value in
                let base = dragBase ?? depth
                dragBase = base
                let step = max(120, size.height / 6)
                depth = min(maxDepth, max(0, base - value.translation.height / step))
            }
            .onEnded { _ in dragBase = nil }
    }

    private var hud: some View {
        let focused = Self.sequence[Int(focusIndexAt(depth: depth, squareCount: Self.count).rounded())]
        return VStack(spacing: 8) {
            Text("depth \(depth, specifier: "%.2f") — focused on \(focused)")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
            Slider(value: $depth, in: 0...maxDepth)
                .tint(Palette.headlinePurple)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 12)
    }
}
