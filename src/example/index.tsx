import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { GridProvider, useGrid } from "../context/GridContext";
import { GoldenGrid } from "..";
import "../styles/golden-grid.css";

const ExampleApp = () => {
    const { inputControl, setInputControl } = useGrid(); // Use context instead of userSequence

    return (
        <div>
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
