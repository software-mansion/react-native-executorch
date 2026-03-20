#pragma once

#include <jsi/jsi.h>
#include <mutex>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/utils/FrameTransform.h>

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
 * - All inference operations are protected by a mutex via scoped_lock
 *
 * Usage:
 * Subclasses should:
 * 1. Inherit from VisionModel instead of BaseModel
 * 2. Optionally override preprocess() for model-specific preprocessing
 * 3. Implement runInference() which acquires the lock internally
 *
 * Example:
 * @code
 * class Classification : public VisionModel {
 * public:
 *   std::unordered_map<std::string_view, float>
 *   generateFromFrame(jsi::Runtime& runtime, const jsi::Value& frameValue) {
 *     auto frameObject = frameValue.asObject(runtime);
 *     cv::Mat frame = extractFromFrame(runtime, frameObject);
 *     return runInference(frame);
 *   }
 * };
 * @endcode
 */
class VisionModel : public BaseModel {
public:
  VisionModel(const std::string &modelSource,
              std::shared_ptr<react::CallInvoker> callInvoker);

  virtual ~VisionModel() = default;

  /**
   * @brief Thread-safe unload that waits for any in-flight inference to
   * complete
   *
   * Overrides BaseModel::unload() to acquire inference_mutex_ before
   * resetting the module. This prevents a crash where BaseModel::unload()
   * destroys module_ while generateFromFrame() is still executing on the
   * VisionCamera worklet thread.
   */
  void unload() noexcept;

protected:
  /// Cached input tensor shape (getAllInputShapes()[0]).
  /// Set once by each subclass constructor to avoid per-frame metadata lookups.
  std::vector<int32_t> modelInputShape_;

  /**
   * @brief Mutex to ensure thread-safe inference
   *
   * This mutex protects against race conditions when:
   * - generateFromFrame() is called from VisionCamera worklet thread (30fps)
   * - generate() is called from JavaScript thread simultaneously
   *
   * Usage guidelines:
   * - Use std::scoped_lock for blocking operations (JS API can wait)
   * - Use try_lock() for non-blocking operations (camera should skip frames)
   *
   * @note Marked mutable to allow locking in const methods if needed
   */
  mutable std::mutex inference_mutex_;

  /**
   * @brief Resize an RGB image to the model's expected input size
   *
   * Resizes to modelInputSize() if needed. Subclasses may override for
   * model-specific preprocessing (e.g., normalisation).
   *
   * @param image Input image in RGB format
   * @return cv::Mat resized to modelInputSize(), in RGB format
   *
   * @note Called from runInference() under the inference mutex
   */
  virtual cv::Mat preprocess(const cv::Mat &image) const;

  /**
   * @brief Get the spatial dimensions of the model input.
   *
   * By default, returns the last two dimensions of modelInputShape_.
   * Subclasses may override this for models with dynamic or multiple input
   * sizes.
   */
  virtual cv::Size modelInputSize() const;
  /**
   * @brief Extract an RGB cv::Mat from a VisionCamera frame
   *
   * Calls frameToMat() then converts the raw 4-channel frame
   * (BGRA on iOS, RGBA on Android) to RGB.
   *
   * @param runtime JSI runtime
   * @param frameData JSI value containing frame data from VisionCamera
   * @return cv::Mat in RGB format (3 channels)
   *
   * @note Does NOT acquire the inference mutex — caller is responsible
   */
  cv::Mat extractFromFrame(jsi::Runtime &runtime,
                           const jsi::Value &frameData) const;

  /**
   * @brief Extract cv::Mat from raw pixel data (TensorPtr) sent from
   * JavaScript
   *
   * This method enables users to run inference on raw pixel data without file
   * I/O. Useful for processing images already in memory (e.g., from canvas,
   * image library).
   *
   * @param tensorView JSTensorViewIn containing:
   *                   - dataPtr: Pointer to raw pixel values (RGB format)
   *                   - sizes: [height, width, channels] - must be 3D
   *                   - scalarType: Must be ScalarType::Byte (Uint8Array)
   *
   * @return cv::Mat containing the pixel data
   *
   * @throws RnExecutorchError if tensorView format is invalid
   *
   * @note The returned cv::Mat owns a copy of the data
   * @note Expected pixel format: RGB (3 channels), row-major order
   * @note Typical usage from JS:
   * @code
   *   const pixels = new Uint8Array([...]);  // Raw RGB pixel data
   *   const result = model.generateFromPixels({
   *     dataPtr: pixels,
   *     sizes: [480, 640, 3],
   *     scalarType: ScalarType.BYTE
   *   }, 0.5);
   * @endcode
   */
  cv::Mat extractFromPixels(const JSTensorViewIn &tensorView) const;
};

} // namespace models
// Register VisionModel constructor traits
// Even though VisionModel is abstract, the metaprogramming system needs to know
// its constructor signature for derived classes
REGISTER_CONSTRUCTOR(models::VisionModel, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
