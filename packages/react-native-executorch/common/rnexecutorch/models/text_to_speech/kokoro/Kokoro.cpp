#include "Kokoro.h"
#include "Partitioner.h"
#include "Utils.h"

#include <algorithm>
#include <fstream>
#include <numeric>
#include <rnexecutorch/data_processing/Sequential.h>
#include <stdexcept>

#include <chrono>

namespace rnexecutorch::models::text_to_speech::kokoro {

Kokoro::Kokoro(int language, const std::string &taggerDataSource,
               const std::string &phonemizerDataSource,
               const std::string &durationPredictorSource,
               const std::string &f0nPredictorSource,
               const std::string &encoderSource,
               const std::string &decoderSource, const std::string &voiceSource,
               std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)),
      durationPredictor_(durationPredictorSource, callInvoker_),
      f0nPredictor_(f0nPredictorSource, callInvoker_),
      encoder_(encoderSource, callInvoker_),
      decoder_(decoderSource, callInvoker_),
      phonemizer_(static_cast<phonemis::Lang>(language), taggerDataSource,
                  phonemizerDataSource) {
  // Populate the voice array by reading given file
  loadVoice(voiceSource);
}

void Kokoro::loadVoice(const std::string &voiceSource) {
  constexpr size_t rows = static_cast<size_t>(constants::kInputLarge.noTokens);
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
  if (text.size() > constants::kMaxTextSize) {
    throw std::invalid_argument("Kokoro: maximum input text size exceeded");
  }

  // G2P (Grapheme to Phoneme) conversion
  auto phonemes = phonemizer_.process(text);

  // Divide the phonemes string intro substrings.
  // Affects the further calculations only in case of string size
  // exceeding the biggest model's input.
  auto subsentences =
      partitioner::divide<partitioner::Strategy::TOTAL_TIME>(phonemes);

  std::vector<float> audio = {};
  for (const auto &subsentence : subsentences) {
    size_t inputSize = subsentence.size() + 2;
    const auto &config = inputSize <= constants::kInputSmall.noTokens
                             ? constants::kInputSmall
                         : inputSize <= constants::kInputMedium.noTokens
                             ? constants::kInputMedium
                             : constants::kInputLarge;

    auto audioPart = generateForConfig(subsentence, config, speed);

    // Calculate a pause between the sentences
    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = constants::kPauseValues.contains(lastPhoneme)
                         ? constants::kPauseValues.at(lastPhoneme)
                         : 0;
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
  if (text.size() > constants::kMaxTextSize) {
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
      partitioner::divide<partitioner::Strategy::LATENCY>(phonemes);

  // We follow the implementation of generate() method, but
  // instead of accumulating results in a vector, we push them
  // back to the JS side with the callback.
  for (size_t i = 0; i < subsentences.size(); i++) {
    const auto &subsentence = subsentences[i];

    size_t inputSize = subsentence.size() + 2;
    const auto &config = inputSize <= constants::kInputSmall.noTokens
                             ? constants::kInputSmall
                         : inputSize <= constants::kInputMedium.noTokens
                             ? constants::kInputMedium
                             : constants::kInputLarge;

    auto audioPart = generateForConfig(subsentence, config, speed);

    // Calculate a pause between the sentences
    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = constants::kPauseValues.contains(lastPhoneme)
                         ? constants::kPauseValues.at(lastPhoneme)
                         : 0;
    std::vector<float> pause(pauseMs * constants::kSamplesPerMilisecond, 0.F);

    // Add the pause to the audio vector
    audioPart.insert(audioPart.end(), std::make_move_iterator(pause.begin()),
                     std::make_move_iterator(pause.end()));

    // Push the audio right away to the JS side
    nativeCallback(audioPart);
  }
}

std::vector<float> Kokoro::generateForConfig(const std::u32string &phonemes,
                                             const Configuration &config,
                                             float speed) {
  // Determine the appropriate method for given input configuration
  std::string method = "forward_" + std::to_string(config.noTokens);

  // Map phonemes to tokens
  auto tokens = utils::tokenize(phonemes, {config.noTokens});

  // Select the appropriate voice vector
  auto voiceId = std::clamp(static_cast<int32_t>(phonemes.size()) - 1, 0,
                            config.noTokens - 2);
  auto &voice = voice_[voiceId];
  auto ref_ls = std::span(voice).first(constants::kVoiceRefHalfSize);
  auto ref_hs = std::span(voice).last(constants::kVoiceRefHalfSize);

  // Initialize text mask
  // Exlude all the paddings apart from first and last one.
  int32_t inputLength =
      std::min(static_cast<int32_t>(phonemes.size()) + 2, config.noTokens);
  std::vector<uint8_t> textMask(config.noTokens, false);
  std::fill(textMask.begin(), textMask.begin() + inputLength, true);

  // Inference 1 - DurationPredictor
  // The resulting duration vector is already scalled at this point
  auto [d, indices, effectiveDuration] = durationPredictor_.generate(
      method, config, std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      ref_hs, speed);

  // Inference 2 - F0NPredictor
  auto f0nPrediction = f0nPredictor_.generate(
      method, config, std::span(indices),
      std::span<float>(d.data_ptr<float>(), d.numel()), ref_hs);
  auto F0_pred = f0nPrediction->at(0).toTensor();
  auto N_pred = f0nPrediction->at(1).toTensor();
  auto en = f0nPrediction->at(2).toTensor();
  auto pred_aln_trg = f0nPrediction->at(3).toTensor();

  // Inference 3 - Encoder
  auto encoding = encoder_.generate(
      method, config, std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span<float>(pred_aln_trg.data_ptr<float>(), pred_aln_trg.numel()));
  auto asr = encoding->at(0).toTensor();

  // Inference 4 - Decoder
  auto decoding = decoder_.generate(
      method, config, std::span<float>(asr.data_ptr<float>(), asr.numel()),
      std::span<float>(F0_pred.data_ptr<float>(), F0_pred.numel()),
      std::span<float>(N_pred.data_ptr<float>(), N_pred.numel()), ref_ls);
  auto audioTensor = decoding->at(0).toTensor();

  // Cut the resulting audio vector according to the effective duration
  int32_t effLength = constants::kTicksPerDuration * effectiveDuration;
  auto audio =
      std::span<const float>(audioTensor.const_data_ptr<float>(), effLength);
  auto croppedAudio =
      utils::stripAudio(audio, constants::kSamplesPerMilisecond * 50);

  std::vector<float> result(croppedAudio.begin(), croppedAudio.end());

  return result;
}

std::size_t Kokoro::getMemoryLowerBound() const noexcept {
  return durationPredictor_.getMemoryLowerBound() +
         f0nPredictor_.getMemoryLowerBound() + encoder_.getMemoryLowerBound() +
         decoder_.getMemoryLowerBound() + sizeof(voice_) + sizeof(phonemizer_);
}

void Kokoro::unload() noexcept {
  durationPredictor_.unload();
  f0nPredictor_.unload();
  encoder_.unload();
  decoder_.unload();
}

} // namespace rnexecutorch::models::text_to_speech::kokoro
