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
   * Generates the Fibonacci sequence up to the max value.
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
   * Generates the golden ratio grid layout based on the provided Fibonacci sequence.
   */
  export function generateGoldenGridLayout(
    sequence: number[],
    mirror: boolean,
    rotate: number
  ): GridLayout {
    const squares: Square[] = [];
  
    let x = 0, y = 0;
    let direction = 0; // 0 = right, 1 = down, 2 = left, 3 = up
  
    sequence.forEach((size, index) => {
      squares.push({ x, y, size });
  
      // Handle directional placement
      switch (direction) {
        case 0: // Right
          x += size;
          break;
        case 1: // Down
          y += size;
          break;
        case 2: // Left
          x -= size;
          break;
        case 3: // Up
          y -= size;
          break;
      }
  
      // Cycle directions, considering rotation
      direction = (direction + 1) % 4;
    });
  
    // Apply mirror effect (if enabled)
    if (mirror) {
      squares.forEach((sq) => {
        sq.x = -sq.x - sq.size;
      });
    }
  
    // Apply rotation (if enabled)
    // ⚠️ NOTE: Rotation effect is not yet debugged and may require matrix transforms.
    if (rotate !== 0) {
      const angle = (rotate * Math.PI) / 180;
      squares.forEach((sq) => {
        const newX = Math.round(sq.x * Math.cos(angle) - sq.y * Math.sin(angle));
        const newY = Math.round(sq.x * Math.sin(angle) + sq.y * Math.cos(angle));
        sq.x = newX;
        sq.y = newY;
      });
    }
  
    // Determine grid bounds
    const minX = Math.min(...squares.map((sq) => sq.x));
    const minY = Math.min(...squares.map((sq) => sq.y));
    const maxX = Math.max(...squares.map((sq) => sq.x + sq.size));
    const maxY = Math.max(...squares.map((sq) => sq.y + sq.size));
  
    return {
      squares,
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY,
    };
  }
  