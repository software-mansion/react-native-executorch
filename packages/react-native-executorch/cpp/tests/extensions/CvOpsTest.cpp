#include <format>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using CvOpsTest = JsiTestEnv;
using ::testing::HasSubstr;

// The cv extension wraps OpenCV for the image pre/post-processing every vision
// pipeline runs. Layout conversions and box decoding are where an off-by-one
// silently produces a plausible-but-wrong tensor, so they are pinned exactly.

constexpr const char *kNs =
    "const cv = __rnexecutorch_jsi__.cv;"
    "const createTensor = __rnexecutorch_jsi__.createTensor;"
    "const fillU8 = (t, v) => { t.setData(new Uint8Array(v)); return t; };"
    "const fillF32 = (t, v) => { t.setData(new Float32Array(v)); return t; };"
    "const readU8 = (t) => { const o = new Uint8Array(t.numel); t.getData(o); return Array.from(o); };"
    "const readF32 = (t) => { const o = new Float32Array(t.numel); t.getData(o); return Array.from(o); };";

TEST_F(CvOpsTest, InstallsTheCvNamespace) {
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__.cv.resize;"), "function");
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__.cv.nms;"), "function");
}

// --- Layout conversions -----------------------------------------------------

TEST_F(CvOpsTest, ToChannelsFirstDeinterleaves) {
    // A 1x2 HWC image with 3 channels: [r0,g0,b0, r1,g1,b1] becomes planar
    // [r0,r1, g0,g1, b0,b1].
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 2, 3], 'uint8'), [1, 2, 3, 4, 5, 6]);
        const dst = createTensor([3, 1, 2], 'uint8');
        cv.toChannelsFirst(src, dst);
        return readU8(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1, 4, 2, 5, 3, 6}));
}

TEST_F(CvOpsTest, ToChannelsLastInterleaves) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([3, 1, 2], 'uint8'), [1, 4, 2, 5, 3, 6]);
        const dst = createTensor([1, 2, 3], 'uint8');
        cv.toChannelsLast(src, dst);
        return readU8(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1, 2, 3, 4, 5, 6}));
}

TEST_F(CvOpsTest, ChannelOrderRoundTrips) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const original = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
        const src = fillU8(createTensor([2, 2, 3], 'uint8'), original);
        const planar = createTensor([3, 2, 2], 'uint8');
        const back = createTensor([2, 2, 3], 'uint8');
        cv.toChannelsFirst(src, planar);
        cv.toChannelsLast(planar, back);
        return readU8(back);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120}));
}

TEST_F(CvOpsTest, ToChannelsFirstRejectsMismatchedDestination) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        cv.toChannelsFirst(createTensor([1, 2, 3], 'uint8'), createTensor([1, 2, 3], 'uint8'));
    )",
                                                kNs)),
                HasSubstr("toChannelsFirst: dst"));
}

// --- Normalize --------------------------------------------------------------

TEST_F(CvOpsTest, NormalizeAppliesScaleAndOffset) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 1, 4], 'uint8'), [0, 50, 100, 200]);
        const dst = createTensor([1, 1, 4], 'float32');
        cv.normalize(src, dst, {{ alpha: 0.5, beta: 1 }});
        return readF32(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1, 26, 51, 101}));
}

TEST_F(CvOpsTest, NormalizeAcceptsPerChannelValues) {
    // Two channels of one pixel each, scaled differently.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([2, 1, 1], 'uint8'), [10, 10]);
        const dst = createTensor([2, 1, 1], 'float32');
        cv.normalize(src, dst, {{ alpha: [1, 2], beta: [0, 5] }});
        return readF32(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {10, 25}));
}

TEST_F(CvOpsTest, NormalizeRejectsWrongPerChannelLength) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const src = createTensor([2, 1, 1], 'uint8');
        const dst = createTensor([2, 1, 1], 'float32');
        cv.normalize(src, dst, {{ alpha: [1, 2, 3], beta: 0 }});
    )",
                                                kNs)),
                HasSubstr("array length must be exactly equal to channels"));
}

// --- Resize -----------------------------------------------------------------

TEST_F(CvOpsTest, ResizeStretchesToDestinationSize) {
    // Nearest-neighbour upscale of a 1x1 image fills the destination.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 1, 1], 'uint8'), [7]);
        const dst = createTensor([2, 2, 1], 'uint8');
        cv.resize(src, dst, {{ mode: 'stretch', interpolation: 'nearest', padValue: 0 }});
        return readU8(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {7, 7, 7, 7}));
}

TEST_F(CvOpsTest, LetterboxPadsWithPadValue) {
    // A 1x2 source into a 2x2 destination scales by 1 (the width already fits),
    // so the content lands on the first row and the second stays padding.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 2, 1], 'uint8'), [5, 5]);
        const dst = createTensor([2, 2, 1], 'uint8');
        cv.resize(src, dst, {{ mode: 'letterbox', interpolation: 'nearest', padValue: 9 }});
        return readU8(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {5, 5, 9, 9}));
}

TEST_F(CvOpsTest, ResizeRejectsUnknownMode) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        cv.resize(createTensor([1, 1, 1], 'uint8'), createTensor([2, 2, 1], 'uint8'),
                  {{ mode: 'squish', interpolation: 'nearest', padValue: 0 }});
    )",
                                                kNs)),
                HasSubstr("unknown mode"));
}

TEST_F(CvOpsTest, ResizeRequiresMatchingChannelCount) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        cv.resize(createTensor([1, 1, 3], 'uint8'), createTensor([2, 2, 1], 'uint8'),
                  {{ mode: 'stretch', interpolation: 'nearest', padValue: 0 }});
    )",
                                                kNs)),
                HasSubstr("resize: dst"));
}

// --- NMS --------------------------------------------------------------------

constexpr const char *kNmsOpts =
    "{ nmsType: 'standard', boxFormat: 'xyxy', iouThreshold: 0.5, confidenceThreshold: 0.1 }";

TEST_F(CvOpsTest, NmsSuppressesOverlappingBoxes) {
    // Two nearly identical boxes plus one far away: the lower-scoring duplicate
    // is dropped, the distant box survives.
    auto result = evalNumberArray(std::format(R"(
        {}
        const boxes = fillF32(createTensor([3, 4], 'float32'), [
            0, 0, 10, 10,
            0, 0, 9, 9,
            100, 100, 110, 110
        ]);
        const scores = fillF32(createTensor([3], 'float32'), [0.9, 0.8, 0.7]);
        return cv.nms(boxes, scores, {});
    )",
                                              kNs, kNmsOpts));
    EXPECT_TRUE(almostEqual(result, {0, 2}));
}

TEST_F(CvOpsTest, NmsKeepsBoxesBelowTheIouThreshold) {
    // Boxes touching at a corner have IoU 0, so both survive.
    auto result = evalNumberArray(std::format(R"(
        {}
        const boxes = fillF32(createTensor([2, 4], 'float32'), [
            0, 0, 10, 10,
            10, 10, 20, 20
        ]);
        const scores = fillF32(createTensor([2], 'float32'), [0.9, 0.8]);
        return cv.nms(boxes, scores, {});
    )",
                                              kNs, kNmsOpts));
    EXPECT_TRUE(almostEqual(result, {0, 1}));
}

TEST_F(CvOpsTest, NmsDropsBoxesBelowTheConfidenceThreshold) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const boxes = fillF32(createTensor([2, 4], 'float32'), [
            0, 0, 10, 10,
            100, 100, 110, 110
        ]);
        const scores = fillF32(createTensor([2], 'float32'), [0.9, 0.05]);
        return cv.nms(boxes, scores, {});
    )",
                                              kNs, kNmsOpts));
    EXPECT_TRUE(almostEqual(result, {0}));
}

TEST_F(CvOpsTest, NmsReturnsEmptyWhenNothingClearsConfidence) {
    EXPECT_EQ(evalNumber(std::format(R"(
        {}
        const boxes = fillF32(createTensor([1, 4], 'float32'), [0, 0, 10, 10]);
        const scores = fillF32(createTensor([1], 'float32'), [0.01]);
        return cv.nms(boxes, scores, {}).length;
    )",
                                     kNs, kNmsOpts)),
              0);
}

TEST_F(CvOpsTest, WeightedNmsReturnsGroupsOfIndices) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const boxes = fillF32(createTensor([3, 4], 'float32'), [
            0, 0, 10, 10,
            0, 0, 9, 9,
            100, 100, 110, 110
        ]);
        const scores = fillF32(createTensor([3], 'float32'), [0.9, 0.8, 0.7]);
        const groups = cv.nms(boxes, scores, {{ nmsType: 'weighted', boxFormat: 'xyxy',
                                                iouThreshold: 0.5, confidenceThreshold: 0.1 }});
        // Flatten to [groupCount, ...group0, ...group1] for easy assertion.
        return [groups.length].concat(groups[0]).concat(groups[1]);
    )",
                                              kNs));
    // Two groups: the first merges the duplicate pair, the second is the distant box.
    EXPECT_TRUE(almostEqual(result, {2, 0, 1, 2}));
}

TEST_F(CvOpsTest, NmsDecodesXywhBoxes) {
    // Same geometry as the xyxy case, expressed as x/y/width/height.
    auto result = evalNumberArray(std::format(R"(
        {}
        const boxes = fillF32(createTensor([2, 4], 'float32'), [
            0, 0, 10, 10,
            0, 0, 9, 9
        ]);
        const scores = fillF32(createTensor([2], 'float32'), [0.9, 0.8]);
        return cv.nms(boxes, scores, {{ nmsType: 'standard', boxFormat: 'xywh',
                                        iouThreshold: 0.5, confidenceThreshold: 0.1 }});
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {0}));
}

TEST_F(CvOpsTest, NmsDecodesCxcywhBoxes) {
    // Centre-based boxes covering the same area overlap fully.
    auto result = evalNumberArray(std::format(R"(
        {}
        const boxes = fillF32(createTensor([2, 4], 'float32'), [
            5, 5, 10, 10,
            5, 5, 9, 9
        ]);
        const scores = fillF32(createTensor([2], 'float32'), [0.9, 0.8]);
        return cv.nms(boxes, scores, {{ nmsType: 'standard', boxFormat: 'cxcywh',
                                        iouThreshold: 0.5, confidenceThreshold: 0.1 }});
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {0}));
}

TEST_F(CvOpsTest, NmsRejectsUnknownEnums) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const boxes = createTensor([1, 4], 'float32');
        const scores = createTensor([1], 'float32');
        cv.nms(boxes, scores, {{ nmsType: 'soft', boxFormat: 'xyxy',
                                 iouThreshold: 0.5, confidenceThreshold: 0.1 }});
    )",
                                                kNs)),
                HasSubstr("unsupported nmsType"));

    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const boxes = createTensor([1, 4], 'float32');
        const scores = createTensor([1], 'float32');
        cv.nms(boxes, scores, {{ nmsType: 'standard', boxFormat: 'yxyx',
                                 iouThreshold: 0.5, confidenceThreshold: 0.1 }});
    )",
                                                kNs)),
                HasSubstr("unsupported boxFormat"));
}

TEST_F(CvOpsTest, NmsRequiresScoresToMatchBoxCount) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const boxes = createTensor([3, 4], 'float32');
        const scores = createTensor([2], 'float32');
        cv.nms(boxes, scores, {});
    )",
                                                kNs, kNmsOpts)),
                HasSubstr("nms: scores"));
}

// --- rectifyQuad ------------------------------------------------------------
// Warps a detected text quad onto a fixed-height canvas, the step between OCR
// detection and recognition. Content is rendered at `contentWidth` and the rest
// of the canvas is flat padding, so the padding and the alignment are as much
// part of the contract as the warp itself.

TEST_F(CvOpsTest, RectifyQuadWarpsAnAxisAlignedQuadUnchanged) {
    // A quad that already matches the destination rectangle is an identity warp,
    // so the pixels come through as they went in.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([2, 2, 1], 'uint8'), [10, 20, 30, 40]);
        const dst = createTensor([2, 2, 1], 'uint8');
        cv.rectifyQuad(src, dst, [0, 0, 2, 0, 2, 2, 0, 2],
                       {{ contentWidth: 2, padValue: 0, align: 'left' }});
        return readU8(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {10, 20, 30, 40}));
}

TEST_F(CvOpsTest, RectifyQuadPadsTheRestOfTheCanvas) {
    // contentWidth 2 on a 4-wide canvas leaves two columns of padding, which
    // must be the requested pad value rather than whatever the warp produced.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 2, 1], 'uint8'), [10, 20]);
        const dst = createTensor([1, 4, 1], 'uint8');
        cv.rectifyQuad(src, dst, [0, 0, 2, 0, 2, 1, 0, 1],
                       {{ contentWidth: 2, padValue: 7, align: 'left' }});
        return readU8(dst);
    )",
                                              kNs));
    EXPECT_EQ(result.size(), 4u);
    EXPECT_EQ(result[2], 7);
    EXPECT_EQ(result[3], 7);
}

TEST_F(CvOpsTest, RectifyQuadCentresContentWhenAsked) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 2, 1], 'uint8'), [10, 20]);
        const dst = createTensor([1, 4, 1], 'uint8');
        cv.rectifyQuad(src, dst, [0, 0, 2, 0, 2, 1, 0, 1],
                       {{ contentWidth: 2, padValue: 7, align: 'center' }});
        return readU8(dst);
    )",
                                              kNs));
    // offsetX = (4 - 2) / 2 = 1, so the padding sits on both sides.
    ASSERT_EQ(result.size(), 4u);
    EXPECT_EQ(result[0], 7);
    EXPECT_EQ(result[3], 7);
}

TEST_F(CvOpsTest, RectifyQuadClampsContentWidthToTheCanvas) {
    // A contentWidth wider than the canvas would run the blit off the end; it is
    // clamped rather than rejected, because the caller derives it from the quad's
    // aspect ratio.
    EXPECT_TRUE(evalBool(std::format(R"(
        {}
        const src = fillU8(createTensor([1, 2, 1], 'uint8'), [10, 20]);
        const dst = createTensor([1, 2, 1], 'uint8');
        cv.rectifyQuad(src, dst, [0, 0, 2, 0, 2, 1, 0, 1],
                       {{ contentWidth: 99, padValue: 0, align: 'left' }});
        return true;
    )",
                                     kNs)));
}

TEST_F(CvOpsTest, RectifyQuadReturnsTheDestinationTensor) {
    EXPECT_TRUE(evalBool(std::format(R"(
        {}
        const src = fillU8(createTensor([2, 2, 1], 'uint8'), [1, 2, 3, 4]);
        const dst = createTensor([2, 2, 1], 'uint8');
        return cv.rectifyQuad(src, dst, [0, 0, 2, 0, 2, 2, 0, 2],
                              {{ contentWidth: 2, padValue: 0, align: 'left' }}) === dst;
    )",
                                     kNs)));
}

TEST_F(CvOpsTest, RectifyQuadRejectsAQuadOfTheWrongLength) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        cv.rectifyQuad(createTensor([2, 2, 1], 'uint8'), createTensor([2, 2, 1], 'uint8'),
                       [0, 0, 2, 0, 2, 2], {{ contentWidth: 2, padValue: 0, align: 'left' }});
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT", "quad must have exactly 8 numbers"));
}

TEST_F(CvOpsTest, RectifyQuadRejectsAChannelMismatch) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        cv.rectifyQuad(createTensor([2, 2, 3], 'uint8'), createTensor([2, 2, 1], 'uint8'),
                       [0, 0, 2, 0, 2, 2, 0, 2], {{ contentWidth: 2, padValue: 0, align: 'left' }});
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT", "rectifyQuad: dst"));
}

TEST_F(CvOpsTest, RectifyQuadRejectsWrongArgumentCounts) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format("{} cv.rectifyQuad();", kNs)),
                             "INVALID_ARGUMENT", "Usage: rectifyQuad(src, dst, quad, options)"));
}

} // namespace
} // namespace rnexecutorch::tests
