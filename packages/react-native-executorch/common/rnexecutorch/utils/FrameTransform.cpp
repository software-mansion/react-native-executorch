#include "FrameTransform.h"

namespace rnexecutorch::utils {

cv::Mat rotateFrameForModel(const cv::Mat &mat,
                            const FrameOrientation &orient) {
  if (!orient.isMirrored && orient.orientation == Orientation::Up) {
    return mat;
  }

  cv::Mat result;

  if (orient.isMirrored) {
    cv::flip(mat, result, 1);
  } else {
    result = mat;
  }

  if (orient.orientation == Orientation::Left) {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else if (orient.orientation == Orientation::Right) {
    cv::rotate(result, result, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else if (orient.orientation == Orientation::Down) {
    cv::rotate(result, result, cv::ROTATE_180);
  }
  // Up = no rotation needed.

  return result;
}

void inverseRotateBbox(float &x1, float &y1, float &x2, float &y2,
                       const FrameOrientation &orient, int rW, int rH) {
  const float w = static_cast<float>(rW);
  const float h = static_cast<float>(rH);

  if (orient.orientation == Orientation::Up) {
    // landscape-left → portrait: nx = h - y, ny = x
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  } else if (orient.orientation == Orientation::Right) {
    // upside-down portrait → portrait: nx = w - x, ny = h - y
    float nx1 = w - x2, ny1 = h - y2;
    float nx2 = w - x1, ny2 = h - y1;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  } else if (orient.orientation == Orientation::Down) {
    // landscape-right → portrait: nx = y, ny = w - x
    float nx1 = y1, ny1 = w - x2;
    float nx2 = y2, ny2 = w - x1;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  }
  // Left: no-op (coords already in screen space)

#if defined(__APPLE__)
  if (orient.isMirrored) {
    // After CW/CCW rotation (Up/Down) screen dims are swapped: rH × rW.
    // After no-op/180° (Left/Right) screen dims are unchanged: rW × rH.
    bool swapped = (orient.orientation == Orientation::Up || orient.orientation == Orientation::Down);
    float sw = swapped ? h : w;
    float sh = swapped ? w : h;
    float nx1 = sw - x2, ny1 = sh - y2;
    float nx2 = sw - x1, ny2 = sh - y1;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  }
#endif
}

cv::Mat inverseRotateMat(const cv::Mat &mat, const FrameOrientation &orient) {
  cv::Mat result;
  if (orient.orientation == Orientation::Up) {
    cv::rotate(mat, result, cv::ROTATE_90_CLOCKWISE);
  } else if (orient.orientation == Orientation::Right) {
    cv::rotate(mat, result, cv::ROTATE_180);
  } else if (orient.orientation == Orientation::Down) {
    cv::rotate(mat, result, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else {
    result = mat;
  }
  // Left: no-op (mask already in screen space)

#if defined(__APPLE__)
  if (orient.isMirrored) {
    cv::rotate(result, result, cv::ROTATE_180);
  }
#endif
  return result;
}

} // namespace rnexecutorch::utils
