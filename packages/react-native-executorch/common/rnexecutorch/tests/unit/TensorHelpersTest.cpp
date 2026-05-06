#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/evalue.h>
#include <gtest/gtest.h>
#include <rnexecutorch/utils/TensorHelpers.h>
#include <span>
#include <vector>

using namespace rnexecutorch::utils::tensor;
using executorch::aten::ScalarType;
using executorch::extension::make_tensor_ptr;
using executorch::runtime::EValue;

// ============================================================================
// toSpan<T>(Tensor) — Convert tensor to typed span
// ============================================================================

TEST(TensorHelpers, ToSpan_FloatTensor) {
  std::vector<float> data = {1.0f, 2.0f, 3.0f, 4.0f, 5.0f};
  auto tensor = make_tensor_ptr({5}, data.data(), ScalarType::Float);

  auto span = toSpan<float>(*tensor);

  EXPECT_EQ(span.size(), 5);
  EXPECT_FLOAT_EQ(span[0], 1.0f);
  EXPECT_FLOAT_EQ(span[1], 2.0f);
  EXPECT_FLOAT_EQ(span[2], 3.0f);
  EXPECT_FLOAT_EQ(span[3], 4.0f);
  EXPECT_FLOAT_EQ(span[4], 5.0f);
}

TEST(TensorHelpers, ToSpan_Int32Tensor) {
  std::vector<int32_t> data = {10, 20, 30, 40};
  auto tensor = make_tensor_ptr({4}, data.data(), ScalarType::Int);

  auto span = toSpan<int32_t>(*tensor);

  EXPECT_EQ(span.size(), 4);
  EXPECT_EQ(span[0], 10);
  EXPECT_EQ(span[1], 20);
  EXPECT_EQ(span[2], 30);
  EXPECT_EQ(span[3], 40);
}

TEST(TensorHelpers, ToSpan_MultidimensionalTensor) {
  std::vector<float> data = {1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f};
  auto tensor = make_tensor_ptr({2, 3}, data.data(), ScalarType::Float);

  auto span = toSpan<float>(*tensor);

  // Should flatten to 1D span
  EXPECT_EQ(span.size(), 6);
  EXPECT_FLOAT_EQ(span[0], 1.0f);
  EXPECT_FLOAT_EQ(span[5], 6.0f);
}

TEST(TensorHelpers, ToSpan_EmptyTensor) {
  std::vector<float> data;
  auto tensor = make_tensor_ptr({0}, data.data(), ScalarType::Float);

  auto span = toSpan<float>(*tensor);

  EXPECT_EQ(span.size(), 0);
}

// ============================================================================
// toSpan<T>(EValue) — Extract tensor from EValue then convert to span
// ============================================================================

TEST(TensorHelpers, ToSpan_FromEValue) {
  std::vector<float> data = {1.5f, 2.5f, 3.5f};
  auto tensor = make_tensor_ptr({3}, data.data(), ScalarType::Float);
  EValue evalue(*tensor);

  auto span = toSpan<float>(evalue);

  EXPECT_EQ(span.size(), 3);
  EXPECT_FLOAT_EQ(span[0], 1.5f);
  EXPECT_FLOAT_EQ(span[1], 2.5f);
  EXPECT_FLOAT_EQ(span[2], 3.5f);
}

TEST(TensorHelpers, ToSpan_FromEValue_LargeTensor) {
  std::vector<float> data(100);
  for (int i = 0; i < 100; ++i) {
    data[i] = static_cast<float>(i);
  }
  auto tensor = make_tensor_ptr({100}, data.data(), ScalarType::Float);
  EValue evalue(*tensor);

  auto span = toSpan<float>(evalue);

  EXPECT_EQ(span.size(), 100);
  EXPECT_FLOAT_EQ(span[0], 0.0f);
  EXPECT_FLOAT_EQ(span[50], 50.0f);
  EXPECT_FLOAT_EQ(span[99], 99.0f);
}

// ============================================================================
// Type safety and const correctness
// ============================================================================

TEST(TensorHelpers, SpanIsConst) {
  std::vector<float> data = {1.0f, 2.0f, 3.0f};
  auto tensor = make_tensor_ptr({3}, data.data(), ScalarType::Float);

  auto span = toSpan<float>(*tensor);

  // Verify span is const (compile-time check, but we can verify element type)
  static_assert(
      std::is_const_v<std::remove_reference_t<decltype(*span.data())>>);
}

TEST(TensorHelpers, CorrectDataPointer) {
  std::vector<float> data = {1.0f, 2.0f, 3.0f};
  auto tensor = make_tensor_ptr({3}, data.data(), ScalarType::Float);

  auto span = toSpan<float>(*tensor);

  // Span should point to the same data as the original tensor
  EXPECT_EQ(span.data(), tensor->const_data_ptr<float>());
}
