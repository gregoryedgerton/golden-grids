package com.gifcommit.goldengrids.example

import android.os.SystemClock
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.verticalDrag
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.gifcommit.goldengrids.GridLayout
import com.gifcommit.goldengrids.SpiralCameraOptions
import com.gifcommit.goldengrids.SpiralTrail
import com.gifcommit.goldengrids.SpiralWindowOptions
import com.gifcommit.goldengrids.contentTransform
import com.gifcommit.goldengrids.generateGoldenGridLayout
import com.gifcommit.goldengrids.spiralCamera
import com.gifcommit.goldengrids.spiralWindow
import com.gifcommit.goldengrids.tileTransform
import com.gifcommit.goldengrids.trailToRotateDeg
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.abs

/**
 * Interactive Experiences — the depth camera over up to NINETY-ONE squares,
 * the Compose analogue of the iOS Spiral tab. Scroll the stage (drag, with
 * inertia); the segmented sets re-dial through spirals of their own size —
 * ALL is the untouched 1–91, DUO/TRIO/QUAD are the smallest spirals that
 * exist (two, three and four squares).
 *
 * Ninety-one is the integer ceiling, not a taste choice: the 92-square
 * layout's bounding box is F(93) ≈ 1.22 × 10¹⁹, past Long.MAX_VALUE — and
 * the web port walls even earlier, at 78 (Number.MAX_SAFE_INTEGER).
 *
 * The sets are the grego facet lesson as a demo: the spiral is count-driven,
 * so a smaller set is the SAME machine over fewer squares — layout and trail
 * re-SOLVED per count, never reused across counts.
 */
private const val FULL_COUNT = 91
private const val TEXTURE_PX = 512.0

/** Which numbers ride the dial. The number is the tile's CONTENT — its
 *  geometry comes from its position in the set's layout. */
enum class NumberSet(val label: String, val numbers: List<Int>) {
    ALL("ALL", (1..FULL_COUNT).toList()),
    DUO("DUO", listOf(1, 2)),
    TRIO("TRIO", listOf(1, 2, 3)),
    QUAD("QUAD", listOf(1, 2, 3, 4)),
}

/** One dial per set: its numbers, and a spiral laid out for exactly that
 *  count — fib run and trail rotation both re-solved, because the trail
 *  direction cycles with the square count. */
private class Dial(val numbers: List<Int>) {
    val layout: GridLayout = generateGoldenGridLayout(
        buildList {
            add(1L); add(1L)
            while (size < numbers.size) add(this[size - 1] + this[size - 2])
        },
        clockwise = true,
        rotate = trailToRotateDeg(SpiralTrail.bottom, clockwise = true, squareCount = numbers.size),
    )
    val count: Int get() = numbers.size
    val maxDepth: Float get() = (count - 1).toFloat()
}

private val dials: Map<NumberSet, Dial> =
    NumberSet.entries.associateWith { Dial(it.numbers) }

@Composable
fun SpiralScreen() {
    var numberSet by remember { mutableStateOf(NumberSet.ALL) }
    var depth by remember { mutableFloatStateOf(0f) }
    var stageSize by remember { mutableStateOf(IntSize.Zero) }
    // The legibility window the dial renders with. FADE off is the library's
    // `fade = false` — full presence out to holdSteps, then straight to
    // hidden, so the spiral's outer context reads solid while tiles past the
    // viewport still leave the paint.
    var fadeTail by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    var coastJob by remember { mutableStateOf<Job?>(null) }

    val dial = dials.getValue(numberSet)
    val maxDepth = dial.maxDepth
    // Clamp BEFORE any indexing: recomposition sees the new dial before a
    // set-switch callback re-clamps the state (the iOS lesson, verbatim).
    val shown = depth.coerceIn(0f, maxDepth)

    /** Decaying inertia after a flick — deliberately in the DEMO, not the
     *  library. Live-flick velocity, ~0.97 decay per frame (the ride is the
     *  demo), interrupted by grabbing the dial or switching sets, killed at
     *  the bounds. */
    fun startCoast(velocity: Float) {
        coastJob?.cancel()
        if (abs(velocity) <= 0.05f) return
        var v = velocity
        coastJob = scope.launch {
            while (isActive && abs(v) > 0.01f) {
                delay(16)
                val next = (depth + v / 60f).coerceIn(0f, maxDepth)
                depth = next
                if (next == 0f || next == maxDepth) return@launch
                v *= 0.97f
            }
        }
    }

    Column(Modifier.fillMaxSize().padding(12.dp)) {
        Box(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .onSizeChanged { stageSize = it }
                .pointerInput(numberSet) {
                    // Raw gesture handling so a flick can hand its velocity
                    // to the coast: track the last sample, and only a lift
                    // within the live-flick window (<100 ms) keeps its speed
                    // — a settled finger must not coast (the iOS stale-flick
                    // guard, verbatim).
                    val perSquare = 180.dp.toPx()
                    awaitEachGesture {
                        val down = awaitFirstDown()
                        coastJob?.cancel()
                        var lastTime = down.uptimeMillis
                        var lastDepth = depth
                        var flick = 0f
                        val completed = verticalDrag(down.id) { change ->
                            val next = (depth + change.positionChange().y / perSquare)
                                .coerceIn(0f, maxDepth)
                            val dt = (change.uptimeMillis - lastTime) / 1000f
                            flick = if (dt in 0.0001f..0.1f) (next - lastDepth) / dt else 0f
                            lastTime = change.uptimeMillis
                            lastDepth = next
                            depth = next
                            change.consume()
                        }
                        // Coast only after a NORMAL lift: a cancelled drag
                        // (another detector consumed the gesture) must not
                        // keep moving the dial. And only a lift within the
                        // live-flick window keeps its speed — a settled
                        // finger must not coast.
                        val live = (SystemClock.uptimeMillis() - lastTime) < 100
                        startCoast(if (completed && live) flick else 0f)
                    }
                },
        ) {
            if (stageSize.width > 0 && stageSize.height > 0) {
                Stage(dial = dial, depth = shown.toDouble(), size = stageSize, fadeTail = fadeTail)
            }
        }

        // Quick sets in the slider's old seat, each a spiral of its own
        // size. Switching grabs the dial (kills any coast) and re-clamps
        // depth into the new, shorter track.
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth().padding(top = 16.dp)) {
            NumberSet.entries.forEachIndexed { index, option ->
                SegmentedButton(
                    selected = numberSet == option,
                    onClick = {
                        coastJob?.cancel()
                        numberSet = option
                        depth = depth.coerceIn(0f, dials.getValue(option).maxDepth)
                    },
                    shape = SegmentedButtonDefaults.itemShape(index = index, count = NumberSet.entries.size),
                ) { Text(option.label) }
            }
        }
        // The fading tail is a configuration detail, not the dial's
        // definition — flip it and watch the outward squares stop ghosting
        // without the cull going away.
        Row(
            Modifier.fillMaxWidth().padding(top = 8.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("FADE TAIL", style = MaterialTheme.typography.labelMedium)
            Switch(
                checked = fadeTail,
                onCheckedChange = { fadeTail = it },
                modifier = Modifier.padding(start = 12.dp),
            )
        }
        Text(
            text = "depth %.2f — square %d".format(
                shown,
                // ROUND, not floor: the focused square flips halfway through
                // a step (spiralWindow's focused predicate), and the caption
                // must name the tile the reader sees focused.
                dial.numbers[dial.count - 1 - Math.round(shown).coerceIn(0, dial.count - 1)],
            ),
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 8.dp),
        )
    }
}

@Composable
private fun Stage(dial: Dial, depth: Double, size: IntSize, fadeTail: Boolean) {
    val density = LocalDensity.current
    val frame = spiralCamera(
        dial.layout,
        depth = depth,
        viewportWidth = size.width.toDouble(),
        viewportHeight = size.height.toDouble(),
        // A larger fill than the 1/φ default: the dial is the whole point of
        // this screen, so the focus owns most of the stage.
        options = SpiralCameraOptions(fillRatio = 0.85, clockwise = true),
    )

    // Per-tile composed transforms, NOT one camera transform over a shared
    // stage: a stage transform rasterizes the 1-unit deep squares and then
    // upscales the raster hundreds of times. tileTransform is the library's
    // answer — each tile renders into a TEXTURE_PX box at a net scale near 1.
    Box(Modifier.fillMaxSize()) {
        dial.layout.squares.forEachIndexed { index, square ->
            val window = spiralWindow(
                index,
                depth = depth,
                squareCount = dial.count,
                options = SpiralWindowOptions(fade = fadeTail),
            )
            val tile = tileTransform(
                frame,
                square = square,
                viewportWidth = size.width.toDouble(),
                viewportHeight = size.height.toDouble(),
                texturePx = TEXTURE_PX,
            )
            // With up to ninety-one squares most of the interior is
            // sub-pixel at any depth — skip tiles that would paint under
            // half a pixel rather than composite ninety-one nodes.
            if (!window.hidden && tile.scale * TEXTURE_PX >= 0.5) {
                val number = dial.numbers[index]
                // Hue keyed to the NUMBER, not the position: a tile keeps
                // its colour in every set it appears in.
                val hue = 360f * (number % 15) / 15f
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
                        // Orientation-lock the label (Compose pivots at the
                        // centre by default). A configuration detail — pass
                        // counterRotate = false to let content ride the dial.
                        val content = contentTransform(frame)
                        Text(
                            text = "$number",
                            color = Color.Black.copy(alpha = 0.45f),
                            fontSize = with(density) { (TEXTURE_PX * 0.25).toFloat().toSp() },
                            modifier = Modifier.graphicsLayer {
                                rotationZ = content.rotationDeg.toFloat()
                                scaleX = content.scale.toFloat()
                                scaleY = content.scale.toFloat()
                            },
                        )
                    }
                }
            }
        }
    }
}
