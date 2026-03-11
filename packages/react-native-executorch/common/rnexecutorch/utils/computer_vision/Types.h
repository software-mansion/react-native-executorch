#pragma once

#include <concepts>

namespace rnexecutorch::utils::computer_vision {

struct BBox {
  float x1, y1, x2, y2;

  float width() const { return x2 - x1; }

  float height() const { return y2 - y1; }

  float area() const { return width() * height(); }

  bool isValid() const {
    return x2 > x1 && y2 > y1 && x1 >= 0.0f && y1 >= 0.0f;
  }
};

template <typename T>
concept HasBBoxAndScore = requires(T t) {
  { t.bbox } -> std::convertible_to<BBox>;
  { t.score } -> std::convertible_to<float>;
};

} // namespace rnexecutorch::utils::computer_vision
