// Port of src/utils/fibonacci.ts (the subset computeRenderModel needs).
// FIB_STOPS is demo-only and intentionally omitted.

/// All Fibonacci values ≤ n, starting [1, 1]. Mirrors `fullFibonacciUpTo`.
func fullFibonacciUpTo(_ n: Int) -> [Int] {
    var arr = [1, 1]
    while arr[arr.count - 1] < n {
        arr.append(arr[arr.count - 1] + arr[arr.count - 2])
    }
    return arr.filter { $0 <= n }
}

struct GridRange {
    let userSequence: [Int]
    let startIdx: Int
    let endIdx: Int
}

/// Resolve a FIB_STOPS index range. `fromIdx`/`toIdx` are positions in FIB_STOPS
/// (0 = value 0, 1 = first 1, 2 = second 1, …). Returns nil when both point at
/// the leading 0, which has no grid representation. Mirrors `getGridRange`.
func getGridRange(_ fromIdx: Int, _ toIdx: Int) -> GridRange? {
    var startPos = min(fromIdx, toIdx)
    let endPos = max(fromIdx, toIdx)

    if endPos == 0 { return nil }
    if startPos == 0 { startPos = 1 }

    let startIdx = startPos - 1
    let endIdx = endPos - 1

    var fib = [1, 1]
    while fib.count <= endIdx {
        fib.append(fib[fib.count - 1] + fib[fib.count - 2])
    }

    return GridRange(userSequence: Array(fib[startIdx...endIdx]), startIdx: startIdx, endIdx: endIdx)
}
