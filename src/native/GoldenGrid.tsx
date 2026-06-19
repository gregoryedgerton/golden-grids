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

/** Parse a CSS border shorthand ("2px solid #000") into RN border values.
 *  Best-effort: width + colour; exotic shorthands fall through to no border. */
function parseOutline(outline: string): { width: number; color: string } | null {
  const m = outline.trim().match(/^(\d+(?:\.\d+)?)px\s+\S+\s+(.+)$/);
  if (!m) return null;
  return { width: parseFloat(m[1]), color: m[2].trim() };
}

const bg = (color: FillColor): ViewStyle => {
  const value = fillToCss(color);
  return value ? { backgroundColor: value } : {};
};

const GoldenGrid: React.FC<GoldenGridProps> = (props) => {
  const border = props.outline ? parseOutline(props.outline) : null;
  // Split borders like the web renderer so shared edges never double up.
  const containerBorder: ViewStyle = border
    ? { borderTopWidth: border.width, borderLeftWidth: border.width, borderTopColor: border.color, borderLeftColor: border.color }
    : {};
  const boxBorder: ViewStyle = border
    ? { borderRightWidth: border.width, borderBottomWidth: border.width, borderRightColor: border.color, borderBottomColor: border.color }
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
