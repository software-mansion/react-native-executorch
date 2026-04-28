#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/utils/computer_vision/Types.h>
#include <string>
#include <type_traits>

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
 * @brief A 2D point with mutable arithmetic `x` and `y` members.
 *
 * Satisfied by e.g. `cv::Point2f`, `cv::Point`, and any user-defined struct
 * shaped `{ T x; T y; }` where `T` is arithmetic.
 */
template <typename P>
concept Point2D = requires(P &p) {
  requires std::is_arithmetic_v<std::remove_reference_t<decltype(p.x)>>;
  requires std::is_arithmetic_v<std::remove_reference_t<decltype(p.y)>>;
};

/**
 * @brief Map a sequence of points from rotated-frame space back to screen
 * space. Inverse of rotateFrameForModel for a collection of points.
 *
 * Works on any iterable whose elements satisfy {@link Point2D}
 * (e.g. `std::array<P, 4>`, `std::vector<P>`).
 * rotatedSize is the rotated frame size (rotated.size()).
 */
template <typename Points>
  requires Point2D<typename Points::value_type>
void inverseRotatePoints(Points &points, const FrameOrientation &orient,
                         cv::Size rotatedSize) {
  const float w = static_cast<float>(rotatedSize.width);
  const float h = static_cast<float>(rotatedSize.height);

  using Coord = decltype(std::declval<Points>().begin()->x);

  for (auto &p : points) {
    float x = static_cast<float>(p.x);
    float y = static_cast<float>(p.y);

    switch (orient.orientation) {
    case Orientation::Up:
      // landscape-left → portrait: nx = h-y, ny = x
      p.x = static_cast<Coord>(h - y);
      p.y = static_cast<Coord>(x);
      break;
    case Orientation::Right:
      // upside-down portrait → portrait: nx = w-x, ny = h-y
      p.x = static_cast<Coord>(w - x);
      p.y = static_cast<Coord>(h - y);
      break;
    case Orientation::Down:
      // landscape-right → portrait: nx = y, ny = w-x
      p.x = static_cast<Coord>(y);
      p.y = static_cast<Coord>(w - x);
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
      p.x = static_cast<Coord>(sw - static_cast<float>(p.x));
      p.y = static_cast<Coord>(sh - static_cast<float>(p.y));
    }
  }
#endif
}

} // namespace rnexecutorch::utils
