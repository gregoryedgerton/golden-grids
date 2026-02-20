import React from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import { fullFibonacciUpTo, getGridRange } from "../utils/fibonacci";
import { hexToHsl, hslToCss } from "../utils/colorUtils";
import { GoldenBox } from "./GoldenBox";
import type { GoldenBoxProps } from "./GoldenBox";
import "../styles/grid.css";

export interface GoldenGridProps {
  from?: number;
  to?: number;
  color?: string;
  clockwise?: boolean;
  placement?: "right" | "bottom" | "left" | "top";
  outline?: string; // CSS border shorthand e.g. "2px dashed #ff0000"
  children?: React.ReactNode;
}

const PLACEMENT_DEG = { right: 0, bottom: 90, left: 180, top: 270 } as const;

const GoldenGrid: React.FC<GoldenGridProps> = (props): React.ReactElement<any> => {
  const { inputControl } = useGrid();

  const from      = props.from      ?? inputControl.from;
  const to        = props.to        ?? inputControl.to;
  const color     = 'color' in props ? props.color : inputControl.color;
  const clockwise = props.clockwise ?? inputControl.clockwise;
  const placement = props.placement ?? inputControl.placement;
  const outline   = 'outline' in props ? props.outline : undefined;
  const rotateDeg = PLACEMENT_DEG[placement];
  const outlined  = !!outline;

  const containerBorder: React.CSSProperties = outline
    ? { borderTop: outline, borderLeft: outline }
    : {};
  const boxBorder: React.CSSProperties = outline
    ? { borderRight: outline, borderBottom: outline }
    : {};

  // --- child mapping ---
  const allBoxChildren = React.Children.toArray(props.children).filter(
    (child): child is React.ReactElement<GoldenBoxProps> =>
      React.isValidElement(child) && child.type === GoldenBox
  );
  const placeholderChild = allBoxChildren.find(child => child.props.placeholder) ?? null;
  const boxChildren = allBoxChildren.filter(child => !child.props.placeholder);

  // --- layout computation ---
  let start = from;
  let end = to;
  if (start > end) [start, end] = [end, start];

  const range = getGridRange(start, end);

  if (!range) {
    return <div className="golden-grid" />;
  }

  const { userSequence, startIdx, endIdx } = range;
  const maxRequested = Math.max(...userSequence);
  const fullSequence = fullFibonacciUpTo(maxRequested);

  const baseColor = color || undefined;
  const [h, s, l] = baseColor ? hexToHsl(baseColor) : [0, 0, 50];
  const gridClass = `golden-grid${outlined ? ' golden-grid--outlined' : ''}`;

  // Single square — no skipped squares
  if (startIdx === 0 && endIdx === 0) {
    const bg = baseColor ? hslToCss(h, s, l) : undefined;
    return (
      <div className={gridClass} style={{ aspectRatio: "1 / 1", ...containerBorder }}>
        <div className="golden-grid__box" style={{ left: 0, top: 0, width: "100%", height: "100%", background: bg, ...boxBorder }}>
          {boxChildren[0] ?? null}
        </div>
      </div>
    );
  }

  const layout = generateGoldenGridLayout(fullSequence, clockwise, rotateDeg);
  const requestedSquares = layout.squares.slice(startIdx, endIdx + 1);
  const skippedSquares = layout.squares.slice(0, startIdx);

  // --- placeholder bounds ---
  const placeholderExists = skippedSquares.length > 0;
  let placeholderStyle: React.CSSProperties | null = null;
  if (placeholderExists) {
    let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity;
    for (const sq of skippedSquares) {
      if (sq.x < pMinX) pMinX = sq.x;
      if (sq.x + sq.size - 1 > pMaxX) pMaxX = sq.x + sq.size - 1;
      if (sq.y < pMinY) pMinY = sq.y;
      if (sq.y + sq.size - 1 > pMaxY) pMaxY = sq.y + sq.size - 1;
    }
    const pWidth = pMaxX - pMinX + 1;
    const pHeight = pMaxY - pMinY + 1;
    placeholderStyle = {
      left:       `${(pMinX - layout.minX) / layout.width * 100}%`,
      top:        `${(pMinY - layout.minY) / layout.height * 100}%`,
      width:      `${pWidth / layout.width * 100}%`,
      height:     `${pHeight / layout.height * 100}%`,
      background: baseColor ?? undefined,
      ...boxBorder,
    };
  }

  // --- color progression ---
  const totalRequested = requestedSquares.length;
  const hueRange = Math.min(330, 180 + Math.max(0, totalRequested - 4) * 15);
  const lightnessSpread = Math.min(50, totalRequested * 3);

  const squareColors = requestedSquares.map((_, seqIndex) => {
    if (!baseColor) return undefined;
    let fraction = 0;
    if (totalRequested > 1) {
      fraction = placeholderExists
        ? (seqIndex + 1) / (totalRequested + 1)
        : seqIndex / (totalRequested - 1);
    } else if (placeholderExists) {
      fraction = 0.5;
    }
    const currentHue = (h + hueRange * fraction) % 360;
    const currentL = Math.max(10, Math.min(90, l + lightnessSpread / 2 - fraction * lightnessSpread));
    return hslToCss(currentHue, s, currentL);
  });

  return (
    <div className={gridClass} style={{ aspectRatio: `${layout.width} / ${layout.height}`, ...containerBorder }}>
      {placeholderExists && placeholderStyle && (
        <div
          className="golden-grid__box golden-grid__box--placeholder"
          style={placeholderStyle}
        >
          {placeholderChild}
        </div>
      )}
      {requestedSquares.map((sq, i) => (
        <div
          key={i}
          className="golden-grid__box"
          style={{
            left:       `${(sq.x - layout.minX) / layout.width * 100}%`,
            top:        `${(sq.y - layout.minY) / layout.height * 100}%`,
            width:      `${sq.size / layout.width * 100}%`,
            height:     `${sq.size / layout.height * 100}%`,
            background: squareColors[i],
            ...boxBorder,
          }}
        >
          {boxChildren[i] ?? null}
        </div>
      ))}
    </div>
  );
};

export default GoldenGrid;
