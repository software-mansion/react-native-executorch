#include <gtest/gtest.h>
#include <rnexecutorch/utils/computer_vision/Processing.h>
#include <rnexecutorch/utils/computer_vision/Types.h>
#include <vector>

using namespace rnexecutorch::utils::computer_vision;

// ============================================================================
// extractDetectionData — Extract bbox, score, label from raw tensor data
// ============================================================================

TEST(ExtractDetectionData, SingleDetection) {
  // Format: bboxData = [x1, y1, x2, y2] per detection
  //         scoresData = [score, label] per detection
  std::vector<float> bboxData = {10.0f, 20.0f, 100.0f, 200.0f};
  std::vector<float> scoresData = {0.95f, 5.0f};

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_FLOAT_EQ(bbox.x1, 10.0f);
  EXPECT_FLOAT_EQ(bbox.y1, 20.0f);
  EXPECT_FLOAT_EQ(bbox.x2, 100.0f);
  EXPECT_FLOAT_EQ(bbox.y2, 200.0f);
  EXPECT_FLOAT_EQ(score, 0.95f);
  EXPECT_EQ(label, 5);
}

TEST(ExtractDetectionData, MultipleDetections_FirstIndex) {
  std::vector<float> bboxData = {
      10.0f,  20.0f,  100.0f, 200.0f, // Detection 0
      150.0f, 50.0f,  250.0f, 150.0f, // Detection 1
      300.0f, 100.0f, 400.0f, 300.0f  // Detection 2
  };
  std::vector<float> scoresData = {
      0.95f, 5.0f, // Detection 0: score, label
      0.85f, 3.0f, // Detection 1
      0.75f, 12.0f // Detection 2
  };

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_FLOAT_EQ(bbox.x1, 10.0f);
  EXPECT_FLOAT_EQ(bbox.y1, 20.0f);
  EXPECT_FLOAT_EQ(bbox.x2, 100.0f);
  EXPECT_FLOAT_EQ(bbox.y2, 200.0f);
  EXPECT_FLOAT_EQ(score, 0.95f);
  EXPECT_EQ(label, 5);
}

TEST(ExtractDetectionData, MultipleDetections_SecondIndex) {
  std::vector<float> bboxData = {
      10.0f,  20.0f,  100.0f, 200.0f, // Detection 0
      150.0f, 50.0f,  250.0f, 150.0f, // Detection 1
      300.0f, 100.0f, 400.0f, 300.0f  // Detection 2
  };
  std::vector<float> scoresData = {
      0.95f, 5.0f, // Detection 0
      0.85f, 3.0f, // Detection 1
      0.75f, 12.0f // Detection 2
  };

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 1);

  EXPECT_FLOAT_EQ(bbox.x1, 150.0f);
  EXPECT_FLOAT_EQ(bbox.y1, 50.0f);
  EXPECT_FLOAT_EQ(bbox.x2, 250.0f);
  EXPECT_FLOAT_EQ(bbox.y2, 150.0f);
  EXPECT_FLOAT_EQ(score, 0.85f);
  EXPECT_EQ(label, 3);
}

TEST(ExtractDetectionData, MultipleDetections_ThirdIndex) {
  std::vector<float> bboxData = {
      10.0f,  20.0f,  100.0f, 200.0f, // Detection 0
      150.0f, 50.0f,  250.0f, 150.0f, // Detection 1
      300.0f, 100.0f, 400.0f, 300.0f  // Detection 2
  };
  std::vector<float> scoresData = {
      0.95f, 5.0f, // Detection 0
      0.85f, 3.0f, // Detection 1
      0.75f, 12.0f // Detection 2
  };

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 2);

  EXPECT_FLOAT_EQ(bbox.x1, 300.0f);
  EXPECT_FLOAT_EQ(bbox.y1, 100.0f);
  EXPECT_FLOAT_EQ(bbox.x2, 400.0f);
  EXPECT_FLOAT_EQ(bbox.y2, 300.0f);
  EXPECT_FLOAT_EQ(score, 0.75f);
  EXPECT_EQ(label, 12);
}

TEST(ExtractDetectionData, LowConfidenceDetection) {
  std::vector<float> bboxData = {50.0f, 60.0f, 150.0f, 160.0f};
  std::vector<float> scoresData = {0.05f, 1.0f}; // Very low confidence

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_FLOAT_EQ(score, 0.05f);
  EXPECT_EQ(label, 1);
}

TEST(ExtractDetectionData, ZeroBasedLabelIndex) {
  std::vector<float> bboxData = {0.0f, 0.0f, 100.0f, 100.0f};
  std::vector<float> scoresData = {0.9f, 0.0f}; // Label index 0

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_EQ(label, 0);
}

TEST(ExtractDetectionData, LargeLabelIndex) {
  std::vector<float> bboxData = {0.0f, 0.0f, 100.0f, 100.0f};
  std::vector<float> scoresData = {0.9f, 999.0f}; // Large label index

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_EQ(label, 999);
}

TEST(ExtractDetectionData, FloatToInt32Conversion) {
  std::vector<float> bboxData = {0.0f, 0.0f, 100.0f, 100.0f};
  std::vector<float> scoresData = {0.9f, 42.7f}; // Float label gets truncated

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_EQ(label, 42); // Should truncate, not round
}

TEST(ExtractDetectionData, NegativeCoordinates) {
  std::vector<float> bboxData = {-10.0f, -20.0f, 50.0f, 60.0f};
  std::vector<float> scoresData = {0.8f, 2.0f};

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_FLOAT_EQ(bbox.x1, -10.0f);
  EXPECT_FLOAT_EQ(bbox.y1, -20.0f);
  EXPECT_FLOAT_EQ(bbox.x2, 50.0f);
  EXPECT_FLOAT_EQ(bbox.y2, 60.0f);
}

TEST(ExtractDetectionData, FractionalCoordinates) {
  std::vector<float> bboxData = {10.5f, 20.75f, 100.25f, 200.9f};
  std::vector<float> scoresData = {0.88f, 7.0f};

  auto [bbox, score, label] =
      extractDetectionData(bboxData.data(), scoresData.data(), 0);

  EXPECT_FLOAT_EQ(bbox.x1, 10.5f);
  EXPECT_FLOAT_EQ(bbox.y1, 20.75f);
  EXPECT_FLOAT_EQ(bbox.x2, 100.25f);
  EXPECT_FLOAT_EQ(bbox.y2, 200.9f);
}
