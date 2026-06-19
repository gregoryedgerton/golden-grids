import XCTest
@testable import GoldenGrids

/// Verifies the Swift port of `computeRenderModel` against the shared golden
/// master generated from the TypeScript source of truth
/// (src/__fixtures__/render-model.json). This is the cross-language contract:
/// if the Swift math drifts from the TS math, these assertions fail.
final class RenderModelFixtureTests: XCTestCase {
    struct FixtureEntry: Decodable {
        let input: RenderModelInput
        let model: RenderModel
    }

    private let tol = 1e-9

    private func loadFixtures() throws -> [String: FixtureEntry] {
        // …/Tests/GoldenGridsTests/RenderModelFixtureTests.swift → repo root (3 up)
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let url = root.appendingPathComponent("src/__fixtures__/render-model.json")
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode([String: FixtureEntry].self, from: data)
    }

    func testPortReproducesEveryFixture() throws {
        let fixtures = try loadFixtures()
        XCTAssertFalse(fixtures.isEmpty, "no fixtures loaded")

        for (name, entry) in fixtures.sorted(by: { $0.key < $1.key }) {
            let got = computeRenderModel(entry.input)
            assertModelsEqual(got, entry.model, name: name)
        }
    }

    // MARK: - tolerant structural comparison

    private func assertModelsEqual(_ a: RenderModel, _ b: RenderModel, name: String) {
        XCTAssertEqual(a.kind, b.kind, "[\(name)] kind")
        XCTAssertEqual(a.aspectRatio.w, b.aspectRatio.w, accuracy: tol, "[\(name)] aspectRatio.w")
        XCTAssertEqual(a.aspectRatio.h, b.aspectRatio.h, accuracy: tol, "[\(name)] aspectRatio.h")

        XCTAssertEqual(a.slots.count, b.slots.count, "[\(name)] slot count")
        for (i, pair) in zip(a.slots, b.slots).enumerated() {
            assertRectsEqual(pair.0.rect, pair.1.rect, label: "[\(name)] slot[\(i)].rect")
            XCTAssertEqual(pair.0.childIndex, pair.1.childIndex, "[\(name)] slot[\(i)].childIndex")
            assertFillsEqual(pair.0.color, pair.1.color, label: "[\(name)] slot[\(i)].color")
        }

        switch (a.placeholder, b.placeholder) {
        case (nil, nil):
            break
        case let (pa?, pb?):
            assertRectsEqual(pa.rect, pb.rect, label: "[\(name)] placeholder.rect")
            assertFillsEqual(pa.color, pb.color, label: "[\(name)] placeholder.color")
        default:
            XCTFail("[\(name)] placeholder presence mismatch (\(String(describing: a.placeholder)) vs \(String(describing: b.placeholder)))")
        }
    }

    private func assertRectsEqual(_ a: Rect, _ b: Rect, label: String) {
        XCTAssertEqual(a.left, b.left, accuracy: tol, "\(label).left")
        XCTAssertEqual(a.top, b.top, accuracy: tol, "\(label).top")
        XCTAssertEqual(a.width, b.width, accuracy: tol, "\(label).width")
        XCTAssertEqual(a.height, b.height, accuracy: tol, "\(label).height")
    }

    private func assertFillsEqual(_ a: FillColor?, _ b: FillColor?, label: String) {
        switch (a, b) {
        case (nil, nil):
            break
        case let (.hsl(h1, s1, l1)?, .hsl(h2, s2, l2)?):
            XCTAssertEqual(h1, h2, accuracy: tol, "\(label).h")
            XCTAssertEqual(s1, s2, accuracy: tol, "\(label).s")
            XCTAssertEqual(l1, l2, accuracy: tol, "\(label).l")
        case let (.raw(v1)?, .raw(v2)?):
            XCTAssertEqual(v1, v2, "\(label).raw")
        default:
            XCTFail("\(label) fill kind mismatch (\(String(describing: a)) vs \(String(describing: b)))")
        }
    }
}
