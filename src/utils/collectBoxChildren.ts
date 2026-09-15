import React from "react";

// Keep the environment check available to consumer bundlers without requiring
// Node types in the native declaration build.
declare const process: { env: { NODE_ENV?: string } };

function childName(child: React.ReactNode): string {
  if (!React.isValidElement(child)) return typeof child;
  const type = child.type;
  if (type === React.Fragment) return "React.Fragment";
  if (typeof type === "string") return type;
  const component = type as { displayName?: string; name?: string };
  return component.displayName || component.name || "anonymous component";
}

/** Collect only direct GoldenBox children, preserving React's existing keys. */
export function collectBoxChildren<P>(
  children: React.ReactNode,
  Box: React.ComponentType<P>
): React.ReactElement<P>[] {
  const discarded: string[] = [];
  const boxes = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<P> => {
      if (React.isValidElement(child) && child.type === Box) return true;
      if (process.env.NODE_ENV !== "production") discarded.push(childName(child));
      return false;
    }
  );
  if (process.env.NODE_ENV !== "production" && discarded.length) {
    console.warn(
      `GoldenGrid only accepts direct GoldenBox children. Discarded: ${discarded.join(", ")}.`
    );
  }
  return boxes;
}
