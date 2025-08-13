#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v);
void normalize(std::span<float> span);
void normalize(std::vector<float> &v);
void normalize(std::span<float> span);
std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask);
/**
 * @brief Checks if two floating-point numbers are considered equal.
 */
template <typename T>
bool isClose(T a, T b,
             T atol = std::numeric_limits<T>::epsilon() * static_cast<T>(10));

extern template bool isClose<float>(float, float, float);
extern template bool isClose<double>(double, double, double);

} // namespace rnexecutorch::numerical