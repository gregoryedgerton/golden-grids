import * as React from "react";
import { createContext, useContext, useState, ReactNode } from "react";
import { InputControlType } from "../types/InputControlType";

interface GridContextProps {
    inputControl: InputControlType;
    setInputControl: (control: InputControlType) => void;
}

const GridContext = createContext<GridContextProps>({
    inputControl: {
        first: 1,
        last: 5,
        color: "#7f7ec7",
        mirror: true,
        rotate: 180,
    },
    setInputControl: () => {}
});

export const GridProvider: React.FC<{ children?: React.ReactNode }> = ({ children }): React.ReactElement => {
    if (!children) return <></>;
    const [inputControl, setInputControl] = useState<InputControlType>({
        first: 1,
        last: 3,
        color: "#7f7ec7",
        mirror: true,
        rotate: 180,
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