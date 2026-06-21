import SwiftUI

/// Shared colours so the example screens stay in sync.
enum Palette {
    /// Background of the dashboard slider tiles, and the light end of the Sleep gradient.
    static let panelGray = Color(white: 0.80)
    /// The editorial headline purple, and the dark end of the Sleep gradient.
    static let headlinePurple = Color.indigo
    /// The main blue of the daytime sky gradient, and the Focus Flow tile.
    static let daySkyBlue = Color(red: 0.36, green: 0.71, blue: 0.98)
    /// Deep navy ink — readable text/plot on the light daySkyBlue Focus tile.
    static let focusInk = Color(red: 0.06, green: 0.14, blue: 0.36)
}
