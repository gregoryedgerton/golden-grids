// Port of src/utils/gridGenerator.ts — spiral layout + rotation, integer math.

public enum PlacementValue: String, Codable, Sendable {
    case right, bottom, left, top
}

public struct Square: Equatable, Sendable {
    public var x: Int
    public var y: Int
    public var size: Int
    public init(x: Int, y: Int, size: Int) {
        self.x = x; self.y = y; self.size = size
    }
}

public struct GridLayout: Equatable, Sendable {
    public var squares: [Square]
    public var width: Int
    public var height: Int
    public var minX: Int
    public var minY: Int
}

/// Effective rotation (deg) so the first requested square lands at `placement`.
/// Mirrors `placementToRotateDeg`.
func placementToRotateDeg(_ placement: PlacementValue, _ clockwise: Bool, _ startIdx: Int) -> Int {
    let placementDeg: [PlacementValue: Int] = [.right: 0, .bottom: 90, .left: 180, .top: 270]
    let desiredDeg = placementDeg[placement]!

    if startIdx < 2 { return (desiredDeg + 360) % 360 }

    let cwNatural = [90, 180, 270, 0]
    let ccwNatural = [270, 180, 90, 0]
    let naturalDeg = (clockwise ? cwNatural : ccwNatural)[(startIdx - 2) % 4]

    return (desiredDeg - naturalDeg + 360) % 360
}

/// Generate the golden spiral layout using bounding-box placement.
/// Mirrors `generateGoldenGridLayout`.
public func generateGoldenGridLayout(_ fibSequence: [Int], clockwise: Bool = true, rotate: Int = 0) -> GridLayout {
    precondition(fibSequence.count >= 2, "Need at least two numbers in the sequence.")
    precondition([0, 90, 180, 270].contains(rotate), "Invalid rotation value: \(rotate). Only 0, 90, 180, and 270 are allowed.")

    var squares: [Square] = []
    var minX = Int.max, maxX = Int.min, minY = Int.max, maxY = Int.min

    func expandBounds(_ sq: Square) {
        if sq.x < minX { minX = sq.x }
        if sq.x + sq.size - 1 > maxX { maxX = sq.x + sq.size - 1 }
        if sq.y < minY { minY = sq.y }
        if sq.y + sq.size - 1 > maxY { maxY = sq.y + sq.size - 1 }
    }
    func recalcBounds() {
        minX = Int.max; maxX = Int.min; minY = Int.max; maxY = Int.min
        for s in squares { expandBounds(s) }
    }

    squares.append(Square(x: 0, y: 0, size: fibSequence[0]))
    squares.append(Square(x: fibSequence[0], y: 0, size: fibSequence[1]))
    expandBounds(squares[0])
    expandBounds(squares[1])

    // CW: bottom → left → top → right ; CCW: top → left → bottom → right
    let directions: [(dx: Int, dy: Int)] = clockwise
        ? [(0, 1), (-1, 0), (0, -1), (1, 0)]
        : [(0, -1), (-1, 0), (0, 1), (1, 0)]
    var dirIndex = 0

    for i in 2..<fibSequence.count {
        let size = fibSequence[i]
        let d = directions[dirIndex]
        let xPos: Int
        let yPos: Int
        if d.dx == 0 && d.dy == 1 {          // bottom
            xPos = minX; yPos = maxY + 1
        } else if d.dx == -1 && d.dy == 0 {  // left
            xPos = minX - size; yPos = maxY - size + 1
        } else if d.dx == 0 && d.dy == -1 {  // top
            xPos = maxX - size + 1; yPos = minY - size
        } else {                              // right
            xPos = maxX + 1; yPos = minY
        }
        let sq = Square(x: xPos, y: yPos, size: size)
        squares.append(sq)
        expandBounds(sq)
        dirIndex = (dirIndex + 1) % directions.count
    }

    if rotate != 0 {
        for idx in squares.indices {
            let tempX = squares[idx].x
            let tempY = squares[idx].y
            let size = squares[idx].size
            if rotate == 90 {
                squares[idx].x = -tempY - size + 1
                squares[idx].y = tempX
            } else if rotate == 180 {
                squares[idx].x = -tempX - size + 1
                squares[idx].y = -tempY - size + 1
            } else if rotate == 270 {
                squares[idx].x = tempY
                squares[idx].y = -tempX - size + 1
            }
        }
        recalcBounds()
    }

    return GridLayout(squares: squares, width: maxX - minX + 1, height: maxY - minY + 1, minX: minX, minY: minY)
}
