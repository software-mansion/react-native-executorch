/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @lint-ignore-every LICENSELINT

#pragma once

#include <cstdint>
#include <unicode.h>

namespace tokenizers {
namespace unicode_utils {

/// CJK Unified Ideographs and extensions.
/// Shared by BertPreTokenizer, BertNormalizer, and UnicodeScriptsPreTokenizer.
inline bool is_cjk(uint32_t c) {
  return (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF) ||
      (c >= 0x20000 && c <= 0x2A6DF) || (c >= 0x2A700 && c <= 0x2B73F) ||
      (c >= 0x2B740 && c <= 0x2B81F) || (c >= 0x2B920 && c <= 0x2CEAF) ||
      (c >= 0xF900 && c <= 0xFAFF) || (c >= 0x2F800 && c <= 0x2FA1F);
}

/// ASCII + Unicode punctuation check.
/// Shared by BertPreTokenizer and PunctuationPreTokenizer.
inline bool is_punctuation(uint32_t cp) {
  if ((cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) ||
      (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126)) {
    return true;
  }
  return unicode_cpt_flags(cp).is_punctuation;
}

} // namespace unicode_utils
} // namespace tokenizers
