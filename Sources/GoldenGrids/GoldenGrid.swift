import SwiftUI

/// SwiftUI renderer — a thin layer over `computeRenderModel`, mirroring the web
/// and React Native renderers. Slots are positioned at the model's normalised
/// rects inside an aspect-ratio'd container; `slotContent` fills each visible
/// slot, keyed by child ordinal (0 = largest / most prominent slot, matching the
/// web "first child fills the largest slot" contract). When `from > 1` the model
/// has a skipped-range placeholder, filled by `placeholderContent` (the analogue
/// of the last child in the web/RN contract).
public struct GoldenGrid<SlotContent: View, PlaceholderContent: View>: View {
    private let model: RenderModel
    private let slotContent: (Int) -> SlotContent
    private let placeholderContent: () -> PlaceholderContent

    public init(
        from: Int = 1,
        to: Int = 4,
        color: String? = nil,
        clockwise: Bool = true,
        placement: PlacementValue = .right,
        @ViewBuilder slotContent: @escaping (Int) -> SlotContent,
        @ViewBuilder placeholderContent: @escaping () -> PlaceholderContent
    ) {
        self.model = computeRenderModel(
            RenderModelInput(from: from, to: to, color: color, clockwise: clockwise, placement: placement)
        )
        self.slotContent = slotContent
        self.placeholderContent = placeholderContent
    }

    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                if let placeholder = model.placeholder {
                    cell(placeholder.rect, fill: placeholder.color, in: geo.size) { placeholderContent() }
                }
                ForEach(model.slots.indices, id: \.self) { i in
                    let slot = model.slots[i]
                    cell(slot.rect, fill: slot.color, in: geo.size) { slotContent(slot.childIndex) }
                }
            }
        }
        .aspectRatio(CGFloat(model.aspectRatio.w / model.aspectRatio.h), contentMode: .fit)
    }

    @ViewBuilder
    private func cell<C: View>(
        _ rect: Rect,
        fill: FillColor?,
        in size: CGSize,
        @ViewBuilder content: () -> C
    ) -> some View {
        ZStack {
            Rectangle().fill(resolveFill(fill))
            content()
        }
        .frame(width: CGFloat(rect.width) * size.width, height: CGFloat(rect.height) * size.height)
        .offset(x: CGFloat(rect.left) * size.width, y: CGFloat(rect.top) * size.height)
    }
}

// Convenience: slot content only — the placeholder renders empty.
extension GoldenGrid where PlaceholderContent == EmptyView {
    public init(
        from: Int = 1,
        to: Int = 4,
        color: String? = nil,
        clockwise: Bool = true,
        placement: PlacementValue = .right,
        @ViewBuilder slotContent: @escaping (Int) -> SlotContent
    ) {
        self.init(from: from, to: to, color: color, clockwise: clockwise, placement: placement,
                  slotContent: slotContent, placeholderContent: { EmptyView() })
    }
}

// Convenience: just the proportional colour boxes, no content.
extension GoldenGrid where SlotContent == EmptyView, PlaceholderContent == EmptyView {
    public init(
        from: Int = 1,
        to: Int = 4,
        color: String? = nil,
        clockwise: Bool = true,
        placement: PlacementValue = .right
    ) {
        self.init(from: from, to: to, color: color, clockwise: clockwise, placement: placement,
                  slotContent: { _ in EmptyView() }, placeholderContent: { EmptyView() })
    }
}
