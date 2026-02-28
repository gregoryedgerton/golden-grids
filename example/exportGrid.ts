import { fullFibonacciUpTo, getGridRange } from "../src/utils/fibonacci";
import { generateGoldenGridLayout, placementToRotateDeg } from "../src/utils/gridGenerator";
import { hexToHsl, hslToCss } from "../src/utils/colorUtils";

export function generateGridHTML(
  from: number,
  to: number,
  color: string | undefined,
  clockwise: boolean,
  placement: "right" | "bottom" | "left" | "top",
  outline?: string
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

  const baseColor = color || undefined;
  const [h, s, l] = baseColor ? hexToHsl(baseColor) : [0, 0, 50];
  const outlined = !!outline;
  const gridClass = `golden-grid${outlined ? ' golden-grid--outlined' : ''}`;
  const containerBorderStyle = outline ? ` style="border-top: ${outline}; border-left: ${outline};"` : "";
  const boxBorderStyles = outline ? ` border-right: ${outline}; border-bottom: ${outline};` : "";
  const outlinedCss = outlined ? `\n    .golden-grid--outlined > .golden-grid__box { box-sizing: border-box; }` : "";

  // Single colored square with nothing skipped: full-width
  if (startIdx === 0 && endIdx === 0) {
    const bgStyle = baseColor ? ` background: ${hslToCss(h, s, l)};` : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Golden Grid</title>
  <style>
    body { margin: 0; padding: 0; }
    .golden-grid {
      margin: 0; padding: 0;
      position: relative; width: 100%; aspect-ratio: 1 / 1;
    }
    .golden-grid > .golden-grid__box { position: absolute; }${outlinedCss}
  </style>
</head>
<body>
  <div class="${gridClass}"${containerBorderStyle}>
    <div class="golden-grid__box" style="left: 0; top: 0; width: 100%; height: 100%;${bgStyle}${boxBorderStyles}"></div>
  </div>
</body>
</html>`;
  }

  const rotateDeg = placementToRotateDeg(placement, clockwise, startIdx);
  const layout = generateGoldenGridLayout(fullSequence, clockwise, rotateDeg);

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
    const bgStyle = baseColor ? ` background: ${baseColor};` : "";

    items.push(
      `      <div class="golden-grid__box golden-grid__box--placeholder" style="left: ${left}%; top: ${top}%; width: ${w}%; height: ${h_}%;${bgStyle}${boxBorderStyles}"></div>`
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
    const bgStyle = baseColor ? ` background: ${hslToCss(currentHue, s, currentL)};` : "";

    items.push(
      `      <div class="golden-grid__box" style="left: ${left}%; top: ${top}%; width: ${w}%; height: ${h_}%;${bgStyle}${boxBorderStyles}"></div>`
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
    .golden-grid {
      margin: 0;
      padding: 0;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      aspect-ratio: ${layout.width} / ${layout.height};
    }
    .golden-grid > .golden-grid__box {
      position: absolute;
    }${outlinedCss}
  </style>
</head>
<body>
  <div class="${gridClass}"${containerBorderStyle}>
${items.join("\n")}
  </div>
</body>
</html>`;
}
