import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const GridContext = createContext({
    inputControl: {
        first: 1,
        last: 3,
        color: "#7f7ec7",
        mirror: true,
        rotate: 180,
    },
    setInputControl: () => { }
});
export const GridProvider = ({ children }) => {
    if (!children)
        return _jsx(_Fragment, {});
    const [inputControl, setInputControl] = useState({
        first: 1,
        last: 3,
        color: "#7f7ec7",
        mirror: true,
        rotate: 180,
    });
    return (_jsx(GridContext.Provider, Object.assign({ value: { inputControl, setInputControl } }, { children: children })));
};
export const useGrid = () => {
    const context = useContext(GridContext);
    if (!context) {
        throw new Error("useGrid must be used within a GridProvider");
    }
    return context;
};
