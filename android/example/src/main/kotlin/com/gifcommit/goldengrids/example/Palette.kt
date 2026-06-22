package com.gifcommit.goldengrids.example

import androidx.compose.ui.graphics.Color

/** Shared colours so the example screens stay in sync — mirrors Examples/iOS/Palette.swift. */
object Palette {
    /** Background of the slider tiles, and the light end of the Sleep gradient. */
    val panelGray = Color(0xFFCCCCCC)
    /** The editorial headline purple, and the dark end of the Sleep gradient (iOS indigo). */
    val headlinePurple = Color(0xFF5856D6)
    /** The main blue of the daytime sky gradient, and the Focus Flow tile. */
    val daySkyBlue = Color(0xFF5CB5FA)
    /** Deep navy ink — readable text/plot on the light daySkyBlue Focus tile. */
    val focusInk = Color(0xFF0F245C)
}

/** SwiftUI-style Color(red:green:blue:) from 0..1 components. */
fun rgb(r: Double, g: Double, b: Double): Color = Color(r.toFloat(), g.toFloat(), b.toFloat())
