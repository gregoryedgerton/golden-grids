package com.gifcommit.goldengrids.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gifcommit.goldengrids.GoldenGrid

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(Modifier.fillMaxSize()) { Showcase() }
            }
        }
    }
}

@Composable
private fun Showcase() {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text("Golden Grids", fontSize = 32.sp, fontWeight = FontWeight.Bold)
        Text(
            "Jetpack Compose, rendered over the same proportional model as web, React Native and SwiftUI.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Text("Colour progression — from 1 to 5", fontWeight = FontWeight.SemiBold)
        GoldenGrid(from = 1, to = 5, color = "#7f7ec7", modifier = Modifier.fillMaxWidth())

        Text("Content slots — largest first", fontWeight = FontWeight.SemiBold)
        GoldenGrid(from = 1, to = 4, modifier = Modifier.fillMaxWidth()) { childIndex ->
            Box(
                Modifier.fillMaxSize().background(tiles[childIndex % tiles.size]),
                contentAlignment = Alignment.Center,
            ) {
                Text("${childIndex + 1}", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

private val tiles = listOf(
    Color(0xFF4C3FB0), Color(0xFF1E7F8C), Color(0xFFC2553F), Color(0xFF5E8B3A),
)
