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
   * Generate Fibonacci sequence up to the max value.
   */
  export function fibonacciUpTo(max: number): number[] {
    const sequence: number[] = [];
    let a = 1, b = 1;
    while (a <= max) {
      sequence.push(a);
      [a, b] = [b, a + b];
    }
    return sequence;
  }
  
  /**
   * Generate the golden spiral layout with tight bounding box.
   */
  export function generateGoldenGridLayout(
    sequence: number[],
    mirror: boolean,
    rotate: number
  ): GridLayout {
    const squares: Square[] = [];
  
    if (sequence.length === 0) return { squares: [], width: 0, height: 0, minX: 0, minY: 0 };
  
    let x = 0, y = 0;
    let direction = 0; // 0 = right, 1 = down, 2 = left, 3 = up
  
    sequence.forEach(size => {
      squares.push({ x, y, size });
  
      switch (direction) {
        case 0: x += size; break; // Right
        case 1: y += size; break; // Down
        case 2: x -= size; break; // Left
        case 3: y -= size; break; // Up
      }
  
      direction = (direction + 1) % 4;
    });
  
    // Get bounding box
    const minX = Math.min(...squares.map(sq => sq.x));
    const minY = Math.min(...squares.map(sq => sq.y));
    const maxX = Math.max(...squares.map(sq => sq.x + sq.size));
    const maxY = Math.max(...squares.map(sq => sq.y + sq.size));
  
    // Offset squares to remove negative coordinates
    squares.forEach(sq => {
      sq.x -= minX;
      sq.y -= minY;
    });
  
    let width = maxX - minX;
    let height = maxY - minY;
  
    // Mirror (flip horizontally)
    if (mirror) {
      squares.forEach(sq => {
        sq.x = width - sq.x - sq.size;
      });
    }
  
    // Rotation (around center)
    if (rotate !== 0) {
      const angle = (rotate * Math.PI) / 180;
      const centerX = width / 2;
      const centerY = height / 2;
  
      squares.forEach(sq => {
        const relX = sq.x + sq.size / 2 - centerX;
        const relY = sq.y + sq.size / 2 - centerY;
  
        const rotatedX = relX * Math.cos(angle) - relY * Math.sin(angle);
        const rotatedY = relX * Math.sin(angle) + relY * Math.cos(angle);
  
        sq.x = rotatedX + centerX - sq.size / 2;
        sq.y = rotatedY + centerY - sq.size / 2;
      });
  
      if (rotate % 180 !== 0) {
        [width, height] = [height, width];
      }
    }
  
    return {
      squares,
      width,
      height,
      minX: 0,
      minY: 0,
    };
  }
  