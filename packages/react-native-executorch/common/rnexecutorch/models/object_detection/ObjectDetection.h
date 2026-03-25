#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>

namespace rnexecutorch {
namespace models::object_detection {
using executorch::extension::TensorPtr;
using executorch::runtime::EValue;

/**
 * @brief Object detection model that detects and localises objects in images.
 *
 * Wraps an ExecuTorch model and exposes a single @ref generate call that
 * preprocesses an input image, runs the forward pass, and returns a filtered,
 * non-max-suppressed list of @ref types::Detection results.
 */
class ObjectDetection : public VisionModel {
public:
  /**
   * @brief Constructs an ObjectDetection model and loads it from disk.
   *
   * @param modelSource  Path to the `.pte` model file.
   * @param normMean     Per-channel mean values used for input normalisation
   *                     (must be exactly 3 elements, or empty to skip).
   * @param normStd      Per-channel standard-deviation values used for input
   *                     normalisation (must be exactly 3 elements, or empty to
   *                     skip).
   * @param labelNames   Ordered list of class label strings. Index @c i must
   *                     correspond to class index @c i produced by the model.
   *                     This is a runtime value passed from JS side,
   *                     dependant the model. The user can pass his own, custom
   *                     labels.
   * @param callInvoker  JSI call invoker used to marshal results back to JS.
   *
   * @throws RnExecutorchError if the model cannot be loaded or its input shape
   *         is incompatible.
   */
  ObjectDetection(const std::string &modelSource, std::vector<float> normMean,
                  std::vector<float> normStd,
                  std::vector<std::string> labelNames,
                  std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * @brief Runs object detection on a single image.
   *
   * Preprocesses the image, executes the model's forward pass, and returns
   * all detections whose confidence score meets @p detectionThreshold after
   * non-maximum suppression.
   *
   * @param imageSource        URI or file path of the input image.
   * @param detectionThreshold Minimum confidence score in (0, 1] for a
   *                           detection to be included in the output.
   * @param iouThreshold       IoU threshold for non-maximum suppression.
   * @param classIndices       Optional list of class indices to filter results.
   *                           Only detections matching these classes will be
   *                           returned. Pass empty vector to include all
   * classes.
   * @param methodName         Name of the method to execute (e.g., "forward",
   *                           "forward_384", "forward_512", "forward_640").
   *
   * @return A vector of @ref types::Detection objects with bounding boxes,
   *         label strings (resolved via the label names passed to the
   *         constructor), and confidence scores.
   *
   * @throws RnExecutorchError if the image cannot be read or the forward pass
   *         fails.
   */
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromString(std::string imageSource, double detectionThreshold,
                     double iouThreshold, std::vector<int32_t> classIndices,
                     std::string methodName);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData,
                    double detectionThreshold, double iouThreshold,
                    std::vector<int32_t> classIndices, std::string methodName);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromPixels(JSTensorViewIn pixelData, double detectionThreshold,
                     double iouThreshold, std::vector<int32_t> classIndices,
                     std::string methodName);

protected:
  /**
   * @brief Returns the model input size based on the currently loaded method.
   *
   * Overrides VisionModel::modelInputSize() to support multi-method models
   * where each method may have different input dimensions.
   *
   * @return The expected input size for the currently loaded method.
   */
  cv::Size modelInputSize() const override;

  std::vector<types::Detection>
  runInference(cv::Mat image, double detectionThreshold, double iouThreshold,
               const std::vector<int32_t> &classIndices,
               const std::string &methodName);

private:
  /**
   * @brief Decodes raw model output tensors into a list of detections.
   *
   * @param tensors            Raw EValue outputs from the forward pass
   *                           (bboxes at index 0, scores at index 1,
   *                           labels at index 2).
   * @param originalSize       Original image dimensions used to scale
   *                           bounding boxes back to input coordinates.
   * @param detectionThreshold Confidence threshold below which detections
   *                           are discarded.
   * @param iouThreshold       IoU threshold for non-maximum suppression.
   * @param classIndices       Optional list of class indices to filter results.
   *
   * @return Non-max-suppressed detections above the threshold.
   *
   * @throws RnExecutorchError if the model outputs a class index that exceeds
   *         the size of @ref labelNames_.
   */
  std::vector<types::Detection>
  postprocess(const std::vector<EValue> &tensors, cv::Size originalSize,
              double detectionThreshold, double iouThreshold,
              const std::vector<int32_t> &classIndices);

  /**
   * @brief Ensures the specified method is loaded, unloading any previous
   * method if necessary.
   *
   * @param methodName Name of the method to load (e.g., "forward",
   * "forward_384").
   * @throws RnExecutorchError if the method cannot be loaded.
   */
  void ensureMethodLoaded(const std::string &methodName);

  /**
   * @brief Prepares a set of allowed class indices for filtering detections.
   *
   * @param classIndices Vector of class indices to allow.
   * @return A set containing the allowed class indices.
   */
  std::set<int32_t>
  prepareAllowedClasses(const std::vector<int32_t> &classIndices) const;

  /// Optional per-channel mean for input normalisation (set in constructor).
  std::optional<cv::Scalar> normMean_;

  /// Optional per-channel standard deviation for input normalisation.
  std::optional<cv::Scalar> normStd_;

  /// Ordered label strings mapping class indices to human-readable names.
  std::vector<std::string> labelNames_;

  /// Name of the currently loaded method (for multi-method models).
  std::string currentlyLoadedMethod_;
};
} // namespace models::object_detection

REGISTER_CONSTRUCTOR(models::object_detection::ObjectDetection, std::string,
                     std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
