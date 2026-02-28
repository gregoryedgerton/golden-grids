import { FIB_STOPS } from '../../src/utils/fibonacci';

// Mirrors the validation guard in GridProvider.validatedSetInputControl
function isValidConfig(control: { from: number; to: number }): boolean {
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
