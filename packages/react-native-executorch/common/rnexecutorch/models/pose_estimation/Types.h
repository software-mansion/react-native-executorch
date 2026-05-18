#pragma once

#include <rnexecutorch/utils/computer_vision/Types.h>
#include <vector>

namespace rnexecutorch::models::pose_estimation {

// N keypoints for one person, depending on the model in question
using PersonKeypoints = std::vector<utils::computer_vision::Point>;

// N people for each image
using PoseDetections = std::vector<PersonKeypoints>;

} // namespace rnexecutorch::models::pose_estimation
