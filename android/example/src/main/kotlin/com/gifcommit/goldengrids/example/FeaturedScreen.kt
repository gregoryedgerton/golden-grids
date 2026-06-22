package com.gifcommit.goldengrids.example

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.util.lerp
import com.gifcommit.goldengrids.GoldenGrid
import com.gifcommit.goldengrids.PlacementValue
import kotlin.math.absoluteValue
import kotlinx.coroutines.delay

/**
 * Featured — a swipeable carousel of GoldenGrid copy cards. Each card is a two-box
 * golden grid (hero headline above, standfirst + CTA below). Cards sit at ~80% width
 * so neighbours peek in, paging snaps between them, and the set builds in on load.
 */
private data class Feature(val eyebrow: String, val headline: String, val body: String, val accent: Color)

private val features = listOf(
    Feature(
        "DESIGN", "Lay your content out on the golden ratio.",
        "Drop your views into proportional slots and let GoldenGrid place them — the same component you already use on web and React Native.",
        rgb(0.345, 0.337, 0.839),
    ),
    Feature(
        "FAST", "Pure Fibonacci math, no layout passes.",
        "The grid is computed once from integer ratios — no measurement loops, no reflow — so it stays smooth however deep the spiral runs.",
        rgb(0.13, 0.45, 0.55),
    ),
    Feature(
        "THEMEABLE", "One model, every product's look.",
        "Hand it a base colour for an HSL progression, an outline, or nothing at all — the slots are yours to style to match any brand.",
        rgb(0.55, 0.27, 0.60),
    ),
)

@Composable
fun FeaturedScreen() {
    var appeared by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(350)
        appeared = true
    }
    val pagerState = rememberPagerState(pageCount = { features.size })

    Box(Modifier.fillMaxSize()) {
        HorizontalPager(
            state = pagerState,
            contentPadding = PaddingValues(horizontal = 40.dp),
            pageSpacing = 16.dp,
            modifier = Modifier.fillMaxSize().padding(vertical = 20.dp),
        ) { page ->
            val intro by animateFloatAsState(
                targetValue = if (appeared) 1f else 0f,
                animationSpec = tween(durationMillis = 520, delayMillis = page * 70),
                label = "cardIntro",
            )
            // How centred this page is: 1 = dead centre, 0 = a full page away.
            val offset = ((pagerState.currentPage - page) + pagerState.currentPageOffsetFraction).absoluteValue
            val nearness = (1f - offset).coerceIn(0f, 1f)
            val settleScale = lerp(0.93f, 1f, nearness)
            val settleAlpha = lerp(0.5f, 1f, nearness)

            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                FeatureCard(
                    features[page],
                    Modifier
                        .fillMaxWidth()
                        .graphicsLayer {
                            val s = settleScale * lerp(0.82f, 1f, intro)
                            scaleX = s
                            scaleY = s
                            alpha = settleAlpha * intro
                            translationY = (1f - intro) * 28.dp.toPx()
                        },
                )
            }
        }

        Row(
            Modifier.align(Alignment.BottomCenter).padding(bottom = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            features.indices.forEach { i ->
                val on = pagerState.currentPage == i
                Box(
                    Modifier.size(7.dp).clip(CircleShape).background(
                        if (on) MaterialTheme.colorScheme.onSurface
                        else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                    ),
                )
            }
        }
    }
}

@Composable
private fun FeatureCard(feature: Feature, modifier: Modifier = Modifier) {
    GoldenGrid(
        from = 1,
        to = 2,
        placement = PlacementValue.top,
        modifier = modifier.clip(RoundedCornerShape(20.dp)),
    ) { ordinal ->
        if (ordinal == 0) HeroBox(feature) else BodyBox(feature)
    }
}

@Composable
private fun HeroBox(feature: Feature) {
    Column(Modifier.fillMaxSize().background(feature.accent).padding(22.dp)) {
        Text(feature.eyebrow, color = Color.White.copy(alpha = 0.75f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(10.dp))
        Text(feature.headline, color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold, lineHeight = 31.sp)
    }
}

@Composable
private fun BodyBox(feature: Feature) {
    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceVariant).padding(22.dp)) {
        Text(feature.body, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 15.sp, lineHeight = 21.sp)
        Spacer(Modifier.weight(1f))
        Text("Read more →", color = feature.accent, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
    }
}
