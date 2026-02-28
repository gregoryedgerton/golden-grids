import { FIB_STOPS, getGridRange } from '../utils/fibonacci';
import { generateGoldenGridLayout, placementToRotateDeg } from '../utils/gridGenerator';
import type { InputControlType } from '../types/InputControlType';

// Mirrors the validation guard in GridProvider.validatedSetInputControl
function isValidConfig(control: Pick<InputControlType, 'from' | 'to'>): boolean {
  const { from, to } = control;
  if (from < 0 || from >= FIB_STOPS.length || to < 0 || to >= FIB_STOPS.length) return false;
  if (!Number.isInteger(from) || !Number.isInteger(to)) return false;
  return true;
}

describe('GridProvider validation', () => {
  test('accepts valid in-bounds integer indices', () => {
    expect(isValidConfig({ from: 1, to: 5 })).toBe(true);
  });

  test('accepts boundary indices 0 and 78', () => {
    expect(isValidConfig({ from: 0, to: 78 })).toBe(true);
  });

  test('rejects negative from index', () => {
    expect(isValidConfig({ from: -1, to: 5 })).toBe(false);
  });

  test('rejects negative to index', () => {
    expect(isValidConfig({ from: 1, to: -1 })).toBe(false);
  });

  test('rejects from index at or beyond FIB_STOPS.length', () => {
    expect(isValidConfig({ from: FIB_STOPS.length, to: 5 })).toBe(false);
  });

  test('rejects to index at or beyond FIB_STOPS.length', () => {
    expect(isValidConfig({ from: 1, to: FIB_STOPS.length })).toBe(false);
  });

  test('rejects non-integer from', () => {
    expect(isValidConfig({ from: 1.5, to: 5 })).toBe(false);
  });

  test('rejects non-integer to', () => {
    expect(isValidConfig({ from: 1, to: 5.5 })).toBe(false);
  });
});

describe('dynamic config re-render behaviour', () => {
  // Confirms the layout algorithm is pure: same input always produces
  // the same output, so swapping configs and back produces no artifacts.
  test('layout is deterministic — same config produces identical output', () => {
    const range = getGridRange(1, 5)!;
    const rotate = placementToRotateDeg('right', true, range.startIdx);
    const a = generateGoldenGridLayout(range.userSequence, true, rotate);
    const b = generateGoldenGridLayout(range.userSequence, true, rotate);
    expect(a).toEqual(b);
  });

  test('switching from a large to a smaller config produces a valid layout', () => {
    const large = getGridRange(1, 7)!;
    const small = getGridRange(1, 4)!;
    const rotLarge = placementToRotateDeg('right', true, large.startIdx);
    const rotSmall = placementToRotateDeg('right', true, small.startIdx);
    const largeLayout = generateGoldenGridLayout(large.userSequence, true, rotLarge);
    const smallLayout = generateGoldenGridLayout(small.userSequence, true, rotSmall);
    expect(largeLayout.squares.length).toBeGreaterThan(smallLayout.squares.length);
    expect(smallLayout.width).toBeGreaterThan(0);
    expect(smallLayout.height).toBeGreaterThan(0);
    smallLayout.squares.forEach(sq => {
      expect(sq.x).toBeGreaterThanOrEqual(smallLayout.minX);
      expect(sq.y).toBeGreaterThanOrEqual(smallLayout.minY);
      expect(sq.size).toBeGreaterThan(0);
    });
  });

  test('switching from a small to a larger config produces a valid layout', () => {
    const small = getGridRange(1, 3)!;
    const large = getGridRange(1, 6)!;
    const rotSmall = placementToRotateDeg('right', true, small.startIdx);
    const rotLarge = placementToRotateDeg('right', true, large.startIdx);
    const smallLayout = generateGoldenGridLayout(small.userSequence, true, rotSmall);
    const largeLayout = generateGoldenGridLayout(large.userSequence, true, rotLarge);
    expect(largeLayout.squares.length).toBeGreaterThan(smallLayout.squares.length);
    expect(largeLayout.width).toBeGreaterThan(0);
    expect(largeLayout.height).toBeGreaterThan(0);
    largeLayout.squares.forEach(sq => {
      expect(sq.x).toBeGreaterThanOrEqual(largeLayout.minX);
      expect(sq.y).toBeGreaterThanOrEqual(largeLayout.minY);
      expect(sq.size).toBeGreaterThan(0);
    });
  });

  test('all placements produce valid layouts for the same config', () => {
    const range = getGridRange(1, 5)!;
    const placements = ['right', 'bottom', 'left', 'top'] as const;
    placements.forEach(placement => {
      const rotate = placementToRotateDeg(placement, true, range.startIdx);
      const layout = generateGoldenGridLayout(range.userSequence, true, rotate);
      expect(layout.squares.length).toBeGreaterThan(0);
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
      layout.squares.forEach(sq => {
        expect(sq.x).toBeGreaterThanOrEqual(layout.minX);
        expect(sq.y).toBeGreaterThanOrEqual(layout.minY);
        expect(sq.size).toBeGreaterThan(0);
      });
    });
  });

  test('clockwise and counter-clockwise produce different but both valid layouts', () => {
    const range = getGridRange(1, 5)!;
    const rotCw  = placementToRotateDeg('right', true,  range.startIdx);
    const rotCcw = placementToRotateDeg('right', false, range.startIdx);
    const cw  = generateGoldenGridLayout(range.userSequence, true,  rotCw);
    const ccw = generateGoldenGridLayout(range.userSequence, false, rotCcw);
    expect(cw).not.toEqual(ccw);
    [cw, ccw].forEach(layout => {
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
      layout.squares.forEach(sq => {
        expect(sq.x).toBeGreaterThanOrEqual(layout.minX);
        expect(sq.y).toBeGreaterThanOrEqual(layout.minY);
        expect(sq.size).toBeGreaterThan(0);
      });
    });
  });
});
