#include "../data_processing/Numerical.h"
#include <gtest/gtest.h>
#include <limits>

namespace rnexecutorch::numerical {

// Helper function to check if two float vectors are approximately equal
void expect_vectors_eq(const std::vector<float> &vector1,
                       const std::vector<float> &vector2, float atol = 1e-6F) {
  ASSERT_EQ(vector1.size(), vector2.size());
  for (size_t i = 0; i < vector1.size(); i++) {
    EXPECT_NEAR(vector1[i], vector2[i], atol);
  }
}

TEST(SoftmaxTests, SoftmaxBasic) {
  std::vector<float> input = {1.0F, 2.0F, 3.0F};
  softmax(input);
  const std::vector<float> expected = {0.09003057F, 0.24472847F, 0.66524095F};
  expect_vectors_eq(input, expected);
}

TEST(SoftmaxTests, SoftmaxWithBigValues) {
  std::vector<float> input = {100000.0F, 100000.0F, 100000.0F};
  softmax(input);
  const std::vector<float> expected = {0.3333333F, 0.3333333F, 0.3333333F};
  expect_vectors_eq(input, expected);
}

TEST(NormalizeTests, NormalizeBasic) {
  std::vector<float> input = {1.0F, 2.0F, 3.0F};
  normalize(input);
  const auto normOfInput = std::sqrtf(14.0F);
  const std::vector<float> expected = {1.0F / normOfInput, 2.0F / normOfInput,
                                       3.0F / normOfInput};
  expect_vectors_eq(input, expected);
}

TEST(NormalizeTests, NormalizationOfExtremelySmallValues) {
  constexpr auto epsilon = std::numeric_limits<float>::epsilon();
  std::vector<float> input(3, epsilon);
  const std::vector<float> expected = input;
  normalize(input);
  expect_vectors_eq(input, expected);
}

TEST(MeanPoolingTests, MeanPoolingBasic) {
  const std::vector<float> modelOutputVec = {1.0F, 2.0F, 3.0F,
                                             4.0F, 5.0F, 6.0F};
  const std::vector<int64_t> attnMaskVec = {1, 1, 0};

  std::span<const float> modelOutput(modelOutputVec);
  std::span<const int64_t> attnMask(attnMaskVec);

  const auto result = meanPooling(modelOutput, attnMask);
  const std::vector<float> expected = {2.0F, 3.0F};
  expect_vectors_eq(result, expected);
}

TEST(MeanPoolingTests, MeanPoolingWithZeroAttentionMask) {
  const std::vector<float> modelOutputVec = {1.0F, 2.0F, 3.0F,
                                             4.0F, 5.0F, 6.0F};
  const std::vector<int64_t> attnMaskVec = {0, 0, 0};

  std::span<const float> modelOutput(modelOutputVec);
  std::span<const int64_t> attnMask(attnMaskVec);

  const auto result = meanPooling(modelOutput, attnMask);
  const std::vector<float> expected = {0.0F, 0.0F};
  expect_vectors_eq(result, expected);
}

TEST(MeanPoolingTests, InvalidDimensionSize) {
  const std::vector<float> modelOutput = {1.0F, 2.0F, 3.0F, 4.0F};
  const std::vector<int64_t> attnMask = {1, 1, 1};

  EXPECT_THROW(
      { meanPooling(modelOutput, attnMask); },
      std::invalid_argument);
}

TEST(MeanPoolingTests, EmptyAttentionMask) {
  const std::vector<float> modelOutput = {1.0F, 2.0F, 3.0F, 4.0F};
  const std::vector<int64_t> attnMask = {};

  EXPECT_THROW(
      { meanPooling(modelOutput, attnMask); },
      std::invalid_argument);
}

} // namespace rnexecutorch::numerical
