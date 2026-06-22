package com.gifcommit.goldengrids.example

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Public
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gifcommit.goldengrids.GoldenGrid
import com.gifcommit.goldengrids.PlacementValue
import kotlinx.coroutines.delay

/**
 * Editorial — a scrollable, text-first article on stacked golden-ratio grids: a lead
 * grid (standfirst, platforms, title), a single big all-text cell, then a grid pairing
 * body copy with a dawn plate, and a footer. Items rise in on load; then you scroll.
 */
@Composable
fun EditorialScreen() {
    var appeared by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(350)
        appeared = true
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(28.dp),
    ) {
        // 1 — lead: standfirst (largest) + platforms + title
        GoldenGrid(
            from = 1, to = 3, placement = PlacementValue.right,
            modifier = Modifier.fillMaxWidth().riseIn(appeared, 0),
        ) { ordinal ->
            when (ordinal) {
                0 -> Standfirst()
                1 -> Platforms()
                else -> Headline()
            }
        }

        // 2 — middle: a single big all-text cell (from:1,to:1 == 1 cell)
        GoldenGrid(from = 1, to = 1, modifier = Modifier.fillMaxWidth().riseIn(appeared, 100)) { _ ->
            BodyText(bigMiddle)
        }

        // 3 — a short caption + the dawn plate (from:1,to:2 == 2 cells)
        GoldenGrid(
            from = 1, to = 2, placement = PlacementValue.right,
            modifier = Modifier.fillMaxWidth().riseIn(appeared, 200),
        ) { ordinal ->
            if (ordinal == 0) PlateCaption() else DawnSky()
        }

        Footer(Modifier.fillMaxWidth().riseIn(appeared, 300))
    }
}

@Composable
private fun Headline() {
    Text(
        "GOLDEN\nRATIO\nLAYOUTS",
        color = Palette.headlinePurple,
        fontSize = 34.sp,
        fontWeight = FontWeight.SemiBold,
        lineHeight = 38.sp,
        modifier = Modifier.fillMaxSize(),
    )
}

@Composable
private fun Platforms() {
    Column(
        Modifier.fillMaxSize().padding(start = 16.dp, end = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        listOf("React", "React Native", "Jetpack Compose").forEach { platform ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(7.dp).clip(CircleShape).background(Palette.headlinePurple))
                Spacer(Modifier.size(9.dp))
                Text(platform, fontSize = 17.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun Standfirst() = BodyText(
    "For centuries the golden ratio has guided composition — manuscripts, posters, façades. GoldenGrid brings the same proportion to Jetpack Compose: drop content into the slots and the spiral places it. No measurement passes, just Fibonacci math — the very layout you already ship on web and in React Native.\n\nThe grid does not care what you put in it: a headline, a photograph, a paragraph of running text — each lands where the proportion says it should, and the page reads as though it were composed by hand rather than computed by a layout engine.",
)

@Composable
private fun BodyText(text: String) {
    Text(
        text,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        modifier = Modifier.fillMaxSize().padding(end = 10.dp),
    )
}

@Composable
private fun PlateCaption() {
    Text(
        "Plate I — dawn over the Atlantic. Eight centuries on, the same spiral still does the quiet work.",
        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
        fontSize = 12.sp,
        lineHeight = 16.sp,
        modifier = Modifier.fillMaxSize().padding(start = 16.dp, end = 10.dp),
    )
}

/** The Gallery's "dawn" sky — a sunrise gradient with the sun low over the water. */
@Composable
private fun DawnSky() {
    Canvas(Modifier.fillMaxSize().clip(RoundedCornerShape(10.dp))) {
        drawRect(
            Brush.verticalGradient(
                listOf(rgb(0.99, 0.78, 0.42), rgb(0.97, 0.49, 0.55), rgb(0.55, 0.35, 0.66)),
            ),
        )
        val r = size.minDimension * 0.20f
        val center = Offset(size.width * 0.5f, size.height * 0.72f)
        drawCircle(
            brush = Brush.radialGradient(
                listOf(Color(0xFFFFF59D).copy(alpha = 0.55f), Color(0xFFFFF59D).copy(alpha = 0f)),
                center = center, radius = r * 2.1f,
            ),
            radius = r * 2.1f, center = center,
        )
        drawCircle(Color.White, radius = r, center = center)
    }
}

@Composable
private fun Footer(modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        HorizontalDivider()
        Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            listOf("Docs", "Guides", "Examples", "License").forEach {
                Text(it, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(22.dp)) {
            listOf(Icons.Filled.Public, Icons.Filled.Code, Icons.Filled.Inventory2, Icons.Filled.MailOutline).forEach {
                Icon(it, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
            }
        }
        Text(
            "© 2026 GoldenGrid · @gifcommit/golden-grids · MIT License",
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
        )
    }
}

@Composable
private fun Modifier.riseIn(appeared: Boolean, delayMs: Int): Modifier {
    val a by animateFloatAsState(
        targetValue = if (appeared) 1f else 0f,
        animationSpec = tween(durationMillis = 500, delayMillis = delayMs),
        label = "rise",
    )
    return this.graphicsLayer {
        alpha = a
        translationY = (1f - a) * 18.dp.toPx()
    }
}

private const val bigMiddle =
    "Reach for it when a screen needs to breathe — a hero and its supporting cards, a gallery, a dashboard, or a column of prose like this one. Each slot is a slice of the same spiral, so the whole layout speaks one proportional language, and the page settles into a rhythm the eye already trusts before it reads a word. Designers reach for it because the result feels considered; engineers because there is nothing left to configure. Lay the grid down, drop your content in, and let eight centuries of composition do the arranging while you get on with the words that matter. Nothing here is decoration — the proportion is load-bearing. Remove it and the page slumps; keep it and every element finds its level."
