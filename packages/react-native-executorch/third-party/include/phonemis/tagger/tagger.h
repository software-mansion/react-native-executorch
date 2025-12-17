#pragma once

#include "../tokenizer/tokens.h"
#include "tag.h"
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace phonemis::tagger {

// Tagger class
// Provides PoS (Part of Speech) tagging functionality.
// Requires a previous tokenization of the text (tokenizer module).
// A modification of the Viterbi algorithm for bigram HMM (Hidden Markov Model)
// tagger.
class Tagger {
public:
  explicit Tagger(const std::string &hmm_data_path);

  // Main tagging method - a modified Viterbi algorithm
  // Works in place bo modyfing the 'tag' fields.
  void tag(std::vector<tokenizer::Token> &sentence) const;

private:
  // Set of possible tags (states)
  std::unordered_set<Tag> tags_;

  // Probability maps - loaded from the input json file.
  std::unordered_map<Tag, double> start_probs_ = {};
  std::unordered_map<Tag, std::unordered_map<std::string, double>>
      emission_probs_ = {};
  std::unordered_map<Tag, std::unordered_map<Tag, double>> transition_probs_ =
      {};
};

} // namespace phonemis::tagger