import React from "react";

export interface GoldenBoxProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GoldenBox: React.FC<GoldenBoxProps> = ({ children, className, style }) => (
  <div
    className={className}
    style={{ width: "100%", height: "100%", position: "relative", ...style }}
  >
    {children}
  </div>
);
