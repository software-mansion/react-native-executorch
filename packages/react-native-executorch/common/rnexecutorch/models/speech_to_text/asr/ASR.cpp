#include <random>
#include <sstream>

#include "ASR.h"
#include "executorch/extension/tensor/tensor_ptr.h"
#include "rnexecutorch/data_processing/Numerical.h"
#include "rnexecutorch/data_processing/dsp.h"
#include "rnexecutorch/data_processing/gzip.h"

namespace rnexecutorch::models::speech_to_text::asr {

using namespace types;

ASR::ASR(const models::BaseModel *encoder, const models::BaseModel *decoder,
         const TokenizerModule *tokenizer)
    : encoder(encoder), decoder(decoder), tokenizer(tokenizer),
      startOfTranscriptionToken(
          this->tokenizer->tokenToId("<|startoftranscript|>")),
      endOfTranscriptionToken(this->tokenizer->tokenToId("<|endoftext|>")),
      timestampBeginToken(this->tokenizer->tokenToId("<|0.00|>")) {}

std::vector<int32_t>
ASR::getInitialSequence(const DecodingOptions &options) const {
  std::vector<int32_t> seq;
  seq.push_back(this->startOfTranscriptionToken);

  if (options.language.has_value()) {
    int32_t langToken =
        this->tokenizer->tokenToId("<|" + options.language.value() + "|>");
    int32_t taskToken = this->tokenizer->tokenToId("<|transcribe|>");
    seq.push_back(langToken);
    seq.push_back(taskToken);
  }

  seq.push_back(this->timestampBeginToken);

  return seq;
}

GenerationResult ASR::generate(std::span<const float> waveform,
                               float temperature,
                               const DecodingOptions &options) const {
  std::vector<float> encoderOutput = this->encode(waveform);

  std::vector<int32_t> sequenceIds = this->getInitialSequence(options);
  const size_t initialSequenceLenght = sequenceIds.size();
  std::vector<float> scores;

  while (std::cmp_less_equal(sequenceIds.size(), ASR::kMaxDecodeLength)) {
    std::vector<float> logits = this->decode(sequenceIds, encoderOutput);

    // intentionally comparing float to float
    // temperatures are predefined, so this is safe
    if (temperature == 0.0f) {
      numerical::softmax(logits);
    } else {
      numerical::softmaxWithTemperature(logits, temperature);
    }

    const std::vector<float> &probs = logits;

    int32_t nextId;
    float nextProb;

    // intentionally comparing float to float
    // temperatures are predefined, so this is safe
    if (temperature == 0.0f) {
      auto maxIt = std::ranges::max_element(probs);
      nextId = static_cast<int32_t>(std::distance(probs.begin(), maxIt));
      nextProb = *maxIt;
    } else {
      std::discrete_distribution<> dist(probs.begin(), probs.end());
      std::mt19937 gen((std::random_device{}()));
      nextId = dist(gen);
      nextProb = probs[nextId];
    }

    sequenceIds.push_back(nextId);
    scores.push_back(nextProb);

    if (nextId == this->endOfTranscriptionToken) {
      break;
    }
  }

  return {.tokens = std::vector<int32_t>(
              sequenceIds.cbegin() + initialSequenceLenght, sequenceIds.cend()),
          .scores = scores};
}

float ASR::getCompressionRatio(const std::string &text) const {
  size_t compressedSize = gzip::deflateSize(text);
  return static_cast<float>(text.size()) / static_cast<float>(compressedSize);
}

std::vector<Segment>
ASR::generateWithFallback(std::span<const float> waveform,
                          const DecodingOptions &options) const {
  std::vector<float> temperatures = {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f};
  std::vector<int32_t> bestTokens;

  for (auto t : temperatures) {
    auto [tokens, scores] = this->generate(waveform, t, options);

    const float cumLogProb = std::transform_reduce(
        scores.begin(), scores.end(), 0.0f, std::plus<>(),
        [](float s) { return std::log(std::max(s, 1e-9f)); });

    const float avgLogProb = cumLogProb / static_cast<float>(tokens.size() + 1);
    const std::string text = this->tokenizer->decode(tokens, true);
    const float compressionRatio = this->getCompressionRatio(text);

    if (avgLogProb >= -1.0f && compressionRatio < 2.4f) {
      bestTokens = std::move(tokens);
      break;
    }
  }

  return this->calculateWordLevelTimestamps(bestTokens, waveform);
}

std::vector<Segment>
ASR::calculateWordLevelTimestamps(std::span<const int32_t> generatedTokens,
                                  const std::span<const float> waveform) const {
  const size_t generatedTokensSize = generatedTokens.size();
  if (generatedTokensSize < 2 ||
      generatedTokens[generatedTokensSize - 1] !=
          this->endOfTranscriptionToken ||
      generatedTokens[generatedTokensSize - 2] < this->timestampBeginToken) {
    return {};
  }
  std::vector<Segment> segments;
  std::vector<int32_t> tokens;
  int32_t prevTimestamp = this->timestampBeginToken;

  for (size_t i = 0; i < generatedTokensSize; i++) {
    if (generatedTokens[i] < this->timestampBeginToken) {
      tokens.push_back(generatedTokens[i]);
    }
    if (i > 0 && generatedTokens[i - 1] >= this->timestampBeginToken &&
        generatedTokens[i] >= this->timestampBeginToken) {
      const int32_t start = prevTimestamp;
      const int32_t end = generatedTokens[i - 1];
      auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);
      if (words.size()) {
        segments.emplace_back(std::move(words), 0.0);
      }
      tokens.clear();
      prevTimestamp = generatedTokens[i];
    }
  }

  const int32_t start = prevTimestamp;
  const int32_t end = generatedTokens[generatedTokensSize - 2];
  auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);

  if (words.size()) {
    segments.emplace_back(std::move(words), 0.0);
  }

  float scalingFactor =
      static_cast<float>(waveform.size()) /
      (ASR::kSamplingRate * (end - this->timestampBeginToken) *
       ASR::kTimePrecision);
  if (scalingFactor < 1.0f) {
    for (auto &seg : segments) {
      for (auto &w : seg.words) {
        w.start *= scalingFactor;
        w.end *= scalingFactor;
      }
    }
  }

  return segments;
}

std::vector<Word>
ASR::estimateWordLevelTimestampsLinear(std::span<const int32_t> tokens,
                                       int32_t start, int32_t end) const {
  const std::vector<int32_t> tokensVec(tokens.begin(), tokens.end());
  const std::string segmentText = this->tokenizer->decode(tokensVec, true);
  std::istringstream iss(segmentText);
  std::vector<std::string> wordsStr;
  std::string word;
  while (iss >> word) {
    wordsStr.emplace_back(" ");
    wordsStr.back().append(word);
  }

  size_t numChars = 0;
  for (const auto &w : wordsStr) {
    numChars += w.size();
  }
  const float duration = (end - start) * ASR::kTimePrecision;
  const float timePerChar = duration / std::max<float>(1, numChars);
  const float startOffset = (start - timestampBeginToken) * ASR::kTimePrecision;

  std::vector<Word> wordObjs;
  wordObjs.reserve(wordsStr.size());
  int32_t prevCharCount = 0;
  for (auto &w : wordsStr) {
    const auto wSize = static_cast<int32_t>(w.size());
    const float wStart = startOffset + prevCharCount * timePerChar;
    const float wEnd = wStart + timePerChar * wSize;
    prevCharCount += wSize;
    wordObjs.emplace_back(std::move(w), wStart, wEnd);
  }

  return wordObjs;
}

std::vector<Segment> ASR::transcribe(std::span<const float> waveform,
                                     const DecodingOptions &options) const {
  int32_t seek = 0;
  std::vector<Segment> results;

  while (std::cmp_less(seek * ASR::kSamplingRate, waveform.size())) {
    int32_t start = seek * ASR::kSamplingRate;
    const auto end = std::min<int32_t>(
        (seek + ASR::kChunkSize) * ASR::kSamplingRate, waveform.size());
    std::span<const float> chunk = waveform.subspan(start, end - start);

    if (std::cmp_less(chunk.size(), ASR::kMinChunkSamples)) {
      break;
    }

    std::vector<Segment> segments = this->generateWithFallback(chunk, options);

    if (segments.empty()) {
      seek += ASR::kChunkSize;
      continue;
    }

    for (auto &seg : segments) {
      for (auto &w : seg.words) {
        w.start += seek;
        w.end += seek;
      }
    }

    seek = static_cast<int32_t>(segments.back().words.back().end);
    results.insert(results.end(), std::make_move_iterator(segments.begin()),
                   std::make_move_iterator(segments.end()));
  }

  return results;
}

std::vector<float> ASR::encode(std::span<const float> waveform) const {
  constexpr int32_t fftWindowSize = 512;
  constexpr int32_t stftHopLength = 160;
  constexpr int32_t innerDim = 256;

  std::vector<float> preprocessedData =
      dsp::stftFromWaveform(waveform, fftWindowSize, stftHopLength);
  const auto numFrames =
      static_cast<int32_t>(preprocessedData.size()) / innerDim;
  std::vector<int32_t> inputShape = {numFrames, innerDim};

  const auto modelInputTensor = executorch::extension::make_tensor_ptr(
      std::move(inputShape), std::move(preprocessedData));
  const auto encoderResult = this->encoder->forward(modelInputTensor);

  if (!encoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during encoding, error code: " +
        std::to_string(static_cast<int32_t>(encoderResult.error())));
  }

  const auto decoderOutputTensor = encoderResult.get().at(0).toTensor();
  const int32_t outputNumel = decoderOutputTensor.numel();

  const float *const dataPtr = decoderOutputTensor.const_data_ptr<float>();
  return {dataPtr, dataPtr + outputNumel};
}

std::vector<float> ASR::decode(std::span<int32_t> tokens,
                               std::span<float> encoderOutput) const {
  std::vector<int32_t> tokenShape = {1, static_cast<int32_t>(tokens.size())};
  auto tokenTensor = executorch::extension::make_tensor_ptr(
      std::move(tokenShape), tokens.data(), ScalarType::Int);

  const auto encoderOutputSize = static_cast<int32_t>(encoderOutput.size());
  std::vector<int32_t> encShape = {1, ASR::kNumFrames,
                                   encoderOutputSize / ASR::kNumFrames};
  auto encoderTensor = executorch::extension::make_tensor_ptr(
      std::move(encShape), encoderOutput.data(), ScalarType::Float);

  const auto decoderResult =
      this->decoder->forward({tokenTensor, encoderTensor});

  if (!decoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during decoding, error code: " +
        std::to_string(static_cast<int32_t>(decoderResult.error())));
  }

  const auto logitsTensor = decoderResult.get().at(0).toTensor();
  const int32_t outputNumel = logitsTensor.numel();

  const size_t innerDim = logitsTensor.size(1);
  const size_t dictSize = logitsTensor.size(2);

  const float *const dataPtr =
      logitsTensor.const_data_ptr<float>() + (innerDim - 1) * dictSize;

  return {dataPtr, dataPtr + outputNumel / innerDim};
}

} // namespace rnexecutorch::models::speech_to_text::asr
