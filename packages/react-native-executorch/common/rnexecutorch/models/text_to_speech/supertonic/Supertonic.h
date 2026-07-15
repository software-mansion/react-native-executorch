#pragma once

#include <atomic>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include "../common/TextPartitioner.h"
#include "DurationPredictor.h"
#include "Params.h"
#include "TextEncoder.h"
#include "TextProcessor.h"
#include "Types.h"
#include "VectorEstimator.h"
#include "Vocoder.h"
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models::text_to_speech::supertonic {

using namespace facebook;

class Supertonic {
public:
  explicit Supertonic(const std::string &lang,
                      const std::string &unicodeIndexerSource,
                      const std::string &durationPredictorSource,
                      const std::string &textEncoderSource,
                      const std::string &vectorEstimatorSource,
                      const std::string &vocoderSource,
                      const std::string &voiceSource,
                      std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Synthesizes the full input in one pass.
   *
   * A theoretically const method, not marked as const for the purpose of
   * compatibility with ET API and simplifying the code.
   * @param input UTF-32 text to synthesize.
   * @param speed playback speed multiplier.
   * @param totalSteps flow-matching steps (quality/latency trade-off).
   * @param lang language-token code for this call (e.g. "en", "na"); empty
   *        falls back to the default provided at construction. Changing it
   *        needs no model reload.
   */
  std::vector<float> generate(std::u32string input,
                              float speed = params::kDefaultSpeedF,
                              int32_t totalSteps = params::kDefaultStepsI,
                              std::string lang = "");

  /**
   * Streams synthesis of the internal buffer, invoking `callback` per segment.
   * The buffer can grow during streaming via `streamInsert`.
   * @param lang language-token code for this streaming session (empty → the
   *        construction default).
   */
  void stream(std::shared_ptr<jsi::Function> callback,
              float speed = params::kDefaultSpeedF,
              int32_t totalSteps = params::kDefaultStepsI,
              bool stopOnEmptyBuffer = false, std::string lang = "");

  void streamInsert(std::u32string chunk);
  void streamFlush() noexcept;
  void streamStop(bool instant) noexcept;

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  void loadVoice(const std::string &voiceSource);

  // Runs the four submodules for one already-partitioned text segment and
  // returns the cropped PCM audio.
  std::vector<float> synthesize(std::u32string_view text, float speed,
                                int32_t totalSteps, std::string_view lang,
                                size_t paddingMs = 40);

  void validateSpeed(float speed) const;

  // --- External dependencies ---
  std::shared_ptr<react::CallInvoker> callInvoker_;

  // --- Pipeline components (in order of use) ---
  TextProcessor textProcessor_;
  TextPartitioner partitioner_;
  DurationPredictor durationPredictor_;
  TextEncoder textEncoder_;
  VectorEstimator vectorEstimator_;
  Vocoder vocoder_;

  // --- Voice ---
  Voice voice_;

  // --- Streaming buffer & control ---
  std::u32string inputTextBuffer_;
  mutable std::mutex inputTextBufferMutex_;
  std::atomic<bool> isStreaming_{false};
  std::atomic<bool> stopOnEmptyBuffer_{true};
  std::atomic<bool> flushPending_{false};
};

} // namespace models::text_to_speech::supertonic

REGISTER_CONSTRUCTOR(models::text_to_speech::supertonic::Supertonic,
                     std::string, std::string, std::string, std::string,
                     std::string, std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
