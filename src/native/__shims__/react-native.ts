/**
 * Minimal `react-native` stand-in for this library's own typecheck, build, and
 * node tests — it is NOT published (only `dist` ships) and never reaches
 * consumers, who provide the real `react-native` (an optional peer dep). The
 * native build externalizes `react-native`, so this shim is dev-only.
 *
 * Only the surface the renderer touches is declared.
 */
import * as React from "react";

export type ViewStyle = Record<string, unknown>;
type RecursiveArray<T> = ReadonlyArray<T | RecursiveArray<T>>;
export type StyleProp<T> = T | RecursiveArray<T | null | undefined | false> | null | undefined;

export interface ViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const View = (props: ViewProps): React.ReactElement =>
  React.createElement("View", props as Record<string, unknown>);

export const StyleSheet = {
  create<T extends Record<string, ViewStyle>>(styles: T): T {
    return styles;
  },
};
