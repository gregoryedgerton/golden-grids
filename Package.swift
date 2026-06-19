// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "GoldenGrids",
    platforms: [.iOS(.v14), .macOS(.v11)],
    products: [
        .library(name: "GoldenGrids", targets: ["GoldenGrids"]),
    ],
    targets: [
        .target(name: "GoldenGrids"),
        .testTarget(name: "GoldenGridsTests", dependencies: ["GoldenGrids"]),
    ]
)
