import SwiftUI
import GoldenGrids

/// Featured — a two-box copy card (hero headline above, standfirst + CTA below),
/// presented with faded "ghost" cards bleeding off either side to suggest a
/// swipeable carousel.
struct FeaturedView: View {
    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                let cardW = geo.size.width * 0.72
                HStack(spacing: 14) {
                    ghostCard.frame(width: cardW).opacity(0.4)
                    mainCard.frame(width: cardW)
                    ghostCard.frame(width: cardW).opacity(0.4)
                }
                .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
            }
            .navigationTitle("Featured")
        }
    }

    private var mainCard: some View {
        GoldenGrid(from: 1, to: 2, placement: .top) { ordinal in
            ordinal == 0 ? AnyView(heroBox) : AnyView(bodyBox)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var ghostCard: some View {
        GoldenGrid(from: 1, to: 2, placement: .top) { ordinal in
            ordinal == 0 ? Color.indigo : Color(.secondarySystemBackground)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var heroBox: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("DESIGN").font(.caption).fontWeight(.semibold).opacity(0.7)
            Text("Lay your content out on the golden ratio.").font(.title).fontWeight(.bold)
            Spacer(minLength: 0)
        }
        .padding(22)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .foregroundStyle(.white)
        .background(Color.indigo)
    }

    private var bodyBox: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Drop your views into proportional slots and let GoldenGrid place them — the same component you already use on web and React Native.")
                .font(.body).foregroundStyle(.secondary)
            Spacer(minLength: 0)
            Text("Read more →").font(.subheadline).fontWeight(.semibold).foregroundStyle(.indigo)
        }
        .padding(22)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(.secondarySystemBackground))
    }
}
