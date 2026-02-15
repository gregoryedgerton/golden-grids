import { buildUserSequenceFromBounds, fullFibonacciUpTo } from "./fibonacci";
import { generateGoldenGridLayout } from "./gridGenerator";
import { hexToHsl, hslToCss } from "./colorUtils";

export function generateGridHTML(
  first: number,
  last: number,
  color: string,
  mirror: boolean,
  rotate: number
): string {
  let start = first;
  let end = last;
  if (start > end) {
    [start, end] = [end, start];
  }

  const userSequence = buildUserSequenceFromBounds(start, end);
  if (userSequence.length < 2) {
    return "<!-- Invalid Fibonacci sequence -->";
  }

  const maxRequested = Math.max(...userSequence);
  const fullSequence = fullFibonacciUpTo(maxRequested);

  const baseColor = color || "#333333";
  const [h, s, l] = hexToHsl(baseColor);
  const complementHue = (h + 180) % 360;

  const layout = generateGoldenGridLayout(fullSequence, mirror, rotate);

  const requestedSquares = layout.squares.filter(sq => userSequence.includes(sq.size));
  const skippedSquares = layout.squares.filter(sq => !userSequence.includes(sq.size));
  const placeholderExists = skippedSquares.length > 0;

  const items: string[] = [];

  if (placeholderExists) {
    const pMinX = Math.min(...skippedSquares.map(s => s.x));
    const pMaxX = Math.max(...skippedSquares.map(s => s.x + s.size - 1));
    const pMinY = Math.min(...skippedSquares.map(s => s.y));
    const pMaxY = Math.max(...skippedSquares.map(s => s.y + s.size - 1));

    const rowStart = pMinY - layout.minY + 1;
    const colStart = pMinX - layout.minX + 1;
    const rowEnd = rowStart + (pMaxY - pMinY + 1);
    const colEnd = colStart + (pMaxX - pMinX + 1);

    items.push(
      `      <li class="placeholder" style="grid-area: ${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}; background: ${baseColor};"></li>`
    );
  }

  const totalRequested = requestedSquares.length;
  requestedSquares.forEach((sq, seqIndex) => {
    let currentHue = h;
    if (totalRequested > 1) {
      let fraction: number;
      if (placeholderExists) {
        fraction = (seqIndex + 1) / (totalRequested + 1);
      } else {
        fraction = seqIndex / (totalRequested - 1);
      }
      currentHue = h + ((complementHue - h) * fraction);
      if (currentHue < 0) currentHue += 360;
      if (currentHue > 360) currentHue -= 360;
    } else {
      if (placeholderExists) {
        currentHue = h + ((complementHue - h) * 0.5);
      }
    }

    const rowStart = sq.y - layout.minY + 1;
    const colStart = sq.x - layout.minX + 1;
    const rowEnd = rowStart + sq.size;
    const colEnd = colStart + sq.size;
    const bg = hslToCss(currentHue, s, l);

    items.push(
      `      <li style="grid-area: ${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}; background: ${bg};"></li>`
    );
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Golden Grid</title>
  <style>
    body { margin: 0; padding: 0; }
    .grid-container {
      display: grid;
      position: relative;
      margin: 0;
      padding: 0;
    }
    .grid-container ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      width: 100%;
      box-sizing: content-box;
      grid-template-columns: repeat(${layout.width}, 1fr);
      grid-template-rows: repeat(${layout.height}, 1fr);
    }
    .grid-container ol > li:not(.placeholder) {
      aspect-ratio: 1 / 1;
    }
    .grid-container .placeholder {
      aspect-ratio: auto;
    }
  </style>
</head>
<body>
  <div class="grid-container">
    <ol>
${items.join("\n")}
    </ol>
  </div>
</body>
</html>`;
}
