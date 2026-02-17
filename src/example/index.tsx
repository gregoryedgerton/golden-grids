import React, { useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GridProvider, useGrid } from "../context/GridContext";
import { GoldenGrid } from "..";
import { generateGridHTML } from "../utils/exportGrid";
import { getGridRange, fullFibonacciUpTo, FIB_STOPS } from "../utils/fibonacci";
import "../styles/golden-grid.css";

const FIB_INDEX_STOPS = FIB_STOPS.map((_: number, i: number) => i);
const ROTATION_STOPS = [0, 90, 180, 270];
const ROTATION_LABELS: Record<number, string> = { 0: "RIGHT", 90: "BOTTOM", 180: "LEFT", 270: "TOP" };

function ordinalSuffix(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

const PIXELS_PER_STEP = 72;

interface DialProps {
    value: number;
    onChange: (n: number) => void;
    label: string;
    stops: number[];
    wrap?: boolean;
    format?: (v: number) => string;
    floorLabel?: string;
}

const Dial: React.FC<DialProps> = ({ value, onChange, label, stops, wrap = false, format, floorLabel }) => {
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const didDragRef = useRef(false);
    const dragStartX = useRef(0);
    const dragStartIndex = useRef(0);
    const currentIndex = useRef(stops.indexOf(value) === -1 ? 0 : stops.indexOf(value));
    const pointerIdRef = useRef<number | null>(null);

    if (stops[currentIndex.current] !== value) {
        currentIndex.current = stops.indexOf(value) === -1 ? 0 : stops.indexOf(value);
    }

    const endDrag = useCallback((el?: HTMLElement) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        if (el && pointerIdRef.current !== null) {
            try { el.releasePointerCapture(pointerIdRef.current); } catch {}
        }
        pointerIdRef.current = null;
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
        isDraggingRef.current = true;
        didDragRef.current = false;
        setIsDragging(true);
        dragStartX.current = e.clientX;
        dragStartIndex.current = currentIndex.current;
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartX.current;
        if (Math.abs(dx) > 4) didDragRef.current = true;

        const stepsDelta = Math.round(dx / PIXELS_PER_STEP);
        let newIndex: number;
        if (wrap) {
            newIndex = ((dragStartIndex.current - stepsDelta) % stops.length + stops.length) % stops.length;
        } else {
            newIndex = Math.max(0, Math.min(stops.length - 1, dragStartIndex.current - stepsDelta));
        }
        if (newIndex !== currentIndex.current) {
            currentIndex.current = newIndex;
            onChange(stops[newIndex]);
        }
    }, [onChange, stops, wrap]);

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
        const wasDrag = didDragRef.current;
        endDrag(e.currentTarget);
        if (!wasDrag) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickedRight = e.clientX >= rect.left + rect.width / 2;
            const idx = currentIndex.current;
            if (clickedRight) {
                if (wrap) {
                    onChange(stops[(idx + 1) % stops.length]);
                } else if (idx < stops.length - 1) {
                    onChange(stops[idx + 1]);
                }
            } else {
                if (wrap) {
                    onChange(stops[(idx - 1 + stops.length) % stops.length]);
                } else if (idx > 0) {
                    onChange(stops[idx - 1]);
                }
            }
        }
    }, [endDrag, onChange, stops, wrap]);

    const onPointerCancel = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
        endDrag(e.currentTarget);
    }, [endDrag]);

    const onLostPointerCapture = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
        endDrag(e.currentTarget);
    }, [endDrag]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        const idx = currentIndex.current;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            if (wrap) {
                onChange(stops[(idx + 1) % stops.length]);
            } else if (idx < stops.length - 1) {
                onChange(stops[idx + 1]);
            }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            if (wrap) {
                onChange(stops[(idx - 1 + stops.length) % stops.length]);
            } else if (idx > 0) {
                onChange(stops[idx - 1]);
            }
        }
    }, [onChange, stops, wrap]);

    const idx = currentIndex.current;
    const display = format ? format(value) : String(value);
    const fmt = (v: number) => format ? format(v) : String(v);
    const prevStop = idx > 0 ? stops[idx - 1] : (wrap ? stops[stops.length - 1] : null);
    const nextStop = idx < stops.length - 1 ? stops[idx + 1] : (wrap ? stops[0] : null);
    const prevDisplay = prevStop != null ? fmt(prevStop) : (floorLabel ?? null);
    const nextDisplay = nextStop != null ? fmt(nextStop) : null;

    return (
        <span
            className={`mad-lib-dial${isDragging ? " mad-lib-dial--grabbing" : ""}`}
            role="slider"
            tabIndex={0}
            aria-valuenow={value}
            aria-valuemin={stops[0]}
            aria-valuemax={stops[stops.length - 1]}
            aria-label={label}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onLostPointerCapture}
            onKeyDown={onKeyDown}
        >
            {prevDisplay != null && <span className="dial-neighbor dial-prev">{prevDisplay}</span>}
            {display}
            {nextDisplay != null && <span className="dial-neighbor dial-next">{nextDisplay}</span>}
        </span>
    );
};

const ExampleApp = () => {
    const { inputControl, setInputControl } = useGrid();
    const [showExport, setShowExport] = useState(false);
    const [copyLabel, setCopyLabel] = useState("Copy");

    const start = Math.min(inputControl.from, inputControl.to);
    const end = Math.max(inputControl.from, inputControl.to);
    const range = getGridRange(start, end);
    let boxCount: number;
    if (!range) {
        boxCount = 0;
    } else if (range.startIdx === 0 && range.endIdx === 0) {
        boxCount = 1;
    } else {
        boxCount = range.endIdx - range.startIdx + 1 + (range.startIdx > 0 ? 1 : 0);
    }

    const html = showExport
        ? generateGridHTML(
              inputControl.from,
              inputControl.to,
              inputControl.color,
              inputControl.clockwise,
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
                <p className="mad-lib">
                    Make a Golden Grid from{" "}
                    <Dial label="From" value={inputControl.from} stops={FIB_INDEX_STOPS}
                        onChange={(n) => setInputControl({ ...inputControl, from: n })}
                        format={(idx) => String(FIB_STOPS[idx])} />
                    {" "}to{" "}
                    <Dial label="To" value={inputControl.to} stops={FIB_INDEX_STOPS}
                        onChange={(n) => setInputControl({ ...inputControl, to: n })}
                        format={(idx) => String(FIB_STOPS[idx])} />
                    , it will be{" "}
                    <span className="mad-lib-static">{boxCount}</span>
                    {" "}{boxCount === 1 ? "box" : "boxes"} and makes use of the{" "}
                    <span className="mad-lib-ordinal">
                        <input className="mad-lib-input" type="number" aria-label="From ordinal"
                            min={0} max={FIB_INDEX_STOPS.length - 1} value={inputControl.from}
                            onChange={(e) => {
                                const v = Math.max(0, Math.min(FIB_INDEX_STOPS.length - 1, parseInt(e.target.value) || 0));
                                setInputControl({ ...inputControl, from: v });
                            }} /><sup>{ordinalSuffix(inputControl.from)}</sup>
                    </span>
                    {" "}and{" "}
                    <span className="mad-lib-ordinal">
                        <input className="mad-lib-input" type="number" aria-label="To ordinal"
                            min={0} max={FIB_INDEX_STOPS.length - 1} value={inputControl.to}
                            onChange={(e) => {
                                const v = Math.max(0, Math.min(FIB_INDEX_STOPS.length - 1, parseInt(e.target.value) || 0));
                                setInputControl({ ...inputControl, to: v });
                            }} /><sup>{ordinalSuffix(inputControl.to)}</sup>
                    </span>
                    {" "}digits in the Fibonacci sequence. The grid builds out from the{" "}
                    <button className="mad-lib-btn" onClick={() => {
                        const order = inputControl.clockwise ? ROTATION_STOPS : [...ROTATION_STOPS].reverse();
                        const idx = order.indexOf(inputControl.rotate);
                        setInputControl({ ...inputControl, rotate: order[(idx + 1) % order.length] });
                    }}>{ROTATION_LABELS[inputControl.rotate]}</button>
                    {" "}of the first box placed {""}
                    <input className="mad-lib-color" type="color" aria-label="Grid color"
                        value={inputControl.color}
                        onChange={(e) => setInputControl({ ...inputControl, color: e.target.value })} />
                      {" "}and spirals{" "}
                    <button className="mad-lib-btn" onClick={() => setInputControl({ ...inputControl, clockwise: !inputControl.clockwise })}>
                        {inputControl.clockwise ? "CLOCKWISE" : "COUNTER-CLOCKWISE"}
                    </button>. 
                    Did you know you can
                    {" "}<button className="mad-lib-btn" onClick={() => setShowExport(true)}>EXPORT</button> your grid?
                </p>
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
