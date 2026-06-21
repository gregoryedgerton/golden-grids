import SwiftUI
import GoldenGrids

/// Editorial — a scrollable, text-first article on stacked golden-ratio grids: a
/// lead grid (title, platforms, standfirst), a single big all-text cell in the
/// middle, then a grid pairing body copy with one plate. Text fills the cells;
/// the words stay the focus. Items rise in on load, then you scroll the page.
struct EditorialView: View {
    @State private var appeared = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 28) {
                    // 1 — lead: standfirst (largest) + platforms + title
                    GoldenGrid(from: 1, to: 3, placement: .right) { ordinal in
                        switch ordinal {
                        case 0: AnyView(standfirst)
                        case 1: AnyView(platforms)
                        default: AnyView(headline)
                        }
                    }
                    .modifier(RiseIn(appeared: appeared, delay: 0.0))

                    // 2 — middle: a single big all-text cell (from:1,to:1 == 1 cell)
                    GoldenGrid(from: 1, to: 1) { _ in
                        bodyText(bigMiddle)
                    }
                    .modifier(RiseIn(appeared: appeared, delay: 0.1))

                    // 3 — a short caption + the dawn plate (from:1,to:2 == 2 cells)
                    GoldenGrid(from: 1, to: 2, placement: .right) { ordinal in
                        ordinal == 0 ? AnyView(plateCaption) : AnyView(dawnSky)
                    }
                    .modifier(RiseIn(appeared: appeared, delay: 0.2))

                    footer
                        .modifier(RiseIn(appeared: appeared, delay: 0.3))
                }
                .padding(20)
            }
            .navigationTitle("Editorial")
            .onAppear {
                guard !appeared else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { appeared = true }
            }
            .onDisappear { appeared = false } // replay the intro on return
        }
    }

    // MARK: Lead grid
    private var headline: some View {
        Text("GOLDEN\nRATIO\nLAYOUTS")
            .font(.system(size: 36, weight: .semibold))
            .foregroundStyle(Palette.headlinePurple)
            .minimumScaleFactor(0.5)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
    private var platforms: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(["React", "React Native", "SwiftUI"], id: \.self) { platform in
                HStack(spacing: 9) {
                    Circle().frame(width: 7, height: 7).foregroundStyle(.indigo)
                    Text(platform).font(.title3).fontWeight(.medium)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(.leading, 16) // ~1em
        .padding(.trailing, 8)
    }
    private var standfirst: some View {
        bodyText("For centuries the golden ratio has guided composition — manuscripts, posters, façades. GoldenGrid brings the same proportion to SwiftUI: drop content into the slots and the spiral places it. No measurement loops, just Fibonacci math — the very layout you already ship on web and in React Native.\n\nThe grid does not care what you put in it: a headline, a photograph, a paragraph of running text — each lands where the proportion says it should, and the page reads as though it were composed by hand rather than computed by a layout engine. Nothing shouts; everything sits where the eye already expects to find it.")
    }

    // MARK: Text cell — sized to fill its square
    private func bodyText(_ text: String) -> some View {
        Text(text)
            .font(.callout)
            .foregroundStyle(.secondary)
            .lineSpacing(2)
            .minimumScaleFactor(0.8)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.trailing, 10) // breathing room beside a neighbouring cell
    }

    // MARK: Grid 3 — caption + dawn plate
    private var plateCaption: some View {
        Text("Plate I — dawn over the Atlantic. Eight centuries on, the same spiral still does the quiet work.")
            .font(.caption)
            .foregroundStyle(.tertiary)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.leading, 16) // ~1em
            .padding(.trailing, 10)
    }

    /// The Gallery's "dawn" sky — a sunrise gradient with the sun low over the water.
    private var dawnSky: some View {
        GeometryReader { geo in
            ZStack {
                LinearGradient(colors: [Color(red: 0.99, green: 0.78, blue: 0.42),
                                        Color(red: 0.97, green: 0.49, blue: 0.55),
                                        Color(red: 0.55, green: 0.35, blue: 0.66)],
                               startPoint: .top, endPoint: .bottom)
                let size = min(geo.size.width, geo.size.height) * 0.40
                Circle()
                    .fill(Color.white)
                    .frame(width: size, height: size)
                    .shadow(color: Color.yellow.opacity(0.6), radius: size * 0.45)
                    .position(x: geo.size.width * 0.5, y: geo.size.height * 0.72)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 16) {
            Divider()
            // nav list
            HStack(spacing: 18) {
                ForEach(["Docs", "Guides", "Examples", "License"], id: \.self) { link in
                    Text(link).font(.footnote).fontWeight(.medium).foregroundStyle(.secondary)
                }
            }
            // brand / social icons
            HStack(spacing: 22) {
                Image(systemName: "globe")
                Image(systemName: "chevron.left.forwardslash.chevron.right")
                Image(systemName: "shippingbox.fill")
                Image(systemName: "envelope")
            }
            .font(.system(size: 17))
            .foregroundStyle(.secondary)
            // legal
            Text("© 2026 GoldenGrid · @gifcommit/golden-grids · MIT License")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.top, 8)
        .padding(.bottom, 4)
    }

    private let bigMiddle = "Reach for it when a screen needs to breathe — a hero and its supporting cards, a gallery, a dashboard, or a column of prose like this one. Each slot is a slice of the same spiral, so the whole layout speaks one proportional language, and the page settles into a rhythm the eye already trusts before it reads a word. Designers reach for it because the result feels considered; engineers because there is nothing left to configure. Lay the grid down, drop your content in, and let eight centuries of composition do the arranging while you get on with the words that matter. Nothing here is decoration — the proportion is load-bearing. Remove it and the page slumps; keep it and every element finds its level, the column widths and the white space tuned to the same ratio the rest of the screen already obeys."
}

/// Rises content up and fades it in once `appeared` flips, staggered by `delay`.
private struct RiseIn: ViewModifier {
    let appeared: Bool
    let delay: Double

    func body(content: Content) -> some View {
        content
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 18)
            .animation(.easeOut(duration: 0.5).delay(delay), value: appeared)
    }
}
