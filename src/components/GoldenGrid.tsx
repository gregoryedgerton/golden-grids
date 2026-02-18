import React, { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import { fullFibonacciUpTo, getGridRange } from "../utils/fibonacci";
import { hexToHsl, hslToCss } from "../utils/colorUtils";
import "../styles/grid.css";

export interface GoldenGridProps {
  from?: number;
  to?: number;
  color?: string;
  clockwise?: boolean;
  rotate?: 0 | 90 | 180 | 270;
}

const GoldenGrid: React.FC<GoldenGridProps> = (props): React.ReactElement<any> => {
  const { inputControl } = useGrid();
  const gridRef = useRef<HTMLDivElement>(null);

  const from = props.from ?? inputControl.from;
  const to = props.to ?? inputControl.to;
  const color = props.color ?? inputControl.color;
  const clockwise = props.clockwise ?? inputControl.clockwise;
  const rotate = props.rotate ?? inputControl.rotate;

  useEffect(() => {
    if (!gridRef.current) return;

    let start = from;
    let end = to;
    if (start > end) {
      [start, end] = [end, start];
    }

    const range = getGridRange(start, end);
    if (!range) {
      gridRef.current.innerHTML = "";
      return;
    }

    const { userSequence, startIdx, endIdx } = range;
    const maxRequested = Math.max(...userSequence);
    const fullSequence = fullFibonacciUpTo(maxRequested);

    const baseColor = color || '#333333';
    const [h, s, l] = hexToHsl(baseColor);

    // Single colored square with nothing skipped: render full-width
    if (startIdx === 0 && endIdx === 0) {
      gridRef.current.innerHTML = "";
      const ol = document.createElement("ol");
      ol.style.aspectRatio = "1 / 1";
      const li = document.createElement("li");
      li.style.left = "0";
      li.style.top = "0";
      li.style.width = "100%";
      li.style.height = "100%";
      li.style.background = hslToCss(h, s, l);
      ol.appendChild(li);
      gridRef.current.appendChild(ol);
      return;
    }

    const layout = generateGoldenGridLayout(fullSequence, clockwise, rotate);

    const requestedSquares = layout.squares.slice(startIdx, endIdx + 1);
    const skippedSquares = layout.squares.slice(0, startIdx);

    gridRef.current.innerHTML = "";
    const ol = document.createElement("ol");
    ol.style.aspectRatio = `${layout.width} / ${layout.height}`;

    // Placeholder for skipped (smaller) squares
    const placeholderExists = skippedSquares.length > 0;

    if (placeholderExists) {
      let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity;
      for (const s of skippedSquares) {
        if (s.x < pMinX) pMinX = s.x;
        if (s.x + s.size - 1 > pMaxX) pMaxX = s.x + s.size - 1;
        if (s.y < pMinY) pMinY = s.y;
        if (s.y + s.size - 1 > pMaxY) pMaxY = s.y + s.size - 1;
      }

      const pWidth = pMaxX - pMinX + 1;
      const pHeight = pMaxY - pMinY + 1;

      const placeholderLi = document.createElement("li");
      placeholderLi.classList.add("placeholder");
      placeholderLi.style.left = `${(pMinX - layout.minX) / layout.width * 100}%`;
      placeholderLi.style.top = `${(pMinY - layout.minY) / layout.height * 100}%`;
      placeholderLi.style.width = `${pWidth / layout.width * 100}%`;
      placeholderLi.style.height = `${pHeight / layout.height * 100}%`;
      placeholderLi.style.background = baseColor;
      ol.appendChild(placeholderLi);
    }

    // Render requested squares with color progression
    const totalRequested = requestedSquares.length;
    const hueRange = Math.min(330, 180 + Math.max(0, totalRequested - 4) * 15);
    const lightnessSpread = Math.min(50, totalRequested * 3);
    requestedSquares.forEach((sq, seqIndex) => {
      let currentHue = h;
      let fraction = 0;
      if (totalRequested > 1) {
        if (placeholderExists) {
          fraction = (seqIndex + 1) / (totalRequested + 1);
        } else {
          fraction = seqIndex / (totalRequested - 1);
        }
        currentHue = (h + hueRange * fraction) % 360;
      } else {
        if (placeholderExists) {
          fraction = 0.5;
          currentHue = (h + hueRange * 0.5) % 360;
        }
      }
      const currentL = Math.max(10, Math.min(90, l + lightnessSpread / 2 - fraction * lightnessSpread));

      const li = document.createElement("li");
      li.style.left = `${(sq.x - layout.minX) / layout.width * 100}%`;
      li.style.top = `${(sq.y - layout.minY) / layout.height * 100}%`;
      li.style.width = `${sq.size / layout.width * 100}%`;
      li.style.height = `${sq.size / layout.height * 100}%`;
      li.style.background = hslToCss(currentHue, s, currentL);
      ol.appendChild(li);
    });

    gridRef.current.appendChild(ol);
  }, [from, to, color, clockwise, rotate]);

  return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
