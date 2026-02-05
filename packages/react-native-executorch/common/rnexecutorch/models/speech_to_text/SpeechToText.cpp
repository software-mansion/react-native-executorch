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

// std::vector<Word> SpeechToText::transcribe(std::span<float> waveform,
//                                            std::string languageOption) const
//                                            {
//   std::vector<Segment> segments =
//       this->asr->transcribe(waveform, DecodingOptions(languageOption));
//   std::vector<Word> transcription;

//   size_t transcriptionLength = 0;
//   for (auto &segment : segments) {
//     transcriptionLength += segment.words.size();
//   }

//   transcription.reserve(segments.size());

//   for (auto &segment : segments) {
//     for (auto &word : segment.words) {
//       transcription.push_back(word);
//     }
//   }

//   return transcription;
// }

// std::vector<char>
// SpeechToText::transcribeStringOnly(std::span<float> waveform,
//                                    std::string languageOption) const {
//   std::vector<Segment> segments =
//       this->asr->transcribe(waveform, DecodingOptions(languageOption));
//   std::string transcription;

//   size_t transcriptionLength = 0;
//   for (auto &segment : segments) {
//     for (auto &word : segment.words) {
//       transcriptionLength += word.content.size();
//     }
//   }
//   transcription.reserve(transcriptionLength);

//   for (auto &segment : segments) {
//     for (auto &word : segment.words) {
//       transcription += word.content;
//     }
//   }

//   return {transcription.begin(), transcription.end()};
// }

// std::vector<char> mergeWordsToString(const std::vector<Word> &words) {
//   std::string result;
//   size_t totalLength = 0;

//   for (const auto &word : words) {
//     totalLength += word.content.size();
//   }
//   result.reserve(totalLength);

//   for (const auto &word : words) {
//     result += word.content;
//   }

//   return {result.begin(), result.end()};
// }

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

// void SpeechToText::stream(std::shared_ptr<jsi::Function> callback,
//                           std::string languageOption, bool enableTimestamps)
//                           {
//   if (this->isStreaming) {
//     throw RnExecutorchError(RnExecutorchErrorCode::StreamingInProgress,
//                             "Streaming is already in progress!");
//   }

//   auto nativeCallback = [this, callback](const auto &committedVec,
//                                          const auto &nonCommittedVec,
//                                          bool isDone) {
//     this->callInvoker->invokeAsync(
//         [callback, committedVec, nonCommittedVec, isDone](jsi::Runtime &rt) {
//           jsi::Value committedJsi =
//               rnexecutorch::jsi_conversion::getJsiValue(committedVec, rt);
//           jsi::Value nonCommittedJsi =
//               rnexecutorch::jsi_conversion::getJsiValue(nonCommittedVec, rt);

//           callback->call(rt, std::move(committedJsi),
//                          std::move(nonCommittedJsi), jsi::Value(isDone));
//         });
//   };

//   this->isStreaming = true;
//   while (this->isStreaming) {
//     if (!this->readyToProcess ||
//         this->processor->audioBuffer.size() < SpeechToText::kMinAudioSamples)
//         {
//       std::this_thread::sleep_for(std::chrono::milliseconds(100));
//       continue;
//     }
//     ProcessResult res =
//         this->processor->processIter(DecodingOptions(languageOption));

//     if (enableTimestamps) {
//       nativeCallback(res.committed, res.nonCommitted, false);
//     } else {
//       nativeCallback(mergeWordsToString(res.committed),
//                      mergeWordsToString(res.nonCommitted), false);
//     }
//     this->readyToProcess = false;
//   }

//   std::vector<Word> committed = this->processor->finish();

//   if (enableTimestamps) {
//     nativeCallback(committed, std::vector<Word>{}, true);
//   } else {
//     nativeCallback(mergeWordsToString(committed), std::vector<char>(), true);
//   }

//   this->resetStreamState();
// }

namespace {
// Helper to convert a list of Words (from streaming) into the API Result format
TranscriptionResult wordsToResult(const std::vector<Word> &words,
                                  const std::string &language, bool verbose) {
  TranscriptionResult res;
  res.language = language;

  // 1. Flatten text
  std::string fullText;
  for (const auto &w : words) {
    fullText += w.content;
  }
  res.text = fullText;

  // 2. Build Verbose Segment
  // Since OnlineASRProcessor only gives us Words, we create a single
  // "Segment" containing all these words for the current chunk.
  if (verbose && !words.empty()) {
    Segment seg;
    seg.start = words.front().start;
    seg.end = words.back().end;
    seg.words = words;

    // Note: 'tokens', 'avgLogprob', etc. are missing in the 'Word' struct,
    // so they will remain empty/default here.

    res.segments.push_back(std::move(seg));
  }

  return res;
}
} // namespace

void SpeechToText::stream(std::shared_ptr<jsi::Function> callback,
                          std::string languageOption, bool verbose) {
  if (this->isStreaming) { /* error... */
  }

  // Lambda that constructs the C++ structs (thread-safe, no JSI here)
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

    // 1. Get the Vector of Words
    ProcessResult res = this->processor->processIter(options);

    // 2. Convert Vectors to TranscriptionResult structs
    TranscriptionResult cRes =
        wordsToResult(res.committed, languageOption, verbose);
    TranscriptionResult ncRes =
        wordsToResult(res.nonCommitted, languageOption, verbose);

    // 3. Pass to callback
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
