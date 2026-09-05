#include <format>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using TensorTest = JsiTestEnv;
using ::testing::HasSubstr;

// The tensor HostObject is the type every extension op takes and returns, so
// its property surface, bounds checks and disposal semantics are exercised
// through JS exactly as the TypeScript layer uses them.

constexpr const char *kNs = "const rne = __rnexecutorch_jsi__;";

TEST_F(TensorTest, InstallsUnderTheProductionGlobal) {
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__;"), "object");
    EXPECT_EQ(evalString("return typeof __rnexecutorch_jsi__.createTensor;"), "function");
}

TEST_F(TensorTest, ExposesShapeDtypeAndNumel) {
    EXPECT_TRUE(almostEqual(
        evalNumberArray(std::format("{} return rne.createTensor([2, 3, 4], 'float32').shape;", kNs)),
        {2, 3, 4}));
    EXPECT_EQ(evalString(std::format("{} return rne.createTensor([2, 3], 'int32').dtype;", kNs)), "int32");
    EXPECT_EQ(evalNumber(std::format("{} return rne.createTensor([2, 3, 4], 'float32').numel;", kNs)), 24);
}

TEST_F(TensorTest, ScalarShapeIsASingleElement) {
    // An empty shape is a rank-0 tensor: one element, not zero.
    EXPECT_EQ(evalNumber(std::format("{} return rne.createTensor([], 'float32').numel;", kNs)), 1);
}

TEST_F(TensorTest, RejectsNonPositiveDimensions) {
    EXPECT_THAT(evalThrowingMessage(std::format("{} rne.createTensor([2, 0], 'float32');", kNs)),
                HasSubstr("Shape dimensions must be positive"));
    EXPECT_THAT(evalThrowingMessage(std::format("{} rne.createTensor([-1], 'float32');", kNs)),
                HasSubstr("Shape dimensions must be positive"));
}

TEST_F(TensorTest, RejectsUnknownDtype) {
    // dtypeFromString names the dtypes it does accept, which is what a caller
    // needs; the context prefix is not added on this path.
    EXPECT_TRUE(isCodedError(evalThrowing(std::format("{} rne.createTensor([2], 'float64');", kNs)),
                             "INVALID_ARGUMENT", "Unsupported dtype: 'float64'"));
}

TEST_F(TensorTest, AcceptsTheBoolDtype) {
    // bool tensors back the mask outputs of the segmentation models; one byte
    // per element, like uint8.
    EXPECT_EQ(evalNumber(std::format("{} return rne.createTensor([2, 3], 'bool').numel;", kNs)), 6);
    EXPECT_EQ(evalString(std::format("{} return rne.createTensor([2, 3], 'bool').dtype;", kNs)), "bool");
}

TEST_F(TensorTest, RejectsWrongArgumentCount) {
    EXPECT_THAT(evalThrowingMessage(std::format("{} rne.createTensor([2]);", kNs)),
                HasSubstr("Usage: createTensor(shape, dtype)"));
}

TEST_F(TensorTest, SetDataAndGetDataRoundTrip) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const t = rne.createTensor([2, 2], 'float32');
        t.setData(new Float32Array([1.5, -2.5, 3.0, 4.25]));
        const out = new Float32Array(4);
        t.getData(out);
        return Array.from(out);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1.5, -2.5, 3.0, 4.25}));
}

TEST_F(TensorTest, SetDataRejectsSizeMismatch) {
    // The tensor holds 4 float32s (16 bytes); a 3-element array is 12.
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const t = rne.createTensor([2, 2], 'float32');
        t.setData(new Float32Array([1, 2, 3]));
    )",
                                                kNs)),
                HasSubstr("Data size mismatch"));
}

TEST_F(TensorTest, SetDataRespectsTypedArrayViewOffset) {
    // A subarray view must copy only its own window, not the whole buffer.
    auto result = evalNumberArray(std::format(R"(
        {}
        const backing = new Float32Array([9, 9, 1, 2, 3, 4]);
        const t = rne.createTensor([4], 'float32');
        t.setData(backing.subarray(2));
        const out = new Float32Array(4);
        t.getData(out);
        return Array.from(out);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {1, 2, 3, 4}));
}

TEST_F(TensorTest, CopyToDuplicatesContents) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = rne.createTensor([3], 'int32');
        src.setData(new Int32Array([7, 8, 9]));
        const dst = rne.createTensor([3], 'int32');
        src.copyTo(dst);
        const out = new Int32Array(3);
        dst.getData(out);
        return Array.from(out);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {7, 8, 9}));
}

TEST_F(TensorTest, CopyToHonoursOffsetAndLength) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const src = rne.createTensor([5], 'int32');
        src.setData(new Int32Array([1, 2, 3, 4, 5]));
        const dst = rne.createTensor([2], 'int32');
        src.copyTo(dst, {{ offset: 1, length: 2 }});
        const out = new Int32Array(2);
        dst.getData(out);
        return Array.from(out);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {2, 3}));
}

TEST_F(TensorTest, CopyToRejectsOutOfBoundsWindow) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const src = rne.createTensor([3], 'int32');
        const dst = rne.createTensor([3], 'int32');
        src.copyTo(dst, {{ offset: 2, length: 3 }});
    )",
                                                kNs)),
                HasSubstr("out of bounds"));
}

TEST_F(TensorTest, CopyToRejectsAliasingItself) {
    // Aliased src/dst would memcpy a buffer onto itself under two locks; the
    // guard must reject it rather than deadlock or corrupt.
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const t = rne.createTensor([3], 'int32');
        t.copyTo(t);
    )",
                                                kNs)),
                HasSubstr("copyTo"));
}

TEST_F(TensorTest, DisposeIsNotIdempotent) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const t = rne.createTensor([2], 'float32');
        t.dispose();
        t.dispose();
    )",
                                                kNs)),
                HasSubstr("already been disposed"));
}

TEST_F(TensorTest, OperationsOnDisposedTensorThrow) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const t = rne.createTensor([2], 'float32');
        t.dispose();
        t.setData(new Float32Array([1, 2]));
    )",
                                                kNs)),
                HasSubstr("disposed"));
}

TEST_F(TensorTest, ThroughPipesTensorIntoCallback) {
    // `through` exists so JS can chain ops; it must pass the tensor as the first
    // argument and forward the rest.
    EXPECT_EQ(evalNumber(std::format(R"(
        {}
        const t = rne.createTensor([4], 'float32');
        return t.through((tensor, extra) => tensor.numel + extra, 10);
    )",
                                     kNs)),
              14);
}

TEST_F(TensorTest, ThroughIfSkipsWhenPredicateIsFalse) {
    EXPECT_EQ(evalNumber(std::format(R"(
        {}
        const t = rne.createTensor([4], 'float32');
        const out = t.throughIf(false, () => 99);
        return out.numel;
    )",
                                     kNs)),
              4);

    EXPECT_EQ(evalNumber(std::format(R"(
        {}
        const t = rne.createTensor([4], 'float32');
        return t.throughIf(true, () => 99);
    )",
                                     kNs)),
              99);
}

TEST_F(TensorTest, UnknownPropertyIsUndefined) {
    EXPECT_EQ(evalString(std::format("{} return typeof rne.createTensor([2], 'float32').notAThing;", kNs)),
              "undefined");
}

} // namespace
} // namespace rnexecutorch::tests
