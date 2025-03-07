import React from "react";
import { createRoot } from "react-dom/client";
import { GridProvider, useGrid } from "../context/GridContext";
import { GoldenGrid } from "..";
import "../styles/golden-grid.css";

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
                        <input
                            type="number"
                            value={inputControl.first}
                            onChange={(e) => setInputControl({ ...inputControl, first: Number(e.target.value) })}
                        />
                    </label>

                    <label>
                        Last Number:
                        <input
                            type="number"
                            value={inputControl.last}
                            onChange={(e) => setInputControl({ ...inputControl, last: Number(e.target.value) })}
                        />
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
