#include <thread>

#include "SpeechToText.h"
#include "common/types/TranscriptionResult.h"
#include "whisper/ASR.h"
#include "whisper/OnlineASR.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::models::speech_to_text {

SpeechToText::SpeechToText(const std::string &modelName,
                           const std::string &modelSource,
                           const std::string &tokenizerSource,
                           const std::string &vadSource,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)) {
  // Switch between the ASR implementations based on model name
  if (modelName == "whisper") {
    if (!vadSource.empty()) {
      vad_ = std::make_unique<VoiceActivityDetection>(vadSource, callInvoker_);
    }

    transcriber_ = std::make_unique<whisper::ASR>(modelSource, tokenizerSource,
                                                  callInvoker_);
    streamer_ = std::make_unique<whisper::stream::OnlineASR>(
        static_cast<const whisper::ASR *>(transcriber_.get()),
        static_cast<const VoiceActivityDetection *>(vad_.get()));
  } else {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::InvalidConfig,
        "[SpeechToText]: Invalid model name: " + modelName);
  }
}

SpeechToText::SpeechToText(SpeechToText &&other) noexcept
    : callInvoker_(std::move(other.callInvoker_)),
      transcriber_(std::move(other.transcriber_)),
      streamer_(std::move(other.streamer_)),
      isStreaming_(other.isStreaming_.load()),
      readyToProcess_(other.readyToProcess_.load()) {}

void SpeechToText::unload() noexcept { transcriber_->unload(); }

std::shared_ptr<OwningArrayBuffer>
SpeechToText::encode(std::span<float> waveform) const {
  executorch::aten::Tensor encoderOutputTensor = transcriber_->encode(waveform);

  return std::make_shared<OwningArrayBuffer>(
      encoderOutputTensor.const_data_ptr<float>(),
      sizeof(float) * encoderOutputTensor.numel());
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::decode(std::span<uint64_t> tokens,
                     std::span<float> encoderOutput) const {
  executorch::aten::Tensor decoderOutputTensor =
      transcriber_->decode(tokens, encoderOutput);

  return std::make_shared<OwningArrayBuffer>(
      decoderOutputTensor.const_data_ptr<float>(),
      sizeof(float) * decoderOutputTensor.numel());
}

TranscriptionResult SpeechToText::transcribe(std::span<float> waveform,
                                             std::string languageOption,
                                             bool verbose) const {
  DecodingOptions options(languageOption, verbose);
  std::vector<Segment> segments = transcriber_->transcribe(waveform, options);

  std::string fullText;
  for (const auto &segment : segments) {
    for (const auto &word : segment.words)
      fullText += word.content;
  }

  TranscriptionResult result;
  result.text = fullText;
  result.task = "transcribe";

  if (verbose) {
    result.language = languageOption.empty() ? "english" : languageOption;
    result.duration = static_cast<double>(waveform.size()) / 16000.0;
    result.segments = std::move(segments);
  }

  return result;
}

size_t SpeechToText::getMemoryLowerBound() const noexcept {
  return transcriber_->getMemoryLowerBound();
}

namespace {
TranscriptionResult wordsToResult(const std::vector<Word> &words,
                                  const std::string &language, bool verbose) {
  TranscriptionResult res;
  res.language = language;
  res.task = "stream";

  std::string fullText;
  for (const auto &w : words) {
    fullText += w.content;
  }
  res.text = fullText;

  if (verbose && !words.empty()) {
    Segment seg;
    seg.start = words.front().start;
    seg.end = words.back().end;
    seg.words = words;
    seg.avgLogprob = std::nanf("0");
    seg.compressionRatio = std::nanf("0");
    seg.temperature = std::nanf("0");

    res.segments.push_back(std::move(seg));
  }

  return res;
}
} // namespace

void SpeechToText::stream(std::shared_ptr<jsi::Function> callback,
                          std::string languageOption, bool verbose,
                          uint32_t timeout, bool useVAD,
                          uint32_t vadDetectionMargin) {
  if (isStreaming_) {
    throw RnExecutorchError(RnExecutorchErrorCode::StreamingInProgress,
                            "Streaming is already in progress!");
  }

  // VAD must be initialized for this option to work.
  if (useVAD && !vad_) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Attempting to use VAD but it's not initialized!");
  }

  auto nativeCallback =
      [this, callback](const TranscriptionResult &committed,
                       const TranscriptionResult &nonCommitted, bool isDone) {
        // This moves execution to the JS thread
        callInvoker_->invokeAsync(
            [callback, committed, nonCommitted, isDone](jsi::Runtime &rt) {
              jsi::Value jsiCommitted =
                  rnexecutorch::jsi_conversion::getJsiValue(committed, rt);
              jsi::Value jsiNonCommitted =
                  rnexecutorch::jsi_conversion::getJsiValue(nonCommitted, rt);

              callback->call(rt, std::move(jsiCommitted),
                             std::move(jsiNonCommitted), jsi::Value(isDone));
            });
      };

  isStreaming_ = true;
  StreamingOptions options(languageOption, verbose, useVAD, vadDetectionMargin);

  while (isStreaming_) {
    if (readyToProcess_ && streamer_->isReady()) {
      ProcessResult res = streamer_->process(options);

      // This is not only about optimization, but also about ensuring
      // correctness when VAD is used. Otherwise we run into the vanishing text
      // issue.
      if (!res.committed.empty() || !res.nonCommitted.empty()) {
        TranscriptionResult committedRes =
            wordsToResult(res.committed, languageOption, verbose);
        TranscriptionResult nonCommittedRes =
            wordsToResult(res.nonCommitted, languageOption, verbose);

        nativeCallback(committedRes, nonCommittedRes, false);
      }

      readyToProcess_ = false;
    }

    // Add a minimal pause between transcriptions.
    // The reasoning is very simple: with the current liberal threshold values,
    // running transcriptions too rapidly (before the audio buffer is filled
    // with significant amount of new data) can cause streamer to commit wrong
    // phrases. We wait on a condition_variable so streamStop() can break the
    // pause immediately — inserts intentionally do not wake us, to preserve
    // the throttle.
    std::unique_lock<std::mutex> lock(streamCvMutex_);
    streamCv_.wait_for(lock, std::chrono::milliseconds(timeout),
                       [this] { return !isStreaming_.load(); });
  }

  // Do not use VAD on final processing to flush and commit everything properly.
  StreamingOptions finishOptions = options;
  finishOptions.useVAD = false;

  std::vector<Word> finalWords = streamer_->finish(finishOptions);
  TranscriptionResult finalRes =
      wordsToResult(finalWords, languageOption, verbose);

  nativeCallback(finalRes, {}, true);
  resetStreamState();
}

void SpeechToText::streamStop() {
  isStreaming_ = false;
  streamCv_.notify_all();
}

void SpeechToText::streamInsert(std::span<float> waveform) {
  streamer_->insertAudioChunk(waveform);
  readyToProcess_ = true;
}

void SpeechToText::resetStreamState() {
  isStreaming_ = false;
  readyToProcess_ = false;
  streamer_->reset();
}

} // namespace rnexecutorch::models::speech_to_text
