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

            // Full Fibonacci sequence up to 'last'
            const fullSequence = fibonacciUpTo(last);
            console.log("✅ Full Fibonacci Sequence:", fullSequence);

            // User-selected active range
            const userSequence = fullSequence.filter(n => n >= first && n <= last);
            console.log("✅ Fixed User Sequence:", userSequence);

            // Build the full grid layout (now properly bounding the full spiral)
            const layout = generateGoldenGridLayout(fullSequence, mirror, rotate);
            console.log("✅ Generated Grid Layout:", layout);

            // Generate harmonic color palette
            const colorPalette = generateHarmonicPalette(color, layout.squares.length);
            console.log("🎨 Generated Color Palette:", colorPalette);

            gridRef.current.innerHTML = "";
            const ol = document.createElement("ol");
            ol.style.gridTemplateColumns = `repeat(${layout.width}, 1fr)`;
            ol.style.gridTemplateRows = `repeat(${layout.height}, 1fr)`;

            // 🔹 Identify and combine skipped squares into a single placeholder block
            const skippedSquares = layout.squares.filter(sq => sq.size < first);
            if (skippedSquares.length > 0) {
                const minX = Math.min(...skippedSquares.map(sq => sq.x));
                const minY = Math.min(...skippedSquares.map(sq => sq.y));
                const maxX = Math.max(...skippedSquares.map(sq => sq.x + sq.size));
                const maxY = Math.max(...skippedSquares.map(sq => sq.y + sq.size));

                const placeholderLi = document.createElement("li");
                placeholderLi.classList.add("placeholder");
                placeholderLi.style.gridArea = `${minY + 1} / ${minX + 1} / ${maxY + 1} / ${maxX + 1}`;
                placeholderLi.style.backgroundColor = colorPalette[0]; // or choose a neutral color

                console.log(`🟡 Rendering Placeholder Block from (${minX}, ${minY}) to (${maxX}, ${maxY})`);
                ol.appendChild(placeholderLi);
            }

            // 🔹 Render only active squares (>= first)
            layout.squares.forEach((sq, index) => {
                if (sq.size < first) return; // Skip placeholder squares

                const li = document.createElement("li");
                li.style.gridArea = `${sq.y + 1} / ${sq.x + 1} / span ${sq.size} / span ${sq.size}`;

                const color = colorPalette[index];
                li.style.backgroundColor = color;

                console.log(`🟢 Rendering Box - Size: ${sq.size}, X: ${sq.x}, Y: ${sq.y}`);
                ol.appendChild(li);
            });

            gridRef.current.appendChild(ol);
        }
    }, [inputControl]);

    return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
