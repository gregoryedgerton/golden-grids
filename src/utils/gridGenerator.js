export function generateGoldenGridLayout(fibSequence, mirror = false, rotate = 0) {
    if (fibSequence.length < 2) {
        throw new Error('Need at least two numbers in the sequence.');
    }
    const squares = [];
    squares.push({ size: fibSequence[0], x: 0, y: 0 });
    squares.push({ size: fibSequence[1], x: fibSequence[0], y: 0 });
    let dirIndex = 0;
    const directions = [
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 } // right
    ];
    for (let i = 2; i < fibSequence.length; i++) {
        const size = fibSequence[i];
        const d = directions[dirIndex];
        const lastSquare = squares[squares.length - 1];
        const xPos = lastSquare.x + d.dx * lastSquare.size;
        const yPos = lastSquare.y + d.dy * lastSquare.size;
        squares.push({ size, x: xPos, y: yPos });
        dirIndex = (dirIndex + 1) % directions.length;
    }
    return { squares, width: 0, height: 0, minX: 0, minY: 0 }; // Adjust accordingly
}
