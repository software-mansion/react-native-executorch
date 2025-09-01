#include <chrono>
#include <stdexcept>
#include <thread>

#include "SpeechToText.h"
#include "rnexecutorch/Log.h"

namespace rnexecutorch::models::speech_to_text {

using namespace ::executorch::extension;

SpeechToText::SpeechToText(const std::string &encoderSource,
                           const std::string &decoderSource,
                           const std::string &tokenizerSource,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      ASR(encoderSource, decoderSource, tokenizerSource, callInvoker),
      processor(OnlineASRProcessor(this)), isStreaming(false),
      readyToProcess(false) {}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::encode(std::vector<float> waveform) {
  std::vector<float> encoderOutput = ASR::encode(waveform);
  return this->makeOwningBuffer(encoderOutput);
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::decode(std::vector<int32_t> tokens,
                     std::vector<float> encoderOutput) {
  std::vector<float> decoderOutput = ASR::decode(tokens, encoderOutput);
  return this->makeOwningBuffer(decoderOutput);
}

std::string SpeechToText::transcribe(std::vector<float> waveform,
                                     std::string languageOption) {
  std::vector<Segment> segments =
      ASR::transcribe(waveform, DecodingOptions(languageOption));
  std::string transcription;
  for (auto &segment : segments) {
    for (auto &word : segment.words) {
      transcription += word.content;
    }
  }
  return transcription;
}

std::shared_ptr<OwningArrayBuffer>
SpeechToText::makeOwningBuffer(std::span<const float> vectorView) {
  auto owniningArrayBuffer =
      std::make_shared<OwningArrayBuffer>(vectorView.size_bytes());
  std::memcpy(owniningArrayBuffer->data(), vectorView.data(),
              vectorView.size_bytes());
  return owniningArrayBuffer;
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

  this->resetStreamState();

  this->isStreaming = true;
  while (this->isStreaming) {
    if (!this->readyToProcess ||
        this->processor.audioBuffer.size() < SpeechToText::minAudioSamples) {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
      continue;
    }
    ProcessResult res =
        this->processor.processIter(DecodingOptions(languageOption));
    nativeCallback(res.committed, res.nonCommitted, false);
    this->readyToProcess = false;
  }

  std::string committed = this->processor.finish();
  nativeCallback(committed, "", true);
}

void SpeechToText::streamStop() { this->isStreaming = false; }

void SpeechToText::streamInsert(std::vector<float> waveform) {
  if (!this->isStreaming) {
    throw std::runtime_error("Streaming is not started");
  }
  this->processor.insertAudioChunk(waveform);
  this->readyToProcess = true;
}

void SpeechToText::resetStreamState() {
  this->isStreaming = false;
  this->readyToProcess = false;
  this->processor = OnlineASRProcessor(this);
}

} // namespace rnexecutorch::models::speech_to_text
