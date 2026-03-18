#pragma once

// NOTE: This header must NOT include <jsi/jsi.h> — it is used in JSI-free unit tests.

#include <array>
#include <string>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::utils {

struct FrameOrientation {
  std::string orientation; // "up"|"right"|"left"|"down"
  bool isMirrored;
  int frameWidth;  // raw frame width (sensor native, before any rotation)
  int frameHeight; // raw frame height (sensor native, before any rotation)
  bool rotate180 = false; // apply extra 180° after main rotation (front camera correction)
};

/**
 * @brief Transform a bounding box from raw frame pixel space to screen space.
 *
 * Maps coordinates from raw frame pixel space to screen space.
 * orientation describes how the buffer is rotated relative to screen,
 * so we apply that same rotation (not its inverse) to map buffer points
 * into screen space. Applies flip (if isMirrored) first, then rotation.
 * Coordinates are absolute pixels in the raw frame (not normalized [0,1]).
 * x1/y1 = top-left corner, x2/y2 = bottom-right corner.
 * After transform, x1<=x2 and y1<=y2 are guaranteed.
 */
void transformBbox(float &x1, float &y1, float &x2, float &y2,
                   const FrameOrientation &orient);

/**
 * @brief Rotate/flip a cv::Mat from raw frame space to screen space.
 *
 * Returns a new mat (does not modify input).
 * For right/left orientations, output rows/cols are swapped vs input.
 */
cv::Mat transformMat(const cv::Mat &mat, const FrameOrientation &orient);

/**
 * @brief Transform 4-point bbox from raw frame pixel space to screen space.
 *
 * Templated on point type — requires P to have float x and y members.
 * Applies same flip-then-rotate logic as transformBbox, per point.
 * Template implementation in header (required for templates).
 */
template <typename P>
void transformPoints(std::array<P, 4> &points,
                     const FrameOrientation &orient) {
  const float w = static_cast<float>(orient.frameWidth);
  const float h = static_cast<float>(orient.frameHeight);

  for (auto &p : points) {
    float x = p.x;
    float y = p.y;

    // Flip first
    if (orient.isMirrored) {
      x = w - x;
    }

    // Sensor native = landscape-left.
    float nx = x, ny = y;
    if (orient.orientation == "up") {
      // CW: new_x = h - y, new_y = x
      nx = h - y;
      ny = x;
    } else if (orient.orientation == "down") {
      // CW: new_x = h - y, new_y = x
      nx = h - y;
      ny = x;
    } else if (orient.orientation == "left") {
      // CCW: new_x = y, new_y = w - x
      nx = y;
      ny = w - x;
    } else if (orient.orientation == "right") {
      // CW: new_x = h - y, new_y = x
      nx = h - y;
      ny = x;
    }
    // "up" = landscape-left: no-op

    if (orient.rotate180) {
      nx = h - nx;
      ny = w - ny;
    }

    p.x = nx;
    p.y = ny;
  }
}

} // namespace rnexecutorch::utils
