#pragma once

#include <concepts>

namespace rnexecutorch::utils::computer_vision {

struct BBox {

  float width() const { return x2 - x1; }

  float height() const { return y2 - y1; }

  float area() const { return width() * height(); }

  bool isValid() const {
    return x2 > x1 && y2 > y1 && x1 >= 0.0f && y1 >= 0.0f;
  }

  BBox scale(float widthRatio, float heightRatio) const {
    return {x1 * widthRatio, y1 * heightRatio, x2 * widthRatio,
            y2 * heightRatio};
  }

  float x1, y1, x2, y2;
};

template <typename T>
concept HasBBoxAndScore = requires(T t) {
  { t.bbox } -> std::convertible_to<BBox>;
  { t.score } -> std::convertible_to<float>;
};

} // namespace rnexecutorch::utils::computer_vision
