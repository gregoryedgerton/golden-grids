import * as React from "react";
import { createContext, useContext, useState, ReactNode } from "react";
import { InputControlType } from "../types/InputControlType";
import { FIB_STOPS } from "../utils/fibonacci";

interface GridContextProps {
  inputControl: InputControlType;
  setInputControl: (control: InputControlType) => void;
}

const GridContext = createContext<GridContextProps>({
  inputControl: {
    from: 1,
    to: 1,
    color: "#7f7ec7",
    clockwise: true,
    rotate: 0,
  },
  setInputControl: () => {},
});

export const GridProvider: React.FC<{ children?: React.ReactNode; initialConfig?: Partial<InputControlType> }> = ({ children, initialConfig }): React.ReactElement => {
  if (!children) return <></>;

  const [inputControl, setInputControl] = useState<InputControlType>({
    from: 1,
    to: 4,
    color: "#7f7ec7",
    clockwise: true,
    rotate: 0,
    ...initialConfig,
  });

  const validatedSetInputControl = (control: InputControlType) => {
    const { from, to } = control;

    if (from < 0 || from >= FIB_STOPS.length || to < 0 || to >= FIB_STOPS.length) {
      return;
    }
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return;
    }

    setInputControl(control);
  };

  return (
    <GridContext.Provider value={{ inputControl, setInputControl: validatedSetInputControl }}>
      {children}
    </GridContext.Provider>
  );
};

export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error("useGrid must be used within a GridProvider");
  }
  return context;
};
