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
            VStack(spacing: 16) {
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

                VStack(spacing: 6) {
                    Slider(value: $depth, in: 0...Double(Self.count - 1))
                    Text("depth \(depth, specifier: "%.2f") — square \(Self.count - Int(depth.rounded()))")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)
            }
            .padding(12)
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

    private func stageContent(in size: CGSize) -> some View {
        let frame = spiralCamera(
            Self.layout,
            depth: depth,
            viewportWidth: Double(size.width),
            viewportHeight: Double(size.height),
            options: SpiralCameraOptions(fillRatio: 0.62, clockwise: true)
        )
        let transform = toAffineTransform(
            frame,
            viewportWidth: Double(size.width),
            viewportHeight: Double(size.height)
        )
        return ZStack(alignment: .topLeading) {
            ForEach(Self.layout.squares.indices, id: \.self) { index in
                let square = Self.layout.squares[index]
                let window = spiralWindow(index, depth: depth, squareCount: Self.count)
                if !window.hidden {
                    tile(index: index, square: square, focused: window.focused)
                        .opacity(window.opacity)
                }
            }
        }
        // One camera matrix over the whole stage. transformEffect applies
        // "relative to the view's coordinate space origin" (its top-leading
        // corner) — exactly the (0, 0) frame toAffineTransform encodes its
        // translation for. There is no anchor parameter to get wrong here;
        // this SDK's only overload is origin-anchored.
        .transformEffect(transform)
        .animation(.linear(duration: 0.05), value: depth)
    }

    private func tile(index: Int, square: Square, focused: Bool) -> some View {
        let hue = Double(index) / Double(Self.count)
        return RoundedRectangle(cornerRadius: Double(square.size) * 0.02)
            .fill(Color(hue: hue, saturation: 0.45, brightness: focused ? 0.95 : 0.75))
            .overlay(
                RoundedRectangle(cornerRadius: Double(square.size) * 0.02)
                    .strokeBorder(.black.opacity(0.25), lineWidth: Double(square.size) * 0.005)
            )
            .overlay(
                Text("\(index + 1)")
                    .font(.system(size: Double(square.size) * 0.3, weight: .bold, design: .rounded))
                    .foregroundStyle(.black.opacity(0.45))
            )
            .frame(width: Double(square.size), height: Double(square.size))
            .offset(x: Double(square.x), y: Double(square.y))
    }
}
