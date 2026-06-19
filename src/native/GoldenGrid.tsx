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

const BORDER_STYLE_TOKENS = "solid|dotted|dashed|double|groove|ridge|inset|outset|none|hidden";

/** Parse a CSS border shorthand into RN border values. CSS allows the width,
 *  style and colour tokens in any order, and the colour may itself contain
 *  spaces (e.g. "2px solid rgb(0, 0, 0)"). So pull out the px width and a
 *  border-style keyword wherever they appear, and treat whatever remains as the
 *  colour — mirroring the web renderer, which hands the string straight to CSS.
 *  RN only supports solid | dotted | dashed, so other styles fall back to solid.
 *  Returns null when a px width and a colour can't both be found. */
function parseOutline(
  outline: string
): { width: number; style: "solid" | "dotted" | "dashed"; color: string } | null {
  let rest = ` ${outline.trim()} `;

  let width: number | null = null;
  const wm = rest.match(/\s(\d*\.?\d+)px\s/);
  if (wm) {
    width = parseFloat(wm[1]);
    rest = rest.replace(wm[0], " ");
  }

  let style: "solid" | "dotted" | "dashed" = "solid";
  let noBorder = false;
  const sm = rest.match(new RegExp(`\\s(${BORDER_STYLE_TOKENS})\\s`, "i"));
  if (sm) {
    const token = sm[1].toLowerCase();
    if (token === "none" || token === "hidden") {
      noBorder = true; // CSS none/hidden draws no border — mirror web, don't fall back to solid
    } else {
      style = token === "dotted" || token === "dashed" ? token : "solid";
    }
    rest = rest.replace(sm[0], " ");
  }

  const color = rest.trim().replace(/\s+/g, " ");
  if (noBorder || width === null || !color) return null;
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
      <View style={{ width: "100%", aspectRatio: 1, ...containerBorder }}>
        <View style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", ...bg(slot.color), ...boxBorder }}>
          {slotChildren[0]}
        </View>
      </View>
    );
  }

  return (
    <View style={{ position: "relative", width: "100%", aspectRatio: model.aspectRatio.w / model.aspectRatio.h, ...containerBorder }}>
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
