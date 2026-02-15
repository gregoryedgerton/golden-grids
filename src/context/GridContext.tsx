import * as React from "react";
import { createContext, useContext, useState, ReactNode } from "react";
import { InputControlType } from "../types/InputControlType";

function isValidFibonacci(num: number): boolean {
  if (num <= 0) return false;
  let a = 1, b = 1;
  while (b < num) {
    [a, b] = [b, a + b];
  }
  return b === num;
}

interface GridContextProps {
  inputControl: InputControlType;
  setInputControl: (control: InputControlType) => void;
}

const GridContext = createContext<GridContextProps>({
  inputControl: {
    from: 1,
    to: 1,
    color: "#7f7ec7",
    mirror: false,
    rotate: 0,
  },
  setInputControl: () => {},
});

export const GridProvider: React.FC<{ children?: React.ReactNode }> = ({ children }): React.ReactElement => {
  if (!children) return <></>;

  const [inputControl, setInputControl] = useState<InputControlType>({
    from: 1,
    to: 3,
    color: "#7f7ec7",
    mirror: false,
    rotate: 0,
  });

  const validatedSetInputControl = (control: InputControlType) => {
    const { from, to } = control;

    if (!isValidFibonacci(from) || !isValidFibonacci(to)) {
      return;
    }

    if (from === to && from !== 1) {
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
