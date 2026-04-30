#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace rnexecutorch::models::privacy_filter::viterbi {

// Six Viterbi transition biases matching the openai/privacy-filter
// viterbi_calibration.json schema. Each value is added to the decoder score
// for the corresponding BIOES transition. Positive = encourage, negative =
// discourage. Defaults are zero (neutral, validity-only Viterbi).
// JSI callers pass a 6-element vector; indices match the field order below.
struct Biases {
  float backgroundStay = 0.0f;    // [0] O      -> O
  float backgroundToStart = 0.0f; // [1] O      -> B-* / S-*
  float endToBackground = 0.0f;   // [2] E-/S-* -> O
  float endToStart = 0.0f;        // [3] E-/S-* -> B-* / S-*
  float insideToContinue = 0.0f;  // [4] B-/I-X -> I-X
  float insideToEnd = 0.0f;       // [5] B-/I-X -> E-X
};

// Pre-computed BIOES grammar tables.
//   transitionScore[i*N + j] = bias for valid transitions, -inf for invalid.
//   validStart[i] = true iff label i is a legal first-token label (O, B-*,
//   S-*).
struct Grammar {
  std::vector<float> transitionScore;
  std::vector<bool> validStart;
  size_t numLabels = 0;
};

Grammar buildGrammar(const std::vector<std::string> &labelNames,
                     const Biases &biases);

// Run constrained Viterbi over [validLen, numLabels] logits and return the
// best BIOES-grammar-valid label-id sequence (length validLen).
std::vector<int32_t> decode(const float *logits, int32_t validLen,
                            const Grammar &grammar);

} // namespace rnexecutorch::models::privacy_filter::viterbi
