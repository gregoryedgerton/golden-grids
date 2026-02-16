import { fullFibonacciUpTo, getGridRange } from "./fibonacci";
import { generateGoldenGridLayout } from "./gridGenerator";
import { hexToHsl, hslToCss } from "./colorUtils";

export function generateGridHTML(
  from: number,
  to: number,
  color: string,
  clockwise: boolean,
  rotate: number
): string {
  let start = from;
  let end = to;
  if (start > end) {
    [start, end] = [end, start];
  }

  const range = getGridRange(start, end);
  if (!range) {
    return "<!-- No grid to render -->";
  }

  const { userSequence, startIdx, endIdx } = range;
  const maxRequested = Math.max(...userSequence);
  const fullSequence = fullFibonacciUpTo(maxRequested);

  const baseColor = color || "#333333";
  const [h, s, l] = hexToHsl(baseColor);

  // Single colored square with nothing skipped: full-width
  if (startIdx === 0 && endIdx === 0) {
    const bg = hslToCss(h, s, l);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Golden Grid</title>
  <style>
    body { margin: 0; padding: 0; }
    .grid-container ol {
      list-style: none; margin: 0; padding: 0;
      position: relative; width: 100%; aspect-ratio: 1 / 1;
    }
    .grid-container ol > li { position: absolute; }
  </style>
</head>
<body>
  <div class="grid-container">
    <ol>
      <li style="left: 0; top: 0; width: 100%; height: 100%; background: ${bg};"></li>
    </ol>
  </div>
</body>
</html>`;
  }

  const layout = generateGoldenGridLayout(fullSequence, clockwise, rotate);

  const requestedSquares = layout.squares.slice(startIdx, endIdx + 1);
  const skippedSquares = layout.squares.slice(0, startIdx);
  const placeholderExists = skippedSquares.length > 0;

  const items: string[] = [];

  if (placeholderExists) {
    let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity;
    for (const s of skippedSquares) {
      if (s.x < pMinX) pMinX = s.x;
      if (s.x + s.size - 1 > pMaxX) pMaxX = s.x + s.size - 1;
      if (s.y < pMinY) pMinY = s.y;
      if (s.y + s.size - 1 > pMaxY) pMaxY = s.y + s.size - 1;
    }

    const pWidth = pMaxX - pMinX + 1;
    const pHeight = pMaxY - pMinY + 1;
    const left = (pMinX - layout.minX) / layout.width * 100;
    const top = (pMinY - layout.minY) / layout.height * 100;
    const w = pWidth / layout.width * 100;
    const h_ = pHeight / layout.height * 100;

    items.push(
      `      <li class="placeholder" style="left: ${left}%; top: ${top}%; width: ${w}%; height: ${h_}%; background: ${baseColor};"></li>`
    );
  }

  const totalRequested = requestedSquares.length;
  const hueRange = Math.min(330, 180 + Math.max(0, totalRequested - 4) * 15);
  const lightnessSpread = Math.min(50, totalRequested * 3);
  requestedSquares.forEach((sq, seqIndex) => {
    let currentHue = h;
    let fraction = 0;
    if (totalRequested > 1) {
      if (placeholderExists) {
        fraction = (seqIndex + 1) / (totalRequested + 1);
      } else {
        fraction = seqIndex / (totalRequested - 1);
      }
      currentHue = (h + hueRange * fraction) % 360;
    } else {
      if (placeholderExists) {
        fraction = 0.5;
        currentHue = (h + hueRange * 0.5) % 360;
      }
    }
    const currentL = Math.max(10, Math.min(90, l + lightnessSpread / 2 - fraction * lightnessSpread));

    const left = (sq.x - layout.minX) / layout.width * 100;
    const top = (sq.y - layout.minY) / layout.height * 100;
    const w = sq.size / layout.width * 100;
    const h_ = sq.size / layout.height * 100;
    const bg = hslToCss(currentHue, s, currentL);

    items.push(
      `      <li style="left: ${left}%; top: ${top}%; width: ${w}%; height: ${h_}%; background: ${bg};"></li>`
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
      position: relative;
      margin: 0;
      padding: 0;
    }
    .grid-container ol {
      list-style: none;
      margin: 0;
      padding: 0;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      aspect-ratio: ${layout.width} / ${layout.height};
    }
    .grid-container ol > li {
      position: absolute;
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
