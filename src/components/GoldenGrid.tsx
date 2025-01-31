import React, { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import { buildUserSequenceFromBounds } from "../utils/fibonacci";
import "../styles/golden-grid.css";

const GoldenGrid: React.FC = () => {
    const { inputControl } = useGrid(); // Get configuration from context
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (gridRef.current) {
            console.log("Grid Updated with:", inputControl);

            
            const { first, last, mirror, rotate } = inputControl;
            const sequence = buildUserSequenceFromBounds(first, last);
            console.log("Generated Fibonacci Sequence:", sequence); // ✅ Debugging log
            const layout = generateGoldenGridLayout(sequence, mirror, rotate);

            gridRef.current.innerHTML = "";
            const ol = document.createElement("ol");
            ol.style.gridTemplateColumns = `repeat(${layout.width}, 1fr)`;
            ol.style.gridTemplateRows = `repeat(${layout.height}, 1fr)`;

            layout.squares.forEach((sq) => {
                const li = document.createElement("li");
                li.style.gridArea = `${sq.y + 1} / ${sq.x + 1} / span ${sq.size} / span ${sq.size}`;
                ol.appendChild(li);
            });

            gridRef.current.appendChild(ol);
        }
    }, [inputControl]); // React when inputControl changes

    return <div ref={gridRef} className="grid-container"></div>;
};

export default GoldenGrid;
