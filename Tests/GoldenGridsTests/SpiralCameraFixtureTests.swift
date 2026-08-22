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
        let fade: Bool
        let ease: Double
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
    struct OnScreenCase: Decodable {
        let frameName: String
        let squareIndex: Int
        let margin: Double
        let onScreen: Bool
    }
    struct FadeDepthInput: Decodable {
        let index: Int
        let count: Int
        let holdSteps: Double
        let fadeSteps: Double
        let fade: Bool
        let ease: Double
    }
    struct FadeDepthCase: Decodable {
        let input: FadeDepthInput
        let depth: Double
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
    struct TileEntry: Decodable {
        let translateX: Double
        let translateY: Double
        let rotationDeg: Double
        let scale: Double
    }
    struct TileCase: Decodable {
        let frameName: String
        let squareIndex: Int
        let texturePx: Double
        let tile: TileEntry
    }
    struct ContentEntry: Decodable {
        let rotationDeg: Double
        let scale: Double
    }
    struct ContentCase: Decodable {
        let frameName: String
        let counterRotate: Bool
        let cover: Bool
        let content: ContentEntry
    }
    struct Fixture: Decodable {
        let frames: [FrameCase]
        let onScreens: [OnScreenCase]
        let windows: [WindowCase]
        let fadeDepths: [FadeDepthCase]
        let trails: [TrailCase]
        let eyes: [EyeCase]
        let tiles: [TileCase]
        let contents: [ContentCase]
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
                    fadeSteps: entry.input.fadeSteps,
                    fade: entry.input.fade,
                    ease: entry.input.ease
                )
            )
            XCTAssertEqual(window.opacity, entry.window.opacity, accuracy: tol, "window opacity")
            XCTAssertEqual(window.hidden, entry.window.hidden, "window hidden")
            XCTAssertEqual(window.focused, entry.window.focused, "window focused")
        }
    }

    func testOnScreenCullsReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.onScreens.isEmpty, "no on-screen fixtures loaded")

        for entry in fixture.onScreens {
            guard let frameCase = fixture.frames.first(where: { $0.name == entry.frameName }) else {
                XCTFail("no frame named \(entry.frameName)"); continue
            }
            let input = frameCase.input
            let layout = generateGoldenGridLayout(
                fib(input.count), clockwise: input.clockwise, rotate: input.rotate
            )
            let frame = SpiralCameraFrame(
                scale: frameCase.frame.scale,
                rotationDeg: frameCase.frame.rotationDeg,
                centerX: frameCase.frame.centerX,
                centerY: frameCase.frame.centerY
            )
            let on = tileOnScreen(
                frame,
                square: layout.squares[entry.squareIndex],
                viewportWidth: input.viewportWidth,
                viewportHeight: input.viewportHeight,
                anchor: CGPoint(x: input.anchor.x, y: input.anchor.y),
                margin: entry.margin
            )
            XCTAssertEqual(on, entry.onScreen, "on-screen \(entry.frameName)#\(entry.squareIndex) m=\(entry.margin)")
        }
    }

    func testFadeDepthsReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.fadeDepths.isEmpty, "no fade-depth fixtures loaded")

        for entry in fixture.fadeDepths {
            let depth = windowFadeDepth(
                entry.input.index,
                squareCount: entry.input.count,
                options: SpiralWindowOptions(
                    holdSteps: entry.input.holdSteps,
                    fadeSteps: entry.input.fadeSteps,
                    fade: entry.input.fade,
                    ease: entry.input.ease
                )
            )
            XCTAssertEqual(depth, entry.depth, accuracy: tol, "fade depth")
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

    func testTilesReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.tiles.isEmpty, "no tile fixtures loaded")
        let framesByName = Dictionary(uniqueKeysWithValues: fixture.frames.map { ($0.name, $0) })

        for entry in fixture.tiles {
            guard let frameCase = framesByName[entry.frameName] else {
                XCTFail("tile references unknown frame \(entry.frameName)"); continue
            }
            let layout = generateGoldenGridLayout(
                fib(frameCase.input.count),
                clockwise: frameCase.input.clockwise,
                rotate: frameCase.input.rotate
            )
            let frame = SpiralCameraFrame(
                scale: frameCase.frame.scale,
                rotationDeg: frameCase.frame.rotationDeg,
                centerX: frameCase.frame.centerX,
                centerY: frameCase.frame.centerY
            )
            let tile = tileTransform(
                frame,
                square: layout.squares[entry.squareIndex],
                viewportWidth: frameCase.input.viewportWidth,
                viewportHeight: frameCase.input.viewportHeight,
                anchor: CGPoint(x: frameCase.input.anchor.x, y: frameCase.input.anchor.y),
                texturePx: entry.texturePx
            )
            XCTAssertEqual(tile.translateX, entry.tile.translateX, accuracy: tol, "[\(entry.frameName)#\(entry.squareIndex)] tx")
            XCTAssertEqual(tile.translateY, entry.tile.translateY, accuracy: tol, "[\(entry.frameName)#\(entry.squareIndex)] ty")
            XCTAssertEqual(tile.rotationDeg, entry.tile.rotationDeg, accuracy: tol, "[\(entry.frameName)#\(entry.squareIndex)] rot")
            XCTAssertEqual(tile.scale, entry.tile.scale, accuracy: tol, "[\(entry.frameName)#\(entry.squareIndex)] scale")
        }
    }

    func testContentsReproduceEveryFixture() throws {
        let fixture = try loadFixture()
        XCTAssertFalse(fixture.contents.isEmpty, "no content fixtures loaded")
        let framesByName = Dictionary(uniqueKeysWithValues: fixture.frames.map { ($0.name, $0) })

        for entry in fixture.contents {
            guard let frameCase = framesByName[entry.frameName] else {
                XCTFail("content references unknown frame \(entry.frameName)"); continue
            }
            let frame = SpiralCameraFrame(
                scale: frameCase.frame.scale,
                rotationDeg: frameCase.frame.rotationDeg,
                centerX: frameCase.frame.centerX,
                centerY: frameCase.frame.centerY
            )
            let content = contentTransform(frame, counterRotate: entry.counterRotate, cover: entry.cover)
            XCTAssertEqual(content.rotationDeg, entry.content.rotationDeg, accuracy: tol, "[\(entry.frameName)] content rot")
            XCTAssertEqual(content.scale, entry.content.scale, accuracy: tol, "[\(entry.frameName)] content scale")
        }
    }
}