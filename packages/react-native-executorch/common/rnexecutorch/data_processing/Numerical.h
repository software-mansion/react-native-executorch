#pragma once

#include <span>
#include <vector>

/**
 * @namespace rnexecutorch::numerical
 * @brief Namespace for numerical operations and transformations.
 */
namespace rnexecutorch::numerical {

/**
 * @brief Applies the softmax function in-place to a sequence of numbers.
 *
 * This function computes the softmax of each element in the `input` span. The
 * softmax transformation is applied directly in the span passed, modifying its
 * contents.
 *
 * @param input A mutable span of floating-point numbers. After the function
 * returns, `input` contains the softmax probabilities.
 */
void softmax(std::span<float> input);

/**
 * @brief Normalizes the elements of the given float span in-place using the
 * Z-score method.
 *
 * This function adjusts the elements in `input` such that their mean is 0 and
 * the standard deviation is 1. The normalization is computed and applied
 * directly in the provided span.
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

} // namespace rnexecutorch::numerical
