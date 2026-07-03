#include "Supertonic.h"
#include "Constants.h"
#include "Params.h"
#include "Utils.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/host_objects/JsiConversions.h>

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstring>
#include <fstream>
#include <thread>

namespace rnexecutorch::models::text_to_speech::supertonic {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;

namespace {

// Returns the last non-space character of a view (for pause selection).
char32_t lastMeaningfulChar(std::u32string_view s) {
  for (auto it = s.rbegin(); it != s.rend(); ++it) {
    if (*it != U' ') {
      return *it;
    }
  }
  return s.empty() ? U'.' : s.back();
}

int32_t pauseMsFor(char32_t c) {
  auto it = params::kPauseValues.find(c);
  return it != params::kPauseValues.end() ? it->second : params::kDefaultPause;
}

} // namespace

Supertonic::Supertonic(const std::string &lang,
                       const std::string &unicodeIndexerSource,
                       const std::string &durationPredictorSource,
                       const std::string &textEncoderSource,
                       const std::string &vectorEstimatorSource,
                       const std::string &vocoderSource,
                       const std::string &voiceSource,
                       std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)),
      textProcessor_(unicodeIndexerSource, lang),
      durationPredictor_(durationPredictorSource, callInvoker_),
      textEncoder_(textEncoderSource, callInvoker_),
      vectorEstimator_(vectorEstimatorSource, callInvoker_),
      vocoder_(vocoderSource, callInvoker_), rng_(std::random_device{}()) {
  loadVoice(voiceSource);
}

void Supertonic::loadVoice(const std::string &voiceSource) {
  // Flat little-endian float32 blob: kStyleTtlSize ttl values followed by
  // kStyleDpSize dp values (see scripts/convert_voice.py).
  constexpr size_t expectedFloats =
      constants::kStyleTtlSize + constants::kStyleDpSize;
  std::ifstream in(voiceSource, std::ios::binary);
  if (!in) {
    throw RnExecutorchError(RnExecutorchErrorCode::FileReadFailed,
                            "[Supertonic::loadVoice] cannot open: " +
                                voiceSource);
  }
  in.seekg(0, std::ios::end);
  const auto fileSize = static_cast<size_t>(in.tellg());
  in.seekg(0, std::ios::beg);
  if (fileSize < expectedFloats * sizeof(float)) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Supertonic::loadVoice] voice file too small: need " +
            std::to_string(expectedFloats * sizeof(float)) + " bytes, got " +
            std::to_string(fileSize));
  }
  in.read(reinterpret_cast<char *>(voice_.ttl.data()),
          constants::kStyleTtlSize * sizeof(float));
  in.read(reinterpret_cast<char *>(voice_.dp.data()),
          constants::kStyleDpSize * sizeof(float));
  if (!in) {
    throw RnExecutorchError(RnExecutorchErrorCode::FileReadFailed,
                            "[Supertonic::loadVoice] failed reading voice");
  }
}

void Supertonic::validateSpeed(float speed) const {
  if (speed < constants::kMinValidSpeed) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Supertonic: speed too low (min " +
                                std::to_string(constants::kMinValidSpeed) +
                                ")");
  }
  if (speed > constants::kMaxValidSpeed) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Supertonic: speed too high (max " +
                                std::to_string(constants::kMaxValidSpeed) +
                                ")");
  }
}

std::vector<float> Supertonic::synthesize(std::u32string_view text, float speed,
                                          int32_t totalSteps,
                                          std::string_view lang,
                                          size_t paddingMs) {
  // 1. Preprocess + tokenize.
  TokenizedText tok = textProcessor_.process(text, lang);
  if (tok.ids.empty()) {
    return {};
  }
  // Clamp to the exported model's dynamic-shape range.
  if (tok.ids.size() > constants::kMaxTokens) {
    tok.ids.resize(constants::kMaxTokens);
    tok.mask.resize(constants::kMaxTokens);
  } else if (tok.ids.size() < constants::kMinTokens) {
    tok.ids.resize(constants::kMinTokens, constants::kPadToken);
    tok.mask.resize(constants::kMinTokens, 0.0F);
  }
  const auto tLen = static_cast<int32_t>(tok.ids.size());

  auto idsTensor = make_tensor_ptr({1, tLen}, tok.ids.data(), ScalarType::Long);
  auto maskTensor =
      make_tensor_ptr({1, 1, tLen}, tok.mask.data(), ScalarType::Float);
  auto styleTtlTensor =
      make_tensor_ptr({1, constants::kStyleTtlTokens, constants::kStyleTtlDim},
                      voice_.ttl.data(), ScalarType::Float);
  auto styleDpTensor =
      make_tensor_ptr({1, constants::kStyleDpTokens, constants::kStyleDpDim},
                      voice_.dp.data(), ScalarType::Float);

  // 2. Duration predictor -> seconds.
  auto durResult =
      durationPredictor_.run({idsTensor, styleDpTensor, maskTensor});
  auto durTensor = durResult->at(0).toTensor();
  const float durationSec = durTensor.const_data_ptr<float>()[0] / speed;
  if (!(durationSec > 0.0F)) {
    return {};
  }

  // 3. Text encoder -> text embedding [1, 256, T] (copied so it stays valid
  //    across the vector-estimator loop).
  auto teResult = textEncoder_.run({idsTensor, styleTtlTensor, maskTensor});
  auto textEmbTensor0 = teResult->at(0).toTensor();
  std::vector<float> textEmb(textEmbTensor0.const_data_ptr<float>(),
                             textEmbTensor0.const_data_ptr<float>() +
                                 textEmbTensor0.numel());
  const int32_t textEmbLen = tLen; // [1, 256, T]
  auto textEmbTensor = make_tensor_ptr({1, constants::kTextEmbDim, textEmbLen},
                                       textEmb.data(), ScalarType::Float);

  // 4. Sample masked Gaussian latent noise.
  const int64_t chunk = constants::kSamplesPerLatentFrame;
  const auto sr = static_cast<double>(constants::kSamplingRate);
  const auto wavLen = static_cast<int64_t>(durationSec * sr);
  size_t L = static_cast<size_t>(std::ceil(durationSec * sr / chunk));
  L = std::clamp<size_t>(L, 1, constants::kMaxLatentFrames);
  const size_t latentValid =
      std::min<size_t>(static_cast<size_t>((wavLen + chunk - 1) / chunk), L);
  const int32_t channels = constants::kLatentChannels;

  std::vector<float> latentMask(L, 0.0F);
  std::fill(latentMask.begin(), latentMask.begin() + latentValid, 1.0F);

  std::normal_distribution<float> gauss(0.0F, 1.0F);
  std::vector<float> xt(static_cast<size_t>(channels) * L);
  for (int32_t c = 0; c < channels; ++c) {
    for (size_t i = 0; i < L; ++i) {
      xt[static_cast<size_t>(c) * L + i] = gauss(rng_) * latentMask[i];
    }
  }

  auto xtTensor = make_tensor_ptr({1, channels, static_cast<int32_t>(L)},
                                  xt.data(), ScalarType::Float);
  auto latentMaskTensor = make_tensor_ptr({1, 1, static_cast<int32_t>(L)},
                                          latentMask.data(), ScalarType::Float);

  // 5. Flow-matching Euler loop.
  float totalF = static_cast<float>(totalSteps);
  auto totalTensor = make_tensor_ptr({1}, &totalF, ScalarType::Float);
  for (int32_t step = 0; step < totalSteps; ++step) {
    float curF = static_cast<float>(step);
    auto curTensor = make_tensor_ptr({1}, &curF, ScalarType::Float);
    auto veResult = vectorEstimator_.run(
        {xtTensor, textEmbTensor, styleTtlTensor, maskTensor, latentMaskTensor,
         curTensor, totalTensor});
    auto out = veResult->at(0).toTensor();
    std::memcpy(xt.data(), out.const_data_ptr<float>(),
                xt.size() * sizeof(float));
  }

  // 6. Vocoder -> waveform.
  auto vocResult = vocoder_.run({xtTensor});
  auto wavTensor = vocResult->at(0).toTensor();
  const auto totalSamples = static_cast<size_t>(wavTensor.numel());
  const float *wavPtr = wavTensor.const_data_ptr<float>();

  // 7. Crop to the predicted duration, then strip trailing silence.
  const size_t cropLen = std::min<size_t>(
      static_cast<size_t>(std::max<int64_t>(wavLen, 0)), totalSamples);
  std::span<const float> audio(wavPtr, cropLen > 0 ? cropLen : totalSamples);
  audio =
      utils::stripAudio(audio, paddingMs * constants::kSamplesPerMillisecond);
  return {audio.begin(), audio.end()};
}

std::vector<float> Supertonic::generate(std::u32string input, float speed,
                                        int32_t totalSteps, std::string lang) {
  validateSpeed(speed);
  if (input.size() > params::kMaxTextSize) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Supertonic: maximum input text size exceeded");
  }
  if (input.empty()) {
    return {};
  }

  auto partition = partitioner_.partition(input, params::kMaxSegmentChars,
                                          Partitioner::Mode::MIN_BREAKS);

  std::vector<float> audio;
  for (const auto &[offset, length] : partition.segments) {
    auto sub = partition.content.substr(offset, length);
    auto audioPart = synthesize(sub, speed, totalSteps, lang);
    if (audioPart.empty()) {
      continue;
    }
    const size_t pause =
        static_cast<size_t>(pauseMsFor(lastMeaningfulChar(sub))) *
        constants::kSamplesPerMillisecond;
    audio.insert(audio.end(), std::make_move_iterator(audioPart.begin()),
                 std::make_move_iterator(audioPart.end()));
    audio.resize(audio.size() + pause, 0.0F);
  }
  return audio;
}

void Supertonic::stream(std::shared_ptr<jsi::Function> callback, float speed,
                        int32_t totalSteps, bool stopOnEmptyBuffer,
                        std::string lang) {
  validateSpeed(speed);

  auto nativeCallback = [this, callback](std::vector<float> audioVec) {
    if (this->isStreaming_) {
      this->callInvoker_->invokeAsync(
          [callback, audioVec = std::move(audioVec)](jsi::Runtime &rt) {
            callback->call(
                rt, rnexecutorch::jsi_conversion::getJsiValue(audioVec, rt));
          });
    }
  };

  isStreaming_ = true;
  stopOnEmptyBuffer_ = stopOnEmptyBuffer;
  flushPending_ = false;

  while (isStreaming_) {
    std::u32string input;
    {
      std::scoped_lock<std::mutex> lock(inputTextBufferMutex_);
      if (inputTextBuffer_.empty() && stopOnEmptyBuffer_) {
        break;
      }

      // Find the most recent end-of-sentence character within the window.
      size_t searchLimit =
          std::min(inputTextBuffer_.size(), params::kMaxTextSize);
      auto eosIt = std::find_first_of(
          inputTextBuffer_.rbegin() + (inputTextBuffer_.size() - searchLimit),
          inputTextBuffer_.rend(), constants::kEndOfSentenceCharacters.begin(),
          constants::kEndOfSentenceCharacters.end());
      size_t chunkSize = (eosIt != inputTextBuffer_.rend())
                             ? std::distance(eosIt, inputTextBuffer_.rend())
                             : 0;

      // Hold back partial content until an EOS arrives, unless a flush/stop
      // asked us to drain the tail.
      if (chunkSize == 0 && flushPending_.load()) {
        chunkSize = searchLimit;
      }
      if (chunkSize > 0) {
        input = inputTextBuffer_.substr(0, chunkSize);
        inputTextBuffer_.erase(0, chunkSize);
        if (inputTextBuffer_.empty()) {
          flushPending_ = false;
        }
      }
    }

    if (!input.empty()) {
      auto partition = partitioner_.partition(input, params::kMaxSegmentChars,
                                              Partitioner::Mode::MIN_LATENCY);
      for (const auto &[offset, length] : partition.segments) {
        if (!isStreaming_) {
          break;
        }
        auto sub = partition.content.substr(offset, length);
        auto audioPart = synthesize(sub, speed, totalSteps, lang);
        if (audioPart.empty()) {
          continue;
        }
        const size_t pause =
            static_cast<size_t>(pauseMsFor(lastMeaningfulChar(sub))) *
            constants::kSamplesPerMillisecond;
        audioPart.resize(audioPart.size() + pause, 0.0F);
        nativeCallback(std::move(audioPart));
      }
    }

    if (isStreaming_) {
      std::this_thread::sleep_for(
          std::chrono::milliseconds(params::kStreamPause));
    }
  }

  {
    std::scoped_lock<std::mutex> lock(inputTextBufferMutex_);
    inputTextBuffer_.clear();
    isStreaming_ = false;
    flushPending_ = false;
  }
}

void Supertonic::streamInsert(std::u32string chunk) noexcept {
  std::scoped_lock<std::mutex> lock(inputTextBufferMutex_);
  inputTextBuffer_.append(chunk);
}

void Supertonic::streamFlush() noexcept { flushPending_ = true; }

void Supertonic::streamStop(bool instant) noexcept {
  if (instant) {
    isStreaming_ = false;
  } else {
    flushPending_ = true;
    stopOnEmptyBuffer_ = true;
  }
}

std::size_t Supertonic::getMemoryLowerBound() const noexcept {
  return durationPredictor_.getMemoryLowerBound() +
         textEncoder_.getMemoryLowerBound() +
         vectorEstimator_.getMemoryLowerBound() +
         vocoder_.getMemoryLowerBound() + textProcessor_.getMemoryLowerBound() +
         sizeof(voice_);
}

void Supertonic::unload() noexcept {
  durationPredictor_.unload();
  textEncoder_.unload();
  vectorEstimator_.unload();
  vocoder_.unload();
}

} // namespace rnexecutorch::models::text_to_speech::supertonic
