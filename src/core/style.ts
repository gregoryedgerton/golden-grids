import type { FillColor } from "../utils/renderModel";
import { hslToCss } from "../utils/colorUtils";

/** Normalised 0..1 coordinate → a percentage string accepted by both CSS
 *  (`left: "50%"`) and React Native (`left: "50%"`). */
export const pct = (n: number): string => `${n * 100}%`;

/** Resolve a platform-neutral fill into a colour string (or undefined to omit).
 *  `hsl(...)` and hex strings are valid in both CSS `background` and RN
 *  `backgroundColor`, so the same value works on every renderer. */
export function fillToCss(color: FillColor): string | undefined {
  if (!color) return undefined;
  return color.kind === "hsl" ? hslToCss(color.h, color.s, color.l) : color.value;
}
