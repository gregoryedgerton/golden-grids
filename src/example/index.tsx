import React from "react";
import { createRoot } from "react-dom/client";
import { GridProvider, useGrid } from "../context/GridContext";
import { GoldenGrid } from "..";
import "../styles/golden-grid.css";

const ExampleApp = () => {
    const { inputControl, setInputControl } = useGrid(); // ✅ Use state correctly

    return (
        <div>
            <header className="control-panel">
                <h1>Make a Golden Grid</h1>
                <p>Get started by entering a valid fibonacci sequence.</p>
                <div className="controls">
                    {/* ✅ Control Inputs for Updating State */}
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
                        Mirror
                    </button>

                    <button onClick={() => setInputControl({ ...inputControl, rotate: (inputControl.rotate + 90) % 360 })}>
                        Rotate
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
