#include "Kokoro.h"
#include "Params.h"
#include "Utils.h"

#include <algorithm>
#include <codecvt>
#include <fstream>
#include <locale>
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
  constexpr size_t rows = static_cast<size_t>(constants::kMaxInputTokens);
  constexpr size_t cols = static_cast<size_t>(constants::kVoiceRefSize); // 256
  const size_t expectedCount = rows * cols;
  const std::streamsize expectedBytes =
      static_cast<std::streamsize>(expectedCount * sizeof(float));

  std::ifstream in(voiceSource, std::ios::binary);
  if (!in) {
    throw RnExecutorchError(RnExecutorchErrorCode::FileReadFailed,
                            "[Kokoro::loadSingleVoice]: cannot open file: " +
                                voiceSource);
  }

  // Check the file size
  in.seekg(0, std::ios::end);
  const std::streamsize fileSize = in.tellg();
  in.seekg(0, std::ios::beg);
  if (fileSize < expectedBytes) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Kokoro::loadSingleVoice]: file too small: expected at least " +
            std::to_string(expectedBytes) + " bytes, got " +
            std::to_string(fileSize));
  }

  // Read [rows, 1, cols] as contiguous floats directly into voice_
  // ([rows][cols])
  if (!in.read(reinterpret_cast<char *>(voice_.data()->data()),
               expectedBytes)) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Kokoro::loadSingleVoice]: failed to read voice weights");
  }
}

std::u32string Kokoro::utf8ToUtf32(const std::string &utf8) {
  std::u32string result;
  result.reserve(utf8.size());
  size_t i = 0;
  while (i < utf8.size()) {
    char32_t cp = 0;
    unsigned char c = static_cast<unsigned char>(utf8[i]);
    size_t len = 0;
    if (c < 0x80) {
      cp = c;
      len = 1;
    } else if ((c >> 5) == 0x06) {
      cp = c & 0x1F;
      len = 2;
    } else if ((c >> 4) == 0x0E) {
      cp = c & 0x0F;
      len = 3;
    } else if ((c >> 3) == 0x1E) {
      cp = c & 0x07;
      len = 4;
    } else {
      throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                              "Kokoro: invalid UTF-8 in phoneme string");
    }
    if (i + len > utf8.size()) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::InvalidUserInput,
          "Kokoro: truncated UTF-8 sequence in phoneme string");
    }
    for (size_t j = 1; j < len; j++) {
      cp = (cp << 6) | (static_cast<unsigned char>(utf8[i + j]) & 0x3F);
    }
    result.push_back(cp);
    i += len;
  }
  return result;
}

std::vector<float>
Kokoro::generateFromPhonemesImpl(const std::u32string &phonemes, float speed) {
  auto subsentences =
      partitioner_.divide<Partitioner::Strategy::TOTAL_TIME>(phonemes);

  std::vector<float> audio = {};
  for (const auto &subsentence : subsentences) {
    auto audioPart = synthesize(subsentence, speed);

    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                         ? params::kPauseValues.at(lastPhoneme)
                         : params::kDefaultPause;
    std::vector<float> pause(pauseMs * constants::kSamplesPerMilisecond, 0.F);

    audio.insert(audio.end(), std::make_move_iterator(audioPart.begin()),
                 std::make_move_iterator(audioPart.end()));
    audio.insert(audio.end(), std::make_move_iterator(pause.begin()),
                 std::make_move_iterator(pause.end()));
  }

  return audio;
}

void Kokoro::streamFromPhonemesImpl(
    const std::u32string &phonemes, float speed,
    std::shared_ptr<jsi::Function> callback) {
  auto nativeCallback = [this, callback](const std::vector<float> &audioVec) {
    if (this->isStreaming_) {
      this->callInvoker_->invokeAsync([callback, audioVec](jsi::Runtime &rt) {
        callback->call(rt,
                       rnexecutorch::jsi_conversion::getJsiValue(audioVec, rt));
      });
    }
  };

  isStreaming_ = true;

  auto subsentences =
      partitioner_.divide<Partitioner::Strategy::LATENCY>(phonemes);

  for (size_t i = 0; i < subsentences.size(); i++) {
    if (!isStreaming_) {
      break;
    }

    const auto &subsentence = subsentences[i];

    bool endsWithSpace = (subsentence.back() == U' ');
    bool prevEndsWithSpace = (i > 0 && subsentences[i - 1].back() == U' ');
    size_t paddingMs = endsWithSpace || prevEndsWithSpace ? 15 : 50;

    auto audioPart = synthesize(subsentence, speed, paddingMs);

    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                         ? params::kPauseValues.at(lastPhoneme)
                         : params::kDefaultPause;
    std::vector<float> pause(pauseMs * constants::kSamplesPerMilisecond, 0.F);

    audioPart.insert(audioPart.end(), std::make_move_iterator(pause.begin()),
                     std::make_move_iterator(pause.end()));

    nativeCallback(audioPart);
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
  auto phonemes32 = utf8ToUtf32(phonemes);
  return generateFromPhonemesImpl(phonemes32, speed);
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
  auto phonemes32 = utf8ToUtf32(phonemes);
  streamFromPhonemesImpl(phonemes32, speed, callback);
}

void Kokoro::streamStop() noexcept { isStreaming_ = false; }

std::vector<float> Kokoro::synthesize(const std::u32string &phonemes,
                                      float speed, size_t paddingMs) {
  if (phonemes.empty()) {
    return {};
  }

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
