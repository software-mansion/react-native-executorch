#include "Kokoro.h"
#include "Params.h"
#include "Utils.h"

#include <algorithm>
#include <fstream>
#include <phonemis/utils/conversions.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/Sequential.h>
#include <thread>

namespace rnexecutorch::models::text_to_speech::kokoro {

Kokoro::Kokoro(const std::string &lang, const std::string &taggerDataSource,
               const std::string &lexiconSource,
               const std::string &neuralModelSource,
               const std::string &durationPredictorSource,
               const std::string &synthesizerSource,
               const std::string &voiceSource,
               std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker_(std::move(callInvoker)),
      phonemizer_(phonemis::Config{
          .lang = lang,
          .tagger = taggerDataSource.empty()
                        ? std::optional<phonemis::tagger::Config>{}
                        : std::make_optional(phonemis::tagger::Config{
                              .data_filepath = taggerDataSource}),
          .phonemizer =
              phonemis::phonemizer::Config{
                  .lang = lang,
                  .lexicon_filepath = lexiconSource.empty()
                                          ? std::nullopt
                                          : std::make_optional(lexiconSource),
                  .nn_model_filepath =
                      neuralModelSource.empty()
                          ? std::nullopt
                          : std::make_optional(neuralModelSource)}}),
      durationPredictor_(durationPredictorSource, context_, callInvoker_),
      synthesizer_(synthesizerSource, context_, callInvoker_) {
  // Populate the voice array by reading given file
  loadVoice(voiceSource);

  // Read model limits & check compatibility
  if (durationPredictor_.getTokensLimit() != synthesizer_.getTokensLimit()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::WrongDimensions,
        "[Kokoro] incompatible DurationPredictor & Synthesizer models");
  }

  context_.inputTokensLimit = durationPredictor_.getTokensLimit();
  context_.inputDurationLimit = synthesizer_.getDurationLimit();
}

void Kokoro::loadVoice(const std::string &voiceSource) {
  constexpr size_t cols = static_cast<size_t>(constants::kVoiceRefSize);
  constexpr size_t bytesPerRow = cols * sizeof(float);

  std::ifstream in(voiceSource, std::ios::binary);
  if (!in) {
    throw RnExecutorchError(RnExecutorchErrorCode::FileReadFailed,
                            "[Kokoro::loadVoice]: cannot open file: " +
                                voiceSource);
  }

  // Determine number of rows from file size
  in.seekg(0, std::ios::end);
  const auto fileSize = static_cast<size_t>(in.tellg());
  in.seekg(0, std::ios::beg);

  if (fileSize < bytesPerRow) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Kokoro::loadVoice]: file too small: need at least " +
            std::to_string(bytesPerRow) + " bytes for one row, got " +
            std::to_string(fileSize));
  }

  const size_t rows = fileSize / bytesPerRow;
  const auto readBytes = static_cast<std::streamsize>(rows * bytesPerRow);

  // Resize voice vector to hold all rows from the file
  voice_.resize(rows);

  if (!in.read(reinterpret_cast<char *>(voice_.data()->data()), readBytes)) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::FileReadFailed,
        "[Kokoro::loadVoice]: failed to read voice weights");
  }
}

std::vector<float> Kokoro::generate(std::u32string input, float speed,
                                    bool phonemize) {
  if (input.size() > params::kMaxTextSize) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "Kokoro: maximum input text size exceeded");
  }

  if (input.empty()) {
    return {};
  }

  // G2P (Grapheme to Phoneme) conversion
  auto phonemes = phonemize ? phonemizer_(input) : input;

  // Divide the phonemes string into substrings, minimizing the amount of
  // breaks.
  auto partition = partitioner_.partition(phonemes, context_.inputTokensLimit,
                                          Partitioner::Mode::MIN_BREAKS);

  std::vector<float> audio = {};
  for (const auto &[offset, length] : partition.segments) {
    auto subsentence = partition.content.substr(offset, length);

    // Generate an audio vector with the Kokoro model
    auto audioPart = synthesize(subsentence, speed);

    // Calculate a pause between the sentences
    char32_t lastPhoneme = subsentence.back();
    size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                         ? params::kPauseValues.at(lastPhoneme)
                         : params::kDefaultPause;

    // Add audio part and silence pause to the main audio vector
    audio.insert(audio.end(), std::make_move_iterator(audioPart.begin()),
                 std::make_move_iterator(audioPart.end()));
    audio.resize(audio.size() + pauseMs * constants::kSamplesPerMilisecond,
                 0.F);
  }

  return audio;
}

void Kokoro::stream(std::shared_ptr<jsi::Function> callback, float speed,
                    bool phonemize, bool stopOnEmptyBuffer) {
  // Create a callback
  auto nativeCallback = [this, callback](const std::vector<float> &audioVec) {
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

  // The outer streaming loop is responsible for handling the input buffer.
  // The extracted text is then passed to the inner loop, which performs a
  // standard streaming on a fixed amount of input text.
  while (isStreaming_) {
    std::string text;

    // Extract the code relying on input buffer for a separate mutex lock
    // section.
    {
      std::scoped_lock<std::mutex> lock(inputTextBufferMutex_);
      if (inputTextBuffer_.empty() && stopOnEmptyBuffer_) {
        break;
      }

      // Try to find the most recent available end of sentence character.
      size_t searchLimit =
          std::min(inputTextBuffer_.size(), params::kMaxTextSize);
      auto eosIt = std::find_first_of(
          inputTextBuffer_.rbegin() + (inputTextBuffer_.size() - searchLimit),
          inputTextBuffer_.rend(), constants::kEndOfSentenceCharacters.begin(),
          constants::kEndOfSentenceCharacters.end());
      size_t chunkSize = (eosIt != inputTextBuffer_.rend())
                             ? std::distance(eosIt, inputTextBuffer_.rend())
                             : 0;

      // To maximize the quality of the speech, we try to avoid processing
      // chunks which end in the middle of a sentence.
      if (chunkSize > 0 ||
          streamSkippedIterations >= params::kStreamMaxSkippedIterations) {
        text = inputTextBuffer_.substr(0, chunkSize);
        inputTextBuffer_.erase(0, chunkSize);
        streamSkippedIterations = 0;
      } else {
        streamSkippedIterations++;
      }
    }

    if (!text.empty()) {
      // Now we proceed with a standard streaming logic for fixed-size input.
      auto phonemes = phonemize
                          ? phonemizer_(text)
                          : phonemis::utils::conversions::utf8_to_u32(text);

      auto partition = partitioner_.partition(
          phonemes, context_.inputTokensLimit, Partitioner::Mode::MIN_LATENCY);

      for (size_t i = 0; i < partition.segments.size(); i++) {
        if (!isStreaming_) {
          break;
        }

        const auto &[offset, length] = partition.segments[i];
        const auto subsentence = partition.content.substr(offset, length);

        // Determine the silent padding duration to be stripped from the edges
        // of the generated audio. If a chunk ends with a space or follows one
        // that did, it indicates a word boundary split – we use a shorter
        // padding to ensure natural speech flow. Otherwise, we use 50ms for
        // standard pauses.
        bool endsWithSpace = (subsentence.back() == U' ');
        bool prevEndsWithSpace =
            (i > 0 && partition.content[offset - 1] == U' ');
        size_t paddingMs = endsWithSpace || prevEndsWithSpace ? 15 : 50; // [ms]

        // Generate an audio vector with the Kokoro model
        auto audioPart = synthesize(subsentence, speed, paddingMs);

        // Calculate and append a pause between the sentences
        char32_t lastPhoneme = subsentence.back();
        size_t pauseMs = params::kPauseValues.contains(lastPhoneme)
                             ? params::kPauseValues.at(lastPhoneme)
                             : params::kDefaultPause;

        audioPart.resize(
            audioPart.size() + pauseMs * constants::kSamplesPerMilisecond, 0.F);

        // Push the audio right away to the JS side
        nativeCallback(std::move(audioPart));
      }
    }

    // A little bit of pause to not overload the thread.
    if (isStreaming_) {
      std::this_thread::sleep_for(
          std::chrono::milliseconds(params::kStreamPause));
    }
  }

  {
    std::scoped_lock<std::mutex> lock(inputTextBufferMutex_);
    inputTextBuffer_.clear();
    isStreaming_ = false;
    streamSkippedIterations = 0;
  }
}

std::vector<float> Kokoro::synthesize(std::u32string_view phonemes, float speed,
                                      size_t paddingMs) {
  if (phonemes.empty()) {
    return {};
  }

  // 1. Prepare input tokens.
  // Clamp input to avoid exceeding model limits (2 tokens reserved for pre/post
  // padding).
  const size_t noTokens =
      std::clamp(phonemes.size() + 2, constants::kMinInputTokens,
                 context_.inputTokensLimit);
  const auto tokens = utils::tokenize(phonemes, {noTokens});

  // 2. Select the appropriate voice vector.
  // Each number of input tokens corresponds to a different voice embedding
  // vector.
  const size_t voiceID =
      std::min({phonemes.size() - 1, noTokens - 1, voice_.size() - 1});
  const auto &voice = voice_[voiceID];

  // 3. Initialize text mask.
  // Exclude all paddings except the first and last ones.
  // We use uint8_t instead of bool to avoid boolean span issues.
  std::vector<uint8_t> textMask(noTokens, false);
  std::fill(textMask.begin(),
            textMask.begin() + std::min(phonemes.size() + 2, noTokens), true);

  // 4. Inference Phase 1: DurationPredictor (submodule).
  // Results in 'd' (durations), 'indices', and 'effectiveDuration'.
  auto [d, indices, effectiveDuration] = durationPredictor_.generate(
      std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span(voice).last(constants::kVoiceRefHalfSize), speed);

  // 5. Inference Phase 2: Synthesizer.
  // Note that we reduce the size of the duration tensor to match the number of
  // tokens.
  auto decoding = synthesizer_.generate(
      std::span(tokens),
      std::span(reinterpret_cast<bool *>(textMask.data()), textMask.size()),
      std::span(indices),
      std::span<float>(d.mutable_data_ptr<float>(),
                       noTokens * d.sizes().back()),
      std::span(voice));

  // 6. Post-processing: Finalize audio.
  const auto audioTensor = decoding->at(0).toTensor();
  const int32_t audioLength = constants::kTicksPerDuration * effectiveDuration;

  const auto audio =
      std::span<const float>(audioTensor.const_data_ptr<float>(), audioLength);

  const auto croppedAudio =
      utils::stripAudio(audio, paddingMs * constants::kSamplesPerMilisecond);

  return {croppedAudio.begin(), croppedAudio.end()};
}

void Kokoro::streamInsert(std::string textChunk) noexcept {
  std::scoped_lock<std::mutex> lock(inputTextBufferMutex_);
  inputTextBuffer_.append(textChunk);
}

void Kokoro::streamStop(bool instant) noexcept {
  if (instant) {
    isStreaming_ = false;
  } else {
    stopOnEmptyBuffer_ = true;
  }
}

std::size_t Kokoro::getMemoryLowerBound() const noexcept {
  return durationPredictor_.getMemoryLowerBound() +
         synthesizer_.getMemoryLowerBound() + sizeof(voice_) +
         sizeof(phonemizer_);
}

void Kokoro::unload() noexcept {
  durationPredictor_.unload();
  synthesizer_.unload();
}

} // namespace rnexecutorch::models::text_to_speech::kokoro
