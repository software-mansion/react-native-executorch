#include <random>
#include <sstream>

#include "ASR.h"
#include "executorch/extension/tensor/tensor_ptr.h"
#include "rnexecutorch/data_processing/Numerical.h"
#include "rnexecutorch/data_processing/gzip.h"
#include <rnexecutorch/Error.h>

namespace rnexecutorch::models::speech_to_text::asr {

using namespace types;

ASR::ASR(const models::BaseModel *encoder, const models::BaseModel *decoder,
         const TokenizerModule *tokenizer)
    : encoder(encoder), decoder(decoder), tokenizer(tokenizer),
      startOfTranscriptionToken(
          this->tokenizer->tokenToId("<|startoftranscript|>")),
      endOfTranscriptionToken(this->tokenizer->tokenToId("<|endoftext|>")),
      timestampBeginToken(this->tokenizer->tokenToId("<|0.00|>")) {}

std::vector<uint64_t>
ASR::getInitialSequence(const DecodingOptions &options) const {
  std::vector<uint64_t> seq;
  seq.push_back(this->startOfTranscriptionToken);

  if (options.language.has_value()) {
    uint64_t langToken =
        this->tokenizer->tokenToId("<|" + options.language.value() + "|>");
    uint64_t taskToken = this->tokenizer->tokenToId("<|transcribe|>");
    seq.push_back(langToken);
    seq.push_back(taskToken);
  }

  seq.push_back(this->timestampBeginToken);

  return seq;
}

GenerationResult ASR::generate(std::span<float> waveform, float temperature,
                               const DecodingOptions &options) const {
  std::vector<float> encoderOutput = this->encode(waveform);

  std::vector<uint64_t> sequenceIds = this->getInitialSequence(options);
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

    uint64_t nextId;
    float nextProb;

    // intentionally comparing float to float
    // temperatures are predefined, so this is safe
    if (temperature == 0.0f) {
      auto maxIt = std::ranges::max_element(probs);
      nextId = static_cast<uint64_t>(std::distance(probs.begin(), maxIt));
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

  return {.tokens = std::vector<uint64_t>(
              sequenceIds.cbegin() + initialSequenceLenght, sequenceIds.cend()),
          .scores = scores};
}

float ASR::getCompressionRatio(const std::string &text) const {
  size_t compressedSize = gzip::deflateSize(text);
  return static_cast<float>(text.size()) / static_cast<float>(compressedSize);
}

std::vector<Segment>
ASR::generateWithFallback(std::span<float> waveform,
                          const DecodingOptions &options) const {
  std::vector<float> temperatures = {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f};
  std::vector<uint64_t> bestTokens;
  float bestAvgLogProb = -std::numeric_limits<float>::infinity();
  float bestCompressionRatio = 0.0f;
  float bestTemperature = 0.0f;

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
      bestAvgLogProb = avgLogProb;
      bestCompressionRatio = compressionRatio;
      bestTemperature = t;
      break;
    }

    if (t == temperatures.back() && bestTokens.empty()) {
      bestTokens = std::move(tokens);
      bestAvgLogProb = avgLogProb;
      bestCompressionRatio = compressionRatio;
      bestTemperature = t;
    }
  }

  return this->calculateWordLevelTimestamps(bestTokens, waveform,
                                            bestAvgLogProb, bestTemperature,
                                            bestCompressionRatio);
}

std::vector<Segment>
ASR::calculateWordLevelTimestamps(std::span<const uint64_t> generatedTokens,
                                  const std::span<const float> waveform,
                                  float avgLogProb, float temperature,
                                  float compressionRatio) const {
  const size_t generatedTokensSize = generatedTokens.size();
  if (generatedTokensSize < 2 ||
      generatedTokens[generatedTokensSize - 1] !=
          this->endOfTranscriptionToken ||
      generatedTokens[generatedTokensSize - 2] < this->timestampBeginToken) {
    return {};
  }
  std::vector<Segment> segments;
  std::vector<uint64_t> tokens;
  uint64_t prevTimestamp = this->timestampBeginToken;

  for (size_t i = 0; i < generatedTokensSize; i++) {
    if (generatedTokens[i] < this->timestampBeginToken) {
      tokens.push_back(generatedTokens[i]);
    }
    if (i > 0 && generatedTokens[i - 1] >= this->timestampBeginToken &&
        generatedTokens[i] >= this->timestampBeginToken) {
      const uint64_t start = prevTimestamp;
      const uint64_t end = generatedTokens[i - 1];
      auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);
      if (words.size()) {
        Segment seg;
        seg.words = std::move(words);
        seg.tokens = {};
        seg.avgLogprob = avgLogProb;
        seg.temperature = temperature;
        seg.compressionRatio = compressionRatio;

        if (!seg.words.empty()) {
          seg.start = seg.words.front().start;
          seg.end = seg.words.back().end;
        } else {
          seg.start = 0.0;
          seg.end = 0.0;
        }

        segments.push_back(std::move(seg));
      }
      tokens.clear();
      prevTimestamp = generatedTokens[i];
    }
  }

  const uint64_t start = prevTimestamp;
  const uint64_t end = generatedTokens[generatedTokensSize - 2];
  auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);

  Segment seg;
  seg.words = std::move(words);
  seg.tokens = tokens;
  seg.avgLogprob = avgLogProb;
  seg.temperature = temperature;
  seg.compressionRatio = compressionRatio;

  if (!seg.words.empty()) {
    seg.start = seg.words.front().start;
    seg.end = seg.words.back().end;
  }

  segments.push_back(std::move(seg));

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
ASR::estimateWordLevelTimestampsLinear(std::span<const uint64_t> tokens,
                                       uint64_t start, uint64_t end) const {
  const std::vector<uint64_t> tokensVec(tokens.begin(), tokens.end());
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

std::vector<Segment> ASR::transcribe(std::span<float> waveform,
                                     const DecodingOptions &options) const {
  int32_t seek = 0;
  std::vector<Segment> results;

  while (std::cmp_less(seek * ASR::kSamplingRate, waveform.size())) {
    int32_t start = seek * ASR::kSamplingRate;
    const auto end = std::min<int32_t>(
        static_cast<int32_t>((seek + ASR::kChunkSize) * ASR::kSamplingRate),
        static_cast<int32_t>(waveform.size()));
    auto chunk = waveform.subspan(start, end - start);

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

      seg.start += seek;
      seg.end += seek;
    }

    while (!segments.empty() && segments.back().words.empty()) {
      segments.pop_back();
    }

    if (!segments.empty() && !segments.back().words.empty()) {
      seek = static_cast<int32_t>(segments.back().words.back().end);
    }
    results.insert(results.end(), std::make_move_iterator(segments.begin()),
                   std::make_move_iterator(segments.end()));
  }

  return results;
}

std::vector<float> ASR::encode(std::span<float> waveform) const {
  auto inputShape = {static_cast<int32_t>(waveform.size())};

  const auto modelInputTensor = executorch::extension::make_tensor_ptr(
      std::move(inputShape), waveform.data(),
      executorch::runtime::etensor::ScalarType::Float);
  const auto encoderResult = this->encoder->forward(modelInputTensor);

  if (!encoderResult.ok()) {
    throw RnExecutorchError(encoderResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  const auto decoderOutputTensor = encoderResult.get().at(0).toTensor();
  const auto outputNumel = decoderOutputTensor.numel();

  const float *const dataPtr = decoderOutputTensor.const_data_ptr<float>();
  return {dataPtr, dataPtr + outputNumel};
}

std::vector<float> ASR::decode(std::span<const uint64_t> tokens,
                               std::span<float> encoderOutput) const {
  std::vector<int32_t> tokenShape = {1, static_cast<int32_t>(tokens.size())};
  auto tokensLong = std::vector<int64_t>(tokens.begin(), tokens.end());

  auto tokenTensor = executorch::extension::make_tensor_ptr(
      tokenShape, tokensLong.data(), ScalarType::Long);

  const auto encoderOutputSize = static_cast<int32_t>(encoderOutput.size());
  std::vector<int32_t> encShape = {1, ASR::kNumFrames,
                                   encoderOutputSize / ASR::kNumFrames};
  auto encoderTensor = executorch::extension::make_tensor_ptr(
      std::move(encShape), encoderOutput.data(), ScalarType::Float);

  const auto decoderResult =
      this->decoder->forward({tokenTensor, encoderTensor});

  if (!decoderResult.ok()) {
    throw RnExecutorchError(decoderResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  const auto logitsTensor = decoderResult.get().at(0).toTensor();
  const int32_t outputNumel = static_cast<int32_t>(logitsTensor.numel());

  const size_t innerDim = logitsTensor.size(1);
  const size_t dictSize = logitsTensor.size(2);

  const float *const dataPtr =
      logitsTensor.const_data_ptr<float>() + (innerDim - 1) * dictSize;

  return {dataPtr, dataPtr + outputNumel / innerDim};
}

} // namespace rnexecutorch::models::speech_to_text::asr
