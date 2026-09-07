#include <cmath>
#include <format>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using MathOpsTest = JsiTestEnv;
using ::testing::HasSubstr;

// The math ops back the post-processing steps of the CV pipelines (softmax over
// logits, argmax for class ids, threshold for masks). They write into a caller
// supplied `dst` tensor, so both the numerics and the shape/aliasing guards
// matter.

constexpr const char *kNs = "const m = __rnexecutorch_jsi__.math;"
                            "const createTensor = __rnexecutorch_jsi__.createTensor;"
                            "const fill = (t, values) => { t.setData(new Float32Array(values)); return t; };"
                            "const read = (t) => { const o = new Float32Array(t.numel); t.getData(o); return Array.from(o); };"
                            "const readInt = (t) => { const o = new Int32Array(t.numel); t.getData(o); return Array.from(o); };"
                            "const fillInt = (t, values) => { t.setData(new Int32Array(values)); return t; };";

double sigmoidOf(double x) { return 1.0 / (1.0 + std::exp(-x)); }

TEST_F(MathOpsTest, SigmoidMapsElementwise) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([4], 'float32'), [-2, -0.5, 0, 3]);
        const dst = createTensor([4], 'float32');
        m.sigmoid(src, dst);
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {sigmoidOf(-2), sigmoidOf(-0.5), 0.5, sigmoidOf(3)}));
}

TEST_F(MathOpsTest, SigmoidReturnsTheDestinationTensor) {
    // Ops return dst so JS can chain them; losing that breaks the pipeline API.
    EXPECT_EQ(evalNumber(std::format(R"(
        {}
        const src = createTensor([4], 'float32');
        const dst = createTensor([4], 'float32');
        return m.sigmoid(src, dst).numel;
    )",
                                     kNs)),
              4);
}

TEST_F(MathOpsTest, SigmoidRejectsShapeMismatch) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        m.sigmoid(createTensor([4], 'float32'), createTensor([3], 'float32'));
    )",
                                                kNs)),
                HasSubstr("sigmoid: dst"));
}

TEST_F(MathOpsTest, SigmoidRejectsAliasedSourceAndDestination) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const t = createTensor([4], 'float32');
        m.sigmoid(t, t);
    )",
                                                kNs)),
                HasSubstr("sigmoid"));
}

TEST_F(MathOpsTest, SigmoidRejectsWrongDtype) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        m.sigmoid(createTensor([4], 'int32'), createTensor([4], 'float32'));
    )",
                                                kNs)),
                HasSubstr("sigmoid: src"));
}

TEST_F(MathOpsTest, SoftmaxNormalisesTheLastAxis) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([2, 3], 'float32'), [1, 2, 3, 1, 1, 1]);
        const dst = createTensor([2, 3], 'float32');
        m.softmax(src, dst, -1);
        return read(dst);
    )",
                                              kNs));

    const double e1 = std::exp(1.0 - 3.0), e2 = std::exp(2.0 - 3.0), e3 = 1.0;
    const double sum = e1 + e2 + e3;
    EXPECT_TRUE(almostEqual(result,
                            {e1 / sum, e2 / sum, e3 / sum, 1.0 / 3, 1.0 / 3, 1.0 / 3}));
}

TEST_F(MathOpsTest, SoftmaxHandlesANonTrailingAxis) {
    // axis=0 on a [2,2] tensor exercises the strided (inner != 1) path.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([2, 2], 'float32'), [1, 2, 1, 2]);
        const dst = createTensor([2, 2], 'float32');
        m.softmax(src, dst, 0);
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {0.5, 0.5, 0.5, 0.5}));
}

TEST_F(MathOpsTest, SoftmaxIsNumericallyStableForLargeInputs) {
    // Without max-subtraction exp(1000) overflows to inf and the result is NaN.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([3], 'float32'), [1000, 1000, 1000]);
        const dst = createTensor([3], 'float32');
        m.softmax(src, dst, 0);
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1.0 / 3, 1.0 / 3, 1.0 / 3}));
}

TEST_F(MathOpsTest, SoftmaxRejectsOutOfRangeAxis) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        m.softmax(createTensor([2, 3], 'float32'), createTensor([2, 3], 'float32'), 2);
    )",
                                                kNs)),
                HasSubstr("axis 2 out of range"));

    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        m.softmax(createTensor([2, 3], 'float32'), createTensor([2, 3], 'float32'), -3);
    )",
                                                kNs)),
                HasSubstr("out of range"));
}

TEST_F(MathOpsTest, ArgmaxPicksTheMaximumIndex) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([2, 3], 'float32'), [1, 9, 2, 5, 4, 3]);
        const dst = createTensor([2, 1], 'int32');
        m.argmax(src, dst, -1);
        return readInt(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1, 0}));
}

TEST_F(MathOpsTest, ArgmaxReturnsTheFirstOfTiedMaxima) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([1, 4], 'float32'), [3, 7, 7, 1]);
        const dst = createTensor([1, 1], 'int32');
        m.argmax(src, dst, -1);
        return readInt(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1}));
}

TEST_F(MathOpsTest, ArgmaxRequiresDestinationWithReducedAxis) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        m.argmax(createTensor([2, 3], 'float32'), createTensor([2, 3], 'int32'), -1);
    )",
                                                kNs)),
                HasSubstr("dst shape must match src shape but with axis dimension 1"));
}

TEST_F(MathOpsTest, ArgmaxRequiresInt32Destination) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        m.argmax(createTensor([2, 3], 'float32'), createTensor([2, 1], 'float32'), -1);
    )",
                                                kNs)),
                HasSubstr("argmax: dst"));
}

// gather reads one value per lane at the index argmax produced, which is how a
// classifier turns its logits into a confidence alongside a label. Its shape
// contract is argmax's: indices and dst carry src's shape with the gathered axis
// collapsed to 1.
TEST_F(MathOpsTest, GatherPicksTheIndexedValuePerLane) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([2, 3], 'float32'), [10, 11, 12, 20, 21, 22]);
        const indices = fillInt(createTensor([2, 1], 'int32'), [2, 0]);
        const dst = createTensor([2, 1], 'float32');
        m.gather(src, indices, dst, -1);
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {12, 20}));
}

TEST_F(MathOpsTest, GatherPairsWithArgmax) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([2, 4], 'float32'), [1, 9, 3, 2, 8, 0, 4, 7]);
        const indices = createTensor([2, 1], 'int32');
        const dst = createTensor([2, 1], 'float32');
        m.argmax(src, indices, -1);
        m.gather(src, indices, dst, -1);
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {9, 8}));
}

TEST_F(MathOpsTest, GatherHandlesANonTrailingAxis) {
    // A [2,2,2] tensor gathered along axis 1: inner is 2, so consecutive lanes
    // are strided rather than adjacent.
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([2, 2, 2], 'float32'), [1, 2, 3, 4, 5, 6, 7, 8]);
        const indices = fillInt(createTensor([2, 1, 2], 'int32'), [1, 0, 0, 1]);
        const dst = createTensor([2, 1, 2], 'float32');
        m.gather(src, indices, dst, 1);
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {3, 2, 5, 8}));
}

TEST_F(MathOpsTest, GatherAcceptsANegativeAxis) {
    auto explicitAxis = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([1, 3], 'float32'), [4, 5, 6]);
        const indices = fillInt(createTensor([1, 1], 'int32'), [1]);
        const dst = createTensor([1, 1], 'float32');
        m.gather(src, indices, dst, 1);
        return read(dst);
    )",
                                                    kNs));
    EXPECT_TRUE(almostEqual(explicitAxis, {5}));
}

TEST_F(MathOpsTest, GatherRejectsMismatchedShapes) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        m.gather(createTensor([2, 3], 'float32'), createTensor([2, 3], 'int32'),
                 createTensor([2, 1], 'float32'), -1);
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT",
                             "gather: indices shape must match src shape but with axis dimension 1"));

    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        m.gather(createTensor([2, 3], 'float32'), createTensor([2, 1], 'int32'),
                 createTensor([2, 3], 'float32'), -1);
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT",
                             "gather: dst shape must match src shape but with axis dimension 1"));
}

TEST_F(MathOpsTest, GatherRejectsAnOutOfRangeAxis) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        m.gather(createTensor([2, 3], 'float32'), createTensor([2, 1], 'int32'),
                 createTensor([2, 1], 'float32'), 5);
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT", "axis 5 out of range"));
}

TEST_F(MathOpsTest, GatherRejectsAliasedSourceAndDestination) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        const t = createTensor([1, 1], 'float32');
        m.gather(t, createTensor([1, 1], 'int32'), t, -1);
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT", "gather: src"));
}

TEST_F(MathOpsTest, GatherRequiresInt32Indices) {
    EXPECT_TRUE(isCodedError(evalThrowing(std::format(R"(
        {}
        m.gather(createTensor([2, 3], 'float32'), createTensor([2, 1], 'float32'),
                 createTensor([2, 1], 'float32'), -1);
    )",
                                                      kNs)),
                             "INVALID_ARGUMENT", "gather: indices"));
}

TEST_F(MathOpsTest, ThresholdBinarises) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = fill(createTensor([5], 'float32'), [0.1, 0.5, 0.49, 0.9, 0]);
        const dst = createTensor([5], 'float32');
        m.threshold(src, dst, 0.5);
        return read(dst);
    )",
                                              kNs));
    // The comparison is `>=`, so a value exactly on the threshold passes.
    EXPECT_TRUE(almostEqual(result, {0, 1, 0, 1, 0}));
}

TEST_F(MathOpsTest, OpsRejectWrongArgumentCounts) {
    EXPECT_THAT(evalThrowingMessage(std::format("{} m.sigmoid(createTensor([1], 'float32'));", kNs)),
                HasSubstr("Usage: sigmoid(src, dst)"));
    EXPECT_THAT(evalThrowingMessage(std::format("{} m.softmax(createTensor([1], 'float32'));", kNs)),
                HasSubstr("Usage: softmax(src, dst, axis)"));
    EXPECT_THAT(evalThrowingMessage(std::format("{} m.argmax(createTensor([1], 'float32'));", kNs)),
                HasSubstr("Usage: argmax(src, dst, axis)"));
    EXPECT_THAT(evalThrowingMessage(std::format("{} m.threshold(createTensor([1], 'float32'));", kNs)),
                HasSubstr("Usage: threshold(src, dst, threshold)"));
    EXPECT_THAT(evalThrowingMessage(std::format("{} m.gather(createTensor([1], 'float32'));", kNs)),
                HasSubstr("Usage: gather(src, indices, dst, axis)"));
}

} // namespace
} // namespace rnexecutorch::tests
