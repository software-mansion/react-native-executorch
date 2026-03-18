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

  // Sensor native = landscape-left ("up" = no-op).
  // "up"    = landscape-left: no-op.
  // "down"  = landscape-right: 180°.
  // "left"  = portrait: CCW (new_x = y, new_y = w - x).
  // "right" = upside-down portrait: CW (new_x = h - y, new_y = x).
  if (orient.orientation == "up") {
    // CW: new_x = h - y, new_y = x
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  } else if (orient.orientation == "down") {
    // CW: new_x = h - y, new_y = x
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  } else if (orient.orientation == "left") {
    // CCW: new_x = y, new_y = w - x
    float nx1 = y1, ny1 = w - x2;
    float nx2 = y2, ny2 = w - x1;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  } else {
    assert(orient.orientation == "right" && "Unknown orientation; expected up/right/left/down");
    // CW: new_x = h - y, new_y = x
    float nx1 = h - y2, ny1 = x1;
    float nx2 = h - y1, ny2 = x2;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  }

  // Extra 180° in post-rotation screen space (screen dims are h x w after CW).
  if (orient.rotate180) {
    float nx1 = h - x2, ny1 = w - y2;
    float nx2 = h - x1, ny2 = w - y1;
    x1 = nx1; y1 = ny1;
    x2 = nx2; y2 = ny2;
  }
}

cv::Mat transformMat(const cv::Mat &mat, const FrameOrientation &orient) {
  cv::Mat result = mat.clone();

  // Flip first
  if (orient.isMirrored) {
    cv::flip(result, result, 1);
  }

  // Sensor native = landscape-left ("up" = no-op).
  if (orient.orientation == "up") {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else if (orient.orientation == "down") {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else if (orient.orientation == "left") {
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  } else {
    assert(orient.orientation == "right" && "Unknown orientation; expected up/right/left/down");
    cv::rotate(result, result, cv::ROTATE_90_CLOCKWISE);
  }

  if (orient.rotate180) {
    cv::rotate(result, result, cv::ROTATE_180);
  }

  return result;
}

} // namespace rnexecutorch::utils
