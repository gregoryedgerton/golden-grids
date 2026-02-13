import React from "react";
import { createRoot } from "react-dom/client";
import { GridProvider, useGrid } from "../context/GridContext";
import { GoldenGrid } from "..";
import "../styles/golden-grid.css";

// Pre-computed Fibonacci sequence for stepping through valid values
const FIB_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];

function nextFib(current: number): number {
    const idx = FIB_SEQUENCE.indexOf(current);
    if (idx === -1 || idx >= FIB_SEQUENCE.length - 1) return current;
    // Skip the duplicate 1 at index 1
    if (idx === 0) return FIB_SEQUENCE[2];
    return FIB_SEQUENCE[idx + 1];
}

function prevFib(current: number): number {
    const idx = FIB_SEQUENCE.indexOf(current);
    if (idx <= 0) return current;
    // Skip the duplicate 1 at index 0
    if (idx === 2) return FIB_SEQUENCE[0];
    return FIB_SEQUENCE[idx - 1];
}

const ExampleApp = () => {
    const { inputControl, setInputControl } = useGrid();

    return (
        <div>
            <header className="control-panel">
                <h1>Make a Golden Grid</h1>
                <p>Get started by entering a valid Fibonacci sequence.</p>
                <div className="controls">
                    <label>
                        First Number:
                        <div className="stepper">
                            <button onClick={() => setInputControl({ ...inputControl, first: prevFib(inputControl.first) })}>-</button>
                            <span>{inputControl.first}</span>
                            <button onClick={() => setInputControl({ ...inputControl, first: nextFib(inputControl.first) })}>+</button>
                        </div>
                    </label>

                    <label>
                        Last Number:
                        <div className="stepper">
                            <button onClick={() => setInputControl({ ...inputControl, last: prevFib(inputControl.last) })}>-</button>
                            <span>{inputControl.last}</span>
                            <button onClick={() => setInputControl({ ...inputControl, last: nextFib(inputControl.last) })}>+</button>
                        </div>
                    </label>

                    <button onClick={() => setInputControl({ ...inputControl, mirror: !inputControl.mirror })}>
                        MIRROR [{inputControl.mirror ? "true" : "false"}]
                    </button>

                    <button onClick={() => setInputControl({ ...inputControl, rotate: (inputControl.rotate + 90) % 360 })}>
                        ROTATION [{inputControl.rotate}°]
                    </button>
                </div>
            </header>

            <GoldenGrid />
        </div>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(
    <GridProvider>
        <ExampleApp />
    </GridProvider>
);
