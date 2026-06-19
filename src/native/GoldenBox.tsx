import React from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

export interface GoldenBoxProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** React Native slot marker — fills 100% of its positioned parent. */
export const GoldenBox: React.FC<GoldenBoxProps> = ({ children, style }) => (
  <View style={[{ width: "100%", height: "100%" }, style]}>{children}</View>
);
