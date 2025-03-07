import React, { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import { buildUserSequenceFromBounds } from "../utils/fibonacci";
import "../styles/golden-grid.css";

const GoldenGrid: React.FC = (): React.ReactElement<any> => {
    const { inputControl } = useGrid();
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("🔵 useEffect Triggered! Input Control:", inputControl);

        if (gridRef.current) {
            const { first, last, mirror, rotate } = inputControl;
            const userSequence = buildUserSequenceFromBounds(first, last);
            console.log("✅ Generated Fibonacci Sequence:", userSequence);

            if (userSequence.length < 2) {
                console.warn("No valid sequence generated for", { first, last });
                return;
            }

            const fullSequence = userSequence;
            console.log("✅ Full Fibonacci Sequence for Grid:", fullSequence);

            const layout = generateGoldenGridLayout(fullSequence, mirror, rotate);
            console.log("✅ Generated Grid Layout:", layout);

            gridRef.current.innerHTML = "";
            const ol = document.createElement("ol");
            ol.style.gridTemplateColumns = `repeat(${layout.width}, 1fr)`;
            ol.style.gridTemplateRows = `repeat(${layout.height}, 1fr)`;

            gridRef.current.appendChild(ol);

            // ✅ Placeholder Logic - Identify skipped squares
            const requestedSquares = layout.squares.filter((sq) => userSequence.includes(sq.size));
            const skippedSquares = layout.squares.filter((sq) => !userSequence.includes(sq.size));
            console.log("🟡 Skipped Squares:", skippedSquares);

            let placeholderExists = skippedSquares.length > 0;
            let placeholderColor = "#CCCCCC"; // Default placeholder color

            if (placeholderExists) {
                console.log("🟢 Rendering Placeholder");

                const minX = Math.min(...skippedSquares.map((s) => s.x));
                const maxX = Math.max(...skippedSquares.map((s) => s.x + s.size - 1));
                const minY = Math.min(...skippedSquares.map((s) => s.y));
                const maxY = Math.max(...skippedSquares.map((s) => s.y + s.size - 1));

                const rowStart = minY - layout.minY + 1;
                const colStart = minX - layout.minX + 1;
                const height = maxY - minY + 1;
                const width = maxX - minX + 1;

                const rowEnd = rowStart + height;
                const colEnd = colStart + width;

                const placeholderLi = document.createElement("li");
                placeholderLi.classList.add("placeholder");
                placeholderLi.style.gridArea = `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
                placeholderLi.style.background = placeholderColor;
                ol.appendChild(placeholderLi);
            } else {
                console.warn("⚠ No Placeholder Needed");
            }

            // ✅ Render Squares
            requestedSquares.forEach((sq) => {
                console.log(`🟢 Rendering Box - Size: ${sq.size}, X: ${sq.x}, Y: ${sq.y}`);

                const li = document.createElement("li");
                li.style.gridArea = `${sq.y + 1} / ${sq.x + 1} / span ${sq.size} / span ${sq.size}`;
                ol.appendChild(li);
            });
        }
    }, [inputControl]);

    return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
