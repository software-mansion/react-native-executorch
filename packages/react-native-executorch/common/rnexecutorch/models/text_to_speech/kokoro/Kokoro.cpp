#include "Kokoro.h"

#include <algorithm>
#include <fstream>
#include <numeric>
#include <rnexecutorch/data_processing/Sequential.h>
#include <stdexcept>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

Kokoro::Kokoro(const std::string &durationPredictorSource,
               const std::string &f0nPredictorSource,
               const std::string &encoderSource,
               const std::string &decoderSource, const std::string &voiceSource,
               std::shared_ptr<react::CallInvoker> callInvoker)
    : durationPredictor_(durationPredictorSource, callInvoker),
      f0nPredictor_(f0nPredictorSource, callInvoker),
      encoder_(encoderSource, callInvoker),
      decoder_(decoderSource, callInvoker) {
  // Populate the voice array by reading given file
  loadSingleVoice(voiceSource);
}

void Kokoro::loadSingleVoice(const std::string &voiceSource) {
  constexpr size_t rows = static_cast<size_t>(constants::kLargeInput.noTokens);
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

void Kokoro::generate(const std::u32string &phonemes, float speed) {
  // Select the appropriate method according to input size
  // Since Kokoro requires padding with single zeros at both ends,
  // the effective input size is phonemes.size() + 2.
  // TODO: replace with a partition algorithm, which would divide input
  //       into smaller parts, therefore speeding up the processing and allowing
  //       to process inputs of any length
  auto inputSize = phonemes.size() + 2;
  const auto &config =
      inputSize <= constants::kSmallInput.noTokens    ? constants::kSmallInput
      : inputSize <= constants::kMediumInput.noTokens ? constants::kMediumInput
                                                      : constants::kLargeInput;

  return generate(phonemes, config, speed);
}

void Kokoro::generate(const std::u32string &phonemes,
                      const Configuration &config, float speed) {
  // Determine the appropriate method for given input configuration
  std::string method = "forward_" + std::to_string(config.noTokens);

  // Map phonemes to tokens
  auto tokens = toTokens(phonemes, config);

  // Select the appropriate voice vector
  auto voiceId = std::clamp(static_cast<int32_t>(phonemes.size()) - 1, 0,
                            config.noTokens - 2);
  auto &voice = voice_[voiceId];
  auto ref_ls = std::span(voice).first(constants::kVoiceRefHalfSize);
  auto ref_hs = std::span(voice).last(constants::kVoiceRefHalfSize);

  // Initialize text mask
  // Exlude all the paddings apart from first and last one.
  std::vector<int64_t> textMask(config.noTokens, 1);
  std::fill(
      std::find(textMask.begin() + 1, textMask.end(), constants::kPadToken) + 1,
      textMask.end(), 0);

  // Inference 1 - DurationPredictor
  // The resulting duration vector is already scalled at this point
  auto durationPrediction = durationPredictor_.generate(method, config, std::span(tokens),
                                                        std::span(textMask), ref_hs, speed);
  auto predDur = durationPrediction->at(0).toTensor();
  auto d = durationPrediction->at(1).toTensor();

  // Create indices tensor by repetitions according to durations vector
  std::vector<int64_t> indices(config.noTokens);
  std::iota(indices.begin(), indices.end(), 0);
  std::vector<int64_t> indicesRepeated = rnexecutorch::sequential::repeatInterleave(
    std::span<const int64_t>(indices),
    std::span<const int64_t>(reinterpret_cast<const int64_t*>(predDur.const_data_ptr()), predDur.numel())
  );
}

std::vector<Token> Kokoro::toTokens(const std::u32string &phonemes,
                                    const Configuration &config) const {
  // Number of tokens to populate, excluding first and last pad token
  auto effNoTokens =
      std::min(config.noTokens - 2, static_cast<int32_t>(phonemes.size()));

  // Note that we populate tokens[1:noTokens - 1], since first and last tokens
  // are zeros (padding). Input could contain unrecognized tokens, and that's
  // why we use partition() at the end.
  std::vector<Token> tokens(config.noTokens, constants::kPadToken);
  std::transform(phonemes.begin(), phonemes.begin() + effNoTokens,
                 tokens.begin() + 1, [](char32_t p) -> Token {
                   return constants::kVocab.contains(p)
                              ? constants::kVocab.at(p)
                              : constants::kInvalidToken;
                 });
  auto validSeqEnd = std::partition(
      tokens.begin() + 1, tokens.begin() + effNoTokens + 1,
      [](Token t) -> bool { return t != constants::kInvalidToken; });
  std::fill(validSeqEnd, tokens.begin() + effNoTokens + 1,
            constants::kPadToken);

  return tokens;
}

} // namespace models::text_to_speech::kokoro
} // namespace rnexecutorch
