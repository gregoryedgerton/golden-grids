import SwiftUI

/// Slot marker — fills its positioned parent. Use inside `GoldenGrid`'s slot
/// content closure when you want an explicit fill container (parity with the web
/// and React Native `GoldenBox`).
public struct GoldenBox<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content.frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
