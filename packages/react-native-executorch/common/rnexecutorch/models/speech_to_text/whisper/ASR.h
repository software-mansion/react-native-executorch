#pragma once

#include <memory>
#include <optional>
#include <span>
#include <string>
#include <vector>

#include "../common/schema/ASR.h"
#include "../common/types/GenerationResult.h"
#include "../common/types/Token.h"
#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::speech_to_text::whisper {

using executorch::aten::Tensor;

/**
 * Automatic Speech Recognition (ASR) class for Whisper-based models.
 * This class handles both encoding and decoding steps for Whisper family
 * models, loading a single model with named entry points for "encode" and
 * "decode".
 */
class ASR : public models::BaseModel, public schema::ASR {
public:
  ASR(const std::string &modelSource, const std::string &tokenizerSource,
      std::shared_ptr<facebook::react::CallInvoker> callInvoker);

  /**
   * @brief The main Whisper transcription API point.
   *        Wrapps the entire transciption process into a single method.
   *
   * @param waveform Input audio waveform sampled at 16kHz, similarly to
   * encode's input.
   * @param options Control variables for decoding process.
   */
  std::vector<Segment> virtual transcribe(
      std::span<float> waveform, const DecodingOptions &options) const override;

  /**
   * Encodes the input audio waveform into mel spectrogram embeddings.
   *
   * @param waveform  Input audio waveform sampled at 16kHz.
   * @return          Flat vector containing the encoder's output features.
   *                  The output tensor shape: [1, 1500, 384] for Whisper
   * models.
   */
  std::vector<float> encode(std::span<float> waveform) const override;

  /**
   * Decodes a sequence of tokens into logits given the encoded audio features.
   *
   * @param tokens        A span of token IDs from previous iteration
   *                      (see autoregressive nature of Whisper decoding).
   * @param encoderOutput A span of floats containing the precomputed encoder
   * embeddings.
   * @param startPos      The starting position in the sequence (used for KV
   * caching).
   * @return              A vector of floats representing the output logits for
   * the next token.
   */
  std::vector<float> decode(std::span<Token> tokens,
                            std::span<float> encoderOutput,
                            uint64_t startPos = 0) const override;

  // Standard ExecuTorch model methods for compatibility with the rest of the
  // API.
  void unload() noexcept override;
  std::size_t getMemoryLowerBound() const noexcept override;

private:
  /**
   * A helper factory for creating initial token sequences.
   *
   * The initial sequence consists of special tokens, such as
   * language mark token or timestamp token. It's always a part
   * of decoder's input.
   *
   * @param options Determine a specific properties of the initial sequence,
   * 								such as whether
   * to add a language mark token or not.
   */
  std::vector<uint64_t>
  createInitialSequence(const DecodingOptions &options) const;

  /**
   * Generation wrapper - wrapps encoding & decoding with
   * temperature fallback mechanism.
   * It could, in theory, run up to 5 inferences for increasing
   * temperature values.
   *
   * @param waveform Input audio waveform sampled at 16kHz, similarly to
   * encode's input.
   * @param options Control variables for decoding process.
   */
  std::vector<Segment> generate(std::span<float> waveform,
                                const DecodingOptions &options) const;

  /**
   * Generation wrapper - wrapps encoding & decoding for a single,
   * specific temperature value.
   * Results in a single inference.
   * Allows to skip the encoding phase if encoder results are already provided.
   *
   * @param waveform Input audio waveform sampled at 16kHz, similarly to
   * encode's input.
   * @param options Control variables for decoding process.
   * @param temperature Controls the scale of randomization during the logits
   * resolving process.
   * @param encoderOutput An optional parameter. If provided, the encoding phase
   * is skipped and the provided value is used instead.
   */
  GenerationResult
  generate(std::span<float> waveform, const DecodingOptions &options,
           float temperature,
           std::optional<std::span<float>> encoderOutput = std::nullopt) const;

  /**
   * Calculates word-level timestamps for a sequence of generated tokens.
   *
   * This method parses the generated tokens, splits them into segments based on
   * timestamp tokens, and applies a linear estimation for individual words.
   * It also adjusts timestamps based on the actual waveform length.
   *
   * @param generatedTokens The sequence of tokens produced by the model.
   * @param waveform        The original audio signal used for scaling.
   * @param avgLogProb      Average log probability of the generated sequence.
   * @param temperature     Temperature used during generation.
   * @param compressionRatio Text compression ratio for the generated sequence.
   * @return                A vector of transcribed segments with word-level
   * timing.
   */
  std::vector<Segment>
  calculateWordLevelTimestamps(std::span<const uint64_t> generatedTokens,
                               const std::span<float> waveform,
                               float avgLogProb, float temperature,
                               float compressionRatio) const;

  /**
   * Estimates word-level timestamps linearly within a token sequence.
   *
   * Decodes the tokens into words and distributes the time interval [start,
   * end] across words based on their character count.
   *
   * @param tokens The slice of tokens representing a single segment.
   * @param start  The timestamp token ID marking the beginning of the segment.
   * @param end    The timestamp token ID marking the end of the segment.
   * @return       A vector of Word objects with estimated start and end times.
   */
  std::vector<Word>
  estimateWordLevelTimestampsLinear(std::span<const uint64_t> tokens,
                                    uint64_t start, uint64_t end) const;

  float calculateCompressionRatio(const std::string &text) const;

  // Submodules - a tokenizer module for decoding process.
  std::unique_ptr<TokenizerModule> tokenizer_;

  // Tokenization helper definitions
  const Token startOfTranscriptionToken_;
  const Token endOfTranscriptionToken_;
  const Token timestampBeginToken_;
};

} // namespace rnexecutorch::models::speech_to_text::whisper
