#include <algorithm>
#include <format>
#include <string>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using OcrOpsTest = JsiTestEnv;
using ::testing::HasSubstr;

// extractDbnetTextQuads turns a DBNet probability map into oriented text quads.
// It is the one cv op whose output count is data-dependent, so the tests pin
// what each option actually filters rather than only the happy path.

// Builds a [1,1,size,size] probability map with `value` inside the axis-aligned
// rectangle [x0,x1] x [y0,y1] and 0 elsewhere, plus the option object the op
// takes. Kept as JS so the tensor is created and filled the way the TS
// pipeline does it.
constexpr const char *kNs = R"(
    const cv = __rnexecutorch_jsi__.cv;
    const probMap = (size, boxes) => {
        const data = new Float32Array(size * size);
        for (const [x0, y0, x1, y1, value] of boxes) {
            for (let y = y0; y <= y1; ++y) {
                for (let x = x0; x <= x1; ++x) { data[y * size + x] = value; }
            }
        }
        const tensor = __rnexecutorch_jsi__.createTensor([1, 1, size, size], 'float32');
        tensor.setData(data);
        return tensor;
    };
    const options = (overrides) => Object.assign({
        binThreshold: 0.3,
        boxThreshold: 0.5,
        unclipRatio: 1.5,
        minBoxSide: 3,
        maxCandidates: 16,
    }, overrides || {});
    const quads = (src, opts) => Array.from(cv.extractDbnetTextQuads(src, options(opts)));
)";

TEST_F(OcrOpsTest, IsInstalledUnderTheCvNamespace) {
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__.cv.extractDbnetTextQuads;"), "function");
}

TEST_F(OcrOpsTest, ReturnsEightNumbersPerDetectedQuad) {
    auto result = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(32, [[8, 8, 23, 23, 1]]));
    )",
                                              kNs));
    ASSERT_EQ(result.size(), 8u);

    // Corner order is unspecified (the TS pipeline derives reading order
    // geometrically), so the assertion is on the extent: the unclipped box
    // covers the blob and stays inside the map.
    double minX = result[0];
    double maxX = result[0];
    double minY = result[1];
    double maxY = result[1];
    for (size_t i = 0; i < result.size(); i += 2) {
        minX = std::min(minX, result[i]);
        maxX = std::max(maxX, result[i]);
        minY = std::min(minY, result[i + 1]);
        maxY = std::max(maxY, result[i + 1]);
    }
    EXPECT_LE(minX, 8.0);
    EXPECT_GE(maxX, 23.0);
    EXPECT_LE(minY, 8.0);
    EXPECT_GE(maxY, 23.0);
    // Clamped to the last valid pixel index, not to the map size.
    EXPECT_GE(minX, 0.0);
    EXPECT_GE(minY, 0.0);
    EXPECT_LE(maxX, 31.0);
    EXPECT_LE(maxY, 31.0);
}

TEST_F(OcrOpsTest, FindsEveryDisjointBlob) {
    auto result = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(48, [[4, 4, 15, 15, 1], [30, 30, 43, 43, 1]]));
    )",
                                              kNs));
    EXPECT_EQ(result.size(), 16u);
}

TEST_F(OcrOpsTest, ReturnsNothingForAnEmptyMap) {
    auto result = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(32, []));
    )",
                                              kNs));
    EXPECT_TRUE(result.empty());
}

// binThreshold binarises the map; a blob whose probability sits below it never
// becomes a contour in the first place.
TEST_F(OcrOpsTest, DropsBlobsBelowTheBinarisationThreshold) {
    auto kept = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(32, [[8, 8, 23, 23, 0.4]]), {{ binThreshold: 0.3, boxThreshold: 0.2 }});
    )",
                                            kNs));
    EXPECT_EQ(kept.size(), 8u);

    auto dropped = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(32, [[8, 8, 23, 23, 0.4]]), {{ binThreshold: 0.6, boxThreshold: 0.2 }});
    )",
                                               kNs));
    EXPECT_TRUE(dropped.empty());
}

// boxThreshold scores the mean probability inside the contour, so a blob that
// binarises but scores weakly is dropped after the fact.
TEST_F(OcrOpsTest, DropsBlobsBelowTheBoxScore) {
    auto dropped = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(32, [[8, 8, 23, 23, 0.4]]), {{ binThreshold: 0.3, boxThreshold: 0.9 }});
    )",
                                               kNs));
    EXPECT_TRUE(dropped.empty());
}

TEST_F(OcrOpsTest, DropsBlobsThinnerThanMinBoxSide) {
    auto dropped = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(32, [[8, 8, 23, 10, 1]]), {{ minBoxSide: 12 }});
    )",
                                               kNs));
    EXPECT_TRUE(dropped.empty());
}

TEST_F(OcrOpsTest, StopsAtMaxCandidates) {
    auto result = evalNumberArray(std::format(R"(
        {}
        return quads(probMap(48, [[4, 4, 15, 15, 1], [30, 30, 43, 43, 1]]), {{ maxCandidates: 1 }});
    )",
                                              kNs));
    EXPECT_EQ(result.size(), 8u);
}

// The DBNet head always emits [1,1,H,W], so the rank is part of the contract
// rather than something to re-derive from the data.
TEST_F(OcrOpsTest, RejectsAMapOfTheWrongRank) {
    auto thrown = evalThrowing(std::format(R"(
        {}
        const src = __rnexecutorch_jsi__.createTensor([32, 32], 'float32');
        cv.extractDbnetTextQuads(src, options());
    )",
                                           kNs));
    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "extractDbnetTextQuads: src"));
}

TEST_F(OcrOpsTest, RejectsAMapOfTheWrongDtype) {
    auto thrown = evalThrowing(std::format(R"(
        {}
        const src = __rnexecutorch_jsi__.createTensor([1, 1, 32, 32], 'uint8');
        cv.extractDbnetTextQuads(src, options());
    )",
                                           kNs));
    EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT", "extractDbnetTextQuads: src"));
}

TEST_F(OcrOpsTest, RequiresEveryOption) {
    for (const auto *option : {"binThreshold", "boxThreshold", "unclipRatio", "minBoxSide", "maxCandidates"}) {
        auto thrown = evalThrowing(std::format(R"(
            {}
            const opts = options();
            delete opts['{}'];
            cv.extractDbnetTextQuads(probMap(32, [[8, 8, 23, 23, 1]]), opts);
        )",
                                               kNs, option));
        EXPECT_TRUE(isCodedError(thrown, "INVALID_ARGUMENT",
                                 std::format("option '{}' is required", option)));
    }
}

TEST_F(OcrOpsTest, RejectsWrongArgumentCounts) {
    EXPECT_TRUE(isCodedError(evalThrowing("__rnexecutorch_jsi__.cv.extractDbnetTextQuads();"),
                             "INVALID_ARGUMENT", "Usage: extractDbnetTextQuads(src, options)"));
}

} // namespace
} // namespace rnexecutorch::tests
