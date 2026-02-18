import { hexToHsl, hslToCss, generateHarmonicPalette } from '../utils/colorUtils';

describe('hexToHsl', () => {
  test('black returns [0, 0, 0]', () => {
    expect(hexToHsl('#000000')).toEqual([0, 0, 0]);
  });

  test('white returns [0, 0, 100]', () => {
    expect(hexToHsl('#ffffff')).toEqual([0, 0, 100]);
  });

  test('red returns hue ~0, saturation ~100, lightness ~50', () => {
    const [h, s, l] = hexToHsl('#ff0000');
    expect(h).toBeCloseTo(0);
    expect(s).toBeCloseTo(100);
    expect(l).toBeCloseTo(50);
  });

  test('magenta-range color (red max, blue > green) returns hue > 300', () => {
    // #ff0080: r=255, g=0, b=128 — red is max and g < b, exercises the +6 branch
    const [h] = hexToHsl('#ff0080');
    expect(h).toBeGreaterThan(300);
    expect(h).toBeLessThan(360);
  });

  test('green returns hue ~120', () => {
    const [h] = hexToHsl('#00ff00');
    expect(h).toBeCloseTo(120);
  });

  test('blue returns hue ~240', () => {
    const [h] = hexToHsl('#0000ff');
    expect(h).toBeCloseTo(240);
  });

  test('accepts hex string without leading #', () => {
    expect(hexToHsl('000000')).toEqual([0, 0, 0]);
  });

  test('returns hue in [0, 360), saturation and lightness in [0, 100]', () => {
    const [h, s, l] = hexToHsl('#7f7ec7');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
    expect(l).toBeGreaterThanOrEqual(0);
    expect(l).toBeLessThanOrEqual(100);
  });
});

describe('hslToCss', () => {
  test('formats correctly', () => {
    expect(hslToCss(240, 50, 75)).toBe('hsl(240, 50%, 75%)');
  });

  test('handles zero values', () => {
    expect(hslToCss(0, 0, 0)).toBe('hsl(0, 0%, 0%)');
  });

  test('round-trips with hexToHsl for a known color', () => {
    const [h, s, l] = hexToHsl('#ff0000');
    expect(hslToCss(h, s, l)).toContain('hsl(');
  });
});

describe('generateHarmonicPalette', () => {
  test('returns the requested number of colors', () => {
    expect(generateHarmonicPalette('#ff0000', 5)).toHaveLength(5);
  });

  test('each entry is a valid hsl() string', () => {
    generateHarmonicPalette('#7f7ec7', 4).forEach(c => {
      expect(c).toMatch(/^hsl\(/);
    });
  });

  test('first color starts at the base hue', () => {
    const [h, s, l] = hexToHsl('#ff0000');
    expect(generateHarmonicPalette('#ff0000', 3)[0]).toBe(hslToCss(h, s, l));
  });

  test('returns one color for steps = 1', () => {
    expect(generateHarmonicPalette('#ffffff', 1)).toHaveLength(1);
  });
});
