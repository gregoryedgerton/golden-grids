import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useGrid } from "../context/GridContext";
import { generateGoldenGridLayout } from "../utils/gridGenerator";
import "../styles/golden-grid.css";
const GoldenGrid = () => {
    const { inputControl } = useGrid();
    const gridRef = useRef(null);
    useEffect(() => {
        if (gridRef.current) {
            const { first, last, mirror, rotate } = inputControl;
            const userSequence = generateGoldenGridLayout([first, last], mirror, rotate);
            gridRef.current.innerHTML = "";
            const ol = document.createElement("ol");
            ol.style.gridTemplateColumns = `repeat(${userSequence.width}, 1fr)`;
            ol.style.gridTemplateRows = `repeat(${userSequence.height}, 1fr)`;
            userSequence.squares.forEach(sq => {
                const li = document.createElement("li");
                li.style.gridArea = `${sq.y + 1} / ${sq.x + 1} / span ${sq.size} / span ${sq.size}`;
                ol.appendChild(li);
            });
            gridRef.current.appendChild(ol);
        }
    }, [inputControl]);
    return _jsx("div", { ref: gridRef, className: "grid-container" });
};
export default GoldenGrid;
