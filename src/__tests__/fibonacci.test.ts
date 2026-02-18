import { FIB_STOPS, fullFibonacciUpTo, getGridRange } from '../utils/fibonacci';

describe('FIB_STOPS', () => {
  test('begins with the expected sequence', () => {
    expect(FIB_STOPS.slice(0, 8)).toEqual([0, 1, 1, 2, 3, 5, 8, 13]);
  });

  test('has 79 entries (indices 0–78)', () => {
    expect(FIB_STOPS).toHaveLength(79);
  });

  test('every value is within Number.MAX_SAFE_INTEGER', () => {
    FIB_STOPS.forEach(v => expect(v).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER));
  });

  test('each entry is the sum of the two before it (from index 2 onward)', () => {
    for (let i = 2; i < FIB_STOPS.length; i++) {
      expect(FIB_STOPS[i]).toBe(FIB_STOPS[i - 1] + FIB_STOPS[i - 2]);
    }
  });
});

describe('fullFibonacciUpTo', () => {
  test('returns [1, 1] for n = 1', () => {
    expect(fullFibonacciUpTo(1)).toEqual([1, 1]);
  });

  test('returns correct sequence for n = 8', () => {
    expect(fullFibonacciUpTo(8)).toEqual([1, 1, 2, 3, 5, 8]);
  });

  test('excludes values above n', () => {
    fullFibonacciUpTo(10).forEach(v => expect(v).toBeLessThanOrEqual(10));
  });

  test('last value equals n when n is a Fibonacci number', () => {
    expect(fullFibonacciUpTo(13).at(-1)).toBe(13);
  });

  test('last value is the largest Fibonacci number below n', () => {
    // n = 10 is not Fibonacci; largest below it is 8
    expect(fullFibonacciUpTo(10).at(-1)).toBe(8);
  });
});

describe('buildUserSequenceFromBounds', () => {
  test('returns the userSequence for a valid range', () => {
    const { buildUserSequenceFromBounds } = require('../utils/fibonacci');
    expect(buildUserSequenceFromBounds(1, 3)).toEqual([1, 1, 2]);
  });

  test('returns an empty array when the range is invalid (both 0)', () => {
    const { buildUserSequenceFromBounds } = require('../utils/fibonacci');
    expect(buildUserSequenceFromBounds(0, 0)).toEqual([]);
  });
});

describe('getGridRange', () => {
  test('returns null when both indices are 0', () => {
    expect(getGridRange(0, 0)).toBeNull();
  });

  test('treats fromIdx 0 as 1 (skips the zero entry)', () => {
    const result = getGridRange(0, 3);
    expect(result).not.toBeNull();
    expect(result!.startIdx).toBe(0);
  });

  test('returns the correct Fibonacci values for indices 1–4', () => {
    expect(getGridRange(1, 4)!.userSequence).toEqual([1, 1, 2, 3]);
  });

  test('startIdx is fromIdx minus 1', () => {
    expect(getGridRange(2, 5)!.startIdx).toBe(1);
  });

  test('endIdx is toIdx minus 1', () => {
    expect(getGridRange(2, 5)!.endIdx).toBe(4);
  });

  test('reversed arguments produce the same result', () => {
    expect(getGridRange(4, 1)).toEqual(getGridRange(1, 4));
  });

  test('single index returns a one-element userSequence', () => {
    expect(getGridRange(3, 3)!.userSequence).toHaveLength(1);
  });
});
