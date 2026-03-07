#include "Kokoro.h"
#include "Params.h"
#include "Utils.h"

#include <algorithm>
#include <fstream>
#include <phonemis/utilities/string_utils.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/Sequential.h>

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
    throw RnExecutorchError(
        RnExecutorchErrorCode::WrongDimensions,
        "[Kokoro] incompatible DurationPredictor & Synthesizer models");
  }

  context_.inputTokensLimit = durationPredictor_.getTokensLimit();
  context_.inputDurationLimit = synthesizer_.getDurationLimit();
}

void Kokoro::loadVoice(const std::string &voiceSource) {
  constexpr size_t cols = static_cast<size_t>(constants::kVoiceRefSize);
  constexpr size_t bytesPerRow = cols * sizeof(float);

  std::ifstream in(voiceSource, std::ios::binary);
  if (!in) {
    throw RnExecutorchError(RnExecutorchErrorCode::FileReadFailed,
                            "[Kokoro::loadVoice]: cannot open file: " +
                                voiceSource);
  }

  // Determine number of rows from file size
  in.seekg(0, std::ios::end);
  const auto fileSize = static_cast<size_t>(in.tellg());
  in.seekg(0, std::ios::beg);

  if (fileSize < bytesPerRow) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Kokoro::loadVoice]: file too small: need at least " +
            std::to_string(bytesPerRow) + " bytes for one row, got " +
            std::to_string(fileSize));
  }

  const size_t rows = fileSize / bytesPerRow;
  const auto readBytes = static_cast<std::streamsize>(rows * bytesPerRow);

  // Resize voice vector to hold all rows from the file
  voice_.resize(rows);

  if (!in.read(reinterpret_cast<char *>(voice_.data()->data()), readBytes)) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Kokoro::loadVoice]: failed to read voice weights");
  }
}

std::vector<float>
Kokoro::generateFromPhonemesImpl(const std::u32string &phonemes, float speed) {
  // Divide the phonemes string into substrings.
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

    // Add audio part and silence pause to the main audio vector
    audio.insert(audio.end(), std::make_move_iterator(audioPart.begin()),
                 std::make_move_iterator(audioPart.end()));
    audio.resize(audio.size() + pauseMs * constants::kSamplesPerMilisecond,
                 0.F);
  }

  return audio;
}

void Kokoro::streamFromPhonemesImpl(
    const std::u32string &phonemes, float speed,
    std::shared_ptr<jsi::Function> callback) {
  auto nativeCallback = [this, callback](const std::vector<float> &audioVec) {
    if (this->isStreaming_) {
      this->callInvoker_->invokeAsync(
          [callback, audioVec = std::move(audioVec)](jsi::Runtime &rt) {
            callback->call(
                rt, rnexecutorch::jsi_conversion::getJsiValue(audioVec, rt));
          });
    }
  };

  isStreaming_ = true;

  // Use LATENCY strategy to minimize the time-to-first-audio for streaming
  auto subsentences =
      partitioner_.divide<Partitioner::Strategy::LATENCY>(phonemes);

  for (size_t i = 0; i < subsentences.size(); i++) {
    if (!isStreaming_) {
      break;
    }

    const auto &subsentence = subsentences[i];

    // Determine the silent padding duration to be stripped from the edges of
    // the generated audio. If a chunk ends with a space or follows one that
    // did, it indicates a word boundary split – we use a shorter padding
    // to ensure natural speech flow. Otherwise, we use 50ms for standard
    // pauses.
    bool endsWithSpace = (subsentence.back() == U' ');
    bool prevEndsWithSpace = (i > 0 && subsentences[i - 1].back() == U' ');
    size_t paddingMs = endsWithSpace || prevEndsWithSpace ? 15 : 50; // [ms]

    // Generate an audio vector with the Kokoro model
    auto audioPart = synthesize(subsentence, speed, paddingMs);

    // Calculate and append a pause between the sentences
    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                         ? params::kPauseValues.at(lastPhoneme)
                         : params::kDefaultPause;
    audioPart.resize(
        audioPart.size() + pauseMs * constants::kSamplesPerMilisecond, 0.F);

    // Push the audio right away to the JS side
    nativeCallback(std::move(audioPart));
  }

  isStreaming_ = false;
}

std::vector<float> Kokoro::generate(std::string text, float speed) {
  if (text.size() > params::kMaxTextSize) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Kokoro: maximum input text size exceeded");
  }

  // G2P (Grapheme to Phoneme) conversion
  auto phonemes = phonemizer_.process(text);

  return generateFromPhonemesImpl(phonemes, speed);
}

std::vector<float> Kokoro::generateFromPhonemes(std::string phonemes,
                                                float speed) {
  if (phonemes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Kokoro: phoneme string must not be empty");
  }
  return generateFromPhonemesImpl(
      phonemis::utilities::string_utils::utf8_to_u32string(phonemes), speed);
}

void Kokoro::stream(std::string text, float speed,
                    std::shared_ptr<jsi::Function> callback) {
  if (text.size() > params::kMaxTextSize) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Kokoro: maximum input text size exceeded");
  }

  // G2P (Grapheme to Phoneme) conversion
  auto phonemes = phonemizer_.process(text);

  streamFromPhonemesImpl(phonemes, speed, callback);
}

void Kokoro::streamFromPhonemes(std::string phonemes, float speed,
                                std::shared_ptr<jsi::Function> callback) {
  if (phonemes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Kokoro: phoneme string must not be empty");
  }
  streamFromPhonemesImpl(
      phonemis::utilities::string_utils::utf8_to_u32string(phonemes), speed,
      callback);
}

void Kokoro::streamStop() noexcept { isStreaming_ = false; }

std::vector<float> Kokoro::synthesize(const std::u32string &phonemes,
                                      float speed, size_t paddingMs) {
  if (phonemes.empty()) {
    return {};
  }

  // Clamp token count: phonemes + 2 padding tokens (leading + trailing zero)
  size_t dpTokens = std::clamp(phonemes.size() + 2,
                               constants::kMinInputTokens,
                               context_.inputTokensLimit);

  // Map phonemes to tokens, padded to dpTokens
  auto tokens = utils::tokenize(phonemes, {dpTokens});

  // Select the appropriate voice vector
  size_t voiceID = std::min({phonemes.size() - 1, dpTokens - 1,
                             voice_.size() - 1});
  auto &voice = voice_[voiceID];

  // Initialize text mask for DP
  size_t realInputLength = std::min(phonemes.size() + 2, dpTokens);
  std::vector<uint8_t> textMask(dpTokens, false);
  std::fill(textMask.begin(), textMask.begin() + realInputLength, true);

  // Inference 1 - DurationPredictor
  auto [d, indices, effectiveDuration] = durationPredictor_.generate(
      std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span(voice).last(constants::kVoiceRefHalfSize), speed);

  // --- Synthesizer phase ---
  // The Synthesizer may have different method sizes than the DP.
  // Pad all inputs to the Synthesizer's selected method size.
  size_t synthTokens = synthesizer_.getMethodTokenCount(dpTokens);
  size_t dCols = d.sizes().back(); // 640

  // Pad tokens and textMask to synthTokens (no-op when synthTokens == dpTokens)
  tokens.resize(synthTokens, 0);
  textMask.resize(synthTokens, false);

  // Pad indices to the maximum duration limit
  indices.resize(context_.inputDurationLimit, 0);

  // Prepare duration data for Synthesizer.
  // When sizes match, pass the DP tensor directly to avoid a 320KB copy.
  size_t durSize = synthTokens * dCols;
  std::vector<float> durPadded;
  float *durPtr;
  if (synthTokens == dpTokens) {
    durPtr = d.mutable_data_ptr<float>();
  } else {
    durPadded.resize(durSize, 0.0f);
    std::copy_n(d.const_data_ptr<float>(), dpTokens * dCols, durPadded.data());
    durPtr = durPadded.data();
  }

  // Inference 2 - Synthesizer
  auto decoding = synthesizer_.generate(
      std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span(indices),
      std::span<float>(durPtr, durSize),
      std::span(voice));
  auto audioTensor = decoding->at(0).toTensor();

  // Cut the resulting audio vector according to the effective duration
  int32_t effLength = constants::kTicksPerDuration * effectiveDuration;
  auto audio =
      std::span<const float>(audioTensor.const_data_ptr<float>(), effLength);
  auto croppedAudio =
      utils::stripAudio(audio, paddingMs * constants::kSamplesPerMilisecond);

  return {croppedAudio.begin(), croppedAudio.end()};
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
