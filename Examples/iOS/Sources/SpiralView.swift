import SwiftUI
import GoldenGrids

/// Spiral dial — the depth camera over a fifteen-square layout, the SwiftUI
/// analogue of the web demo's spiral mode. A slider (or a vertical drag on
/// the stage) dials depth continuously; the stage applies one
/// `toAffineTransform` about a top-left origin, and each square fades through
/// `spiralWindow` so only a few tiles read at a time.
struct SpiralView: View {
    private static let count = 15
    private static let fib: [Int] = {
        var seq = [1, 1]
        while seq.count < count { seq.append(seq[seq.count - 1] + seq[seq.count - 2]) }
        return seq
    }()

    /// Trailing side is solved per count, not hardcoded — the direction the
    /// composition grows into cycles with the square count (see
    /// `trailToRotateDeg`). Down suits a portrait phone stage.
    private static let layout = generateGoldenGridLayout(
        fib,
        clockwise: true,
        rotate: trailToRotateDeg(.bottom, clockwise: true, squareCount: count)
    )

    @State private var depth: Double = 0
    @State private var dragStartDepth: Double?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                GeometryReader { geo in
                    stage(in: geo.size)
                }
                .clipped()
                .contentShape(Rectangle())
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            // Drag DOWN to dial deeper, one square per ~180pt.
                            let start = dragStartDepth ?? depth
                            dragStartDepth = start
                            let travelled = Double(value.translation.height) / 180
                            depth = min(max(start + travelled, 0), Double(Self.count - 1))
                        }
                        .onEnded { _ in dragStartDepth = nil }
                )

                VStack(spacing: 8) {
                    Slider(value: $depth, in: 0...Double(Self.count - 1))
                    Text("depth \(depth, specifier: "%.2f") — square \(Self.count - Int(depth.rounded()))")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)
            }
            .padding(.horizontal, 4)
            .padding(.bottom, 12)
            .navigationTitle("Spiral")
        }
    }

    @ViewBuilder
    private func stage(in size: CGSize) -> some View {
        // A zero-sized proposal is a real state during the tab transition,
        // and spiralCamera treats it as a caller error by design (the same
        // contract as the web): skip the frame instead of crashing on the
        // precondition. The production dial guards exactly like this.
        if size.width > 0 && size.height > 0 {
            stageContent(in: size)
        } else {
            Color.clear
        }
    }

    private static let texturePx: Double = 512

    private func stageContent(in size: CGSize) -> some View {
        let frame = spiralCamera(
            Self.layout,
            depth: depth,
            viewportWidth: Double(size.width),
            viewportHeight: Double(size.height),
            // A larger fill than the 1/φ default: the dial is the whole
            // point of this screen, so the focus owns most of the stage.
            options: SpiralCameraOptions(fillRatio: 0.85, clockwise: true)
        )
        // Per-tile composed transforms, NOT one matrix over a shared stage:
        // a stage transform rasterizes the 1-unit deep squares and upscales
        // the raster hundreds of times — the library's tileTransform exists
        // precisely for this. Each tile renders into a texturePx box at a net
        // scale near 1, so every era paints at native resolution.
        return ZStack(alignment: .topLeading) {
            ForEach(Self.layout.squares.indices, id: \.self) { index in
                let square = Self.layout.squares[index]
                let window = spiralWindow(index, depth: depth, squareCount: Self.count)
                if !window.hidden {
                    tile(index: index, focused: window.focused, frame: frame)
                        .opacity(window.opacity)
                        .transformEffect(
                            toAffineTileTransform(
                                frame,
                                square: square,
                                viewportWidth: Double(size.width),
                                viewportHeight: Double(size.height),
                                texturePx: Self.texturePx
                            )
                        )
                }
            }
        }
        .animation(.linear(duration: 0.05), value: depth)
    }

    private func tile(index: Int, focused: Bool, frame: SpiralCameraFrame) -> some View {
        let hue = Double(index) / Double(Self.count)
        let t = Self.texturePx
        // Orientation-lock the label: counter-rotate the content against the
        // dial (about its own centre, the SwiftUI default) so it orbits with
        // the tile but never spins. A configuration detail — pass
        // counterRotate: false to let content ride the spiral instead.
        let content = contentTransform(frame)
        return RoundedRectangle(cornerRadius: t * 0.02)
            .fill(Color(hue: hue, saturation: 0.45, brightness: focused ? 0.95 : 0.75))
            .overlay(
                RoundedRectangle(cornerRadius: t * 0.02)
                    .strokeBorder(.black.opacity(0.25), lineWidth: t * 0.005)
            )
            .overlay(
                Text("\(index + 1)")
                    .font(.system(size: t * 0.3, weight: .bold, design: .rounded))
                    .foregroundStyle(.black.opacity(0.45))
                    .rotationEffect(.degrees(content.rotationDeg))
                    .scaleEffect(content.scale)
            )
            .frame(width: t, height: t)
            .clipped()
    }
}
