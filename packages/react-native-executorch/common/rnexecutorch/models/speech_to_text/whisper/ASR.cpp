#include <array>
#include <numeric>
#include <random>

#include "ASR.h"
#include "Constants.h"
#include "Params.h"
#include <executorch/extension/tensor/tensor_ptr.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/data_processing/gzip.h>

#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::speech_to_text::whisper {

using executorch::runtime::etensor::ScalarType;

ASR::ASR(const std::string &modelSource, const std::string &tokenizerSource,
         std::shared_ptr<facebook::react::CallInvoker> callInvoker)
    : BaseModel(modelSource, std::move(callInvoker)), schema::ASR(),
      tokenizer_(std::make_unique<TokenizerModule>(tokenizerSource,
                                                   this->callInvoker)),
      startOfTranscriptionToken_(
          tokenizer_->tokenToId(constants::tokens::kStartOfTranscript)),
      endOfTranscriptionToken_(
          tokenizer_->tokenToId(constants::tokens::kEndOfTranscript)),
      timestampBeginToken_(
          tokenizer_->tokenToId(constants::tokens::kBeginTimestamp)) {}

/**
 * Whisper inference - full transcription
 */
std::vector<Segment> ASR::transcribe(std::span<float> waveform,
                                     const DecodingOptions &options) const {
  // Use floats to prevent downcasting and timestamp mismatches
  float seek = 0.f;
  std::vector<Segment> results;

  const float waveformSize = static_cast<float>(waveform.size());
  const float waveformSkipBoundary =
      static_cast<float>((constants::kChunkSize - params::kChunkBreakBuffer) *
                         constants::kSamplingRate);

  // We loop through the input audio waveform and process it in 30s chunks.
  // This is determined by Whisper models strict 30s audio length requirement.
  while (seek * constants::kSamplingRate < waveformSize) {
    // Calculate chunk bounds and extract the chunk.
    float start = seek * constants::kSamplingRate;
    const auto end =
        std::min<float>(static_cast<float>((seek + constants::kChunkSize) *
                                           constants::kSamplingRate),
                        waveformSize);
    auto chunk = waveform.subspan(start, end - start);

    if (std::cmp_less(chunk.size(), constants::kMinChunkSamples)) {
      break;
    }

    // Enter the processing logic.
    std::vector<Segment> segments = this->generate(chunk, options);

    if (segments.empty()) {
      seek += constants::kChunkSize;
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
      // This prevents additional segments to appear, unless the audio length is
      // very close to the max chunk size, that is there could be some words
      // spoken near the breakpoint.
      seek = waveformSize < waveformSkipBoundary
                 ? seek + constants::kChunkSize
                 : segments.back().words.back().end;
    }
    results.insert(results.end(), std::make_move_iterator(segments.begin()),
                   std::make_move_iterator(segments.end()));
  }

  return results;
}

/**
 * Whisper inference - encoding phase
 *
 * The input is a standard audio waveform, altough it is implicitly converted
 * to a log mel format inside the encoder call.
 */
std::vector<float> ASR::encode(std::span<float> waveform) const {
  auto inputShape = {static_cast<int32_t>(waveform.size())};

  const auto modelInputTensor = executorch::extension::make_tensor_ptr(
      std::move(inputShape), waveform.data(), ScalarType::Float);

  const auto encoderResult = this->execute("encode", {modelInputTensor});

  if (!encoderResult.ok()) {
    throw RnExecutorchError(encoderResult.error(),
                            "[Whisper] The 'encode' method did not succeed. "
                            "Ensure the model input is correct.");
  }

  const auto encoderOutputTensor = encoderResult.get().at(0).toTensor();
  const auto outputNumel = encoderOutputTensor.numel();

  const float *const dataPtr = encoderOutputTensor.const_data_ptr<float>();
  return {dataPtr, dataPtr + outputNumel};
}

/**
 * Whisper inference - decoding phase
 *
 * An autoregressive decoder, called with increasing amount of input tokens.
 */
std::vector<float> ASR::decode(std::span<uint64_t> tokens,
                               std::span<float> encoderOutput,
                               uint64_t startPos) const {
  std::vector<int32_t> tokenShape = {1, static_cast<int32_t>(tokens.size())};
  std::vector<int32_t> positionShape = {static_cast<int32_t>(tokens.size())};

  auto tokenTensor = executorch::extension::make_tensor_ptr(
      tokenShape, tokens.data(), ScalarType::Long);

  // Populate cache position vector
  std::vector<uint64_t> cachePositions(tokens.size());
  std::iota(cachePositions.begin(), cachePositions.end(), startPos);
  auto positionTensor = executorch::extension::make_tensor_ptr(
      positionShape, cachePositions.data(), ScalarType::Long);

  const auto encoderOutputSize = static_cast<int32_t>(encoderOutput.size());
  std::vector<int32_t> encShape = {1, constants::kNumFrames,
                                   encoderOutputSize / constants::kNumFrames};
  auto encoderTensor = executorch::extension::make_tensor_ptr(
      std::move(encShape), encoderOutput.data(), ScalarType::Float);

  const auto decoderResult =
      this->execute("decode", {tokenTensor, positionTensor, encoderTensor});

  if (!decoderResult.ok()) {
    throw RnExecutorchError(decoderResult.error(),
                            "[Whisper] The 'decode' method did not succeed. "
                            "Ensure the model inputs are correct.");
  }

  const auto logitsTensor = decoderResult.get().at(0).toTensor();
  const int32_t outputNumel = static_cast<int32_t>(logitsTensor.numel());

  const size_t innerDim = logitsTensor.size(1);
  const size_t dictSize = logitsTensor.size(2);

  const float *const dataPtr =
      logitsTensor.const_data_ptr<float>() + (innerDim - 1) * dictSize;

  return {dataPtr, dataPtr + outputNumel / innerDim};
}

void ASR::unload() noexcept { BaseModel::unload(); }

std::size_t ASR::getMemoryLowerBound() const noexcept {
  return BaseModel::getMemoryLowerBound();
}

/**
 * Helper functions - creating initial token IDs sequence
 */
std::vector<uint64_t>
ASR::createInitialSequence(const DecodingOptions &options) const {
  std::vector<uint64_t> seq;
  seq.push_back(startOfTranscriptionToken_);

  if (options.language.has_value()) {
    uint64_t langToken =
        tokenizer_->tokenToId("<|" + options.language.value() + "|>");
    uint64_t taskToken = tokenizer_->tokenToId("<|transcribe|>");
    seq.push_back(langToken);
    seq.push_back(taskToken);
  }

  seq.push_back(timestampBeginToken_);

  return seq;
}

/**
 * Helper functions - generation wrapper, with fallback
 */
std::vector<Segment> ASR::generate(std::span<float> waveform,
                                   const DecodingOptions &options) const {
  // A fixed pool of available temperatures
  constexpr std::array<float, 6> temperatures = {0.0f, 0.2f, 0.4f,
                                                 0.6f, 0.8f, 1.0f};

  // Calculate audio features just once to save time.
  std::vector<float> encoderOutput = this->encode(waveform);

  std::vector<uint64_t> bestTokens;
  float bestAvgLogProb = -std::numeric_limits<float>::infinity();
  float bestCompressionRatio = 0.0f;
  float bestTemperature = 0.0f;

  for (auto t : temperatures) {
    auto [tokens, scores] =
        this->generate(waveform, options, t, {encoderOutput});

    const float cumLogProb = std::transform_reduce(
        scores.begin(), scores.end(), 0.0f, std::plus<>(),
        [](float s) { return std::log(std::max(s, 1e-9f)); });

    const float avgLogProb = cumLogProb / static_cast<float>(tokens.size() + 1);
    const std::string text = tokenizer_->decode(tokens, true);
    const float compressionRatio = this->calculateCompressionRatio(text);

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

  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[ASR] Raw transcription results (tokens): ", bestTokens);
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[ASR] Raw transcription results (text): ",
                    tokenizer_->decode(bestTokens, true));

  return this->calculateWordLevelTimestamps(bestTokens, waveform,
                                            bestAvgLogProb, bestTemperature,
                                            bestCompressionRatio);
}

/**
 * Helper functions - generation wrapper, single-temperature inference
 */
GenerationResult
ASR::generate(std::span<float> waveform, const DecodingOptions &options,
              float temperature,
              std::optional<std::span<float>> encoderOutput) const {
  std::vector<float> encoderOutputData = !encoderOutput.has_value()
                                             ? this->encode(waveform)
                                             : std::vector<float>();
  std::span<float> encodings = encoderOutput.has_value()
                                   ? encoderOutput.value()
                                   : std::span<float>(encoderOutputData);

  std::vector<uint64_t> sequenceIds = this->createInitialSequence(options);
  std::vector<uint64_t> cachedTokens = sequenceIds;
  const size_t initialSequenceLenght = sequenceIds.size();
  std::vector<float> scores;

  uint64_t startPos = 0;
  while (std::cmp_less_equal(startPos + sequenceIds.size(),
                             constants::kMaxDecodeLength)) {
    std::vector<float> logits = this->decode(sequenceIds, encodings, startPos);

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

    // Move the startPos pointer by the amount of tokens we processed
    startPos += sequenceIds.size();
    sequenceIds = {nextId};
    cachedTokens.push_back(nextId);
    scores.push_back(nextProb);

    if (nextId == endOfTranscriptionToken_) {
      break;
    }
  }

  return {.tokens = std::vector<uint64_t>(cachedTokens.cbegin() +
                                              initialSequenceLenght,
                                          cachedTokens.cend()),
          .scores = scores};
}

std::vector<Segment> ASR::calculateWordLevelTimestamps(
    std::span<const uint64_t> generatedTokens, const std::span<float> waveform,
    float avgLogProb, float temperature, float compressionRatio) const {
  const size_t generatedTokensSize = generatedTokens.size();
  if (generatedTokensSize < 2 ||
      generatedTokens[generatedTokensSize - 1] != endOfTranscriptionToken_ ||
      generatedTokens[generatedTokensSize - 2] < timestampBeginToken_) {
    return {};
  }
  std::vector<Segment> segments;
  std::vector<uint64_t> tokens;
  uint64_t prevTimestamp = timestampBeginToken_;

  for (size_t i = 0; i < generatedTokensSize; i++) {
    if (generatedTokens[i] < timestampBeginToken_) {
      tokens.push_back(generatedTokens[i]);
    }
    if (i > 0 && generatedTokens[i - 1] >= timestampBeginToken_ &&
        generatedTokens[i] >= timestampBeginToken_) {
      const uint64_t start = prevTimestamp;
      const uint64_t end = generatedTokens[i - 1];
      auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);
      if (words.size()) {
        Segment seg;
        seg.words = std::move(words);
        // seg.tokens = {};  // WTF ?
        seg.tokens = tokens;
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
      (constants::kSamplingRate * (end - timestampBeginToken_) *
       constants::kTimePrecision);
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
  const std::string segmentText = tokenizer_->decode(tokensVec, true);

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
  const float duration = (end - start) * constants::kTimePrecision;
  const float timePerChar = duration / std::max<float>(1, numChars);
  const float startOffset =
      (start - timestampBeginToken_) * constants::kTimePrecision;

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

float ASR::calculateCompressionRatio(const std::string &text) const {
  size_t compressedSize = gzip::deflateSize(text);
  return static_cast<float>(text.size()) / static_cast<float>(compressedSize);
}

} // namespace rnexecutorch::models::speech_to_text::whisper
