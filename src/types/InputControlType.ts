export type PlacementValue = "right" | "bottom" | "left" | "top";

export interface InputControlType {
  from: number;
  to: number;
  color: string;
  clockwise: boolean;
  placement: PlacementValue;
}
