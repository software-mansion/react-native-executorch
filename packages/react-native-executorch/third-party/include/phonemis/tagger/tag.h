#pragma once

#include "../utilities/string_utils.h"
#include <string>

namespace phonemis::tagger {

using namespace utilities;

// Tag class definition
// An abstraction layer which wrapps a simple string-based tag definition
// with some additional logic.
class Tag : public std::string {
public:
  // Inherit constructors and assignment from std::string
  using std::string::string;
  using std::string::operator=;
  Tag(std::string const &s) : std::string(s) {}
  Tag(std::string &&s) : std::string(std::move(s)) {}

  // Extra logic
  Tag parent_tag() const {
    auto this_tag = static_cast<const std::string &>(*this);
    if (this_tag == "VERB" || string_utils::starts_with(this_tag, "VB"))
      return {"VERB"};
    if (this_tag == "NOUN" || string_utils::starts_with(this_tag, "NN"))
      return {"NOUN"};
    if (string_utils::starts_with(this_tag, "ADV") ||
        string_utils::starts_with(this_tag, "RB"))
      return {"ADV"};
    if (string_utils::starts_with(this_tag, "ADJ") ||
        string_utils::starts_with(this_tag, "JJ"))
      return {"ADJ"};
    return (*this);
  }
};

} // namespace phonemis::tagger

// Hash definition
// Required to use Tag objects as map keys.
namespace std {
template <> struct hash<phonemis::tagger::Tag> {
  size_t operator()(phonemis::tagger::Tag const &t) const noexcept {
    // Use std::string's hash implementation
    return std::hash<std::string>()(static_cast<std::string const &>(t));
  }
};
} // namespace std