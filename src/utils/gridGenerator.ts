/**
 * Compute the effective rotation (in degrees) to pass to generateGoldenGridLayout
 * so that the first *requested* square appears at the `placement` side of the
 * placeholder (or of square[0] when nothing is skipped).
 *
 * Without any skipped squares the spiral always places square[1] to the RIGHT
 * of square[0], so a simple PLACEMENT_DEG lookup suffices.  When squares are
 * skipped the spiral has already turned (startIdx - 2) extra times before
 * reaching the first requested square, meaning the "natural" direction it would
 * arrive from differs from RIGHT.  We subtract that natural angle from the
 * desired angle so the final rotation corrects for it.
 */
export function placementToRotateDeg(
  placement: "right" | "bottom" | "left" | "top",
  clockwise: boolean,
  startIdx: number
): number {
  const PLACEMENT_DEG = { right: 0, bottom: 90, left: 180, top: 270 } as const;
  const desiredDeg = PLACEMENT_DEG[placement];

  // For startIdx 0 or 1 the first visible box is square[0] or square[1];
  // square[1] is always placed to the right of square[0] by construction.
  if (startIdx < 2) return (desiredDeg + 360) % 360;

  // From square index 2 onward, directions cycle (modulo 4).
  // CW  base order:  bottom(90) → left(180) → top(270) → right(0)
  // CCW base order:  top(270)   → left(180) → bottom(90) → right(0)
  const cwNatural  = [90, 180, 270, 0] as const;
  const ccwNatural = [270, 180, 90, 0] as const;
  const naturalDeg = (clockwise ? cwNatural : ccwNatural)[(startIdx - 2) % 4];

  return (desiredDeg - naturalDeg + 360) % 360;
}

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
