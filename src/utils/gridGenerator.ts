interface GridSquare {
  size: number;
  x: number;
  y: number;
}

interface GridSquare {
  size: number;
  x: number;
  y: number;
}

export function generateGoldenGridLayout(
  fibSequence: number[],
  mirror: boolean = false,
  rotate: number = 0
): { squares: GridSquare[]; width: number; height: number; minX: number; minY: number } {
  if (fibSequence.length < 2) {
      throw new Error("Need at least two numbers in the sequence.");
  }

  const validRotations = [0, 90, 180, 270];
  if (!validRotations.includes(rotate)) {
      throw new Error(`Invalid rotation value: ${rotate}. Only 0, 90, 180, and 270 are allowed.`);
  }

  const squares: GridSquare[] = [];
  squares.push({ size: fibSequence[0], x: 0, y: 0 });
  squares.push({ size: fibSequence[1], x: fibSequence[0], y: 0 });

  const directions = [
      { dx: 0, dy: 1 }, // bottom
      { dx: -1, dy: 0 }, // left
      { dx: 0, dy: -1 }, // top
      { dx: 1, dy: 0 }   // right
  ];
  let dirIndex = 0;

  function updateBounds() {
      const minX = Math.min(...squares.map(s => s.x));
      const maxX = Math.max(...squares.map(s => s.x + s.size - 1));
      const minY = Math.min(...squares.map(s => s.y));
      const maxY = Math.max(...squares.map(s => s.y + s.size - 1));

      return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }

  for (let i = 2; i < fibSequence.length; i++) {
      console.log(`🟢 Adding square size: ${fibSequence[i]}`);
      const size = fibSequence[i];
      const d = directions[dirIndex];

      let xPos: number, yPos: number;
      if (d.dx === 0 && d.dy === 1) {
          xPos = squares[squares.length - 1].x;
          yPos = squares[squares.length - 1].y + squares[squares.length - 1].size;
      } else if (d.dx === -1 && d.dy === 0) {
          xPos = squares[squares.length - 1].x - size;
          yPos = squares[squares.length - 1].y;
      } else if (d.dx === 0 && d.dy === -1) {
          xPos = squares[squares.length - 1].x;
          yPos = squares[squares.length - 1].y - size;
      } else {
          xPos = squares[squares.length - 1].x + squares[squares.length - 1].size;
          yPos = squares[squares.length - 1].y;
      }

      // ✅ Prevent Overlapping
      if (!squares.some(sq => sq.x === xPos && sq.y === yPos)) {
          squares.push({ size, x: xPos, y: yPos });
      } else {
          console.warn(`Skipping overlapping square at ${xPos},${yPos}`);
      }

      dirIndex = (dirIndex + 1) % directions.length;
  }

  const layout = updateBounds();

  return {
      squares,
      width: layout.width,
      height: layout.height,
      minX: layout.minX,
      minY: layout.minY
  };
}

