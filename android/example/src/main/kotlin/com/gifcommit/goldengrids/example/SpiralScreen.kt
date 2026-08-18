package com.gifcommit.goldengrids.example

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.gifcommit.goldengrids.SpiralCameraOptions
import com.gifcommit.goldengrids.SpiralTrail
import com.gifcommit.goldengrids.generateGoldenGridLayout
import com.gifcommit.goldengrids.spiralCamera
import com.gifcommit.goldengrids.spiralWindow
import com.gifcommit.goldengrids.tileTransform
import com.gifcommit.goldengrids.trailToRotateDeg

/**
 * Spiral dial — the depth camera over a fifteen-square layout, the Compose
 * analogue of the iOS Spiral tab. A slider (or a vertical drag on the stage)
 * dials depth continuously; the stage applies one `toGraphicsLayerTransform`
 * with a top-left pivot, and each square fades through `spiralWindow` so only
 * a few tiles read at a time.
 */
private const val COUNT = 15

private val fibSequence: List<Long> = buildList {
    add(1L); add(1L)
    while (size < COUNT) add(this[size - 1] + this[size - 2])
}

/** Trailing side is solved per count, not hardcoded — the direction the
 *  composition grows into cycles with the square count (trailToRotateDeg).
 *  Down suits a portrait phone stage. */
private val layout = generateGoldenGridLayout(
    fibSequence,
    clockwise = true,
    rotate = trailToRotateDeg(SpiralTrail.bottom, clockwise = true, squareCount = COUNT),
)

@Composable
fun SpiralScreen() {
    var depth by remember { mutableFloatStateOf(0f) }
    var stageSize by remember { androidx.compose.runtime.mutableStateOf(IntSize.Zero) }

    Column(Modifier.fillMaxSize().padding(12.dp)) {
        Box(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .onSizeChanged { stageSize = it }
                .pointerInput(Unit) {
                    // Drag DOWN to dial deeper, one square per ~180dp.
                    detectVerticalDragGestures { _, dragAmount ->
                        val perSquare = 180.dp.toPx()
                        depth = (depth + dragAmount / perSquare).coerceIn(0f, (COUNT - 1).toFloat())
                    }
                },
        ) {
            if (stageSize.width > 0 && stageSize.height > 0) {
                Stage(depth = depth.toDouble(), size = stageSize)
            }
        }

        Slider(
            value = depth,
            onValueChange = { depth = it },
            valueRange = 0f..(COUNT - 1).toFloat(),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
        Text(
            text = "depth %.2f — square %d".format(depth, COUNT - depth.toInt()),
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )
    }
}

private const val TEXTURE_PX = 512.0

@Composable
private fun Stage(depth: Double, size: IntSize) {
    val density = LocalDensity.current
    val frame = spiralCamera(
        layout,
        depth = depth,
        viewportWidth = size.width.toDouble(),
        viewportHeight = size.height.toDouble(),
        options = SpiralCameraOptions(fillRatio = 0.62, clockwise = true),
    )

    // Per-tile composed transforms, NOT one camera transform over a shared
    // stage: a stage transform rasterizes the 1-unit deep squares and then
    // upscales the raster hundreds of times. tileTransform is the library's
    // answer — each tile renders into a TEXTURE_PX box at a net scale near 1,
    // so every era paints at native resolution.
    Box(Modifier.fillMaxSize()) {
        layout.squares.forEachIndexed { index, square ->
            val window = spiralWindow(index, depth = depth, squareCount = COUNT)
            if (!window.hidden) {
                val tile = tileTransform(
                    frame,
                    square = square,
                    viewportWidth = size.width.toDouble(),
                    viewportHeight = size.height.toDouble(),
                    texturePx = TEXTURE_PX,
                )
                val hue = 360f * index / COUNT
                val color = Color.hsv(hue, 0.45f, if (window.focused) 0.95f else 0.75f)
                with(density) {
                    Box(
                        Modifier
                            .size(TEXTURE_PX.toFloat().toDp())
                            .graphicsLayer {
                                transformOrigin = TransformOrigin(0f, 0f)
                                translationX = tile.translateX.toFloat()
                                translationY = tile.translateY.toFloat()
                                rotationZ = tile.rotationDeg.toFloat()
                                scaleX = tile.scale.toFloat()
                                scaleY = tile.scale.toFloat()
                                alpha = window.opacity.toFloat()
                            }
                            .background(color, RoundedCornerShape((TEXTURE_PX * 0.02).toFloat().toDp())),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = "${index + 1}",
                            color = Color.Black.copy(alpha = 0.45f),
                            fontSize = with(density) { (TEXTURE_PX * 0.3).toFloat().toSp() },
                        )
                    }
                }
            }
        }
    }
}
