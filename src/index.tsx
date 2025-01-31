import React from 'react';
import ReactDOM from 'react-dom';
import { GridProvider } from './context/GridContext';
import GoldenGrid from './components/GoldenGrid';
import './styles/golden-grid.css';

const userSequence = {
    width: 5,
    height: 5,
    squares: [
        { x: 0, y: 0, size: 1 },
        { x: 1, y: 1, size: 2 },
        // Add more squares as needed
    ],
};

ReactDOM.render(
    <GridProvider>
        <GoldenGrid userSequence={userSequence} />
    </GridProvider>,
    document.getElementById('root')
);