import SwiftUI

/// SwiftUI renderer — a thin layer over `computeRenderModel`, mirroring the web
/// and React Native renderers. Slots are positioned at the model's normalised
/// rects inside an aspect-ratio'd container; `slotContent` fills each slot,
/// keyed by child ordinal (0 = largest / most prominent slot, matching the web
/// "first child fills the largest slot" contract).
public struct GoldenGrid<SlotContent: View>: View {
    private let model: RenderModel
    private let slotContent: (Int) -> SlotContent

    public init(
        from: Int = 1,
        to: Int = 4,
        color: String? = nil,
        clockwise: Bool = true,
        placement: PlacementValue = .right,
        @ViewBuilder slotContent: @escaping (Int) -> SlotContent
    ) {
        self.model = computeRenderModel(
            RenderModelInput(from: from, to: to, color: color, clockwise: clockwise, placement: placement)
        )
        self.slotContent = slotContent
    }

    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                if let placeholder = model.placeholder {
                    cell(placeholder.rect, fill: placeholder.color, in: geo.size) { EmptyView() }
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

/// Convenience: render just the proportional colour boxes with no slot content.
extension GoldenGrid where SlotContent == EmptyView {
    public init(
        from: Int = 1,
        to: Int = 4,
        color: String? = nil,
        clockwise: Bool = true,
        placement: PlacementValue = .right
    ) {
        self.init(from: from, to: to, color: color, clockwise: clockwise, placement: placement) { _ in
            EmptyView()
        }
    }
}
