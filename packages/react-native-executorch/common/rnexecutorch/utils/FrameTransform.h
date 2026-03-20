#pragma once

#include <array>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/utils/computer_vision/Types.h>
#include <string>

namespace rnexecutorch::utils {

enum class Orientation { Up, Down, Left, Right };

inline Orientation orientationFromString(const std::string &s) {
  if (s == "down") {
    return Orientation::Down;
  }
  if (s == "left") {
    return Orientation::Left;
  }
  if (s == "right") {
    return Orientation::Right;
  }
  return Orientation::Up;
}

struct FrameOrientation {
  Orientation orientation;
  bool isMirrored;
};

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
 * Does not modify or clone the input — cv::rotate/cv::flip allocate
 * internally when needed. Returns the input mat unchanged when no
 * transform is needed (Up, not mirrored).
 */
cv::Mat rotateFrameForModel(const cv::Mat &mat, const FrameOrientation &orient);

/**
 * @brief Map bbox coords from rotated-frame space back to screen space.
 *
 * Inverse of rotateFrameForModel for coordinates.
 * rotatedSize is the rotated frame size (rotated.size()).
 */
void inverseRotateBbox(computer_vision::BBox &bbox,
                       const FrameOrientation &orient, cv::Size rotatedSize);

/**
 * @brief Rotate a cv::Mat from rotated-frame space back to screen space.
 *
 * Inverse of rotateFrameForModel for matrices.
 * Does not modify or clone the input.
 */
cv::Mat inverseRotateMat(const cv::Mat &mat, const FrameOrientation &orient);

/**
 * @brief Map 4-point bbox from rotated-frame space back to screen space.
 *
 * Inverse of rotateFrameForModel for 4-point bboxes.
 * rotatedSize is the rotated frame size (rotated.size()).
 * Templated on point type — requires P to have float x and y members.
 */
template <typename P>
void inverseRotatePoints(std::array<P, 4> &points,
                         const FrameOrientation &orient, cv::Size rotatedSize) {
  const float w = static_cast<float>(rotatedSize.width);
  const float h = static_cast<float>(rotatedSize.height);

  for (auto &p : points) {
    float x = p.x;
    float y = p.y;

    switch (orient.orientation) {
    case Orientation::Up:
      // landscape-left → portrait: nx = h-y, ny = x
      p.x = h - y;
      p.y = x;
      break;
    case Orientation::Right:
      // upside-down portrait → portrait: nx = w-x, ny = h-y
      p.x = w - x;
      p.y = h - y;
      break;
    case Orientation::Down:
      // landscape-right → portrait: nx = y, ny = w-x
      p.x = y;
      p.y = w - x;
      break;
    case Orientation::Left:
      break;
    }
  }

#if defined(__APPLE__)
  if (orient.isMirrored) {
    bool swapped = (orient.orientation == Orientation::Up ||
                    orient.orientation == Orientation::Down);
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
