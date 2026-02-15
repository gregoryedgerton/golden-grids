import React, { useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GridProvider, useGrid } from "../context/GridContext";
import { GoldenGrid } from "..";
import { generateGridHTML } from "../utils/exportGrid";
import { buildUserSequenceFromBounds, fullFibonacciUpTo } from "../utils/fibonacci";
import "../styles/golden-grid.css";

const DIAL_STOPS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
const PIXELS_PER_STEP = 72;

function fibToDialIndex(value: number): number {
    const idx = DIAL_STOPS.indexOf(value);
    return idx === -1 ? 0 : idx;
}

interface FibDialProps {
    value: number;
    onChange: (n: number) => void;
    label: string;
}

const FibDial: React.FC<FibDialProps> = ({ value, onChange, label }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [knurlOffset, setKnurlOffset] = useState(0);
    const isDraggingRef = useRef(false);
    const dragStartX = useRef(0);
    const dragStartIndex = useRef(0);
    const currentIndex = useRef(fibToDialIndex(value));
    const pointerIdRef = useRef<number | null>(null);

    // Keep ref in sync when value changes externally
    currentIndex.current = fibToDialIndex(value);

    const endDrag = useCallback((el?: HTMLElement) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        setKnurlOffset(0);
        if (el && pointerIdRef.current !== null) {
            try { el.releasePointerCapture(pointerIdRef.current); } catch {}
        }
        pointerIdRef.current = null;
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
        isDraggingRef.current = true;
        setIsDragging(true);
        dragStartX.current = e.clientX;
        dragStartIndex.current = currentIndex.current;
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartX.current;
        setKnurlOffset(dx);

        const stepsDelta = Math.round(dx / PIXELS_PER_STEP);
        const newIndex = Math.max(0, Math.min(DIAL_STOPS.length - 1, dragStartIndex.current - stepsDelta));
        if (newIndex !== currentIndex.current) {
            currentIndex.current = newIndex;
            onChange(DIAL_STOPS[newIndex]);
        }
    }, [onChange]);

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        endDrag(e.currentTarget);
    }, [endDrag]);

    const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        endDrag(e.currentTarget);
    }, [endDrag]);

    const onLostPointerCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        endDrag(e.currentTarget);
    }, [endDrag]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        const idx = fibToDialIndex(value);
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            if (idx < DIAL_STOPS.length - 1) onChange(DIAL_STOPS[idx + 1]);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            if (idx > 0) onChange(DIAL_STOPS[idx - 1]);
        }
    }, [value, onChange]);

    return (
        <div className="dial-control">
            <span className="dial-label">{label}</span>
            <span className="dial-value">{value}</span>
            <div
                className={`dial-strip${isDragging ? " dial-strip--grabbing" : ""}`}
                role="slider"
                tabIndex={0}
                aria-valuenow={value}
                aria-valuemin={DIAL_STOPS[0]}
                aria-valuemax={DIAL_STOPS[DIAL_STOPS.length - 1]}
                aria-label={label}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onLostPointerCapture={onLostPointerCapture}
                onKeyDown={onKeyDown}
                style={{ backgroundPosition: `${knurlOffset}px 0, 0 0` }}
            >
                <div className="dial-indicator" />
            </div>
        </div>
    );
};

const ExampleApp = () => {
    const { inputControl, setInputControl } = useGrid();
    const [showExport, setShowExport] = useState(false);
    const [copyLabel, setCopyLabel] = useState("Copy");

    const start = Math.min(inputControl.from, inputControl.to);
    const end = Math.max(inputControl.from, inputControl.to);
    const userSequence = buildUserSequenceFromBounds(start, end);
    const fullSequence = fullFibonacciUpTo(Math.max(...userSequence));
    const skippedCount = fullSequence.length - userSequence.length;
    const squareCount = userSequence.length + (skippedCount > 0 ? 1 : 0);

    const html = showExport
        ? generateGridHTML(
              inputControl.from,
              inputControl.to,
              inputControl.color,
              inputControl.mirror,
              inputControl.rotate
          )
        : "";

    const handleCopy = () => {
        navigator.clipboard.writeText(html).then(() => {
            setCopyLabel("Copied!");
            setTimeout(() => setCopyLabel("Copy"), 1500);
        });
    };

    const handleDownload = () => {
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "golden-grid.html";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <header className="control-panel">
                <h1>Make a Golden Grid</h1>
                <p>Get started by entering a valid Fibonacci sequence.</p>
                <div className="controls">
                    <FibDial label="From" value={inputControl.from}
                        onChange={(n) => setInputControl({ ...inputControl, from: n })} />
                    <FibDial label="To" value={inputControl.to}
                        onChange={(n) => setInputControl({ ...inputControl, to: n })} />

                    <span className="square-count">
                        {squareCount} {squareCount === 1 ? "square" : "squares"}
                    </span>

                    <label className="color-control">
                        Color
                        <input
                            type="color"
                            value={inputControl.color}
                            onChange={(e) => setInputControl({ ...inputControl, color: e.target.value })}
                        />
                    </label>

                    <button onClick={() => setInputControl({ ...inputControl, mirror: !inputControl.mirror })}>
                        MIRROR [{inputControl.mirror ? "true" : "false"}]
                    </button>

                    <button onClick={() => setInputControl({ ...inputControl, rotate: (inputControl.rotate + 90) % 360 })}>
                        ROTATION [{inputControl.rotate}°]
                    </button>

                    <button onClick={() => setShowExport(true)}>
                        EXPORT
                    </button>
                </div>
            </header>

            <GoldenGrid />

            {showExport && (
                <div className="export-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowExport(false); }}>
                    <div className="export-modal">
                        <textarea
                            readOnly
                            value={html}
                            onFocus={(e) => e.currentTarget.select()}
                        />
                        <div className="export-modal-actions">
                            <button onClick={handleCopy}>{copyLabel}</button>
                            <button onClick={handleDownload}>Download</button>
                            <button onClick={() => setShowExport(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(
    <GridProvider>
        <ExampleApp />
    </GridProvider>
);
