export const FIB_STOPS: number[] = (() => {
  const stops = [0];
  let a = 1, b = 1;
  while (a <= Number.MAX_SAFE_INTEGER) {
    stops.push(a);
    [a, b] = [b, a + b];
  }
  return stops;
})();

export function fullFibonacciUpTo(n: number): number[] {
  const arr: number[] = [1, 1];
  while (arr[arr.length - 1] < n) {
      arr.push(arr[arr.length - 1] + arr[arr.length - 2]);
  }
  return arr.filter(v => v <= n);
}

export function buildUserSequenceFromBounds(fromIdx: number, toIdx: number): number[] {
  const range = getGridRange(fromIdx, toIdx);
  return range ? range.userSequence : [];
}

/**
 * Get the grid range from FIB_STOPS indices.
 * fromIdx/toIdx are positions in FIB_STOPS (0 = value 0, 1 = first 1, 2 = second 1, 3 = 2, ...).
 * Returns userSequence as Fibonacci values, and startIdx/endIdx into the fullFib array.
 */
export function getGridRange(fromIdx: number, toIdx: number): {
  userSequence: number[];
  startIdx: number;
  endIdx: number;
} | null {
  let startPos = Math.min(fromIdx, toIdx);
  let endPos = Math.max(fromIdx, toIdx);

  // FIB_STOPS[0] = 0, no grid representation
  if (endPos === 0) return null;
  if (startPos === 0) startPos = 1;

  // FIB_STOPS index N (N>=1) maps to fullFib index N-1
  const startIdx = startPos - 1;
  const endIdx = endPos - 1;

  // Build enough of the sequence
  const fib: number[] = [1, 1];
  while (fib.length <= endIdx) {
    fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
  }

  return {
    userSequence: fib.slice(startIdx, endIdx + 1),
    startIdx,
    endIdx,
  };
}
