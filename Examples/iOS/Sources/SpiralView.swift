import SwiftUI
import GoldenGrids

/// Spiral dial — the depth camera over up to NINETY-ONE squares, the SwiftUI
/// analogue of the production dial. Scroll the stage (drag, with inertia);
/// the segmented sets re-dial through spirals of their own size — ALL is the
/// untouched 1–91, DUO/TRIO/QUAD are the smallest spirals that exist (two,
/// three and four squares).
/// Each square fades through `spiralWindow` and every tile carries its own
/// camera-composed transform.
///
/// Ninety-one is the integer ceiling, not a taste choice: the 92-square
/// layout's bounding box is F(93) ≈ 1.22 × 10¹⁹, past Int64.max — and the
/// web port walls even earlier, at 78 (Number.MAX_SAFE_INTEGER). Going to a
/// true 100 needs a float-coordinate layout in the library.
///
/// The filters are the grego facet lesson as a demo: the spiral is
/// count-driven, so a filtered set is the SAME machine over fewer squares —
/// layout and trail re-SOLVED per count, never reused across counts.
struct SpiralView: View {
    private static let fullCount = 91

    /// Which numbers ride the dial. The number is the tile's CONTENT — its
    /// geometry comes from its position in the filtered layout.
    enum NumberFilter: String, CaseIterable, Identifiable {
        case all = "ALL"
        case duo = "DUO"
        case trio = "TRIO"
        case quad = "QUAD"
        var id: String { rawValue }

        var numbers: [Int] {
            switch self {
            case .all: return Array(1...SpiralView.fullCount)
            case .duo: return [1, 2]
            case .trio: return [1, 2, 3]
            case .quad: return [1, 2, 3, 4]
            }
        }
    }

    /// One dial per filter: its numbers, and a spiral laid out for exactly
    /// that count — fib run and trail rotation both re-solved, because the
    /// trail direction cycles with the square count.
    struct Dial {
        let numbers: [Int]
        let layout: GoldenGrids.GridLayout
        var count: Int { numbers.count }
    }

    private static let dials: [NumberFilter: Dial] = {
        var out: [NumberFilter: Dial] = [:]
        for filter in NumberFilter.allCases {
            let numbers = filter.numbers
            var fib = [1, 1]
            while fib.count < numbers.count { fib.append(fib[fib.count - 1] + fib[fib.count - 2]) }
            out[filter] = Dial(
                numbers: numbers,
                layout: generateGoldenGridLayout(
                    fib,
                    clockwise: true,
                    rotate: trailToRotateDeg(.bottom, clockwise: true, squareCount: numbers.count)
                )
            )
        }
        return out
    }()

    @State private var filter: NumberFilter = SpiralView.initialFilter()
    // Clamped against the INITIAL filter's dial, not the full set — GG_DEPTH
    // combined with a short GG_FILTER must not start out of range.
    @State private var depth: Double = SpiralView.initialDepth(
        for: SpiralView.dials[SpiralView.initialFilter()]!.count
    )
    @State private var dragStartDepth: Double?
    /// Last two drag samples, for a live-flick velocity (depth/second) —
    /// only the final <100 ms of the gesture should decide the coast, or a
    /// slow settle at the end of a fast drag inherits stale speed.
    @State private var lastSample: (time: Date, depth: Double)?
    @State private var flickVelocity: Double = 0
    @State private var coastTask: Task<Void, Never>?

    private var dial: Dial { Self.dials[filter]! }
    private var maxDepth: Double { Double(dial.count - 1) }

    /// Screenshot hooks, like GG_TAB in App.swift: GG_DEPTH starts the dial
    /// at a depth, GG_AUTOSPIN dials from there at N squares/second — both
    /// demo-only, for recording the README artwork deterministically.
    private static func initialDepth(for count: Int) -> Double {
        guard let raw = ProcessInfo.processInfo.environment["GG_DEPTH"],
              let value = Double(raw) else { return 0 }
        return min(max(value, 0), Double(count - 1))
    }

    /// GG_FILTER selects a segment at launch (all/duo/trio/quad) — the same
    /// deterministic-recording family as GG_TAB/GG_DEPTH/GG_AUTOSPIN.
    private static func initialFilter() -> NumberFilter {
        guard let raw = ProcessInfo.processInfo.environment["GG_FILTER"] else { return .all }
        return NumberFilter(rawValue: raw.uppercased()) ?? .all
    }

    private static func autospinRate() -> Double? {
        guard let raw = ProcessInfo.processInfo.environment["GG_AUTOSPIN"],
              let value = Double(raw), value > 0 else { return nil }
        return value
    }

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
                            // A new touch interrupts any coast — grabbing the
                            // dial stops it, like grabbing a real wheel.
                            coastTask?.cancel()
                            let start = dragStartDepth ?? depth
                            dragStartDepth = start
                            // Drag DOWN to dial deeper, one square per ~180pt.
                            let next = min(max(start + Double(value.translation.height) / 180, 0), maxDepth)
                            let now = Date()
                            if let sample = lastSample {
                                let dt = now.timeIntervalSince(sample.time)
                                // Live flick only: a sample older than 100 ms
                                // means the finger settled — no inherited speed.
                                flickVelocity = dt > 0 && dt < 0.1 ? (next - sample.depth) / dt : 0
                            }
                            lastSample = (now, next)
                            depth = next
                        }
                        .onEnded { _ in
                            dragStartDepth = nil
                            // A finger that settled before lifting emits no
                            // further samples — the stored velocity is stale
                            // and must not coast. Only a release within the
                            // live-flick window keeps its speed.
                            let live = lastSample.map { Date().timeIntervalSince($0.time) < 0.1 } ?? false
                            lastSample = nil
                            startCoast(velocity: live ? flickVelocity : 0)
                            flickVelocity = 0
                        }
                )

                VStack(spacing: 8) {
                    // Quick filters in the slider's old seat: the same
                    // numbers re-dialed through a smaller spiral. Switching
                    // grabs the dial (kills any coast) and re-clamps depth
                    // into the new, shorter track.
                    Picker("Filter", selection: $filter) {
                        ForEach(NumberFilter.allCases) { option in
                            Text(option.rawValue).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    // The two-parameter onChange still deploys below iOS 17.
                    .onChange(of: filter) { _ in
                        coastTask?.cancel()
                        depth = min(depth, maxDepth)
                    }
                    // Clamp BEFORE indexing: on a filter switch SwiftUI
                    // renders this body with the new dial before onChange
                    // has re-clamped the state, and an unclamped depth would
                    // index outside the shorter dial.
                    Text("depth \(min(depth, maxDepth), specifier: "%.2f") — square \(dial.numbers[dial.count - 1 - Int(min(depth, maxDepth).rounded())])")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)
            }
            .padding(.horizontal, 4)
            .padding(.bottom, 12)
            .navigationTitle("Interactive Experiences")
            .onDisappear { coastTask?.cancel() }
            .task {
                guard let rate = Self.autospinRate() else { return }
                _ = dial
                // Advance by measured elapsed time, not per-wakeup: sleeps
                // are nominal (and drift under load), and the recording hook
                // promises N squares per wall-clock second.
                var last = ContinuousClock.now
                while !Task.isCancelled && depth < maxDepth {
                    try? await Task.sleep(nanoseconds: 16_000_000)
                    let now = ContinuousClock.now
                    let elapsed = Double((now - last).components.attoseconds) / 1e18
                        + Double((now - last).components.seconds)
                    last = now
                    depth = min(depth + rate * elapsed, maxDepth)
                }
            }
        }
    }

    /// Decaying inertia after a flick — deliberately in the DEMO, not the
    /// library: the camera answers "where is the viewport at depth d", and
    /// how depth moves (gesture feel, decay rate, interrupts) is the
    /// consumer's interaction design. Same shape the production dial uses:
    /// multiply velocity by ~0.94 per frame and stop when it dies or the
    /// reader grabs the dial.
    private func startCoast(velocity: Double) {
        coastTask?.cancel()
        guard abs(velocity) > 0.05 else { return }
        var v = velocity
        coastTask = Task { @MainActor in
            while !Task.isCancelled && abs(v) > 0.01 {
                try? await Task.sleep(nanoseconds: 16_000_000) // ~60 fps
                if Task.isCancelled { return }
                let next = min(max(depth + v / 60, 0), maxDepth)
                depth = next
                // Hitting either end kills the coast rather than pinning
                // against the bound at full speed.
                if next == 0 || next == maxDepth { return }
                // Longer coast than the production dial's 0.94: with up to
                // ninety-one squares the ride IS the demo.
                v *= 0.97
            }
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
            dial.layout,
            depth: min(depth, maxDepth),
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
            ForEach(dial.layout.squares.indices, id: \.self) { index in
                let square = dial.layout.squares[index]
                let window = spiralWindow(index, depth: min(depth, maxDepth), squareCount: dial.count)
                let tileScale = frame.scale * Double(square.size) / Self.texturePx
                // With ninety-one squares most of the interior is sub-pixel
                // at any depth — skip tiles that would paint under half a
                // pixel rather than composite ninety-one views per frame.
                if !window.hidden && tileScale * Self.texturePx >= 0.5 {
                    tile(number: dial.numbers[index], focused: window.focused, frame: frame)
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

    private func tile(number: Int, focused: Bool, frame: SpiralCameraFrame) -> some View {
        // Hue keyed to the NUMBER, not the position: 46 keeps its colour in
        // every filter it appears in.
        let hue = Double(number).truncatingRemainder(dividingBy: 15) / 15
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
                Text("\(number)")
                    .font(.system(size: t * 0.25, weight: .bold, design: .rounded))
                    .foregroundStyle(.black.opacity(0.45))
                    .rotationEffect(.degrees(content.rotationDeg))
                    .scaleEffect(content.scale)
            )
            .frame(width: t, height: t)
            .clipped()
    }
}
