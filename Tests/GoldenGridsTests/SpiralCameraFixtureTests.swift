import XCTest
@testable import GoldenGrids

/// Verifies the Swift port of the spiral camera against the shared golden
/// master generated from the TypeScript source of truth
/// (src/__fixtures__/spiral-camera.json) — the same contract the Kotlin port
/// asserts against. Layouts are rebuilt from each entry's (fibCount,
/// clockwise, rotate), so the camera fixtures also exercise the layout port.
final class SpiralCameraFixtureTests: XCTestCase {
    struct CameraInput: Decodable {
        let fibCount: Int
        let clockwise: Bool
        let rotate: Int
        let depth: Double
        let viewportWidth: Double
        let viewportHeight: Double
        let fillRatio: Double?
    }

    struct WindowInput: Decodable {
        let index: Int
        let depth: Double
        let squareCount: Int
        let holdSteps: Double?
        let fadeSteps: Double?
    }

    struct TrailInput: Decodable {
        let trail: SpiralTrail
        let clockwise: Bool
        let squareCount: Int
    }

    struct EyeInput: Decodable {
        let fibCount: Int
        let clockwise: Bool
        let rotate: Int
    }

    struct Fixture: Decodable {
        struct CameraCase: Decodable {
            let name: String
            let input: CameraInput
            let frame: SpiralCameraFrame
        }
        struct WindowCase: Decodable {
            let name: String
            let input: WindowInput
            let window: SpiralWindow
        }
        struct TrailCase: Decodable {
            let input: TrailInput
            let rotateDeg: Int
        }
        struct EyeCase: Decodable {
            let name: String
            let input: EyeInput
            let eye: SpiralPoint
        }
        let camera: [CameraCase]
        let window: [WindowCase]
        let trail: [TrailCase]
        let eye: [EyeCase]
    }

    private let tol = 1e-9

    private func fib(_ n: Int) -> [Int] {
        var seq = [1, 1]
        while seq.count < n { seq.append(seq[seq.count - 1] + seq[seq.count - 2]) }
        return seq
    }

    private func loadFixture() throws -> Fixture {
        // …/Tests/GoldenGridsTests/SpiralCameraFixtureTests.swift → repo root (3 up)
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let url = root.appendingPathComponent("src/__fixtures__/spiral-camera.json")
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(Fixture.self, from: data)
    }

    func testCameraFramesMatchGoldenMaster() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.camera.isEmpty, "no camera fixtures loaded")

        for entry in fixture.camera {
            let input = entry.input
            let layout = generateGoldenGridLayout(fib(input.fibCount),
                                                  clockwise: input.clockwise,
                                                  rotate: input.rotate)
            let got = spiralCamera(layout,
                                   depth: input.depth,
                                   viewportWidth: input.viewportWidth,
                                   viewportHeight: input.viewportHeight,
                                   fillRatio: input.fillRatio ?? 0.62,
                                   clockwise: input.clockwise)
            XCTAssertEqual(got.scale, entry.frame.scale, accuracy: tol, "[\(entry.name)] scale")
            XCTAssertEqual(got.rotationDeg, entry.frame.rotationDeg, accuracy: tol, "[\(entry.name)] rotationDeg")
            XCTAssertEqual(got.centerX, entry.frame.centerX, accuracy: tol, "[\(entry.name)] centerX")
            XCTAssertEqual(got.centerY, entry.frame.centerY, accuracy: tol, "[\(entry.name)] centerY")
        }
    }

    func testWindowsMatchGoldenMaster() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.window.isEmpty, "no window fixtures loaded")

        for entry in fixture.window {
            let input = entry.input
            let got = spiralWindow(index: input.index,
                                   depth: input.depth,
                                   squareCount: input.squareCount,
                                   holdSteps: input.holdSteps ?? 1,
                                   fadeSteps: input.fadeSteps ?? 2.5)
            XCTAssertEqual(got.opacity, entry.window.opacity, accuracy: tol, "[\(entry.name)] opacity")
            XCTAssertEqual(got.hidden, entry.window.hidden, "[\(entry.name)] hidden")
            XCTAssertEqual(got.focused, entry.window.focused, "[\(entry.name)] focused")
        }
    }

    func testTrailSolvesMatchGoldenMasterAndRoundTrip() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.trail.isEmpty, "no trail fixtures loaded")

        for entry in fixture.trail {
            let input = entry.input
            let got = trailToRotateDeg(input.trail, clockwise: input.clockwise, squareCount: input.squareCount)
            XCTAssertEqual(got, entry.rotateDeg,
                           "trail \(input.trail) cw=\(input.clockwise) n=\(input.squareCount)")
            XCTAssertEqual(trailForRotation(entry.rotateDeg, clockwise: input.clockwise, squareCount: input.squareCount),
                           input.trail,
                           "round-trip \(entry.rotateDeg) cw=\(input.clockwise) n=\(input.squareCount)")
        }
    }

    func testEyesMatchGoldenMaster() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.eye.isEmpty, "no eye fixtures loaded")

        for entry in fixture.eye {
            let input = entry.input
            let layout = generateGoldenGridLayout(fib(input.fibCount),
                                                  clockwise: input.clockwise,
                                                  rotate: input.rotate)
            let got = spiralEye(layout)
            XCTAssertEqual(got.x, entry.eye.x, accuracy: tol, "[\(entry.name)] x")
            XCTAssertEqual(got.y, entry.eye.y, accuracy: tol, "[\(entry.name)] y")
        }
    }
}
