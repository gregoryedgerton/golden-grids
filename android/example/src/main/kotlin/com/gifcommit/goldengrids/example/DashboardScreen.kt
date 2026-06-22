package com.gifcommit.goldengrids.example

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Icon
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gifcommit.goldengrids.GoldenGrid
import com.gifcommit.goldengrids.PlacementValue
import kotlin.math.roundToInt
import kotlinx.coroutines.delay

/**
 * Bento dashboard — statistics in the proportional slots, rotated to portrait with
 * `placement = top`. On appear the figures count up, the Focus plot settles into
 * place, the Sleep tile fades from dusk to deep night, and the selector sliders
 * glide to their resting stop.
 */
@Composable
fun DashboardScreen() {
    var appeared by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(450)
        appeared = true
    }

    Box(Modifier.fillMaxSize().padding(12.dp), contentAlignment = Alignment.Center) {
        GoldenGrid(
            from = 1,
            to = 4,
            placement = PlacementValue.top,
            modifier = Modifier.fillMaxWidth(),
        ) { ordinal ->
            when (ordinal) {
                0 -> FocusTile(appeared, Modifier.fillMaxSize())
                1 -> SleepTile(appeared, Modifier.fillMaxSize())
                2 -> EmojiSliderTile(listOf("👀", "👃", "👂"), start = 0, Modifier.fillMaxSize().background(Palette.panelGray))
                else -> Box(Modifier.fillMaxSize().background(Palette.panelGray)) {
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black.copy(alpha = 0.12f)).align(Alignment.TopCenter))
                    EmojiSliderTile(listOf("🙁", "😐", "🙂"), start = 2, Modifier.fillMaxSize())
                }
            }
        }
    }
}

// ordinal 0 — hero, day-sky blue. The figure counts up; the plot settles from a flat
// baseline (constant opacity, so the looping intro never flashes). Navy ink stays legible.
@Composable
private fun FocusTile(appeared: Boolean, modifier: Modifier) {
    val plotProgress by animateFloatAsState(
        targetValue = if (appeared) 1f else 0f,
        animationSpec = tween(durationMillis = 900, delayMillis = 200),
        label = "plot",
    )
    Box(modifier.background(Palette.daySkyBlue)) {
        FocusPlot(
            Palette.focusInk,
            plotProgress,
            Modifier.align(Alignment.TopCenter).fillMaxWidth().fillMaxHeight(0.5f)
                .padding(start = 18.dp, end = 18.dp, top = 52.dp),
        )
        StatColumn(
            icon = Icons.Filled.TrackChanges, target = 82f, decimals = 0, unit = "%", label = "Focus Flow",
            valueSize = 60.sp, labelSize = 20.sp, ink = Palette.focusInk, reveal = appeared,
            modifier = Modifier.fillMaxSize().padding(18.dp),
        )
    }
}

// ordinal 1 — sleep, gradient shifts from dusk to deep night (both dark, so the
// looping intro never flashes). Leading separator.
private val sleepDusk = listOf(rgb(0.32, 0.17, 0.44), rgb(0.46, 0.26, 0.42))
private val sleepNight = listOf(rgb(0.06, 0.05, 0.22), rgb(0.18, 0.15, 0.38))

@Composable
private fun SleepTile(appeared: Boolean, modifier: Modifier) {
    val c0 by animateColorAsState(if (appeared) sleepNight[0] else sleepDusk[0], tween(5000, delayMillis = 100), label = "s0")
    val c1 by animateColorAsState(if (appeared) sleepNight[1] else sleepDusk[1], tween(5000, delayMillis = 100), label = "s1")
    Box(modifier.background(Brush.linearGradient(listOf(c0, c1)))) {
        Box(Modifier.fillMaxHeight().width(1.dp).background(Color.White.copy(alpha = 0.35f)).align(Alignment.CenterStart))
        StatColumn(
            icon = Icons.Filled.Bedtime, target = 6.2f, decimals = 1, unit = "hrs", label = "Sleep",
            valueSize = 40.sp, labelSize = 17.sp, ink = Color.White, reveal = appeared,
            modifier = Modifier.fillMaxSize().padding(14.dp),
        )
    }
}

@Composable
private fun StatColumn(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    target: Float,
    decimals: Int,
    unit: String,
    label: String,
    valueSize: TextUnit,
    labelSize: TextUnit,
    ink: Color,
    reveal: Boolean,
    modifier: Modifier = Modifier,
) {
    val value by animateFloatAsState(
        targetValue = if (reveal) target else 0f,
        animationSpec = tween(durationMillis = 1000, delayMillis = 150),
        label = "count",
    )
    val text = if (decimals <= 0) value.roundToInt().toString() else "%.${decimals}f".format(value)
    Column(modifier) {
        Icon(icon, contentDescription = null, tint = ink, modifier = Modifier.size(26.dp))
        Spacer(Modifier.weight(1f))
        Row(verticalAlignment = Alignment.Bottom) {
            Text(text, color = ink, fontSize = valueSize, fontWeight = FontWeight.Bold)
            if (unit.isNotEmpty()) {
                Spacer(Modifier.width(2.dp))
                Text(
                    unit,
                    color = ink.copy(alpha = 0.8f),
                    fontSize = valueSize * 0.4f,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = valueSize.value.times(0.12f).dp),
                )
            }
        }
        Text(label, color = ink.copy(alpha = 0.9f), fontSize = labelSize)
    }
}

/** A trend line that loads FLAT (constant opacity) and whose points settle into place
 *  as `progress` animates 0→1, so the line never flashes in. Decorative, not real data. */
@Composable
private fun FocusPlot(tint: Color, progress: Float, modifier: Modifier) {
    val ys = listOf(0.78f, 0.62f, 0.68f, 0.46f, 0.52f, 0.34f, 0.40f, 0.22f)
    Canvas(modifier) {
        val p = progress.coerceIn(0f, 1f)
        val baseline = 0.5f
        val pts = ys.mapIndexed { i, y ->
            Offset(size.width * i / (ys.size - 1), size.height * (baseline + (y - baseline) * p))
        }
        val path = Path().apply {
            moveTo(pts[0].x, pts[0].y)
            pts.drop(1).forEach { lineTo(it.x, it.y) }
        }
        drawPath(path, color = tint.copy(alpha = 0.30f), style = Stroke(width = 1.5.dp.toPx()))
        pts.forEach { drawCircle(tint.copy(alpha = 0.5f), radius = 3.dp.toPx(), center = it) }
    }
}

/** A selector — one emoji shown large, with a slider that auto-glides to its resting
 *  stop on appear, cycling the emoji on the way. */
@Composable
private fun EmojiSliderTile(items: List<String>, start: Int, modifier: Modifier) {
    val farEnd = if (start == 0) (items.size - 1).toFloat() else 0f
    var index by remember { mutableFloatStateOf(farEnd) }
    LaunchedEffect(Unit) {
        delay(600)
        animate(initialValue = farEnd, targetValue = start.toFloat(), animationSpec = tween(900)) { v, _ -> index = v }
    }
    Column(modifier.padding(12.dp)) {
        Text(items[index.roundToInt().coerceIn(0, items.size - 1)], fontSize = 40.sp)
        Spacer(Modifier.weight(1f))
        Slider(
            value = index,
            onValueChange = { index = it },
            valueRange = 0f..(items.size - 1).toFloat(),
        )
    }
}
