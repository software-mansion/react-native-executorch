#include <stdexcept>

#include <gtest/gtest.h>

#include "core/dtype.h"

namespace {
using rnexecutorch::core::types::DType;
namespace types = rnexecutorch::core::types;

// dtype is the one piece of the package with no JSI in its signature, so it is
// tested directly rather than through a runtime.

TEST(DType, ParsesEverySupportedName) {
    EXPECT_EQ(types::dtypeFromString("uint8"), DType::uint8);
    EXPECT_EQ(types::dtypeFromString("int32"), DType::int32);
    EXPECT_EQ(types::dtypeFromString("int64"), DType::int64);
    EXPECT_EQ(types::dtypeFromString("float32"), DType::float32);
}

TEST(DType, RejectsUnknownName) {
    EXPECT_THROW(types::dtypeFromString("float64"), std::invalid_argument);
    EXPECT_THROW(types::dtypeFromString(""), std::invalid_argument);
    // Names are matched exactly — no case folding, no aliases.
    EXPECT_THROW(types::dtypeFromString("Float32"), std::invalid_argument);
    EXPECT_THROW(types::dtypeFromString("float"), std::invalid_argument);
}

TEST(DType, StringRoundTrips) {
    for (auto dtype : {DType::uint8, DType::int32, DType::int64, DType::float32}) {
        EXPECT_EQ(types::dtypeFromString(types::dtypeToString(dtype)), dtype);
    }
}

TEST(DType, ScalarTypeRoundTrips) {
    for (auto dtype : {DType::uint8, DType::int32, DType::int64, DType::float32}) {
        EXPECT_EQ(types::dtypeFromScalarType(types::dtypeToScalarType(dtype)), dtype);
    }
}

TEST(DType, RejectsUnsupportedScalarType) {
    // ExecuTorch models can declare types the JS layer has no representation
    // for; those must be rejected rather than silently coerced.
    EXPECT_THROW(types::dtypeFromScalarType(executorch::aten::ScalarType::Double),
                 std::invalid_argument);
    EXPECT_THROW(types::dtypeFromScalarType(executorch::aten::ScalarType::Bool),
                 std::invalid_argument);
}

TEST(DType, ElementSizeMatchesScalarType) {
    EXPECT_EQ(types::elementSize(DType::uint8), 1u);
    EXPECT_EQ(types::elementSize(DType::int32), 4u);
    EXPECT_EQ(types::elementSize(DType::int64), 8u);
    EXPECT_EQ(types::elementSize(DType::float32), 4u);
}

} // namespace
