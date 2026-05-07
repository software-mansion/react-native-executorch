#include "OnlineASR.h"

#include <algorithm>
#include <iterator>
#include <utility>

#include "Constants.h"
#include "Params.h"
#include "Utils.h"

namespace rnexecutorch::models::speech_to_text::whisper::stream {

OnlineASR::OnlineASR(const ASR *asr) : asr_(asr) {
  // Reserve an expected amount of memory for audio buffer.
  audioBuffer_.reserve((constants::kChunkSize + 1) * constants::kSamplingRate);
}

bool OnlineASR::isReady() const {
  return audioBuffer_.size() >= constants::kMinChunkSamples;
}

void OnlineASR::insertAudioChunk(std::span<const float> audio) {
  std::scoped_lock<std::mutex> lock(audioBufferMutex_);
  audioBuffer_.insert(audioBuffer_.end(), audio.begin(), audio.end());
}

ProcessResult OnlineASR::process(const DecodingOptions &options) {
  std::vector<float> audioCopy;

  // Copy the audio buffer to avoid keeping the lock during the entire
  // transcription process.
  {
    std::scoped_lock<std::mutex> lock(audioBufferMutex_);
    audioCopy = audioBuffer_;
  }

  // Obtain a transcription for current audio buffer state.
  // It's very unlikely that buffer will exceed whisper's maximum capacity, but
  // for absolute safety we can additionally clip the buffer.
  std::span<const float> input(
      audioCopy.begin(),
      audioCopy.begin() + std::min(constants::kMaxSamples, audioCopy.size()));

  std::vector<Segment> transcriptions = asr_->transcribe(input, options);

  // Flatten segments into a single word sequence.
  // This is basically our 'nonCommitted' part for now.
  std::vector<Word> words;
  for (auto &segment : transcriptions) {
    std::move(segment.words.begin(), segment.words.end(),
              std::back_inserter(words));
  }

  std::vector<Word> committed;

  // Step 1: examine all previously saved EOS points.
  // The idea is to remove entries which have changed or no longer exist
  // due to model correcting it's output.
  for (size_t i = 0; i < eos_.size(); i++) {
    const auto &eos = eos_[i];
    if (eos.position >= words.size() || !utils::isEos(words[eos.position]) ||
        (eos.position > 0 &&
         eos.preceeding != words[eos.position - 1].content)) {
      eos_.erase(eos_.begin() + i, eos_.end());
      break;
    }
  }

  // Step 2: check if the newest EOS character from transcript should be
  // saved to eos_ vector.
  auto lastEosIt = std::find_if(words.rbegin(), words.rend(), utils::isEos);
  if (lastEosIt != words.rend()) {
    size_t lastEosIndex = std::distance(words.begin(), lastEosIt.base()) - 1;

    // Because of step 1, we know that if the last EOS exist in eos_,
    // then it must be the last entry.
    if (eos_.empty() || eos_.back().position != lastEosIndex) {
      // Register last EOS entry
      std::string preceeding =
          lastEosIndex > 0 ? words[lastEosIndex - 1].content : "";
      eos_.emplace_back(lastEosIndex, preceeding, lastEosIt->end);
    }
  }

  // Step 3: clear the buffer if it is getting too large.
  // The idea is to use the saved EOS entries and try to cut the buffer
  // in a 'good' spot - where it will remove a significant audio chunk, yet
  // won't affect most recent, unfinished speech samples.
  size_t bufferSize = audioBuffer_.size();
  if (bufferSize > static_cast<size_t>(params::kStreamSafeBufferDuration *
                                       constants::kSamplingRate)) {
    // Setup the lock for the entire cleanup section.
    std::scoped_lock<std::mutex> lock(audioBufferMutex_);

    const float midBufferThreshold = params::kStreamMaxDuration / 2.0F;

    // If we don't have any EOS entries, then we most likely have not
    // recorded any speech. In this case we can safely cut the maximum amount of
    // audio data.
    if (eos_.empty()) {
      size_t cut = bufferSize - params::kStreamSafetyThreshold;

      audioBuffer_.erase(audioBuffer_.begin(), audioBuffer_.begin() + cut);
    }

    // If we have exactly one (most recent) EOS entry in the eos_, then
    // we need to be more careful.
    // Normally we want to keep at least one sentence in, but if the sentence
    // covers a significant amount of buffer, we have no choice.
    else if (eos_.size() == 1) {
      const float eosTimestamp = eos_[0].tmstpend;

      const float upperHalfDuration =
          std::max(0.0F, eosTimestamp - midBufferThreshold);
      const float wordsPerSecond =
          upperHalfDuration > 0.1F
              ? static_cast<float>(words.size()) / upperHalfDuration
              : 0.0F;

      // The EOS sits early enough that cutting up to the safety margin won't
      // touch the ongoing (post-EOS) speech.
      const bool eosSafe = eosTimestamp < params::kStreamSafeBufferDuration -
                                              params::kStreamSafetyThreshold;

      if (!eosSafe && wordsPerSecond < params::kWordsPerSecondLow) {
        // EOS lies past the midpoint, but a low word density implies the spoken
        // audio is concentrated in the upper half. Drop the lower half and
        // shift the EOS accordingly.
        audioBuffer_.erase(audioBuffer_.begin(),
                           audioBuffer_.begin() +
                               static_cast<size_t>(midBufferThreshold *
                                                   constants::kSamplingRate));
        eos_[0].tmstpend -= midBufferThreshold;
      } else {
        // Cut everything up to and including the sentence — either by the
        // safety margin (when EOS is early) or (more aggresively) right at the
        // EOS boundary — and commit its words.
        const size_t cut =
            eosSafe
                ? bufferSize -
                      static_cast<size_t>(params::kStreamSafetyThreshold *
                                          constants::kSamplingRate)
                : static_cast<size_t>(eosTimestamp * constants::kSamplingRate);

        audioBuffer_.erase(audioBuffer_.begin(), audioBuffer_.begin() + cut);

        committed.insert(committed.end(),
                         std::make_move_iterator(words.begin()),
                         std::make_move_iterator(words.end()));

        words.clear();
        eos_.clear();
      }
    }

    // In case of 2 or more sentences, we generally want to keep the last one
    // intact. This would provide a bit of stability to the algorithm.
    else {
      const auto &secondTolastEntry = eos_[eos_.size() - 2];

      const size_t cut = static_cast<size_t>(secondTolastEntry.tmstpend *
                                             constants::kSamplingRate);
      const size_t lastCommittedPos = secondTolastEntry.position;

      audioBuffer_.erase(audioBuffer_.begin(), audioBuffer_.begin() + cut);

      // Move all words up to the last committed position (inclusive) to the
      // committed buffer.
      committed.insert(
          committed.end(), std::make_move_iterator(words.begin()),
          std::make_move_iterator(words.begin() + lastCommittedPos + 1));
      words.erase(words.begin(), words.begin() + lastCommittedPos + 1);

      // Retain only the most recent EOS entry.
      eos_.erase(eos_.begin(), eos_.end() - 1);
      eos_[0].tmstpend -= secondTolastEntry.tmstpend;
    }
  }

  // Return the results
  // Note that uncommitted part represented by recent transcription (words)
  // is already shrinked if something has been committed during the cleanup
  // phase.
  return {.committed = std::move(committed), .nonCommitted = std::move(words)};
}

std::vector<Word> OnlineASR::finish(const DecodingOptions &options) {
  ProcessResult result = process(options);

  // Last-tick committed delta + whatever never made it past the commit
  // threshold.
  std::vector<Word> residual = std::move(result.committed);
  residual.insert(residual.end(),
                  std::make_move_iterator(result.nonCommitted.begin()),
                  std::make_move_iterator(result.nonCommitted.end()));

  reset();

  return residual;
}

void OnlineASR::reset() {
  std::scoped_lock<std::mutex> lock(audioBufferMutex_);
  audioBuffer_.clear();

  eos_.clear();
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
