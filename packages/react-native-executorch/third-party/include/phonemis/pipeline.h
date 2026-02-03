#pragma once

#include "phonemizer/phonemizer.h"
#include "preprocessor/tools.h"
#include "tagger/tagger.h"
#include "tokenizer/tokenize.h"
#include <memory>

namespace phonemis {

using phonemizer::Lang;
using phonemizer::Phonemizer;
using tagger::Tagger;

// #### Main phonemization pipeline
// Manages all the phonemization parts, from preprocessing, through
// tokenization and tagging to final Phonemizer call.
// Tagger and Lexicon .json data files are theoretically optional, but
// skipping these arguments will significantly impact the phonemization quality.
class Pipeline {
public:
  Pipeline(Lang language, const std::string &tagger_data_filepath = "",
           const std::string &lexicon_data_filepath = "");

  std::u32string process(const std::string &text);

private:
  Lang language_;

  // Pipeline subcomponents
  std::unique_ptr<Phonemizer> phonemizer_ = nullptr;
  std::unique_ptr<Tagger> tagger_ = nullptr;
};

} // namespace phonemis