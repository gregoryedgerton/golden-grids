package com.gifcommit.goldengrids.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Article
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Cyclone
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier

/**
 * Mirrors Examples/iOS — five screens, icons-only bottom navigation, each built
 * entirely with the GoldenGrid composable: a swipeable Featured carousel, a sky
 * Gallery, a stats Dashboard, and a text-first Editorial article.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { Surface { AppShell() } } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppShell() {
    val titles = listOf("Featured", "Galleries", "Dashboards", "Editorial", "Interactive Experiences")
    val icons = listOf(Icons.Filled.Star, Icons.Filled.PhotoLibrary, Icons.Filled.GridView, Icons.Filled.Article, Icons.Filled.Cyclone)
    var selected by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        topBar = { TopAppBar(title = { Text(titles[selected]) }) },
        bottomBar = {
            NavigationBar {
                titles.indices.forEach { i ->
                    NavigationBarItem(
                        selected = selected == i,
                        onClick = { selected = i },
                        icon = { Icon(icons[i], contentDescription = titles[i]) },
                    )
                }
            }
        },
    ) { padding ->
        // Render only the selected screen, so switching tabs disposes and recreates
        // it — that replays each screen's build-in intro, matching the iOS onDisappear.
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (selected) {
                0 -> FeaturedScreen()
                1 -> GalleryScreen()
                2 -> DashboardScreen()
                3 -> EditorialScreen()
                else -> SpiralScreen()
            }
        }
    }
}
