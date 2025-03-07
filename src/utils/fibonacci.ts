export function fullFibonacciUpTo(n: number): number[] {
  const arr: number[] = [1, 1];
  while (arr[arr.length - 1] < n) {
      arr.push(arr[arr.length - 1] + arr[arr.length - 2]);
  }
  return arr.filter(v => v <= n);
}

export function buildUserSequenceFromBounds(start: number, end: number): number[] {
  const fib: number[] = [1, 1];
  
  // Generate Fibonacci sequence up to the largest number in range
  while (fib[fib.length - 1] < end) {
      fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
  }

  const startIndex = fib.findIndex(n => n === start);
  const endIndex = fib.findIndex(n => n === end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      console.error("Invalid Fibonacci sequence bounds.", { start, end });
      return [];
  }

  const sequence = fib.slice(startIndex, endIndex + 1);
  console.log("✅ Fixed User Sequence:", sequence); // Debugging Output
  return sequence;
}


