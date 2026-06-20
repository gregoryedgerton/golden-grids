import SwiftUI

@main
struct GoldenGridsExampleApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

struct RootView: View {
    @State private var tab = initialTab()

    var body: some View {
        // Icons only, no labels. Four screens.
        TabView(selection: $tab) {
            FeaturedView().tabItem { Image(systemName: "star") }.tag(0)
            GalleryView().tabItem { Image(systemName: "photo") }.tag(1)
            BentoDashboardView().tabItem { Image(systemName: "square.grid.2x2") }.tag(2)
            EditorialView().tabItem { Image(systemName: "doc.richtext") }.tag(3)
        }
    }
}

/// Lets a screenshot script pick the starting tab via `SIMCTL_CHILD_GG_TAB`.
private func initialTab() -> Int {
    if let raw = ProcessInfo.processInfo.environment["GG_TAB"], let i = Int(raw), (0...3).contains(i) {
        return i
    }
    return 0
}
