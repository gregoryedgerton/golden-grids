package com.gifcommit.goldengrids.example

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gifcommit.goldengrids.SpiralTrail
import com.gifcommit.goldengrids.focusIndexAt
import com.gifcommit.goldengrids.generateGoldenGridLayout
import com.gifcommit.goldengrids.spiralCamera
import com.gifcommit.goldengrids.spiralWindow
import com.gifcommit.goldengrids.trailToRotateDeg
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Spiral — the depth dial, mirroring Examples/iOS/Sources/SpiralView.swift.
 * Twelve Fibonacci squares laid out by the core, viewed through [spiralCamera]:
 * drag up (or scrub the dial) to travel one square deeper per step. The
 * rotation is solved with [trailToRotateDeg] (bottom) so everything still to
 * be dialed through trails off the bottom of the portrait screen, and each
 * tile's presence comes from [spiralWindow]. Tiles are composed from the frame
 * directly (position, rotation, size) so their labels stay crisp at any zoom;
 * a stage already sized in pixels can use `toGraphicsLayerTransform` on a
 * single container instead.
 */
private const val SQUARE_COUNT = 12

private val sequence: List<Long> = buildList {
    add(1L); add(1L)
    while (size < SQUARE_COUNT) add(this[size - 1] + this[size - 2])
}

private val spiralLayout = generateGoldenGridLayout(
    sequence,
    clockwise = true,
    rotate = trailToRotateDeg(SpiralTrail.bottom, clockwise = true, squareCount = SQUARE_COUNT),
)

@Composable
fun SpiralScreen() {
    var depth by rememberSaveable { mutableFloatStateOf(0f) }
    val maxDepth = (SQUARE_COUNT - 1).toFloat()

    Column(Modifier.fillMaxSize()) {
        BoxWithConstraints(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .clipToBounds()
                .background(Color(0xFFF7F7F7))
                .pointerInput(Unit) {
                    detectVerticalDragGestures { _, dragAmount ->
                        // Drag up to dial deeper — one depth step per sixth of the screen.
                        val step = max(120f, size.height / 6f)
                        depth = (depth - dragAmount / step).coerceIn(0f, maxDepth)
                    }
                },
        ) {
            val density = LocalDensity.current
            val viewportW = with(density) { maxWidth.toPx() }.toDouble()
            val viewportH = with(density) { maxHeight.toPx() }.toDouble()
            // A zero-sized pass mid-layout is a real state — skip the frame
            // rather than hand the camera a degenerate viewport.
            if (viewportW <= 0.0 || viewportH <= 0.0) return@BoxWithConstraints
            val frame = spiralCamera(spiralLayout, depth.toDouble(), viewportW, viewportH)
            val rad = Math.toRadians(frame.rotationDeg)

            spiralLayout.squares.forEachIndexed { i, sq ->
                val window = spiralWindow(i, depth.toDouble(), SQUARE_COUNT)
                if (!window.hidden) {
                    val sidePx = (sq.size * frame.scale).toFloat()
                    // The anchor: the focused square's centre lands at the viewport centre.
                    val dx = (sq.x + sq.size / 2.0 - frame.centerX) * frame.scale
                    val dy = (sq.y + sq.size / 2.0 - frame.centerY) * frame.scale
                    val centerX = viewportW / 2 + dx * cos(rad) - dy * sin(rad)
                    val centerY = viewportH / 2 + dx * sin(rad) + dy * cos(rad)

                    Box(
                        Modifier
                            .size(with(density) { sidePx.toDp() })
                            .graphicsLayer {
                                translationX = (centerX - sidePx / 2).toFloat()
                                translationY = (centerY - sidePx / 2).toFloat()
                                rotationZ = frame.rotationDeg.toFloat()
                                alpha = window.opacity.toFloat()
                            }
                            .background(tileColor(i))
                            .border(max(1f, sidePx * 0.008f).let { with(density) { it.toDp() } }, Color.White.copy(alpha = 0.55f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = sequence[i].toString(),
                            color = Color.White.copy(alpha = 0.92f),
                            fontWeight = FontWeight.Bold,
                            fontSize = with(density) { (sidePx * 0.3f).toSp() },
                        )
                    }
                }
            }
        }

        val focused = sequence[focusIndexAt(depth.toDouble(), SQUARE_COUNT).roundToInt()]
        Column(Modifier.padding(horizontal = 24.dp, vertical = 12.dp)) {
            Text(
                text = "depth %.2f — focused on %d".format(depth, focused),
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
            Slider(
                value = depth,
                onValueChange = { depth = it },
                valueRange = 0f..maxDepth,
                colors = SliderDefaults.colors(
                    thumbColor = Palette.headlinePurple,
                    activeTrackColor = Palette.headlinePurple,
                ),
            )
        }
    }
}

/** The same idea as the web HSL progression: walk the hue away from the
 *  example app's indigo, darkening toward the spiral's eye. */
private fun tileColor(i: Int): Color {
    val fraction = (SQUARE_COUNT - 1 - i).toFloat() / (SQUARE_COUNT - 1)
    return Color.hsv(
        hue = (237.6f + 162f * fraction) % 360f,
        saturation = 0.38f,
        value = 0.84f - 0.22f * fraction,
    )
}
