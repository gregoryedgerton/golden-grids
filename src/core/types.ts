import type React from "react";
import type { PlacementValue } from "../utils/renderModel";

// Public props for the grid component. Platform-neutral by design — no CSS or
// DOM types — so the web and React Native renderers share one definition.
export interface GoldenGridProps {
  from?: number;
  to?: number;
  color?: string;
  clockwise?: boolean;
  placement?: PlacementValue;
  outline?: string; // CSS border shorthand e.g. "2px dashed #ff0000"
  children?: React.ReactNode;
}
