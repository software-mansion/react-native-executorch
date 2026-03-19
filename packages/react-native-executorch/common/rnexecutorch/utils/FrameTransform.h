#pragma once

// NOTE: This header must NOT include <jsi/jsi.h> — it is used in JSI-free unit
// tests.

#include <array>
#include <opencv2/opencv.hpp>
#include <string>

namespace rnexecutorch::utils {

struct FrameOrientation {
  std::string orientation; // "up"|"right"|"left"|"down"
  bool isMirrored;
  int frameWidth;  // raw frame width (sensor native, before any rotation)
  int frameHeight; // raw frame height (sensor native, before any rotation)
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
 * @brief Rotate/flip a cv::Mat so the model sees an upright image.
 *
 * Applies the correct rotation per orientation so the output matches how a
 * human would see the scene, regardless of device orientation:
 *   "up"    (landscape-left)       → no rotation
 *   "down"  (landscape-right)      → 180°
 *   "left"  (portrait upright)     → CW
 *   "right" (portrait upside-down) → CCW
 * Also applies isMirrored flip.
 * Returns a new mat (does not modify input).
 */
cv::Mat rotateFrameForModel(const cv::Mat &mat, const FrameOrientation &orient);

/**
 * @brief Map bbox coords from rotated-frame space back to screen space.
 *
 * Inverse of rotateFrameForModel for coordinates.
 * rW/rH are the rotated frame dimensions (rotated.cols / rotated.rows).
 */
void inverseRotateBbox(float &x1, float &y1, float &x2, float &y2,
                       const FrameOrientation &orient, int rW, int rH);

/**
 * @brief Rotate a cv::Mat from rotated-frame space back to screen space.
 *
 * Inverse of rotateFrameForModel for matrices.
 * Returns a new mat (does not modify input).
 */
cv::Mat inverseRotateMat(const cv::Mat &mat, const FrameOrientation &orient);

/**
 * @brief Transform 4-point bbox from raw frame pixel space to screen space.
 *
 * Templated on point type — requires P to have float x and y members.
 * Applies same flip-then-rotate logic as transformBbox, per point.
 * Template implementation in header (required for templates).
 */
template <typename P>
void transformPoints(std::array<P, 4> &points, const FrameOrientation &orient) {
  const float w = static_cast<float>(orient.frameWidth);
  const float h = static_cast<float>(orient.frameHeight);

  for (auto &p : points) {
    float x = p.x;
    float y = p.y;

    // Flip first
    if (orient.isMirrored) {
      x = w - x;
    }

    // Sensor native = landscape-left — apply CW rotation for all orientations.
    p.x = h - y;
    p.y = x;
  }
}

/**
 * @brief Map 4-point bbox from rotated-frame space back to screen space.
 *
 * Inverse of rotateFrameForModel for 4-point bboxes.
 * rW/rH are the rotated frame dimensions (rotated.cols / rotated.rows).
 * Templated on point type — requires P to have float x and y members.
 */
template <typename P>
void inverseRotatePoints(std::array<P, 4> &points,
                         const FrameOrientation &orient, int rW, int rH) {
  const float w = static_cast<float>(rW);
  const float h = static_cast<float>(rH);

  for (auto &p : points) {
    float x = p.x;
    float y = p.y;

    if (orient.orientation == "up") {
      // CW: nx = h-y, ny = x
      p.x = h - y;
      p.y = x;
    } else if (orient.orientation == "right") {
      // 180°: nx = w-x, ny = h-y
      p.x = w - x;
      p.y = h - y;
    } else if (orient.orientation == "down") {
      // CCW: nx = y, ny = w-x
      p.x = y;
      p.y = w - x;
    }
    // "left": no-op
  }

#if defined(__APPLE__)
  if (orient.isMirrored) {
    bool swapped = (orient.orientation == "up" || orient.orientation == "down");
    float sw = swapped ? h : w;
    float sh = swapped ? w : h;
    for (auto &p : points) {
      p.x = sw - p.x;
      p.y = sh - p.y;
    }
  }
#endif
}

} // namespace rnexecutorch::utils
