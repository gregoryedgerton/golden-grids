package com.gifcommit.goldengrids.example

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.util.lerp
import com.gifcommit.goldengrids.GoldenGrid
import com.gifcommit.goldengrids.PlacementValue
import kotlinx.coroutines.delay

/**
 * Photo gallery — four sky gradients in transparent slots, rotated to portrait with
 * `placement = bottom`, each with its celestial body. Read as photos shot looking out
 * over the Atlantic from the east coast: the sun rises over the water at dawn and sits
 * high by day; by dusk it has set behind you to the west, so the evening skies show the
 * moon rising over the ocean. Each tile pops in on load.
 */
private data class Sky(val stops: List<Color>, val sun: Boolean, val high: Boolean)

private val skies = listOf(
    Sky(listOf(rgb(0.99, 0.78, 0.42), rgb(0.97, 0.49, 0.55), rgb(0.55, 0.35, 0.66)), sun = true, high = false),  // sunrise
    Sky(listOf(rgb(0.01, 0.02, 0.10), rgb(0.14, 0.16, 0.40), rgb(0.38, 0.31, 0.60)), sun = false, high = true),  // night
    Sky(listOf(rgb(0.18, 0.21, 0.49), rgb(0.55, 0.34, 0.64), rgb(0.97, 0.58, 0.45)), sun = false, high = false), // dusk
    Sky(listOf(rgb(0.36, 0.71, 0.98), rgb(0.66, 0.86, 0.99), rgb(0.88, 0.95, 1.00)), sun = true, high = true),   // day
)

@Composable
fun GalleryScreen() {
    var appeared by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(350)
        appeared = true
    }

    Box(Modifier.fillMaxSize().padding(12.dp), contentAlignment = Alignment.Center) {
        GoldenGrid(
            from = 1,
            to = 4,
            placement = PlacementValue.bottom,
            modifier = Modifier.fillMaxWidth(),
        ) { ordinal ->
            val sky = skies[ordinal % skies.size]
            val intro by animateFloatAsState(
                targetValue = if (appeared) 1f else 0f,
                animationSpec = tween(durationMillis = 500, delayMillis = ordinal * 90),
                label = "skyIntro",
            )
            SkyTile(
                sky,
                Modifier.fillMaxSize().graphicsLayer {
                    val s = lerp(0.9f, 1f, intro)
                    scaleX = s
                    scaleY = s
                    alpha = intro
                },
            )
        }
    }
}

@Composable
private fun SkyTile(sky: Sky, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        drawRect(Brush.verticalGradient(sky.stops))
        val body = size.minDimension * 0.17f // radius (iOS diameter = min * 0.34)
        val cx = size.width * (if (sky.high) 0.70f else 0.50f)
        val cy = size.height * (if (sky.high) 0.26f else 0.74f)
        val center = Offset(cx, cy)
        val glow = if (sky.sun) Color(0xFFFFF59D) else Color.White
        // soft glow
        drawCircle(
            brush = Brush.radialGradient(
                listOf(glow.copy(alpha = 0.55f), glow.copy(alpha = 0f)),
                center = center,
                radius = body * 2.1f,
            ),
            radius = body * 2.1f,
            center = center,
        )
        // disc
        drawCircle(color = if (sky.sun) Color.White else Color(0xFFEDEDED), radius = body, center = center)
    }
}
