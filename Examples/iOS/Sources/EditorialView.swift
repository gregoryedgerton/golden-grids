import SwiftUI
import GoldenGrids

/// Editorial — a true editorial layout with no visible grid lines. The headline
/// and a platforms list sit up top; the body fills the largest box. Below, a
/// second single-tile grid carries more copy that fades out under a gradient.
struct EditorialView: View {
    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    GoldenGrid(from: 1, to: 3, placement: .right) { ordinal in
                        switch ordinal {
                        case 0: bodyBox       // largest, bottom
                        case 1: platformsBox  // top
                        default: headlineBox  // top
                        }
                    }

                    GoldenGrid(from: 1, to: 1) { _ in moreCopyBox }
                        .overlay(alignment: .bottom) {
                            LinearGradient(
                                colors: [.clear, Color(.systemBackground)],
                                startPoint: UnitPoint(x: 0.5, y: 0.25),
                                endPoint: .bottom
                            )
                        }
                }
                .padding(20)
            }
            .navigationTitle("Editorial")
        }
    }

    private var headlineBox: some View {
        Text("GOLDEN\nRATIO\nLAYOUTS")
            .font(.system(size: 32, weight: .semibold))
            .foregroundStyle(Palette.headlinePurple)
            .minimumScaleFactor(0.5)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var platformsBox: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(["React", "React Native", "SwiftUI"], id: \.self) { platform in
                HStack(spacing: 9) {
                    Circle().frame(width: 6, height: 6).foregroundStyle(.indigo)
                    Text(platform).font(.title3).fontWeight(.medium)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var bodyBox: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("For centuries the golden ratio has guided composition — manuscripts, posters, façades. GoldenGrid brings the same proportion to SwiftUI: drop your content into the slots and the spiral handles placement.")
            Text("No measurement loops, just Fibonacci math — the very layout you already ship on the web and in React Native. One model, three renderers, the same proportions everywhere.")
            Text("Reach for it when a screen needs to breathe: a hero and its supporting cards, a gallery, a dashboard, a column of prose. Each slot is a slice of the same spiral, so the whole layout speaks one proportional language.")
        }
        .font(.body)
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var moreCopyBox: some View {
        Text("Designers reach for it because the result feels considered; engineers reach for it because there is nothing left to configure. The ratio has outlived every framework it has touched, and it will outlive this one too — which is rather the point. Lay the grid down, drop your content in, and let eight centuries of composition do the arranging while you get on with the words. Eight hundred years on, the proportion still does the quiet work of making a layout feel inevitable rather than merely arranged.")
            .font(.body)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}
