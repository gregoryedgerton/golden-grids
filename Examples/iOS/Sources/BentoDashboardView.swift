import SwiftUI
import GoldenGrids

/// Bento dashboard — statistics in the proportional slots, rotated to portrait
/// with `placement: .top`. The value sizes form a 1× / 3× / 5× hierarchy
/// (Steps & Tasks → Sleep → Focus); Sleep carries a gradient, and subtle hairline
/// separators delineate the tiles.
struct BentoDashboardView: View {
    private let base: CGFloat = 24 // 1× value size

    var body: some View {
        NavigationStack {
            GoldenGrid(from: 1, to: 4, placement: .top) { ordinal in
                switch ordinal {
                case 0: focusTile
                case 1: sleepTile
                case 2: stepsTile
                default: tasksTile
                }
            }
            .padding(12)
            .navigationTitle("Dashboards")
        }
    }

    // ordinal 0 — hero, 5×, dull blue with an abstract data plot behind the stat
    private var focusTile: some View {
        stat(icon: "target", value: "82", unit: "%", label: "Focus Flow",
             valueSize: base * 5, labelFont: .title2, onDark: true)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background {
                ZStack(alignment: .top) {
                    Color(red: 0.29, green: 0.47, blue: 0.67) // duller steel blue
                    GeometryReader { geo in
                        FocusPlot()
                            .frame(height: max(80, geo.size.height * 0.42))
                            .padding(.horizontal, 18)
                            .padding(.top, 52)
                    }
                }
            }
    }

    // ordinal 1 — sleep, 3×, grayscale gradient + leading separator
    private var sleepTile: some View {
        stat(icon: "moon.stars", value: "6.2", unit: "hrs", label: "Sleep",
             valueSize: base * 3, labelFont: .title3, onDark: true)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(LinearGradient(
                colors: [Color(white: 0.16), Color(white: 0.52)],
                startPoint: .topLeading, endPoint: .bottomTrailing)) // grayscale
            .overlay(alignment: .leading) {
                Rectangle().fill(.white.opacity(0.35)).frame(width: 1)
            }
    }

    // ordinal 2 — an eyes / nose / ear selector, set to ear
    private var stepsTile: some View {
        EmojiSliderTile(items: ["👀", "👃", "👂"], start: 2)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(.regularMaterial)
    }

    // ordinal 3 — a mood selector: a face + a 3-stop slider, top separator from steps
    private var tasksTile: some View {
        EmojiSliderTile(items: ["🙁", "😐", "🙂"], start: 2)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(.regularMaterial)
            .overlay(alignment: .top) {
                Rectangle().fill(Color.primary.opacity(0.12)).frame(height: 1)
            }
    }

    private func stat(icon: String, value: String, unit: String, label: String,
                      valueSize: CGFloat, labelFont: Font, onDark: Bool,
                      tint: Color = .primary) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: icon)
                .font(valueSize >= base * 3 ? .title : .title3)
                .foregroundStyle(onDark ? Color.white : tint)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value).font(.system(size: valueSize, weight: .bold, design: .rounded))
                if !unit.isEmpty {
                    Text(unit).font(.system(size: valueSize * 0.4, weight: .semibold, design: .rounded)).opacity(0.8)
                }
            }
            .minimumScaleFactor(0.4)
            .lineLimit(1)
            Text(label).font(labelFont)
                .foregroundStyle(onDark ? Color.white.opacity(0.9) : Color.secondary)
        }
        .foregroundStyle(onDark ? Color.white : Color.primary)
        .padding(onDark ? 18 : 14)
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

/// Abstract data plot — a faint scatter + trend line, as if the Focus tile is
/// reading some correlated signal. Decorative; the points aren't real data.
private struct FocusPlot: View {
    private let ys: [CGFloat] = [0.78, 0.62, 0.68, 0.46, 0.52, 0.34, 0.40, 0.22]

    var body: some View {
        Canvas { ctx, size in
            let pts = ys.enumerated().map { i, y in
                CGPoint(x: size.width * CGFloat(i) / CGFloat(ys.count - 1), y: size.height * y)
            }
            var line = Path()
            line.addLines(pts)
            ctx.stroke(line, with: .color(.white.opacity(0.28)), lineWidth: 1.5)
            for p in pts {
                let r: CGFloat = 3.5
                ctx.fill(Path(ellipseIn: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2)),
                         with: .color(.white.opacity(0.5)))
            }
        }
    }
}
