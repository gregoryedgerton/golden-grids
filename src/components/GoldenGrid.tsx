import React, { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import { fullFibonacciUpTo, buildUserSequenceFromBounds } from "../utils/fibonacci";
import { hexToHsl, hslToCss } from "../utils/colorUtils";
import "../styles/golden-grid.css";

const GoldenGrid: React.FC = (): React.ReactElement<any> => {
  const { inputControl } = useGrid();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    const { first, last, mirror, rotate, color } = inputControl;

    let start = first;
    let end = last;
    if (start > end) {
      [start, end] = [end, start];
    }

    const userSequence = buildUserSequenceFromBounds(start, end);
    if (userSequence.length < 2) {
      console.warn('No valid sequence generated for', { start, end });
      return;
    }

    const maxRequested = Math.max(...userSequence);
    const fullSequence = fullFibonacciUpTo(maxRequested);

    const baseColor = color || '#333333';
    const [h, s, l] = hexToHsl(baseColor);
    const complementHue = (h + 180) % 360;

    const layout = generateGoldenGridLayout(fullSequence, mirror, rotate);

    const requestedSquares = layout.squares.filter(sq => userSequence.includes(sq.size));
    const skippedSquares = layout.squares.filter(sq => !userSequence.includes(sq.size));

    gridRef.current.innerHTML = "";
    const ol = document.createElement("ol");
    ol.style.gridTemplateColumns = `repeat(${layout.width}, 1fr)`;
    ol.style.gridTemplateRows = `repeat(${layout.height}, 1fr)`;

    // Placeholder for skipped (smaller) squares
    const placeholderExists = skippedSquares.length > 0;

    if (placeholderExists) {
      const pMinX = Math.min(...skippedSquares.map(s => s.x));
      const pMaxX = Math.max(...skippedSquares.map(s => s.x + s.size - 1));
      const pMinY = Math.min(...skippedSquares.map(s => s.y));
      const pMaxY = Math.max(...skippedSquares.map(s => s.y + s.size - 1));

      const rowStart = pMinY - layout.minY + 1;
      const colStart = pMinX - layout.minX + 1;
      const pHeight = pMaxY - pMinY + 1;
      const pWidth = pMaxX - pMinX + 1;
      const rowEnd = rowStart + pHeight;
      const colEnd = colStart + pWidth;

      const placeholderLi = document.createElement("li");
      placeholderLi.classList.add("placeholder");
      placeholderLi.style.gridArea = `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
      placeholderLi.style.background = baseColor;
      ol.appendChild(placeholderLi);
    }

    // Render requested squares with color progression
    const totalRequested = requestedSquares.length;
    requestedSquares.forEach((sq, seqIndex) => {
      let currentHue = h;
      if (totalRequested > 1) {
        let fraction: number;
        if (placeholderExists) {
          fraction = (seqIndex + 1) / (totalRequested + 1);
        } else {
          fraction = seqIndex / (totalRequested - 1);
        }
        currentHue = h + ((complementHue - h) * fraction);
        if (currentHue < 0) currentHue += 360;
        if (currentHue > 360) currentHue -= 360;
      } else {
        if (placeholderExists) {
          currentHue = h + ((complementHue - h) * 0.5);
        }
      }

      const li = document.createElement("li");
      const rowStart = sq.y - layout.minY + 1;
      const colStart = sq.x - layout.minX + 1;
      const rowEnd = rowStart + sq.size;
      const colEnd = colStart + sq.size;
      li.style.gridArea = `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
      li.style.background = hslToCss(currentHue, s, l);
      ol.appendChild(li);
    });

    gridRef.current.appendChild(ol);
  }, [inputControl]);

  return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
