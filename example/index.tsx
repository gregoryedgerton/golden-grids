import React, { useState, useRef, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { GoldenGrid, GoldenBox } from "@gifcommit/golden-grids";
import { GridProvider, useGrid } from "./GridContext";
import type { InputControlType } from "./GridContext";
import { generateGridHTML } from "./exportGrid";
import { FIB_STOPS, getGridRange, fullFibonacciUpTo } from "../src/utils/fibonacci";
import { generateGoldenGridLayout, placementToRotateDeg } from "../src/utils/gridGenerator";
import "./golden-grid.css";
import { LabelMode, LABEL_MODES, getLabel } from "./labelUtils";

const FIB_INDEX_STOPS = FIB_STOPS.map((_: number, i: number) => i);
const PLACEMENT_STOPS = ["right", "bottom", "left", "top"] as const;
const OUTLINE_STYLES = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
const OUTLINE_WIDTH_STOPS = [1, 2, 3, 4, 5, 6, 7, 8];

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
    const [panelOpen, setPanelOpen] = useState(false);
    const [copyLabel, setCopyLabel] = useState("Copy");
    const [useOutline, setUseOutline] = useState(true);
    const [outlineWidth, setOutlineWidth] = useState(2);
    const [outlineStyle, setOutlineStyle] = useState('solid');
    const [outlineColor, setOutlineColor] = useState('#000000');
    const [useColor, setUseColor] = useState(true);
    const [labelMode, setLabelMode] = useState<LabelMode>('ROMAN NUMERALS');

    const lowerIdx = Math.min(inputControl.from, inputControl.to);
    const upperIdx = Math.max(inputControl.from, inputControl.to);
    const lowerKey = inputControl.from <= inputControl.to ? "from" : "to";
    const upperKey = lowerKey === "from" ? "to" : "from";
    const start = lowerIdx;
    const end = upperIdx;
    const range = getGridRange(start, end);
    let boxCount: number;
    let hasPlaceholder = false;
    let skippedDigits: number[] = [];
    if (!range) {
        boxCount = 0;
    } else if (range.startIdx === 0 && range.endIdx === 0) {
        boxCount = 1;
    } else {
        hasPlaceholder = range.startIdx > 0;
        skippedDigits = FIB_STOPS.slice(1, lowerIdx);
        boxCount = range.endIdx - range.startIdx + 1 + (hasPlaceholder ? 1 : 0);
    }

    const gridLayout = useMemo(() => {
        const r = getGridRange(start, end);
        if (!r || (r.startIdx === 0 && r.endIdx === 0)) return null;
        const maxVal = Math.max(...r.userSequence);
        const fullSeq = fullFibonacciUpTo(maxVal);
        const rot = placementToRotateDeg(inputControl.placement, inputControl.clockwise, r.startIdx);
        return generateGoldenGridLayout(fullSeq, inputControl.clockwise, rot);
    }, [start, end, inputControl.placement, inputControl.clockwise]);
    const gridRatioW = gridLayout ? gridLayout.width : 1;
    const gridRatioH = gridLayout ? gridLayout.height : 1;
    const panelEdge = gridRatioW >= gridRatioH ? 'top' : 'left';

    const outlineValue = `${outlineWidth}px ${outlineStyle} ${outlineColor}`;

    const baseHtml = showExport
        ? generateGridHTML(
              inputControl.from,
              inputControl.to,
              useColor ? inputControl.color : undefined,
              inputControl.clockwise,
              inputControl.placement,
              useOutline ? outlineValue : undefined
          )
        : "";

    const html = labelMode !== 'NOTHING' && baseHtml
        ? (() => {
              let counter = 0;
              const labelStyle = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:clamp(1rem,3cqw,1.5rem);pointer-events:none;color:${outlineColor};`;
              return baseHtml.replace(
                  /(<div class="golden-grid__box[^"]*"[^>]*>)<\/div>/g,
                  (_match, openTag) => `${openTag}<span style="${labelStyle}">${getLabel(++counter, labelMode)}.</span></div>`
              );
          })()
        : baseHtml;

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
            <section
                className={`grid-preview grid-preview--panel-${panelEdge}`}
                style={{ '--grid-ratio-w': gridRatioW, '--grid-ratio-h': gridRatioH } as React.CSSProperties}
            >
                <GoldenGrid
                    from={inputControl.from}
                    to={inputControl.to}
                    color={useColor ? inputControl.color : undefined}
                    clockwise={inputControl.clockwise}
                    outline={useOutline ? outlineValue : undefined}
                    placement={inputControl.placement}
                >
                    {Array.from({ length: 79 }, (_, i) => (
                        <GoldenBox key={i}>
                            {labelMode !== 'NOTHING' && (
                                <span className="box-label" style={{ color: outlineColor }}>
                                    {getLabel(i + 1, labelMode)}.
                                </span>
                            )}
                        </GoldenBox>
                    ))}
                </GoldenGrid>
            </section>

            <div className={`control-float control-float--${panelEdge}${panelOpen ? '' : ' control-float--closed'}`}>
                <div className="control-float__body">
                    <p className="mad-lib">
                        Make a Golden Grid from{" "}
                        <Dial label="From" value={inputControl.from} stops={FIB_INDEX_STOPS}
                            onChange={(n) => setInputControl({ ...inputControl, from: n })}
                            format={(idx) => String(FIB_STOPS[idx])} />
                        {" "}to{" "}
                        <Dial label="To" value={inputControl.to} stops={FIB_INDEX_STOPS}
                            onChange={(n) => setInputControl({ ...inputControl, to: n })}
                            format={(idx) => String(FIB_STOPS[idx])} />
                        , comprised of{" "}
                        <span className="mad-lib-static">{boxCount}</span>
                        {" "}{boxCount === 1 ? "box" : "boxes"} proportional to the{" "}
                        <span className="mad-lib-ordinal">
                            <input className="mad-lib-input" type="number" aria-label="Lower ordinal"
                                min={0} max={FIB_INDEX_STOPS.length - 1} value={lowerIdx}
                                onChange={(e) => {
                                    const v = Math.max(0, Math.min(FIB_INDEX_STOPS.length - 1, parseInt(e.target.value) || 0));
                                    setInputControl({ ...inputControl, [lowerKey]: v });
                                }} /><sup>{ordinalSuffix(lowerIdx)}</sup>
                        </span>
                        {" "}through{" "}
                        <span className="mad-lib-ordinal">
                            <input className="mad-lib-input" type="number" aria-label="Upper ordinal"
                                min={0} max={FIB_INDEX_STOPS.length - 1} value={upperIdx}
                                onChange={(e) => {
                                    const v = Math.max(0, Math.min(FIB_INDEX_STOPS.length - 1, parseInt(e.target.value) || 0));
                                    setInputControl({ ...inputControl, [upperKey]: v });
                                }} /><sup>{ordinalSuffix(upperIdx)}</sup>
                        </span>
                        {" "}digits of the Fibonacci sequence, rendered with{" "}
                        <button className="mad-lib-btn" onClick={() => setUseOutline(o => !o)}>
                            {useOutline ? "AN OUTLINE" : "NO OUTLINE"}
                        </button>
                        {useOutline && <>{" "}that's{" "}
                        <Dial label="Outline width" value={outlineWidth} stops={OUTLINE_WIDTH_STOPS}
                            onChange={setOutlineWidth}
                            format={(v) => `${v}px`} />
                        {" "}thick{" "}
                        <button className="mad-lib-btn" onClick={() => {
                            const idx = OUTLINE_STYLES.indexOf(outlineStyle);
                            setOutlineStyle(OUTLINE_STYLES[(idx + 1) % OUTLINE_STYLES.length]);
                        }}>{outlineStyle.toUpperCase()}</button>
                        {" "}and{" "}
                        <input className="mad-lib-color" type="color" aria-label="Outline color"
                            value={outlineColor}
                            onChange={(e) => setOutlineColor(e.target.value)} /></>}
                        {boxCount === 1 ? ", and a " : ", and "}
                        <button className="mad-lib-btn" onClick={() => setUseColor(c => !c)}>
                            {useColor ? "COLORED" : "TRANSPARENT"}
                        </button>
                        {" "}{boxCount === 1 ? "box" : "boxes"}{useColor && <>{" "}{boxCount === 1 ? "starting with" : "starting from"}{" "}
                        <input className="mad-lib-color" type="color" aria-label="Grid color"
                            value={inputControl.color}
                            onChange={(e) => setInputControl({ ...inputControl, color: e.target.value })} />
                        </>}{boxCount > 1 && <>{" "}with the second box placed to the{" "}
                        <button className="mad-lib-btn" onClick={() => {
                            const order = inputControl.clockwise ? PLACEMENT_STOPS : [...PLACEMENT_STOPS].reverse();
                            const idx = order.indexOf(inputControl.placement);
                            setInputControl({ ...inputControl, placement: order[(idx + 1) % order.length] });
                        }}>{inputControl.placement.toUpperCase()}</button>
                          {" "}and spirals{" "}
                        <button className="mad-lib-btn" onClick={() => setInputControl({ ...inputControl, clockwise: !inputControl.clockwise })}>
                            {inputControl.clockwise ? "CLOCKWISE" : "COUNTER-CLOCKWISE"}
                        </button></>}.
                        {hasPlaceholder && <>{" "}Grids that skip{" "}
                            <span className="mad-lib-static">{skippedDigits.join(", ")}</span>
                            {" "}will include a single irregular box of the combined relative proportions to keep the grid golden.</>}
                        {" "}Display{" "}
                        <button className="mad-lib-btn" onClick={() => {
                            const idx = LABEL_MODES.indexOf(labelMode);
                            setLabelMode(LABEL_MODES[(idx + 1) % LABEL_MODES.length]);
                        }}>
                            {labelMode}
                        </button>{" "}in each box from largest to smallest, and{" "}
                        <button className="mad-lib-btn" onClick={() => setShowExport(true)}>EXPORT</button>{" "}this grid.
                    </p>
                </div>
                <button
                    className="control-float__tab"
                    onClick={() => setPanelOpen(o => !o)}
                    aria-expanded={panelOpen}
                    data-action={panelOpen ? 'CLOSE' : 'OPEN'}
                    style={useOutline ? (panelEdge === 'left' ? { borderRight: outlineValue } : { borderBottom: outlineValue }) : undefined}
                >
                    {panelEdge === 'left' ? (
                        <>
                            <span className="control-float__tab-label">GOLDEN GRID GENERATOR</span>
                            <span className="control-float__tab-toggle">{panelOpen ? '−' : '+'}</span>
                        </>
                    ) : (
                        <>
                            <span>GOLDEN GRID GENERATOR</span>
                            <span className="control-float__tab-toggle">{panelOpen ? '−' : '+'}</span>
                        </>
                    )}
                </button>
            </div>

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
