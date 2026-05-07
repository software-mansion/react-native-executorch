#pragma once

#include <concepts>

namespace rnexecutorch::utils::computer_vision {

struct Point {
  float x;
  float y;
};

struct BBox {
  float width() const { return p2.x - p1.x; }
  float height() const { return p2.y - p1.y; }
  float area() const { return width() * height(); }

  bool isValid() const {
    return p2.x > p1.x && p2.y > p1.y && p1.x >= 0.0f && p1.y;
  }

  BBox scale(float widthRatio, float heightRatio) const {
    return {{p1.x * widthRatio, p1.y * heightRatio},
            {p2.x * widthRatio, p2.y * heightRatio}};
  }

  Point p1, p2;
};

template <typename T>
concept HasBBoxAndScore = requires(T t) {
  { t.bbox } -> std::convertible_to<BBox>;
  { t.score } -> std::convertible_to<float>;
};

} // namespace rnexecutorch::utils::computer_vision
