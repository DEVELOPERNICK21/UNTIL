// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "WatchMath",
  platforms: [.macOS(.v13)],
  products: [
    .library(name: "WatchMath", targets: ["WatchMath"]),
  ],
  targets: [
    .target(
      name: "WatchMath",
      path: "Sources/WatchMath"
    ),
    .testTarget(
      name: "WatchMathTests",
      dependencies: ["WatchMath"],
      path: "Tests/WatchMathTests"
    ),
  ]
)
