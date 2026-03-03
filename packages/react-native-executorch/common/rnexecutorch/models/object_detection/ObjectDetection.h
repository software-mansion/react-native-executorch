#pragma once

#include <executorch/extension/tensor/tensor_ptr.h>
#include <executorch/runtime/core/evalue.h>
#include <opencv2/opencv.hpp>
#include <optional>

#include "Types.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/VisionModel.h>
#include <rnexecutorch/models/object_detection/Utils.h>

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
   *
   * @return A vector of @ref types::Detection objects with bounding boxes,
   *         label strings (resolved via the label names passed to the
   *         constructor), and confidence scores.
   *
   * @throws RnExecutorchError if the image cannot be read or the forward pass
   *         fails.
   */
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromString(std::string imageSource, double detectionThreshold);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData,
                    double detectionThreshold);
  [[nodiscard("Registered non-void function")]] std::vector<types::Detection>
  generateFromPixels(JSTensorViewIn pixelData, double detectionThreshold);

protected:
  std::vector<types::Detection> runInference(cv::Mat image,
                                             double detectionThreshold);
  cv::Mat preprocessFrame(const cv::Mat &frame) const override;

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
   *
   * @return Non-max-suppressed detections above the threshold.
   *
   * @throws RnExecutorchError if the model outputs a class index that exceeds
   *         the size of @ref labelNames_.
   */
  std::vector<types::Detection> postprocess(const std::vector<EValue> &tensors,
                                            cv::Size originalSize,
                                            double detectionThreshold);

  /// Expected input image dimensions derived from the model's input shape.
  cv::Size modelImageSize{0, 0};

  /// Optional per-channel mean for input normalisation (set in constructor).
  std::optional<cv::Scalar> normMean_;

  /// Optional per-channel standard deviation for input normalisation.
  std::optional<cv::Scalar> normStd_;

  /// Ordered label strings mapping class indices to human-readable names.
  std::vector<std::string> labelNames_;
};
} // namespace models::object_detection

REGISTER_CONSTRUCTOR(models::object_detection::ObjectDetection, std::string,
                     std::vector<float>, std::vector<float>,
                     std::vector<std::string>,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
