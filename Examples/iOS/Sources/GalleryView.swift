import SwiftUI
import GoldenGrids

/// Photo gallery — four sky gradients in transparent slots, rotated to portrait
/// with `placement: .bottom`, each with its celestial body. Read as photos shot
/// looking out over the Atlantic from the east coast: the sun rises over the
/// water at dawn and sits high by day, but by dusk it has set behind you to the
/// west — so the evening skies show the moon rising over the ocean instead.
struct GalleryView: View {
    private enum Celestial { case sun, moon }
    private struct Sky { let stops: [Color]; let body: Celestial; let high: Bool }

    private let skies: [Sky] = [
        // sunrise — sun rising low over the water
        Sky(stops: [c(0.99, 0.78, 0.42), c(0.97, 0.49, 0.55), c(0.55, 0.35, 0.66)], body: .sun, high: false),
        // night — moon high
        Sky(stops: [c(0.01, 0.02, 0.10), c(0.14, 0.16, 0.40), c(0.38, 0.31, 0.60)], body: .moon, high: true),
        // dusk — moon rising over the ocean (the sun has set to the west)
        Sky(stops: [c(0.18, 0.21, 0.49), c(0.55, 0.34, 0.64), c(0.97, 0.58, 0.45)], body: .moon, high: false),
        // day — sun high
        Sky(stops: [c(0.36, 0.71, 0.98), c(0.66, 0.86, 0.99), c(0.88, 0.95, 1.00)], body: .sun, high: true),
    ]

    @State private var appeared = false

    var body: some View {
        NavigationStack {
            GoldenGrid(from: 1, to: 4, placement: .bottom) { ordinal in
                let sky = skies[ordinal % skies.count]
                LinearGradient(colors: sky.stops, startPoint: .top, endPoint: .bottom)
                    .overlay { celestialBody(sky) }
                    .scaleEffect(appeared ? 1 : 0.9)
                    .opacity(appeared ? 1 : 0)
                    .animation(.spring(response: 0.5, dampingFraction: 0.82).delay(Double(ordinal) * 0.09), value: appeared)
            }
            .padding(12)
            .navigationTitle("Galleries")
            .onAppear {
                guard !appeared else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { appeared = true }
            }
            .onDisappear { appeared = false } // replay the intro on return
        }
    }

    private func celestialBody(_ sky: Sky) -> some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height) * 0.34
            let x = geo.size.width * (sky.high ? 0.70 : 0.50)
            let y = geo.size.height * (sky.high ? 0.26 : 0.74)
            Circle()
                .fill(sky.body == .sun ? Color(white: 1.0) : Color(white: 0.93))
                .frame(width: size, height: size)
                .shadow(color: (sky.body == .sun ? Color.yellow : Color.white).opacity(0.6), radius: size * 0.45)
                .position(x: x, y: y)
        }
        .allowsHitTesting(false)
    }
}

private func c(_ r: Double, _ g: Double, _ b: Double) -> Color {
    Color(red: r, green: g, blue: b)
}
