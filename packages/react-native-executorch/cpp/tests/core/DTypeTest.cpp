#include <gtest/gtest.h>

#include "core/dtype.h"
#include "core/error.h"
#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using rnexecutorch::core::types::DType;
namespace error = rnexecutorch::core::error;
namespace types = rnexecutorch::core::types;

constexpr auto kInvalidArgument = error::RnExecuTorchErrorCode::InvalidArgument;

constexpr DType kAllDTypes[] = {DType::uint8, DType::int32, DType::int64,
                                DType::float32, DType::boolean};

TEST(DType, ParsesEverySupportedName) {
    EXPECT_EQ(types::dtypeFromString("uint8"), DType::uint8);
    EXPECT_EQ(types::dtypeFromString("int32"), DType::int32);
    EXPECT_EQ(types::dtypeFromString("int64"), DType::int64);
    EXPECT_EQ(types::dtypeFromString("float32"), DType::float32);
    // The JS name is "bool"; the enumerator is `boolean` because `bool` is a
    // keyword. A mismatch here would only surface as a rejected tensor dtype.
    EXPECT_EQ(types::dtypeFromString("bool"), DType::boolean);
    EXPECT_EQ(types::dtypeToString(DType::boolean), "bool");
}

TEST(DType, RejectsUnknownName) {
    EXPECT_TRUE(throwsCoded([] { types::dtypeFromString("float64"); }, kInvalidArgument));
    EXPECT_TRUE(throwsCoded([] { types::dtypeFromString(""); }, kInvalidArgument));
    // Names are matched exactly — no case folding, no aliases.
    EXPECT_TRUE(throwsCoded([] { types::dtypeFromString("Float32"); }, kInvalidArgument));
    EXPECT_TRUE(throwsCoded([] { types::dtypeFromString("float"); }, kInvalidArgument));
    EXPECT_TRUE(throwsCoded([] { types::dtypeFromString("boolean"); }, kInvalidArgument));
}

TEST(DType, StringRoundTrips) {
    for (auto dtype : kAllDTypes) {
        EXPECT_EQ(types::dtypeFromString(types::dtypeToString(dtype)), dtype);
    }
}

TEST(DType, ScalarTypeRoundTrips) {
    for (auto dtype : kAllDTypes) {
        EXPECT_EQ(types::dtypeFromScalarType(types::dtypeToScalarType(dtype)), dtype);
    }
}

TEST(DType, RejectsUnsupportedScalarType) {
    // ExecuTorch models can declare types the JS layer has no representation
    // for; those must be rejected rather than silently coerced.
    EXPECT_TRUE(throwsCoded(
        [] { types::dtypeFromScalarType(executorch::aten::ScalarType::Double); }, kInvalidArgument));
    EXPECT_TRUE(throwsCoded(
        [] { types::dtypeFromScalarType(executorch::aten::ScalarType::Half); }, kInvalidArgument));
}

TEST(DType, ElementSizeMatchesScalarType) {
    EXPECT_EQ(types::elementSize(DType::uint8), 1u);
    EXPECT_EQ(types::elementSize(DType::int32), 4u);
    EXPECT_EQ(types::elementSize(DType::int64), 8u);
    EXPECT_EQ(types::elementSize(DType::float32), 4u);
    // ExecuTorch stores Bool one byte per element, so a bool tensor's buffer is
    // sized like a uint8 one.
    EXPECT_EQ(types::elementSize(DType::boolean), 1u);
}

} // namespace
} // namespace rnexecutorch::tests
