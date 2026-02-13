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
  mirror: boolean = false,
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

  // Place first two squares explicitly
  squares.push({ size: fibSequence[0], x: 0, y: 0 });
  squares.push({ size: fibSequence[1], x: fibSequence[0], y: 0 });

  // Direction cycle: bottom → left → top → right
  const directions = [
    { dx: 0, dy: 1 },   // bottom
    { dx: -1, dy: 0 },  // left
    { dx: 0, dy: -1 },  // top
    { dx: 1, dy: 0 }    // right
  ];
  let dirIndex = 0;

  // Track bounding box, updated after each placement
  let minX = Math.min(...squares.map(s => s.x));
  let maxX = Math.max(...squares.map(s => s.x + s.size - 1));
  let minY = Math.min(...squares.map(s => s.y));
  let maxY = Math.max(...squares.map(s => s.y + s.size - 1));

  function updateBounds() {
    minX = Math.min(...squares.map(s => s.x));
    maxX = Math.max(...squares.map(s => s.x + s.size - 1));
    minY = Math.min(...squares.map(s => s.y));
    maxY = Math.max(...squares.map(s => s.y + s.size - 1));
  }

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

    squares.push({ size, x: xPos, y: yPos });
    updateBounds();
    dirIndex = (dirIndex + 1) % directions.length;
  }

  // Mirror (flip horizontally)
  if (mirror) {
    squares.forEach(square => {
      square.x = -square.x - square.size + 1;
    });
    updateBounds();
  }

  // Rotate using integer coordinate swaps (no floating-point)
  if (rotate) {
    squares.forEach(square => {
      const tempX = square.x;
      const tempY = square.y;
      if (rotate === 90) {
        square.x = tempY;
        square.y = -tempX - square.size + 1;
      } else if (rotate === 180) {
        square.x = -tempX - square.size + 1;
        square.y = -tempY - square.size + 1;
      } else if (rotate === 270) {
        square.x = -tempY - square.size + 1;
        square.y = tempX;
      }
    });
    updateBounds();
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  return { squares, width, height, minX, minY };
}
