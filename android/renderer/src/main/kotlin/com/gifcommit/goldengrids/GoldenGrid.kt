package com.gifcommit.goldengrids

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

/**
 * Jetpack Compose renderer — a thin layer over [computeRenderModel], mirroring the
 * web, React Native and SwiftUI renderers. Slots are positioned at the model's
 * normalised rects inside an aspect-ratio'd container; [slotContent] fills each
 * visible slot keyed by child ordinal (0 = largest / most prominent slot). When
 * `from > 1` the model has a skipped-range placeholder, filled by [placeholderContent].
 */
@Composable
fun GoldenGrid(
    from: Int = 1,
    to: Int = 4,
    color: String? = null,
    clockwise: Boolean = true,
    placement: PlacementValue = PlacementValue.right,
    modifier: Modifier = Modifier,
    placeholderContent: @Composable () -> Unit = {},
    slotContent: @Composable (childIndex: Int) -> Unit = {},
) {
    val model = remember(from, to, color, clockwise, placement) {
        computeRenderModel(
            RenderModelInput(from = from, to = to, color = color, clockwise = clockwise, placement = placement)
        )
    }

    BoxWithConstraints(
        modifier.aspectRatio((model.aspectRatio.w / model.aspectRatio.h).toFloat())
    ) {
        val w = maxWidth
        val h = maxHeight
        model.placeholder?.let { ph ->
            Cell(ph.rect, ph.color, w, h) { placeholderContent() }
        }
        model.slots.forEach { slot ->
            Cell(slot.rect, slot.color, w, h) { slotContent(slot.childIndex) }
        }
    }
}

@Composable
private fun Cell(rect: Rect, fill: FillColor?, parentW: Dp, parentH: Dp, content: @Composable () -> Unit) {
    Box(
        Modifier
            .offset(x = parentW * rect.left.toFloat(), y = parentH * rect.top.toFloat())
            .size(width = parentW * rect.width.toFloat(), height = parentH * rect.height.toFloat())
            .background(fill.toComposeColor())
    ) {
        content()
    }
}

private fun FillColor?.toComposeColor(): Color = when (this) {
    null -> Color.Transparent
    is FillColor.Hsl -> Color.hsl(h.toFloat(), (s / 100.0).toFloat(), (l / 100.0).toFloat())
    is FillColor.Raw -> parseHexColor(value)
}

private fun parseHexColor(hex: String): Color {
    val clean = hex.removePrefix("#")
    return runCatching {
        Color(
            red = clean.substring(0, 2).toInt(16),
            green = clean.substring(2, 4).toInt(16),
            blue = clean.substring(4, 6).toInt(16),
        )
    }.getOrDefault(Color.Transparent)
}
