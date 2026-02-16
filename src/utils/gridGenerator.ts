export interface Square {
  x: number;
  y: number;
  size: number;
}

export interface GridLayout {
  squares: Square[];
  width: number;
  height: number;
  minX: number;
  minY: number;
}

/**
 * Generate the golden spiral layout using bounding-box placement.
 * Each new square is placed flush against the overall grid edge,
 * producing a tight Fibonacci spiral.
 */
export function generateGoldenGridLayout(
  fibSequence: number[],
  clockwise: boolean = true,
  rotate: number = 0
): GridLayout {
  if (fibSequence.length < 2) {
    throw new Error('Need at least two numbers in the sequence.');
  }

  const validRotations = [0, 90, 180, 270];
  if (!validRotations.includes(rotate)) {
    throw new Error(`Invalid rotation value: ${rotate}. Only 0, 90, 180, and 270 are allowed.`);
  }

  const squares: Square[] = [];

  // Incremental bounding box tracking
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  function expandBounds(sq: Square) {
    if (sq.x < minX) minX = sq.x;
    if (sq.x + sq.size - 1 > maxX) maxX = sq.x + sq.size - 1;
    if (sq.y < minY) minY = sq.y;
    if (sq.y + sq.size - 1 > maxY) maxY = sq.y + sq.size - 1;
  }

  function recalcBounds() {
    minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
    for (const s of squares) expandBounds(s);
  }

  // Place first two squares explicitly
  squares.push({ size: fibSequence[0], x: 0, y: 0 });
  squares.push({ size: fibSequence[1], x: fibSequence[0], y: 0 });
  expandBounds(squares[0]);
  expandBounds(squares[1]);

  // CW:  bottom → left → top → right
  // CCW: top → left → bottom → right
  const directions = clockwise
    ? [{ dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }]
    : [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }];
  let dirIndex = 0;

  // Place remaining squares against the bounding box edge
  for (let i = 2; i < fibSequence.length; i++) {
    const size = fibSequence[i];
    const d = directions[dirIndex];

    let xPos: number, yPos: number;
    if (d.dx === 0 && d.dy === 1) {
      // bottom
      xPos = minX;
      yPos = maxY + 1;
    } else if (d.dx === -1 && d.dy === 0) {
      // left
      xPos = minX - size;
      yPos = maxY - size + 1;
    } else if (d.dx === 0 && d.dy === -1) {
      // top
      xPos = maxX - size + 1;
      yPos = minY - size;
    } else {
      // right
      xPos = maxX + 1;
      yPos = minY;
    }

    const sq = { size, x: xPos, y: yPos };
    squares.push(sq);
    expandBounds(sq);
    dirIndex = (dirIndex + 1) % directions.length;
  }

  // Rotate using integer coordinate swaps (no floating-point)
  if (rotate) {
    squares.forEach(square => {
      const tempX = square.x;
      const tempY = square.y;
      if (rotate === 90) {
        square.x = -tempY - square.size + 1;
        square.y = tempX;
      } else if (rotate === 180) {
        square.x = -tempX - square.size + 1;
        square.y = -tempY - square.size + 1;
      } else if (rotate === 270) {
        square.x = tempY;
        square.y = -tempX - square.size + 1;
      }
    });
    recalcBounds();
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  return { squares, width, height, minX, minY };
}
