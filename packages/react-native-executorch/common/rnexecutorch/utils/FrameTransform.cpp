#include "FrameTransform.h"
#include <cassert>

namespace rnexecutorch::utils {

void transformBbox(float &x1, float &y1, float &x2, float &y2,
                   const FrameOrientation &orient) {
  const float w = static_cast<float>(orient.frameWidth);
  const float h = static_cast<float>(orient.frameHeight);

  // Flip horizontally first
  if (orient.isMirrored) {
    float nx1 = w - x2;
    float nx2 = w - x1;
    x1 = nx1;
    x2 = nx2;
  }

  // Sensor native = landscape-left — apply CW rotation for all orientations.
  {
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  }
}

cv::Mat transformMat(const cv::Mat &mat, const FrameOrientation &orient) {
  cv::Mat result = mat.clone();

  // Flip first
  if (orient.isMirrored) {
    cv::flip(result, result, 1);
  }

  // Sensor native = landscape-left — apply CW rotation.
  cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);

  return result;
}

cv::Mat rotateFrameForModel(const cv::Mat &mat,
                            const FrameOrientation &orient) {
  cv::Mat result = mat.clone();

  if (orient.isMirrored) {
    cv::flip(result, result, 1);
  }

  if (orient.orientation == "left") {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else if (orient.orientation == "right") {
    cv::rotate(result, result, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else if (orient.orientation == "down") {
    cv::rotate(result, result, cv::ROTATE_180);
  }
  // "up" = no rotation needed.

  return result;
}

void inverseRotateBbox(float &x1, float &y1, float &x2, float &y2,
                       const FrameOrientation &orient, int rW, int rH) {
  const float w = static_cast<float>(rW);
  const float h = static_cast<float>(rH);

  if (orient.orientation == "up") {
    // CW: nx = h - y, ny = x
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  } else if (orient.orientation == "right") {
    // 180°: nx = w - x, ny = h - y
    float nx1 = w - x2, ny1 = h - y2;
    float nx2 = w - x1, ny2 = h - y1;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  } else if (orient.orientation == "down") {
    // CCW: nx = y, ny = w - x
    float nx1 = y1, ny1 = w - x2;
    float nx2 = y2, ny2 = w - x1;
    x1 = nx1;
    y1 = ny1;
    x2 = nx2;
    y2 = ny2;
  }
  // "left": no-op (coords already in screen space)

#if defined(__APPLE__)
  if (orient.isMirrored) {
    // After CW/CCW rotation ("up"/"down") screen dims are swapped: rH × rW.
    // After no-op/180° ("left"/"right") screen dims are unchanged: rW × rH.
    bool swapped = (orient.orientation == "up" || orient.orientation == "down");
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
  cv::Mat result = mat.clone();
  if (orient.orientation == "up") {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else if (orient.orientation == "right") {
    cv::rotate(result, result, cv::ROTATE_180);
  } else if (orient.orientation == "down") {
    cv::rotate(result, result, cv::ROTATE_90_COUNTERCLOCKWISE);
  }
  // "left": no-op (mask already in screen space)

#if defined(__APPLE__)
  if (orient.isMirrored) {
    cv::rotate(result, result, cv::ROTATE_180);
  }
#endif
  return result;
}

} // namespace rnexecutorch::utils
