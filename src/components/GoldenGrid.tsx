import React from "react";
import { computeRenderModel } from "../utils/renderModel";
import type { PlacementValue } from "../utils/renderModel";
import { pct, fillToCss } from "../core/style";
import { assignChildren } from "../core/assignChildren";
import type { GoldenGridProps } from "../core/types";
import { GoldenBox } from "./GoldenBox";
import type { GoldenBoxProps } from "./GoldenBox";
import "../styles/grid.css";

export type { PlacementValue, GoldenGridProps };

const GoldenGrid: React.FC<GoldenGridProps> = (props): React.ReactElement<any> => {
  const outline = props.outline;
  const outlined = !!outline;

  const containerBorder: React.CSSProperties = outline
    ? { borderTop: outline, borderLeft: outline }
    : {};
  const boxBorder: React.CSSProperties = outline
    ? { borderRight: outline, borderBottom: outline }
    : {};

  // --- child collection (React-specific; the model + assignChildren supply the ordering) ---
  const allBoxChildren = React.Children.toArray(props.children).filter(
    (child): child is React.ReactElement<GoldenBoxProps> =>
      React.isValidElement(child) && child.type === GoldenBox
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
    return <div className="golden-grid" />;
  }

  const gridClass = `golden-grid${outlined ? " golden-grid--outlined" : ""}`;

  // Single square — no skipped squares
  if (model.kind === "single") {
    const slot = model.slots[0];
    return (
      <div className={gridClass} style={{ aspectRatio: "1 / 1", ...containerBorder }}>
        <div className="golden-grid__box" style={{ left: 0, top: 0, width: "100%", height: "100%", background: fillToCss(slot.color), ...boxBorder }}>
          {slotChildren[0]}
        </div>
      </div>
    );
  }

  return (
    <div className={gridClass} style={{ aspectRatio: `${model.aspectRatio.w} / ${model.aspectRatio.h}`, ...containerBorder }}>
      {model.placeholder && (
        <div
          className="golden-grid__box golden-grid__box--placeholder"
          style={{
            left:       pct(model.placeholder.rect.left),
            top:        pct(model.placeholder.rect.top),
            width:      pct(model.placeholder.rect.width),
            height:     pct(model.placeholder.rect.height),
            background: fillToCss(model.placeholder.color),
            ...boxBorder,
          }}
        >
          {placeholderChild}
        </div>
      )}
      {model.slots.map((slot, i) => (
        <div
          key={i}
          className="golden-grid__box"
          style={{
            left:       pct(slot.rect.left),
            top:        pct(slot.rect.top),
            width:      pct(slot.rect.width),
            height:     pct(slot.rect.height),
            background: fillToCss(slot.color),
            ...boxBorder,
          }}
        >
          {slotChildren[i]}
        </div>
      ))}
    </div>
  );
};

export default GoldenGrid;
