import SwiftUI

@main
struct GoldenGridsExampleApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

/// Disables UIKit state restoration so the app always opens on the first tab
/// (and so a screenshot launch arg reliably selects a tab).
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     shouldRestoreSecureApplicationState coder: NSCoder) -> Bool { false }
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
