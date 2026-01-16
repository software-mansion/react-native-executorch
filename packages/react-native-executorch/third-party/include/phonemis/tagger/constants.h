#pragma once

#include "tag.h"
#include <unordered_set>

namespace phonemis::tagger::constants {

// Punctuation and special symbol tags
inline const std::unordered_set<Tag> kPunctationTags = {
    Tag("."),  Tag(","), Tag("-LRB-"), Tag("-RRB-"), Tag("``"), Tag("\"\""),
    Tag("''"), Tag(":"), Tag("$"),     Tag("#"),     Tag("NFP")};

} // namespace phonemis::tagger::constants