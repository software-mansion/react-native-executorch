#include <thread>

#include "SpeechToText.h"

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

std::shared_ptr<OwningArrayBuffer>
SpeechToText::encode(std::span<float> waveform) const {
  std::vector<float> encoderOutput = this->asr->encode(waveform);
  return this->makeOwningBuffer(encoderOutput);
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::decode(std::span<int32_t> tokens,
                     std::span<float> encoderOutput) const {
  std::vector<float> decoderOutput = this->asr->decode(tokens, encoderOutput);
  return this->makeOwningBuffer(decoderOutput);
}

std::string SpeechToText::transcribe(std::span<float> waveform,
                                     std::string languageOption) const {
  std::vector<Segment> segments =
      this->asr->transcribe(waveform, DecodingOptions(languageOption));
  std::string transcription;

  size_t transcriptionLength = 0;
  for (auto &segment : segments) {
    for (auto &word : segment.words) {
      transcriptionLength += word.content.size();
    }
  }
  transcription.reserve(transcriptionLength);

  for (auto &segment : segments) {
    for (auto &word : segment.words) {
      transcription += word.content;
    }
  }
  return transcription;
}

size_t SpeechToText::getMemoryLowerBound() const noexcept {
  return this->encoder->getMemoryLowerBound() +
         this->decoder->getMemoryLowerBound() +
         this->tokenizer->getMemoryLowerBound();
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::makeOwningBuffer(std::span<const float> vectorView) const {
  auto owningArrayBuffer =
      std::make_shared<OwningArrayBuffer>(vectorView.size_bytes());
  std::memcpy(owningArrayBuffer->data(), vectorView.data(),
              vectorView.size_bytes());
  return owningArrayBuffer;
}

void SpeechToText::stream(std::shared_ptr<jsi::Function> callback,
                          std::string languageOption) {
  if (this->isStreaming) {
    throw std::runtime_error("Streaming is already in progress");
  }

  auto nativeCallback = [this, callback](const std::string &committed,
                                         const std::string &nonCommitted,
                                         bool isDone) {
    this->callInvoker->invokeAsync(
        [callback, committed, nonCommitted, isDone](jsi::Runtime &rt) {
          callback->call(rt, jsi::String::createFromUtf8(rt, committed),
                         jsi::String::createFromUtf8(rt, nonCommitted),
                         jsi::Value(isDone));
        });
  };

  this->isStreaming = true;
  while (this->isStreaming) {
    if (!this->readyToProcess ||
        this->processor->audioBuffer.size() < SpeechToText::kMinAudioSamples) {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
      continue;
    }
    ProcessResult res =
        this->processor->processIter(DecodingOptions(languageOption));
    nativeCallback(res.committed, res.nonCommitted, false);
    this->readyToProcess = false;
  }

  std::string committed = this->processor->finish();
  nativeCallback(committed, "", true);

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
