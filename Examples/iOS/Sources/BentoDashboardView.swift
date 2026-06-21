import SwiftUI
import GoldenGrids

/// Bento dashboard — statistics in the proportional slots, rotated to portrait
/// with `placement: .top`. On appear the screen animates itself in: the grid
/// grows from two cells to four (revealing the slider panels), the figures count
/// up, the Focus plot points settle into place, and the Sleep tile fades from a
/// daytime sky to a dark night.
struct BentoDashboardView: View {
    private let base: CGFloat = 24 // 1× value size
    @State private var appeared = false

    var body: some View {
        NavigationStack {
            GoldenGrid(from: 1, to: appeared ? 4 : 2, placement: .top) { ordinal in
                switch ordinal {
                case 0: focusTile
                case 1: sleepTile
                case 2: stepsTile
                default: tasksTile
                }
            }
            .padding(12)
            .animation(.spring(response: 0.75, dampingFraction: 0.82), value: appeared)
            .navigationTitle("Dashboards")
            .onAppear {
                // Let the launch / tab transition settle so the intro plays on-screen.
                guard !appeared else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { appeared = true }
            }
            .onDisappear { appeared = false } // replay the intro on return
        }
    }

    // ordinal 0 — hero, 5×, day-sky blue. The figure counts up and the plot
    // points settle into place; deep navy ink keeps it legible on the light fill.
    private var focusTile: some View {
        stat(icon: "target", value: 82, decimals: 0, unit: "%", label: "Focus Flow",
             valueSize: base * 5, labelFont: .title2, onDark: true, ink: Palette.focusInk,
             reveal: appeared)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background {
                ZStack(alignment: .top) {
                    Palette.daySkyBlue
                    GeometryReader { geo in
                        FocusPlot(tint: Palette.focusInk, progress: appeared ? 1 : 0)
                            .frame(height: max(80, geo.size.height * 0.42))
                            .padding(.horizontal, 18)
                            .padding(.top, 52)
                            .animation(.easeOut(duration: 0.9).delay(0.2), value: appeared)
                    }
                }
            }
    }

    // ordinal 1 — sleep, 3×, gradient fades from day to a dark night + separator
    private var sleepTile: some View {
        stat(icon: "moon.stars", value: 6.2, decimals: 1, unit: "hrs", label: "Sleep",
             valueSize: base * 3, labelFont: .title3, onDark: true, reveal: appeared)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(LinearGradient(
                colors: appeared ? Self.sleepNight : Self.sleepDay,
                startPoint: .topLeading, endPoint: .bottomTrailing))
            .animation(.easeInOut(duration: 1.3).delay(0.1), value: appeared)
            .overlay(alignment: .leading) {
                Rectangle().fill(.white.opacity(0.35)).frame(width: 1)
            }
    }

    // Sleep tile fades along this day → night transition. The night end is darker
    // than the old purple→gray fill, so the tile reads as "asleep".
    private static let sleepDay: [Color] = [
        Color(red: 0.46, green: 0.62, blue: 0.92), Color(red: 0.88, green: 0.92, blue: 0.99),
    ]
    private static let sleepNight: [Color] = [
        Color(red: 0.06, green: 0.05, blue: 0.22), Color(red: 0.22, green: 0.18, blue: 0.40),
    ]

    // ordinal 2 — an eyes / nose / ear selector, set to eyes
    private var stepsTile: some View {
        EmojiSliderTile(items: ["👀", "👃", "👂"], start: 0)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Palette.panelGray)
    }

    // ordinal 3 — a mood selector: a face + a 3-stop slider, top separator from steps
    private var tasksTile: some View {
        EmojiSliderTile(items: ["🙁", "😐", "🙂"], start: 2)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Palette.panelGray)
            .overlay(alignment: .top) {
                Rectangle().fill(Color.primary.opacity(0.12)).frame(height: 1)
            }
    }

    // `ink` overrides the foreground (icon/value/label) for tiles whose fill needs
    // a custom text colour. `reveal` drives the count-up of the figure.
    private func stat(icon: String, value: Double, decimals: Int, unit: String, label: String,
                      valueSize: CGFloat, labelFont: Font, onDark: Bool,
                      ink: Color? = nil, tint: Color = .primary, reveal: Bool) -> some View {
        let primaryFg = ink ?? (onDark ? Color.white : Color.primary)
        let iconFg = ink ?? (onDark ? Color.white : tint)
        let labelFg = ink?.opacity(0.8) ?? (onDark ? Color.white.opacity(0.9) : Color.secondary)
        return VStack(alignment: .leading, spacing: 4) {
            Image(systemName: icon)
                .font(valueSize >= base * 3 ? .title : .title3)
                .foregroundStyle(iconFg)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Counter(value: reveal ? value : 0, decimals: decimals)
                    .font(.system(size: valueSize, weight: .bold, design: .rounded))
                    .animation(.easeOut(duration: 1.0).delay(0.15), value: reveal)
                if !unit.isEmpty {
                    Text(unit).font(.system(size: valueSize * 0.4, weight: .semibold, design: .rounded)).opacity(0.8)
                }
            }
            .minimumScaleFactor(0.4)
            .lineLimit(1)
            Text(label).font(labelFont)
                .foregroundStyle(labelFg)
        }
        .foregroundStyle(primaryFg)
        .padding(onDark ? 18 : 14)
    }
}

/// A number that counts up as its value animates.
private struct Counter: View, Animatable {
    var value: Double
    var decimals: Int

    var animatableData: Double {
        get { value }
        set { value = newValue }
    }

    var body: some View {
        Text(decimals <= 0 ? "\(Int(value.rounded()))" : String(format: "%.\(decimals)f", value))
    }
}

/// A small selector — one emoji shown large, with a slider whose stops choose
/// between the items.
private struct EmojiSliderTile: View {
    let items: [String]
    @State private var index: Double

    init(items: [String], start: Int) {
        self.items = items
        _index = State(initialValue: Double(start))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(items[max(0, min(items.count - 1, Int(index.rounded())))])
                .font(.system(size: 40))
            Spacer(minLength: 0)
            Slider(value: $index, in: 0...Double(items.count - 1), step: 1)
                .tint(.blue)
        }
        .padding(12)
    }
}

/// Abstract data plot — the points settle from a flat baseline into place as
/// `progress` animates 0→1, fading in as they arrive. Decorative, not real data.
private struct FocusPlot: View, Animatable {
    var tint: Color
    var progress: Double

    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }

    private let ys: [CGFloat] = [0.78, 0.62, 0.68, 0.46, 0.52, 0.34, 0.40, 0.22]

    var body: some View {
        Canvas { ctx, size in
            let p = max(0, min(1, progress))
            let baseline: CGFloat = 0.55
            let pts = ys.enumerated().map { i, y in
                let yy = baseline + (y - baseline) * CGFloat(p)
                return CGPoint(x: size.width * CGFloat(i) / CGFloat(ys.count - 1), y: size.height * yy)
            }
            var line = Path()
            line.addLines(pts)
            ctx.stroke(line, with: .color(tint.opacity(0.40 * p)), lineWidth: 1.5)
            for pt in pts {
                let r: CGFloat = 3.5
                ctx.fill(Path(ellipseIn: CGRect(x: pt.x - r, y: pt.y - r, width: r * 2, height: r * 2)),
                         with: .color(tint.opacity(0.65 * p)))
            }
        }
    }
}
