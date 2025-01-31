export function fullFibonacciUpTo(n: number): number[] {
  const arr: number[] = [1, 1];
  while (arr[arr.length - 1] < n) {
      arr.push(arr[arr.length - 1] + arr[arr.length - 2]);
  }
  return arr.filter(v => v <= n);
}

export function buildUserSequenceFromBounds(start: number, end: number): number[] {
  const fib: number[] = fullFibonacciUpTo(end);

  if (fib.indexOf(start) === -1 || fib.indexOf(end) === -1) {
      throw new Error('Start and end must be Fibonacci numbers');
  }

  const startIndex = fib.indexOf(start);
  const endIndex = fib.indexOf(end);
  return fib.slice(startIndex, endIndex + 1);
}