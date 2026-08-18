import XCTest
@testable import GoldenGrids

/// Verifies the Swift port of the spiral camera against the shared golden
/// master generated from the TypeScript source of truth
/// (src/__fixtures__/spiral-camera.json) — the same cross-language contract
/// RenderModelFixtureTests carries for the grid.
final class SpiralCameraFixtureTests: XCTestCase {
    struct Anchor: Decodable { let x: Double; let y: Double }
    struct FrameInput: Decodable {
        let count: Int
        let clockwise: Bool
        let rotate: Int
        let depth: Double
        let viewportWidth: Double
        let viewportHeight: Double
        let fillRatio: Double
        let anchor: Anchor
    }
    struct Frame: Decodable {
        let scale: Double
        let rotationDeg: Double
        let centerX: Double
        let centerY: Double
    }
    struct FrameCase: Decodable {
        let name: String
        let input: FrameInput
        let frame: Frame
        let affine: [Double]
    }
    struct WindowInput: Decodable {
        let index: Int
        let depth: Double
        let count: Int
        let holdSteps: Double
        let fadeSteps: Double
    }
    struct Window: Decodable {
        let opacity: Double
        let hidden: Bool
        let focused: Bool
    }
    struct WindowCase: Decodable {
        let input: WindowInput
        let window: Window
    }
    struct TrailCase: Decodable {
        let count: Int
        let clockwise: Bool
        let trail: String
        let rotate: Int
    }
    struct EyeInput: Decodable {
        let count: Int
        let clockwise: Bool
        let rotate: Int
    }
    struct Eye: Decodable { let x: Double; let y: Double }
    struct EyeCase: Decodable {
        let input: EyeInput
        let eye: Eye
    }
    struct Fixture: Decodable {
        let frames: [FrameCase]
        let windows: [WindowCase]
        let trails: [TrailCase]
        let eyes: [EyeCase]
    }

    private let tol = 1e-9

    private func fib(_ n: Int) -> [Int] {
        var seq = [1, 1]
        while seq.count < n { seq.append(seq[seq.count - 1] + seq[seq.count - 2]) }
        return seq
    }

    private func loadFixture() throws -> Fixture {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let url = root.appendingPathComponent("src/__fixtures__/spiral-camera.json")
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(Fixture.self, from: data)
    }

    func testFramesReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.frames.isEmpty, "no frame fixtures loaded")

        for entry in fixture.frames {
            let layout = generateGoldenGridLayout(
                fib(entry.input.count),
                clockwise: entry.input.clockwise,
                rotate: entry.input.rotate
            )
            let frame = spiralCamera(
                layout,
                depth: entry.input.depth,
                viewportWidth: entry.input.viewportWidth,
                viewportHeight: entry.input.viewportHeight,
                options: SpiralCameraOptions(
                    fillRatio: entry.input.fillRatio,
                    clockwise: entry.input.clockwise
                )
            )
            XCTAssertEqual(frame.scale, entry.frame.scale, accuracy: tol, "[\(entry.name)] scale")
            XCTAssertEqual(frame.rotationDeg, entry.frame.rotationDeg, accuracy: tol, "[\(entry.name)] rotationDeg")
            XCTAssertEqual(frame.centerX, entry.frame.centerX, accuracy: tol, "[\(entry.name)] centerX")
            XCTAssertEqual(frame.centerY, entry.frame.centerY, accuracy: tol, "[\(entry.name)] centerY")

            let transform = toAffineTransform(
                frame,
                viewportWidth: entry.input.viewportWidth,
                viewportHeight: entry.input.viewportHeight,
                anchor: CGPoint(x: entry.input.anchor.x, y: entry.input.anchor.y)
            )
            let got = [transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty]
            for (index, value) in got.enumerated() {
                XCTAssertEqual(
                    Double(value), entry.affine[index], accuracy: tol,
                    "[\(entry.name)] affine[\(index)]"
                )
            }
        }
    }

    func testWindowsReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.windows.isEmpty, "no window fixtures loaded")

        for entry in fixture.windows {
            let window = spiralWindow(
                entry.input.index,
                depth: entry.input.depth,
                squareCount: entry.input.count,
                options: SpiralWindowOptions(
                    holdSteps: entry.input.holdSteps,
                    fadeSteps: entry.input.fadeSteps
                )
            )
            XCTAssertEqual(window.opacity, entry.window.opacity, accuracy: tol, "window opacity")
            XCTAssertEqual(window.hidden, entry.window.hidden, "window hidden")
            XCTAssertEqual(window.focused, entry.window.focused, "window focused")
        }
    }

    func testTrailSolvesReproduceTheMatrixAndInvert() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.trails.isEmpty, "no trail fixtures loaded")

        for entry in fixture.trails {
            let trail = SpiralTrail(rawValue: entry.trail)!
            XCTAssertEqual(
                trailToRotateDeg(trail, clockwise: entry.clockwise, squareCount: entry.count),
                entry.rotate,
                "trail \(entry.trail) count \(entry.count) cw \(entry.clockwise)"
            )
            XCTAssertEqual(
                trailForRotation(entry.rotate, clockwise: entry.clockwise, squareCount: entry.count),
                trail,
                "inverse rotate \(entry.rotate) count \(entry.count) cw \(entry.clockwise)"
            )
        }
    }

    func testEyesReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.eyes.isEmpty, "no eye fixtures loaded")

        for entry in fixture.eyes {
            let layout = generateGoldenGridLayout(
                fib(entry.input.count),
                clockwise: entry.input.clockwise,
                rotate: entry.input.rotate
            )
            let eye = spiralEye(layout)
            XCTAssertEqual(eye.x, entry.eye.x, accuracy: tol, "eye x")
            XCTAssertEqual(eye.y, entry.eye.y, accuracy: tol, "eye y")
        }
    }
}
