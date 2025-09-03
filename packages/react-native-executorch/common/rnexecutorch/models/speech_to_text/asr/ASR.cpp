#include <random>

#include "ASR.h"
#include "executorch/extension/tensor/tensor_ptr.h"
#include "rnexecutorch/data_processing/dsp.h"
#include "rnexecutorch/data_processing/gzip.h"

namespace rnexecutorch::models::speech_to_text::asr {

ASR::ASR(const models::BaseModel &encoder, const models::BaseModel &decoder,
         const TokenizerModule &tokenizer)
    : encoder(encoder), decoder(decoder), tokenizer(tokenizer),
      startOfTranscriptionToken(
          this->tokenizer.tokenToId("<|startoftranscript|>")),
      endOfTranscriptionToken(this->tokenizer.tokenToId("<|endoftext|>")),
      timestampBeginToken(this->tokenizer.tokenToId("<|0.00|>")) {}

std::vector<int32_t>
ASR::getInitialSequence(const DecodingOptions &options) const {
  std::vector<int32_t> seq;
  seq.push_back(this->startOfTranscriptionToken);

  if (options.language.has_value()) {
    int32_t langToken =
        this->tokenizer.tokenToId("<|" + options.language.value() + "|>");
    int32_t taskToken = this->tokenizer.tokenToId("<|transcribe|>");
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

  while (sequenceIds.size() <= ASR::maxDecodeLength) {
    std::vector<float> logits = this->decode(sequenceIds, encoderOutput);
    std::vector<float> probs = this->softmaxWithTemperature(
        logits, (temperature == 0 ? 1.0f : temperature));

    int32_t nextId;
    float nextProb;

    if (temperature == 0.0f) {
      auto maxIt = std::max_element(probs.begin(), probs.end());
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

  return {std::vector<int32_t>(sequenceIds.begin() + initialSequenceLenght,
                               sequenceIds.end()),
          scores};
}

std::vector<float> ASR::softmaxWithTemperature(std::span<const float> logits,
                                               float temperature) const {
  const float maxLogit = *std::max_element(logits.begin(), logits.end());

  std::vector<float> exps(logits.size());
  std::transform(logits.begin(), logits.end(), exps.begin(), [=](float logit) {
    return std::exp((logit - maxLogit) / temperature);
  });

  const float sumExp = std::accumulate(exps.begin(), exps.end(), 0.0f);

  std::transform(exps.begin(), exps.end(), exps.begin(),
                 [=](float value) { return value / sumExp; });

  return exps;
}

float ASR::getCompressionRatio(const std::string &text) const {
  std::string compressed = gzip::deflate(text);
  return static_cast<float>(text.size()) /
         static_cast<float>(compressed.size());
}

std::vector<Segment>
ASR::generateWithFallback(std::span<const float> waveform,
                          const DecodingOptions &options) const {
  std::vector<float> temps = {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f};
  std::vector<int32_t> bestTokens;

  for (float t : temps) {
    auto [tokens, scores] = this->generate(waveform, t, options);

    float cumLogProb = std::transform_reduce(
        scores.begin(), scores.end(), 0.0f, std::plus<>(),
        [](float s) { return std::log(std::max(s, 1e-9f)); });

    float avgLogProb = cumLogProb / (tokens.size() + 1);
    std::string text = this->tokenizer.decode(tokens, true);
    float compressionRatio = this->getCompressionRatio(text);

    if (avgLogProb >= -1.0f && compressionRatio < 2.4f) {
      bestTokens = tokens;
      break;
    }
  }

  return this->calculateWordLevelTimestamps(bestTokens, waveform);
}

std::vector<Segment>
ASR::calculateWordLevelTimestamps(std::span<const int32_t> generatedTokens,
                                  const std::span<const float> waveform) const {
  std::vector<Segment> segments;
  std::vector<int32_t> tokens;
  int32_t prevTimestamp = this->timestampBeginToken;

  for (size_t i = 0; i < generatedTokens.size(); i++) {
    if (generatedTokens[i] < this->timestampBeginToken) {
      tokens.push_back(generatedTokens[i]);
    }
    if (i > 0 && generatedTokens[i - 1] >= this->timestampBeginToken &&
        generatedTokens[i] >= this->timestampBeginToken) {
      int32_t start = prevTimestamp;
      int32_t end = generatedTokens[i - 1];
      auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);
      if (words.size()) {
        segments.push_back({words, 0.0});
      }
      tokens.clear();
      prevTimestamp = generatedTokens[i];
    }
  }

  int32_t start = prevTimestamp;
  int32_t end = generatedTokens[generatedTokens.size() - 2];
  auto words = this->estimateWordLevelTimestampsLinear(tokens, start, end);

  if (words.size()) {
    segments.emplace_back(Segment{words, 0.0});
  }

  float scalingFactor =
      static_cast<float>(waveform.size()) / ASR::samplingRate /
      ((end - this->timestampBeginToken) * ASR::timePrecision);
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
  std::string segmentText = this->tokenizer.decode(tokensVec, true);
  std::istringstream iss(segmentText);
  std::vector<std::string> wordsStr;
  std::string word;
  while (iss >> word) {
    wordsStr.push_back(" " + word);
  }

  int32_t numChars = 0;
  for (auto &w : wordsStr)
    numChars += static_cast<int32_t>(w.size());

  float duration = (end - start) * ASR::timePrecision;
  float timePerChar = duration / std::max(1, numChars);
  float startOffset = (start - timestampBeginToken) * ASR::timePrecision;

  std::vector<Word> wordObjs;
  int prevCharCount = 0;
  for (auto &w : wordsStr) {
    float wStart = startOffset + prevCharCount * timePerChar;
    float wEnd = wStart + timePerChar * w.size();
    wordObjs.push_back({w, wStart, wEnd});
    prevCharCount += w.size();
  }

  return wordObjs;
}

std::vector<Segment> ASR::transcribe(std::span<const float> waveform,
                                     const DecodingOptions &options) const {
  int32_t seek = 0;
  std::vector<Segment> results;

  while (seek * ASR::samplingRate < waveform.size()) {
    int32_t start = seek * ASR::samplingRate;
    int32_t end = std::min<int32_t>((seek + ASR::chunkSize) * ASR::samplingRate,
                                    waveform.size());
    std::span<const float> chunk = waveform.subspan(start, end - start);

    if (chunk.size() < ASR::minChunkSamples) {
      break;
    }

    auto segments = this->generateWithFallback(chunk, options);

    for (auto &seg : segments) {
      for (auto &w : seg.words) {
        w.start += seek;
        w.end += seek;
      }
    }

    results.insert(results.end(), segments.begin(), segments.end());
    seek = static_cast<int>(segments.back().words.back().end);
  }

  return results;
}

std::vector<float> ASR::encode(std::span<const float> waveform) const {
  constexpr int32_t fftWindowSize = 512;
  constexpr int32_t stftHopLength = 160;
  constexpr int32_t innerDim = 256;

  const std::vector<float> preprocessedData =
      dsp::stftFromWaveform(waveform, fftWindowSize, stftHopLength);
  const int32_t numFrames = preprocessedData.size() / innerDim;
  const std::vector<int32_t> inputShape = {static_cast<int32_t>(numFrames),
                                           innerDim};

  const auto modelInputTensor = executorch::extension::make_tensor_ptr(
      std::move(inputShape), std::move(preprocessedData));
  const auto encoderResult = this->encoder.forward(modelInputTensor);

  if (!encoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during encoding, error code: " +
        std::to_string(static_cast<int>(encoderResult.error())));
  }

  const auto decoderOutputTensor = encoderResult.get().at(0).toTensor();
  const int32_t outputNumel = decoderOutputTensor.numel();

  const float *const dataPtr = decoderOutputTensor.const_data_ptr<float>();
  std::span<const float> encoderOutputSpan(dataPtr, outputNumel);

  std::vector<float> encoderOutput(encoderOutputSpan.begin(),
                                   encoderOutputSpan.end());

  return encoderOutput;
}

std::vector<float> ASR::decode(std::span<const int32_t> tokens,
                               std::span<const float> encoderOutput) const {
  const std::vector<int32_t> tokenShape = {1,
                                           static_cast<int32_t>(tokens.size())};
  std::vector<int32_t> tokenVec(tokens.begin(), tokens.end());
  auto tokenTensor = executorch::extension::make_tensor_ptr(
      std::move(tokenShape), std::move(tokenVec));

  const int32_t encoderOutputSize = encoderOutput.size();
  const std::vector<int32_t> encShape = {1, ASR::numFrames,
                                         encoderOutputSize / ASR::numFrames};
  std::vector<float> encVec(encoderOutput.begin(), encoderOutput.end());
  auto encoderTensor = executorch::extension::make_tensor_ptr(
      std::move(encShape), std::move(encVec));

  const auto decoderResult =
      this->decoder.forward({tokenTensor, encoderTensor});

  if (!decoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during decoding, error code: " +
        std::to_string(static_cast<int>(decoderResult.error())));
  }

  const auto logitsTensor = decoderResult.get().at(0).toTensor();
  const int32_t outputNumel = logitsTensor.numel();

  const size_t innerDim = logitsTensor.size(1);
  const size_t dictSize = logitsTensor.size(2);

  const float *const dataPtr =
      logitsTensor.const_data_ptr<float>() + (innerDim - 1) * dictSize;
  std::span<const float> logitsSpan(dataPtr, outputNumel / innerDim);

  return std::vector<float>(logitsSpan.begin(), logitsSpan.end());
}

} // namespace rnexecutorch::models::speech_to_text::asr
