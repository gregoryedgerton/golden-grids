import React from "react";
import { View } from "react-native";
import type { ViewStyle } from "react-native";
import { computeRenderModel } from "../utils/renderModel";
import type { FillColor, PlacementValue } from "../utils/renderModel";
import { pct, fillToCss } from "../core/style";
import { assignChildren } from "../core/assignChildren";
import type { GoldenGridProps } from "../core/types";
import { GoldenBox } from "./GoldenBox";

export type { PlacementValue, GoldenGridProps };

const BORDER_STYLE_TOKENS = new Set([
  "solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset", "none", "hidden",
]);

/** Parse a CSS border shorthand into RN border values. CSS allows the width,
 *  style and colour tokens in any order ("2px solid #000", "solid 2px #000",
 *  "#000 2px solid"), so classify each token rather than assume a fixed order —
 *  matching the web renderer, which hands the string straight to CSS. RN only
 *  supports solid | dotted | dashed, so other styles fall back to solid. Returns
 *  null when a px width and a colour can't both be found. */
function parseOutline(
  outline: string
): { width: number; style: "solid" | "dotted" | "dashed"; color: string } | null {
  let width: number | null = null;
  let style: "solid" | "dotted" | "dashed" = "solid";
  let color: string | null = null;

  for (const token of outline.trim().split(/\s+/)) {
    const w = token.match(/^(\d*\.?\d+)px$/);
    if (w && width === null) {
      width = parseFloat(w[1]);
    } else if (BORDER_STYLE_TOKENS.has(token.toLowerCase())) {
      const s = token.toLowerCase();
      style = s === "dotted" || s === "dashed" ? s : "solid";
    } else if (color === null) {
      color = token;
    }
  }

  if (width === null || color === null) return null;
  return { width, style, color };
}

const bg = (color: FillColor): ViewStyle => {
  const value = fillToCss(color);
  return value ? { backgroundColor: value } : {};
};

const GoldenGrid: React.FC<GoldenGridProps> = (props) => {
  const border = props.outline ? parseOutline(props.outline) : null;
  // Split borders like the web renderer so shared edges never double up.
  const containerBorder: ViewStyle = border
    ? { borderStyle: border.style, borderTopWidth: border.width, borderLeftWidth: border.width, borderTopColor: border.color, borderLeftColor: border.color }
    : {};
  const boxBorder: ViewStyle = border
    ? { borderStyle: border.style, borderRightWidth: border.width, borderBottomWidth: border.width, borderRightColor: border.color, borderBottomColor: border.color }
    : {};

  // --- child collection (the model + assignChildren supply the ordering) ---
  const allBoxChildren = React.Children.toArray(props.children).filter(
    (child): child is React.ReactElement => React.isValidElement(child) && child.type === GoldenBox
  );

  const model = computeRenderModel({
    from: props.from,
    to: props.to,
    color: props.color,
    clockwise: props.clockwise,
    placement: props.placement,
  });
  const { slotChildren, placeholderChild } = assignChildren(model, allBoxChildren);

  if (model.kind === "empty") {
    return <View />;
  }

  // Single square — no skipped squares
  if (model.kind === "single") {
    const slot = model.slots[0];
    return (
      <View style={{ aspectRatio: 1, ...containerBorder }}>
        <View style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", ...bg(slot.color), ...boxBorder }}>
          {slotChildren[0]}
        </View>
      </View>
    );
  }

  return (
    <View style={{ position: "relative", aspectRatio: model.aspectRatio.w / model.aspectRatio.h, ...containerBorder }}>
      {model.placeholder && (
        <View
          style={{
            position: "absolute",
            left:   pct(model.placeholder.rect.left),
            top:    pct(model.placeholder.rect.top),
            width:  pct(model.placeholder.rect.width),
            height: pct(model.placeholder.rect.height),
            ...bg(model.placeholder.color),
            ...boxBorder,
          }}
        >
          {placeholderChild}
        </View>
      )}
      {model.slots.map((slot, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left:   pct(slot.rect.left),
            top:    pct(slot.rect.top),
            width:  pct(slot.rect.width),
            height: pct(slot.rect.height),
            ...bg(slot.color),
            ...boxBorder,
          }}
        >
          {slotChildren[i]}
        </View>
      ))}
    </View>
  );
};

export default GoldenGrid;
