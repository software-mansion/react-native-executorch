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
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)), isStreaming_(false),
      readyToProcess_(false) {
  // Switch between the ASR implementations based on model name
  if (modelName == "whisper") {
    transcriber_ = std::make_unique<whisper::ASR>(modelSource, tokenizerSource,
                                                  callInvoker_);
    streamer_ = std::make_unique<whisper::stream::OnlineASR>(
        static_cast<const whisper::ASR *>(transcriber_.get()));
  } else {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::InvalidConfig,
        "[SpeechToText]: Invalid model name: " + modelName);
  }
}

void SpeechToText::unload() noexcept { transcriber_->unload(); }

std::shared_ptr<OwningArrayBuffer>
SpeechToText::encode(std::span<float> waveform) const {
  std::vector<float> encoderOutput = transcriber_->encode(waveform);
  return std::make_shared<OwningArrayBuffer>(encoderOutput);
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::decode(std::span<uint64_t> tokens,
                     std::span<float> encoderOutput) const {
  std::vector<float> decoderOutput =
      transcriber_->decode(tokens, encoderOutput);
  return std::make_shared<OwningArrayBuffer>(decoderOutput);
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
    fullText += w.content + w.punctations;
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
                          std::string languageOption, bool verbose) {
  if (isStreaming_) {
    throw RnExecutorchError(RnExecutorchErrorCode::StreamingInProgress,
                            "Streaming is already in progress!");
  }

  auto nativeCallback = [this, callback,
                         verbose](const TranscriptionResult &committed,
                                  const TranscriptionResult &nonCommitted,
                                  bool isDone) {
    // This moves execution to the JS thread
    callInvoker_->invokeAsync(
        [callback, committed, nonCommitted, isDone, verbose](jsi::Runtime &rt) {
          jsi::Value jsiCommitted =
              rnexecutorch::jsi_conversion::getJsiValue(committed, rt);
          jsi::Value jsiNonCommitted =
              rnexecutorch::jsi_conversion::getJsiValue(nonCommitted, rt);

          callback->call(rt, std::move(jsiCommitted),
                         std::move(jsiNonCommitted), jsi::Value(isDone));
        });
  };

  isStreaming_ = true;
  DecodingOptions options(languageOption, verbose);

  while (isStreaming_) {
    if (!readyToProcess_ || !streamer_->isReady()) {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
      continue;
    }

    ProcessResult res = streamer_->process(options);

    TranscriptionResult cRes =
        wordsToResult(res.committed, languageOption, verbose);
    TranscriptionResult ncRes =
        wordsToResult(res.nonCommitted, languageOption, verbose);

    nativeCallback(cRes, ncRes, false);
    readyToProcess_ = false;
  }

  std::vector<Word> finalWords = streamer_->finish();
  TranscriptionResult finalRes =
      wordsToResult(finalWords, languageOption, verbose);

  nativeCallback(finalRes, {}, true);
  resetStreamState();
}

void SpeechToText::streamStop() { isStreaming_ = false; }

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
