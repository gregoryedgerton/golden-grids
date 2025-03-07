import React, { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout, fibonacciUpTo } from "../utils/gridGenerator";
import { generateHarmonicPalette } from "../utils/colorUtils";
import "../styles/golden-grid.css";

const GoldenGrid: React.FC = (): React.ReactElement<any> => {
    const { inputControl } = useGrid();
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (gridRef.current) {
            const { first, last, mirror, rotate, color } = inputControl;

            console.log("🔵 useEffect Triggered! Input Control:", inputControl);

            // Full Fibonacci sequence from 1 up to the 'last' value
            const fullSequence = fibonacciUpTo(last);
            console.log("✅ Full Fibonacci Sequence:", fullSequence);

            // User's active selection range
            const userSequence = fullSequence.filter(n => n >= first && n <= last);
            console.log("✅ Fixed User Sequence:", userSequence);

            // Skipped numbers for placeholders
            const skippedSquares = fullSequence.filter(n => n < first);
            console.log("🟡 Skipped Squares:", skippedSquares);

            // Build grid layout with the full sequence
            const layout = generateGoldenGridLayout(fullSequence, mirror, rotate);
            console.log("✅ Generated Grid Layout:", layout);

            // Generate harmonic color palette
            const colorPalette = generateHarmonicPalette(color, layout.squares.length);
            console.log("🎨 Generated Color Palette:", colorPalette);

            gridRef.current.innerHTML = "";
            const ol = document.createElement("ol");
            ol.style.gridTemplateColumns = `repeat(${layout.width}, 1fr)`;
            ol.style.gridTemplateRows = `repeat(${layout.height}, 1fr)`;

            layout.squares.forEach((sq, index) => {
                const li = document.createElement("li");
                li.style.gridArea = `${sq.y + 1} / ${sq.x + 1} / span ${sq.size} / span ${sq.size}`;

                const color = colorPalette[index];
                li.style.backgroundColor = color;

                if (sq.size < first) {
                    console.log(`🟡 Placeholder - Size: ${sq.size}, X: ${sq.x}, Y: ${sq.y}`);
                    li.classList.add("placeholder");
                } else {
                    console.log(`🟢 Rendering Box - Size: ${sq.size}, X: ${sq.x}, Y: ${sq.y}`);
                }

                ol.appendChild(li);
            });

            gridRef.current.appendChild(ol);
        }
    }, [inputControl]);

    return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
