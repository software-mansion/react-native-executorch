#include "../data_processing/Numerical.h"
#include <gtest/gtest.h>

namespace rnexecutorch::numerical {

// Helper function to check if two float vectors are approximately equal
void expect_vectors_eq(const std::vector<float> &vector1,
                       const std::vector<float> &vector2, float tol = 1e-6F) {
  ASSERT_EQ(vector1.size(), vector2.size());
  for (size_t i = 0; i < vector1.size(); i++) {
    EXPECT_NEAR(vector1[i], vector2[i], tol);
  }
}

TEST(NumericalTests, SoftmaxBasic) {
  std::vector<float> input = {1.0F, 2.0F, 3.0F};
  softmax(input);
  const std::vector<float> expected = {0.09003057f, 0.24472847f, 0.66524095F};
  expect_vectors_eq(input, expected);
}

TEST(NumericalTests, NormalizeBasic) {
  std::vector<float> input = {1.0F, 2.0F, 3.0F};
  normalize(input);
  const std::vector<float> expected = {-1.22474487f, 0.0F, 1.22474487F};
  expect_vectors_eq(input, expected);
}

TEST(NumericalTests, MeanPoolingBasic) {
  // Create vectors to initialize spans
  const std::vector<float> modelOutputVec = {1.0f, 2.0f, 3.0f,
                                             4.0f, 5.0f, 6.0f};
  const std::vector<int64_t> attnMaskVec = {1, 1, 1};

  std::span<const float> modelOutput(modelOutputVec);
  std::span<const int64_t> attnMask(attnMaskVec);

  const auto result = meanPooling(modelOutput, attnMask);
  const std::vector<float> expected = {3.0F, 4.0F};
  expect_vectors_eq(result, expected);
}

TEST(NumericalTests, NormalizeNearZeroVariance) {
  std::vector<float> input = {
      1.0F, 1.0F, 1.0F}; // All elements are the same - zero variance
  normalize(input);
  const std::vector<float> expected = {0.0F, 0.0F, 0.0F};
  expect_vectors_eq(input, expected);
}

} // namespace rnexecutorch::numerical