import React, { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout, fibonacciUpTo } from "../utils/gridGenerator";
import { generateHarmonicPalette } from "../utils/colorUtils";
import "../styles/golden-grid.css";

function isValidFibonacci(num: number): boolean {
  if (num <= 0) return false;
  let a = 1, b = 1;
  while (b < num) {
    [a, b] = [b, a + b];
  }
  return b === num;
}

const GoldenGrid: React.FC = (): React.ReactElement<any> => {
  const { inputControl } = useGrid();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      const { first, last, mirror, rotate, color } = inputControl;

      if (!isValidFibonacci(first) || !isValidFibonacci(last)) {
        alert("Please enter valid Fibonacci numbers greater than 0.");
        return;
      }

      console.log("🔵 useEffect Triggered! Input Control:", inputControl);

      const fullSequence = fibonacciUpTo(Math.max(first, last));
      console.log("✅ Full Fibonacci Sequence:", fullSequence);

      const userSequence = fullSequence.filter(n => n >= Math.min(first, last) && n <= Math.max(first, last));
      console.log("✅ User Sequence:", userSequence);

      const layout = generateGoldenGridLayout(fullSequence, mirror, rotate);
      console.log("✅ Generated Grid Layout:", layout);

      const colorPalette = generateHarmonicPalette(color, layout.squares.length);
      console.log("🎨 Generated Color Palette:", colorPalette);

      gridRef.current.innerHTML = "";
      const ol = document.createElement("ol");
      ol.style.gridTemplateColumns = `repeat(${layout.width}, 1fr)`;
      ol.style.gridTemplateRows = `repeat(${layout.height}, 1fr)`;

      const skippedSquares = layout.squares.filter(sq => sq.size < first);
      if (skippedSquares.length > 0) {
        const minX = Math.min(...skippedSquares.map(sq => sq.x));
        const minY = Math.min(...skippedSquares.map(sq => sq.y));
        const maxX = Math.max(...skippedSquares.map(sq => sq.x + sq.size));
        const maxY = Math.max(...skippedSquares.map(sq => sq.y + sq.size));

        const placeholderLi = document.createElement("li");
        placeholderLi.classList.add("placeholder");
        placeholderLi.style.gridArea = `${minY + 1} / ${minX + 1} / ${maxY + 1} / ${maxX + 1}`;
        placeholderLi.style.backgroundColor = colorPalette[0];

        console.log(`🟡 Rendering Placeholder Block from (${minX}, ${minY}) to (${maxX}, ${maxY})`);
        ol.appendChild(placeholderLi);
      }

      layout.squares.forEach((sq, index) => {
        if (sq.size < first) return;

        const li = document.createElement("li");
        li.style.gridArea = `${sq.y + 1} / ${sq.x + 1} / span ${sq.size} / span ${sq.size}`;
        li.style.backgroundColor = colorPalette[index];

        console.log(`🟢 Rendering Box - Size: ${sq.size}, X: ${sq.x}, Y: ${sq.y}`);
        ol.appendChild(li);
      });

      gridRef.current.appendChild(ol);
    }
  }, [inputControl]);

  return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
