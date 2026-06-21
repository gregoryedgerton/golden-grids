import SwiftUI
import GoldenGrids

/// Featured — a swipeable carousel of GoldenGrid copy cards. Each card is a
/// two-box golden grid (hero headline above, standfirst + CTA below). Cards sit
/// at ~78% width so the neighbours peek in from the edges, and a drag pages
/// between them with a spring snap. Page dots track the position.
struct FeaturedView: View {
    private struct Feature: Identifiable {
        let id = UUID()
        let eyebrow: String
        let headline: String
        let body: String
        let accent: Color
    }

    private let features: [Feature] = [
        Feature(eyebrow: "DESIGN",
                headline: "Lay your content out on the golden ratio.",
                body: "Drop your views into proportional slots and let GoldenGrid place them — the same component you already use on web and React Native.",
                accent: .indigo),
        Feature(eyebrow: "FAST",
                headline: "Pure Fibonacci math, no layout passes.",
                body: "The grid is computed once from integer ratios — no measurement loops, no reflow — so it stays smooth however deep the spiral runs.",
                accent: Color(red: 0.13, green: 0.45, blue: 0.55)),
        Feature(eyebrow: "THEMEABLE",
                headline: "One model, every product's look.",
                body: "Hand it a base colour for an HSL progression, an outline, or nothing at all — the slots are yours to style to match any brand.",
                accent: Color(red: 0.55, green: 0.27, blue: 0.60)),
    ]

    @State private var index = 0
    @State private var dragOffset: CGFloat = 0
    @State private var appeared = false

    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                let cardW = geo.size.width * 0.78
                let spacing: CGFloat = 16
                let step = cardW + spacing
                let leadInset = (geo.size.width - cardW) / 2

                HStack(spacing: spacing) {
                    ForEach(Array(features.enumerated()), id: \.element.id) { i, feature in
                        card(feature)
                            .frame(width: cardW)
                            .scaleEffect(appeared ? (i == index ? 1 : 0.93) : 0.82)
                            .opacity(appeared ? (i == index ? 1 : 0.5) : 0)
                            .offset(y: appeared ? 0 : 28)
                            .animation(.spring(response: 0.5, dampingFraction: 0.82).delay(Double(i) * 0.07), value: appeared)
                    }
                }
                .frame(width: geo.size.width, height: geo.size.height, alignment: .leading)
                .offset(x: leadInset - CGFloat(index) * step + dragOffset)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture()
                        .onChanged { value in dragOffset = value.translation.width }
                        .onEnded { value in
                            let threshold = cardW * 0.22
                            var next = index
                            if value.translation.width < -threshold { next += 1 }
                            else if value.translation.width > threshold { next -= 1 }
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.86)) {
                                index = min(max(next, 0), features.count - 1)
                                dragOffset = 0
                            }
                        }
                )
                .animation(.spring(response: 0.35, dampingFraction: 0.86), value: index)
            }
            .navigationTitle("Featured")
            .overlay(alignment: .bottom) { pageDots }
            .onAppear {
                guard !appeared else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { appeared = true }
            }
            .onDisappear { appeared = false } // replay the intro on return
        }
    }

    private var pageDots: some View {
        HStack(spacing: 7) {
            ForEach(features.indices, id: \.self) { i in
                Circle()
                    .fill(i == index ? Color.primary : Color.secondary.opacity(0.3))
                    .frame(width: 7, height: 7)
            }
        }
        .padding(.bottom, 10)
        .opacity(appeared ? 1 : 0)
        .animation(.easeOut(duration: 0.2), value: index)
        .animation(.easeOut(duration: 0.4).delay(0.3), value: appeared)
    }

    private func card(_ feature: Feature) -> some View {
        GoldenGrid(from: 1, to: 2, placement: .top) { ordinal in
            ordinal == 0 ? AnyView(heroBox(feature)) : AnyView(bodyBox(feature))
        }
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func heroBox(_ feature: Feature) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(feature.eyebrow).font(.caption).fontWeight(.semibold).opacity(0.7)
            Text(feature.headline).font(.title).fontWeight(.bold)
            Spacer(minLength: 0)
        }
        .padding(22)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .foregroundStyle(.white)
        .background(feature.accent)
    }

    private func bodyBox(_ feature: Feature) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(feature.body).font(.body).foregroundStyle(.secondary)
            Spacer(minLength: 0)
            Text("Read more →").font(.subheadline).fontWeight(.semibold).foregroundStyle(feature.accent)
        }
        .padding(22)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(.secondarySystemBackground))
    }
}
