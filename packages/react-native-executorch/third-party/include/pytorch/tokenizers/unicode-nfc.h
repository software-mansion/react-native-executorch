/*
 * Unicode NFC/NFD normalization implementation
 * This implementation fixes the broken llama.cpp-unicode normalization
 * by using proper multi-codepoint decomposition sequences.
 */

#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace tokenizers {

/**
 * Normalize a sequence of codepoints to NFD (Canonical Decomposition)
 *
 * @param cpts Input codepoint sequence
 * @return NFD-normalized codepoint sequence
 */
std::vector<uint32_t> unicode_normalize_nfd(const std::vector<uint32_t> &cpts);

/**
 * Normalize a sequence of codepoints to NFC (Canonical Decomposition +
 * Composition)
 *
 * @param cpts Input codepoint sequence
 * @return NFC-normalized codepoint sequence
 */
std::vector<uint32_t> unicode_normalize_nfc(const std::vector<uint32_t> &cpts);

/**
 * Normalize a UTF-8 string to NFD
 *
 * @param utf8 Input UTF-8 string
 * @return NFD-normalized UTF-8 string
 */
std::string unicode_normalize_nfd_utf8(const std::string &utf8);

/**
 * Normalize a UTF-8 string to NFC
 *
 * @param utf8 Input UTF-8 string
 * @return NFC-normalized UTF-8 string
 */
std::string unicode_normalize_nfc_utf8(const std::string &utf8);

} // namespace tokenizers
