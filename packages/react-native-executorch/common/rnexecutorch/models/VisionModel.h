#pragma once

#include <jsi/jsi.h>
#include <mutex>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models {

/**
 * @brief Base class for computer vision models that support real-time camera
 * input
 *
 * VisionModel extends BaseModel with thread-safe inference and automatic frame
 * extraction from VisionCamera. This class is designed for models that need to
 * process camera frames in real-time (e.g., at 30fps).
 *
 * Thread Safety:
 * - All inference operations are protected by a mutex
 * - generateFromFrame() uses try_lock() to skip frames when the model is busy
 * - This prevents blocking the camera thread and maintains smooth frame rates
 *
 * Usage:
 * Subclasses should:
 * 1. Inherit from VisionModel instead of BaseModel
 * 2. Implement preprocessFrame() with model-specific preprocessing
 * 3. Use inference_mutex_ when calling forward() in custom generate methods
 * 4. Use lock_guard for blocking operations (JS API)
 * 5. Use try_lock() for non-blocking operations (camera API)
 *
 * Example:
 * @code
 * class Classification : public VisionModel {
 * public:
 *   std::unordered_map<std::string_view, float>
 *   generateFromFrame(jsi::Runtime& runtime, const jsi::Value& frameValue) {
 *     // try_lock is handled automatically
 *     auto frameObject = frameValue.asObject(runtime);
 *     cv::Mat frame = FrameExtractor::extractFrame(runtime, frameObject);
 *
 *     // Lock before inference
 *     if (!inference_mutex_.try_lock()) {
 *       return {}; // Skip frame if busy
 *     }
 *     std::lock_guard<std::mutex> lock(inference_mutex_, std::adopt_lock);
 *
 *     auto preprocessed = preprocessFrame(frame);
 *     // ... run inference
 *   }
 * };
 * @endcode
 */
class VisionModel : public BaseModel {
public:
  /**
   * @brief Construct a VisionModel with the same parameters as BaseModel
   *
   * VisionModel uses the same construction pattern as BaseModel, just adding
   * thread-safety on top.
   */
  VisionModel(const std::string &modelSource,
              std::shared_ptr<react::CallInvoker> callInvoker)
      : BaseModel(modelSource, callInvoker) {}

  /**
   * @brief Virtual destructor for proper cleanup in derived classes
   */
  virtual ~VisionModel() = default;

protected:
  /**
   * @brief Mutex to ensure thread-safe inference
   *
   * This mutex protects against race conditions when:
   * - generateFromFrame() is called from VisionCamera worklet thread (30fps)
   * - generate() is called from JavaScript thread simultaneously
   *
   * Usage guidelines:
   * - Use std::lock_guard for blocking operations (JS API can wait)
   * - Use try_lock() for non-blocking operations (camera should skip frames)
   *
   * @note Marked mutable to allow locking in const methods if needed
   */
  mutable std::mutex inference_mutex_;

  /**
   * @brief Preprocess a camera frame for model input
   *
   * This method should implement model-specific preprocessing such as:
   * - Resizing to the model's expected input size
   * - Color space conversion (e.g., BGR to RGB)
   * - Normalization
   * - Any other model-specific transformations
   *
   * @param frame Input frame from camera (already extracted and rotated by
   * FrameExtractor)
   * @return Preprocessed cv::Mat ready for tensor conversion
   *
   * @note The input frame is already in RGB format and rotated 90° clockwise
   * @note This method is called under mutex protection in generateFromFrame()
   */
  virtual cv::Mat preprocessFrame(const cv::Mat &frame) const = 0;

  /**
   * @brief Extract and preprocess frame from VisionCamera in one call
   *
   * This is a convenience method that combines frame extraction and
   * preprocessing. It handles both nativeBuffer (zero-copy) and ArrayBuffer
   * paths automatically.
   *
   * @param runtime JSI runtime
   * @param frameData JSI value containing frame data from VisionCamera
   *
   * @return Preprocessed cv::Mat ready for tensor conversion
   *
   * @throws std::runtime_error if frame extraction fails
   *
   * @note This method does NOT acquire the inference mutex - caller is
   * responsible
   * @note Typical usage:
   * @code
   *   cv::Mat preprocessed = extractFromFrame(runtime, frameData);
   *   auto tensor = image_processing::getTensorFromMatrix(dims, preprocessed);
   * @endcode
   */
  cv::Mat extractFromFrame(jsi::Runtime &runtime,
                           const jsi::Value &frameData) const;

  /**
   * @brief Extract cv::Mat from raw pixel data (ArrayBuffer) sent from
   * JavaScript
   *
   * This method enables users to run inference on raw pixel data without file
   * I/O. Useful for processing images already in memory (e.g., from canvas,
   * image library).
   *
   * @param runtime JSI runtime
   * @param pixelData JSI object containing:
   *                  - data: ArrayBuffer with raw pixel values
   *                  - width: number - image width
   *                  - height: number - image height
   *                  - channels: number - number of channels (3 for RGB, 4 for
   * RGBA)
   *
   * @return cv::Mat containing the pixel data
   *
   * @throws std::runtime_error if pixelData format is invalid
   *
   * @note The returned cv::Mat owns a copy of the data
   * @note Expected pixel format: RGB or RGBA, row-major order
   * @note Typical usage from JS:
   * @code
   *   const pixels = new Uint8Array([...]);  // Raw pixel data
   *   const result = model.generateFromPixels({
   *     data: pixels.buffer,
   *     width: 640,
   *     height: 480,
   *     channels: 3
   *   }, 0.5);
   * @endcode
   */
  cv::Mat extractFromPixels(jsi::Runtime &runtime,
                            const jsi::Object &pixelData) const;
};

} // namespace models
// Register VisionModel constructor traits
// Even though VisionModel is abstract, the metaprogramming system needs to know
// its constructor signature for derived classes
REGISTER_CONSTRUCTOR(models::VisionModel, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
