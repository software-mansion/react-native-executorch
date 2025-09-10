#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::numerical {

/**
 * @brief Applies the softmax function in-place to a sequence of numbers.
 *
 * @param input A mutable span of floating-point numbers. After the function
 * returns, `input` contains the softmax probabilities.
 */
void softmax(std::span<float> input);

/**
 * @brief Applies the softmax function with temperature scaling in-place to a
 * sequence of numbers.
 *
 * The temperature parameter controls the "sharpness" of the resulting
 * probability distribution. A temperature of 1.0 means no scaling, while lower
 * values make the distribution sharper (more peaked), and higher values make it
 * softer (more uniform).
 *
 * @param input A mutable span of floating-point numbers. After the function
 * returns, `input` contains the softmax probabilities.
 * @param temperature A positive float value used to scale the logits before
 * applying softmax. Must be greater than 0.
 */
void softmaxWithTemperature(std::span<float> input, float temperature);

/**
 * @brief Normalizes the elements of the given float span in-place using the
 * L2 norm method.
 *
 * This function scales the input vector such that its L2 norm (Euclidean norm)
 * becomes 1. If the norm is zero, the result is a zero vector with the same
 * size as the input.
 *
 * @param input A mutable span of floating-point values representing the data to
 * be normalized.
 */
void normalize(std::span<float> input);

/**
 * @brief Computes mean pooling across the modelOutput adjusted by an attention
 * mask.
 *
 * This function aggregates the `modelOutput` span by sections defined by
 * `attnMask`, computing the mean of sections influenced by the mask. The result
 * is a vector where each element is the mean of a segment from the original
 * data.
 *
 * @param modelOutput A span of floating-point numbers representing the model
 * output.
 * @param attnMask A span of integers where each integer is a weight
 * corresponding to the elements in `modelOutput`.
 * @return A std::vector<float> containing the computed mean values of segments.
 */
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