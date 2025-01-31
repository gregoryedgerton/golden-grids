export interface GridSquare {
  size: number;
  x: number;
  y: number;
}

export interface GridLayout {
  squares: GridSquare[];
  width: number;
  height: number;
  minX: number;
  minY: number;
}

export function generateGoldenGridLayout(
  fibSequence: number[], mirror = false, rotate = 0
): GridLayout {
  if (fibSequence.length < 2) {
      throw new Error('Need at least two numbers in the sequence.');
  }

  const squares: GridSquare[] = [];
  squares.push({ size: fibSequence[0], x: 0, y: 0 });
  squares.push({ size: fibSequence[1], x: fibSequence[0], y: 0 });

  let dirIndex = 0;
  const directions = [
      { dx: 0, dy: 1 },  // bottom
      { dx: -1, dy: 0 }, // left
      { dx: 0, dy: -1 }, // top
      { dx: 1, dy: 0 }   // right
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