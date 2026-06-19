import type { ReactNode } from "react";
import type { RenderModel } from "../utils/renderModel";

export interface AssignedChildren {
  /** One entry per visible slot (aligned to `model.slots`), already resolved
   *  to the correct child or `null`. */
  slotChildren: ReactNode[];
  /** The child that fills the placeholder, or `null` when there is none. */
  placeholderChild: ReactNode;
}

/**
 * Map collected GoldenBox children onto a render model's slots — the
 * platform-neutral half of the compound-component contract. The React.Children
 * *filter* stays in each renderer (it references that platform's GoldenBox), but
 * the ordering is identical everywhere: when a placeholder exists it claims the
 * last child and the visible slots draw from the rest; each slot's `childIndex`
 * (largest slot first) selects its child, with `null` when there aren't enough.
 */
export function assignChildren(model: RenderModel, allBoxChildren: ReactNode[]): AssignedChildren {
  const placeholderExists = !!model.placeholder;
  const visibleChildren = placeholderExists ? allBoxChildren.slice(0, -1) : allBoxChildren;
  const placeholderChild = placeholderExists
    ? (allBoxChildren[allBoxChildren.length - 1] ?? null)
    : null;
  const slotChildren = model.slots.map((slot) => visibleChildren[slot.childIndex] ?? null);
  return { slotChildren, placeholderChild };
}
