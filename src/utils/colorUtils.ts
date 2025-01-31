export function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0,2),16) / 255;
  let g = parseInt(hex.substring(2,4),16) / 255;
  let b = parseInt(hex.substring(4,6),16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number = 0, s: number, l: number = (max + min) / 2;

  if (max === min) {
      s = 0;
  } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h = h / 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}