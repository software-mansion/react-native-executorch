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

  switch (orient.orientation) {
  case Orientation::Left:
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
    break;
  case Orientation::Right:
#if defined(__APPLE__)
    cv::rotate(result, result, cv::ROTATE_90_COUNTERCLOCKWISE);
#else
    // Android front-cam in upright portrait reports orient=Right with
    // isMirrored=true; the sensor mount needs CW (same as back-cam Left)
    // to land upright for the model after the horizontal flip above.
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
#endif
    break;
  case Orientation::Down:
    cv::rotate(result, result, cv::ROTATE_180);
    break;
  case Orientation::Up:
    break;
  }

  return result;
}

void inverseRotateBbox(computer_vision::BBox &bbox,
                       const FrameOrientation &orient, cv::Size rotatedSize) {
  const float w = static_cast<float>(rotatedSize.width);
  const float h = static_cast<float>(rotatedSize.height);

  switch (orient.orientation) {
  case Orientation::Up: {
    // landscape-left → portrait: nx = h - y, ny = x
    float nx1 = h - bbox.p2.y, ny1 = bbox.p1.x;
    float nx2 = h - bbox.p1.y, ny2 = bbox.p2.x;
    bbox.p1 = {nx1, ny1};
    bbox.p2 = {nx2, ny2};
    break;
  }
  case Orientation::Right: {
#if defined(__APPLE__)
    // iOS upside-down portrait → portrait: nx = w - x, ny = h - y
    float nx1 = w - bbox.p2.x, ny1 = h - bbox.p2.y;
    float nx2 = w - bbox.p1.x, ny2 = h - bbox.p1.y;
    bbox.p1 = {nx1, ny1};
    bbox.p2 = {nx2, ny2};
#endif
    // Android front-cam upright portrait: rotated frame already in screen
    // space, no inverse needed.
    break;
  }
  case Orientation::Down: {
    // landscape-right → portrait: nx = y, ny = w - x
    float nx1 = bbox.p1.y, ny1 = w - bbox.p2.x;
    float nx2 = bbox.p2.y, ny2 = w - bbox.p1.x;
    bbox.p1 = {nx1, ny1};
    bbox.p2 = {nx2, ny2};
    break;
  }
  case Orientation::Left:
    // no-op (coords already in screen space)
    break;
  }

#if defined(__APPLE__)
  if (orient.isMirrored) {
    // After CW/CCW rotation (Up/Down) screen dims are swapped: rH × rW.
    // After no-op/180° (Left/Right) screen dims are unchanged: rW × rH.
    bool swapped = (orient.orientation == Orientation::Up ||
                    orient.orientation == Orientation::Down);
    float sw = swapped ? h : w;
    float sh = swapped ? w : h;
    float nx1 = sw - bbox.p2.x, ny1 = sh - bbox.p2.y;
    float nx2 = sw - bbox.p1.x, ny2 = sh - bbox.p1.y;
    bbox.p1 = {nx1, ny1};
    bbox.p2 = {nx2, ny2};
  }
#endif
}

cv::Mat inverseRotateMat(const cv::Mat &mat, const FrameOrientation &orient) {
  cv::Mat result;
  switch (orient.orientation) {
  case Orientation::Up:
    cv::rotate(mat, result, cv::ROTATE_90_CLOCKWISE);
    break;
  case Orientation::Right:
#if defined(__APPLE__)
    cv::rotate(mat, result, cv::ROTATE_180);
#else
    // Android front-cam upright portrait: mask already in screen space.
    result = mat;
#endif
    break;
  case Orientation::Down:
    cv::rotate(mat, result, cv::ROTATE_90_COUNTERCLOCKWISE);
    break;
  case Orientation::Left:
    // no-op (mask already in screen space)
    result = mat;
    break;
  }

#if defined(__APPLE__)
  if (orient.isMirrored) {
    cv::rotate(result, result, cv::ROTATE_180);
  }
#endif
  return result;
}

} // namespace rnexecutorch::utils
