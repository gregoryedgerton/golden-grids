import * as React from "react";
import { createContext, useContext, useState, ReactNode } from "react";

interface InputControlType {
    first: number;
    last: number;
    color: string;
    mirror: boolean;
    rotate: number;
}

interface GridContextProps {
    inputControl: InputControlType;
    setInputControl: (control: InputControlType) => void;
}

const GridContext = createContext<GridContextProps | undefined>(undefined);

export const GridProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [inputControl, setInputControl] = useState<InputControlType>({
        first: 1,
        last: 2,
        color: "#7f7ec7",
        mirror: false,
        rotate: 0,
    });

    return (
        <GridContext.Provider value={{ inputControl, setInputControl }}>
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
