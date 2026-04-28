#pragma once

#include <cstdint>
#include <vector>

namespace rnexecutorch::models::pose_estimation {

// Single keypoint (x, y)
struct Keypoint {
  int32_t x;
  int32_t y;
};

// N keypoints for one person, depending on the model in question
using PersonKeypoints = std::vector<Keypoint>;

// N people for each image
using PoseDetections = std::vector<PersonKeypoints>;

} // namespace rnexecutorch::models::pose_estimation
