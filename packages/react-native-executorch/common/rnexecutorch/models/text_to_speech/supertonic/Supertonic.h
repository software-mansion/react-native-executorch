#pragma once

#include <atomic>
#include <memory>
#include <mutex>
#include <random>
#include <string>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#include "Partitioner.h"
#include "Submodule.h"
#include "TextProcessor.h"
#include "Types.h"
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models::text_to_speech::supertonic {

using namespace facebook;

/**
 * Supertonic 3 TTS.
 *
 * Mirrors the Kokoro RNE pipeline (offline `generate` + chunked `stream`) but
 * runs the Supertonic flow-matching stack: four ExecuTorch submodules driven in
 * order per segment —
 *   1. duration_predictor : (ids, style_dp, mask)                -> duration[s]
 *   2. text_encoder       : (ids, style_ttl, mask)               -> text_emb
 *   3. vector_estimator   : Euler flow-matching loop over noise  -> latent
 *   4. vocoder            : latent                               -> waveform
 * Text pre-processing (Unicode NFKD + indexer) and audio post-processing
 * (duration crop + silence strip) are done natively in C++.
 */
class Supertonic {
public:
  Supertonic(const std::string &lang, const std::string &unicodeIndexerSource,
             const std::string &durationPredictorSource,
             const std::string &textEncoderSource,
             const std::string &vectorEstimatorSource,
             const std::string &vocoderSource, const std::string &voiceSource,
             std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Synthesizes the full input in one pass.
   * @param input UTF-32 text to synthesize.
   * @param speed playback speed multiplier.
   * @param totalSteps flow-matching steps (quality/latency trade-off).
   * @param lang language-token code for this call (e.g. "en", "na"); empty
   *        falls back to the default provided at construction. Changing it
   *        needs no model reload.
   */
  std::vector<float> generate(std::u32string input,
                              float speed = kDefaultSpeedF,
                              int32_t totalSteps = kDefaultStepsI,
                              std::string lang = "");

  /**
   * Streams synthesis of the internal buffer, invoking `callback` per segment.
   * The buffer can grow during streaming via `streamInsert`.
   * @param lang language-token code for this streaming session (empty → the
   *        construction default).
   */
  void stream(std::shared_ptr<jsi::Function> callback,
              float speed = kDefaultSpeedF, int32_t totalSteps = kDefaultStepsI,
              bool stopOnEmptyBuffer = false, std::string lang = "");

  void streamInsert(std::u32string chunk) noexcept;
  void streamFlush() noexcept;
  void streamStop(bool instant) noexcept;

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  static constexpr float kDefaultSpeedF = 1.05F;
  static constexpr int32_t kDefaultStepsI = 8;

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
  Partitioner partitioner_;
  Submodule durationPredictor_;
  Submodule textEncoder_;
  Submodule vectorEstimator_;
  Submodule vocoder_;

  // --- Voice ---
  Voice voice_;

  // --- Noise sampling ---
  std::mt19937 rng_;

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
