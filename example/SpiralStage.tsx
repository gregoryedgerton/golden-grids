import React, { useEffect, useRef, useState } from "react";
import { spiralCamera, spiralWindow } from "../src/utils/spiralCamera";
import type { GridLayout } from "../src/utils/gridGenerator";
import { getLabel } from "./labelUtils";
import type { LabelMode } from "./labelUtils";

interface Props {
  layout: GridLayout;
  depth: number;
  /** Must match the handedness the layout was built with — the camera's
   * rotation sign exists to cancel the layout's own quarter-turns. */
  clockwise: boolean;
  /** First VISIBLE square (the flat mode's skipped range). The dial floors
   * at the smallest visible square, and skipped interior squares render
   * unlabeled — they are the placeholder region, seen from inside. */
  startIdx: number;
  /** CSS fill per layout square index — the flat renderer's own progression
   * (see fillsForSpiral), so the dial previews the export's exact colours. */
  fills: Array<string | undefined>;
  outline?: string;
  labelMode: LabelMode;
  labelColor: string;
}

/**
 * Every square renders into the same fixed-size texture box and carries its
 * FULL camera-composed transform — camera ∘ placement, flat, per square.
 * There is deliberately no transform on a shared stage layer: the deepest
 * squares are 1px in layout units, and one camera scale above them forces the
 * browser to rasterize that 1px box (where even a hairline border floors to a
 * device pixel and paints the whole square black) and then upscale it
 * hundreds of times. Composed per square the net raster scale stays near 1,
 * so fills, borders and labels all render at native resolution — the exact
 * fix the production dial (gregoryedgerton.com/projects) proved first.
 */
const TEXTURE_PX = 512;

export const SpiralStage: React.FC<Props> = ({
  layout,
  depth,
  clockwise,
  startIdx,
  fills,
  outline,
  labelMode,
  labelColor,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () =>
      setSize({ width: host.clientWidth, height: host.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const count = layout.squares.length;
  // The dial floors at the smallest VISIBLE square: skipped leading squares
  // are the flat mode's placeholder region and are not destinations.
  const maxDepth = count - 1 - startIdx;
  const clamped = Math.min(depth, maxDepth);
  const rendered = layout.squares.map(
    (_square, index) => !spiralWindow(index, clamped, count).hidden
  );
  const frame =
    size.width > 0 && size.height > 0
      ? spiralCamera(layout, clamped, size.width, size.height, { clockwise })
      : null;

  return (
    <div ref={hostRef} className="spiral-stage">
      {frame &&
        layout.squares.map((square, index) => {
          const window = spiralWindow(index, clamped, count);
          if (window.hidden) return null;
          const fill = fills[index];
          // Net texture scale for this square — what one texture pixel spans
          // on screen. Border and label sizes divide by it so they render at
          // their authored screen size regardless of the zoom.
          const netScale = (frame.scale * square.size) / TEXTURE_PX;
          // The flat renderer's shared-edge rule, in layout space: every
          // square draws right+bottom, and top/left belong to the neighbour
          // across the edge — so a shared edge carries ONE line and the dial
          // previews the exported outline thickness. Unlike the flat grid,
          // the window can HIDE that owner, so a visible square also paints
          // its own top/left when any square across the edge is not rendered
          // (or the edge is the layout boundary — layout.minX/minY, not
          // zero: rotated layouts keep negative coordinates). Where an edge
          // is split between a visible and a hidden neighbour this doubles
          // the visible segment briefly; an unpainted edge on the focused
          // tile reads far worse.
          const scaled = outline ? scaleOutline(outline, netScale) : undefined;
          const borders = scaled
            ? {
                borderRight: scaled,
                borderBottom: scaled,
                borderTop: edgeExposed(layout, rendered, index, "top") ? scaled : undefined,
                borderLeft: edgeExposed(layout, rendered, index, "left") ? scaled : undefined,
              }
            : undefined;
          const transform =
            `translate(${size.width / 2}px, ${size.height / 2}px) ` +
            `rotate(${frame.rotationDeg}deg) scale(${frame.scale}) ` +
            `translate(${square.x - frame.centerX}px, ${square.y - frame.centerY}px) ` +
            `scale(${square.size / TEXTURE_PX})`;
          return (
            <div
              key={index}
              className={`spiral-stage__square${window.focused ? " spiral-stage__square--focused" : ""}`}
              style={{
                width: TEXTURE_PX,
                height: TEXTURE_PX,
                transform,
                background: fill,
                ...borders,
                opacity: window.opacity,
              }}
            >
              {labelMode !== "NOTHING" && index >= startIdx && (
                <span
                  className="spiral-stage__label"
                  style={{ color: labelColor, fontSize: TEXTURE_PX * 0.22 }}
                >
                  {getLabel(labelFor(index, count, startIdx), labelMode)}.
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
};

/**
 * Rewrite an outline's px width for a square's net texture scale, so the
 * border renders at its authored screen thickness at any zoom.
 */
export function scaleOutline(outline: string, netScale: number): string {
  return outline.replace(/^(\d+(?:\.\d+)?)px/, (_match, width) => `${parseFloat(width) / netScale}px`);
}

/**
 * The flat renderer's label for a square: largest = 1 descending without a
 * skipped range, and the flat mode's ascending-with-placeholder order
 * (placeholder 1, smallest visible 2, … largest visible = boxCount) when the
 * range skips — so toggling modes never renumbers a box.
 */
export function labelFor(index: number, count: number, startIdx: number): number {
  if (startIdx === 0) return count - index;
  return 2 + (index - startIdx);
}

/**
 * Whether a square's top/left edge needs its own line: true when any part of
 * that edge is NOT covered by a rendered neighbour's owning border (the
 * neighbour across it draws right/bottom). Covers the layout boundary for
 * free — nothing sits across it.
 */
export function edgeExposed(
  layout: GridLayout,
  rendered: boolean[],
  index: number,
  side: "top" | "left"
): boolean {
  const square = layout.squares[index];
  return layout.squares.some((other, otherIndex) => {
    if (otherIndex === index || rendered[otherIndex]) return false;
    return side === "top"
      ? other.y + other.size === square.y &&
          other.x < square.x + square.size &&
          other.x + other.size > square.x
      : other.x + other.size === square.x &&
          other.y < square.y + square.size &&
          other.y + other.size > square.y;
  }) || !layout.squares.some((other, otherIndex) => {
    if (otherIndex === index) return false;
    return side === "top"
      ? other.y + other.size === square.y &&
          other.x < square.x + square.size &&
          other.x + other.size > square.x
      : other.x + other.size === square.x &&
          other.y < square.y + square.size &&
          other.y + other.size > square.y;
  });
}
