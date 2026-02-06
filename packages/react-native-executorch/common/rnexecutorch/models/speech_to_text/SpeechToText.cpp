#include <thread>

#include "SpeechToText.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/models/speech_to_text/types/TranscriptionResult.h>

namespace rnexecutorch::models::speech_to_text {

using namespace ::executorch::extension;
using namespace asr;
using namespace types;
using namespace stream;

SpeechToText::SpeechToText(const std::string &encoderSource,
                           const std::string &decoderSource,
                           const std::string &tokenizerSource,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(std::move(callInvoker)),
      encoder(std::make_unique<BaseModel>(encoderSource, this->callInvoker)),
      decoder(std::make_unique<BaseModel>(decoderSource, this->callInvoker)),
      tokenizer(std::make_unique<TokenizerModule>(tokenizerSource,
                                                  this->callInvoker)),
      asr(std::make_unique<ASR>(this->encoder.get(), this->decoder.get(),
                                this->tokenizer.get())),
      processor(std::make_unique<OnlineASRProcessor>(this->asr.get())),
      isStreaming(false), readyToProcess(false) {}

void SpeechToText::unload() noexcept {
  this->encoder->unload();
  this->decoder->unload();
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::encode(std::span<float> waveform) const {
  std::vector<float> encoderOutput = this->asr->encode(waveform);
  return std::make_shared<OwningArrayBuffer>(encoderOutput);
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::decode(std::span<uint64_t> tokens,
                     std::span<float> encoderOutput) const {
  std::vector<float> decoderOutput = this->asr->decode(tokens, encoderOutput);
  return std::make_shared<OwningArrayBuffer>(decoderOutput);
}

TranscriptionResult SpeechToText::transcribe(std::span<float> waveform,
                                             std::string languageOption,
                                             bool verbose) const {
  DecodingOptions options(languageOption, verbose);
  std::vector<Segment> segments = this->asr->transcribe(waveform, options);

  std::string fullText;
  for (const auto &segment : segments) {
    for (const auto &word : segment.words)
      fullText += word.content;
  }

  TranscriptionResult result;
  result.text = fullText;
  result.task = "transcription";

  if (verbose) {
    result.language = languageOption.empty() ? "english" : languageOption;
    result.duration = static_cast<double>(waveform.size()) / 16000.0;
    result.segments = std::move(segments);
  }

  return result;
}

size_t SpeechToText::getMemoryLowerBound() const noexcept {
  return this->encoder->getMemoryLowerBound() +
         this->decoder->getMemoryLowerBound();
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
    seg.noSpeechProbability = std::nanf("0");
    seg.temperature = std::nanf("0");

    res.segments.push_back(std::move(seg));
  }

  return res;
}
} // namespace

void SpeechToText::stream(std::shared_ptr<jsi::Function> callback,
                          std::string languageOption, bool verbose) {
  if (this->isStreaming) {
    throw RnExecutorchError(RnExecutorchErrorCode::StreamingInProgress,
                            "Streaming is already in progress!");
  }

  auto nativeCallback = [this, callback,
                         verbose](const TranscriptionResult &committed,
                                  const TranscriptionResult &nonCommitted,
                                  bool isDone) {
    // This moves execution to the JS thread
    this->callInvoker->invokeAsync(
        [callback, committed, nonCommitted, isDone, verbose](jsi::Runtime &rt) {
          jsi::Value jsiCommitted =
              rnexecutorch::jsi_conversion::getJsiValue(committed, rt);
          jsi::Value jsiNonCommitted =
              rnexecutorch::jsi_conversion::getJsiValue(nonCommitted, rt);

          callback->call(rt, std::move(jsiCommitted),
                         std::move(jsiNonCommitted), jsi::Value(isDone));
        });
  };

  this->isStreaming = true;
  DecodingOptions options(languageOption, verbose);

  while (this->isStreaming) {
    if (!this->readyToProcess ||
        this->processor->audioBuffer.size() < SpeechToText::kMinAudioSamples) {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
      continue;
    }

    ProcessResult res = this->processor->processIter(options);

    TranscriptionResult cRes =
        wordsToResult(res.committed, languageOption, verbose);
    TranscriptionResult ncRes =
        wordsToResult(res.nonCommitted, languageOption, verbose);

    nativeCallback(cRes, ncRes, false);
    this->readyToProcess = false;
  }

  std::vector<Word> finalWords = this->processor->finish();
  TranscriptionResult finalRes =
      wordsToResult(finalWords, languageOption, verbose);

  nativeCallback(finalRes, {}, true);
  this->resetStreamState();
}

void SpeechToText::streamStop() { this->isStreaming = false; }

void SpeechToText::streamInsert(std::span<float> waveform) {
  this->processor->insertAudioChunk(waveform);
  this->readyToProcess = true;
}

void SpeechToText::resetStreamState() {
  this->isStreaming = false;
  this->readyToProcess = false;
  this->processor = std::make_unique<OnlineASRProcessor>(this->asr.get());
}

} // namespace rnexecutorch::models::speech_to_text
