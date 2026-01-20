#include "Kokoro.h"
#include "Params.h"
#include "Utils.h"

#include <algorithm>
#include <fstream>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/Sequential.h>
#include <stdexcept>

namespace rnexecutorch::models::text_to_speech::kokoro {

Kokoro::Kokoro(const std::string &lang, const std::string &taggerDataSource,
               const std::string &phonemizerDataSource,
               const std::string &durationPredictorSource,
               const std::string &synthesizerSource,
               const std::string &voiceSource,
               std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)),
      phonemizer_(lang == "en-us"   ? phonemis::Lang::EN_US
                  : lang == "en-gb" ? phonemis::Lang::EN_GB
                                    : phonemis::Lang::DEFAULT,
                  taggerDataSource, phonemizerDataSource),
      partitioner_(context_),
      durationPredictor_(durationPredictorSource, context_, callInvoker_),
      synthesizer_(synthesizerSource, context_, callInvoker_) {
  // Populate the voice array by reading given file
  loadVoice(voiceSource);

  // Read model limits & check compatibility
  if (durationPredictor_.getTokensLimit() != synthesizer_.getTokensLimit()) {
    throw std::runtime_error(
        "[Kokoro] incompatible DurationPredictor & Synthesizer models");
  }

  context_.inputTokensLimit = durationPredictor_.getTokensLimit();
  context_.inputDurationLimit = synthesizer_.getDurationLimit();
}

void Kokoro::loadVoice(const std::string &voiceSource) {
  constexpr size_t rows = static_cast<size_t>(constants::kMaxInputTokens);
  constexpr size_t cols = static_cast<size_t>(constants::kVoiceRefSize); // 256
  const size_t expectedCount = rows * cols;
  const std::streamsize expectedBytes =
      static_cast<std::streamsize>(expectedCount * sizeof(float));

  std::ifstream in(voiceSource, std::ios::binary);
  if (!in) {
    throw std::runtime_error("[Kokoro::loadSingleVoice]: cannot open file: " +
                             voiceSource);
  }

  // Check the file size
  in.seekg(0, std::ios::end);
  const std::streamsize fileSize = in.tellg();
  in.seekg(0, std::ios::beg);
  if (fileSize < expectedBytes) {
    throw std::runtime_error(
        "[Kokoro::loadSingleVoice]: file too small: expected at least " +
        std::to_string(expectedBytes) + " bytes, got " +
        std::to_string(fileSize));
  }

  // Read [rows, 1, cols] as contiguous floats directly into voice_
  // ([rows][cols])
  if (!in.read(reinterpret_cast<char *>(voice_.data()->data()),
               expectedBytes)) {
    throw std::runtime_error(
        "[Kokoro::loadSingleVoice]: failed to read voice weights");
  }
}

std::vector<float> Kokoro::generate(std::string text, float speed) {
  if (text.size() > params::kMaxTextSize) {
    throw std::invalid_argument("Kokoro: maximum input text size exceeded");
  }

  // G2P (Grapheme to Phoneme) conversion
  auto phonemes = phonemizer_.process(text);

  // Divide the phonemes string intro substrings.
  // Affects the further calculations only in case of string size
  // exceeding the biggest model's input.
  auto subsentences =
      partitioner_.divide<Partitioner::Strategy::TOTAL_TIME>(phonemes);

  std::vector<float> audio = {};
  for (const auto &subsentence : subsentences) {
    // Generate an audio vector with the Kokoro model
    auto audioPart = synthesize(subsentence, speed);

    // Calculate a pause between the sentences
    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                         ? params::kPauseValues.at(lastPhoneme)
                         : params::kDefaultPause;
    std::vector<float> pause(pauseMs * constants::kSamplesPerMilisecond, 0.F);

    // Add audio part and pause to the main audio vector
    audio.insert(audio.end(), std::make_move_iterator(audioPart.begin()),
                 std::make_move_iterator(audioPart.end()));
    audio.insert(audio.end(), std::make_move_iterator(pause.begin()),
                 std::make_move_iterator(pause.end()));
  }

  return audio;
}

void Kokoro::stream(std::string text, float speed,
                    std::shared_ptr<jsi::Function> callback) {
  if (text.size() > params::kMaxTextSize) {
    throw std::invalid_argument("Kokoro: maximum input text size exceeded");
  }

  // Build a full callback function
  auto nativeCallback = [this, callback](const std::vector<float> &audioVec) {
    this->callInvoker_->invokeAsync([callback, audioVec](jsi::Runtime &rt) {
      callback->call(rt,
                     rnexecutorch::jsi_conversion::getJsiValue(audioVec, rt));
    });
  };

  // G2P (Grapheme to Phoneme) conversion
  auto phonemes = phonemizer_.process(text);

  // Divide the phonemes string intro substrings.
  // Use specialized implementation to minimize the latency between the
  // sentences.
  auto subsentences =
      partitioner_.divide<Partitioner::Strategy::LATENCY>(phonemes);

  // We follow the implementation of generate() method, but
  // instead of accumulating results in a vector, we push them
  // back to the JS side with the callback.
  for (size_t i = 0; i < subsentences.size(); i++) {
    const auto &subsentence = subsentences[i];

    // Determine the silent padding duration to be stripped from the edges of
    // the generated audio. If a chunk ends with a space or follows one that
    // did, it indicates a word boundary split – we use a shorter padding (20ms)
    // to ensure natural speech flow. Otherwise, we use 50ms for standard
    // pauses.
    bool endsWithSpace = (subsentence.back() == U' ');
    bool prevEndsWithSpace = (i > 0 && subsentences[i - 1].back() == U' ');
    size_t paddingMs = endsWithSpace || prevEndsWithSpace ? 15 : 50; // [ms]

    // Generate an audio vector with the Kokoro model
    auto audioPart = synthesize(subsentence, speed, paddingMs);

    // Calculate a pause between the sentences
    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                         ? params::kPauseValues.at(lastPhoneme)
                         : params::kDefaultPause;
    std::vector<float> pause(pauseMs * constants::kSamplesPerMilisecond, 0.F);

    // Add pause to the audio vector
    audioPart.insert(audioPart.end(), std::make_move_iterator(pause.begin()),
                     std::make_move_iterator(pause.end()));

    // Push the audio right away to the JS side
    nativeCallback(audioPart);
  }
}

std::vector<float> Kokoro::synthesize(const std::u32string &phonemes,
                                      float speed, size_t paddingMs) {
  if (phonemes.empty())
    return {};

  // Clamp the input to not go beyond number of input token limits
  // Note that 2 tokens are always reserved for pre- and post-fix padding,
  // so we effectively take at most (maxNoInputTokens_ - 2) tokens.
  size_t noTokens = std::clamp(phonemes.size() + 2, constants::kMinInputTokens,
                               context_.inputTokensLimit);

  // Map phonemes to tokens
  const auto tokens = utils::tokenize(phonemes, {noTokens});

  // Select the appropriate voice vector
  size_t voiceID = std::min(phonemes.size() - 1, noTokens);
  auto &voice = voice_[voiceID];

  // Initialize text mask
  // Exclude all the paddings apart from first and last one.
  size_t realInputLength = std::min(phonemes.size() + 2, noTokens);
  std::vector<uint8_t> textMask(noTokens, false);
  std::fill(textMask.begin(), textMask.begin() + realInputLength, true);

  // Inference 1 - DurationPredictor
  // The resulting duration vector is already scalled at this point
  auto [d, indices, effectiveDuration] = durationPredictor_.generate(
      std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span(voice).last(constants::kVoiceRefHalfSize), speed);

  // Inference 2 - Synthesizer
  auto decoding = synthesizer_.generate(
      std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span(indices),
      // Note that we reduce the size of d tensor to match the initial number of
      // input tokens
      std::span<float>(d.mutable_data_ptr<float>(),
                       noTokens * d.sizes().back()),
      std::span(voice));
  auto audioTensor = decoding->at(0).toTensor();

  // Cut the resulting audio vector according to the effective duration
  int32_t effLength = constants::kTicksPerDuration * effectiveDuration;
  auto audio =
      std::span<const float>(audioTensor.const_data_ptr<float>(), effLength);
  auto croppedAudio =
      utils::stripAudio(audio, paddingMs * constants::kSamplesPerMilisecond);

  std::vector<float> result(croppedAudio.begin(), croppedAudio.end());

  return result;
}

std::size_t Kokoro::getMemoryLowerBound() const noexcept {
  return durationPredictor_.getMemoryLowerBound() +
         synthesizer_.getMemoryLowerBound() + sizeof(voice_) +
         sizeof(phonemizer_);
}

void Kokoro::unload() noexcept {
  durationPredictor_.unload();
  synthesizer_.unload();
}

} // namespace rnexecutorch::models::text_to_speech::kokoro
