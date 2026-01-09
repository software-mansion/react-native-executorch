#pragma once

#include <cstdint>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::kokoro::constants {
// Hyperparameters which determine the behavior of the model & algorithms.
inline constexpr size_t kMaxTextSize =
    2048; // An input which exceedes this value causes an exception to be thrown
inline constexpr int32_t kAudioCroppingSteps = 20;
inline constexpr float kAudioSilenceThreshold = 0.01F;
inline const std::unordered_map<char32_t, int32_t> kPauseValues = {
    {U'.', 250}, {U'?', 350}, {'!', 180},  {';', 300},
    {U'…', 500}, {U',', 125}, {U':', 175}, {U'-', 175}}; // [ms]
inline constexpr int32_t kDefaultPause = 5;              // [ms]

// Model input sizes - input tokens & max (expected) durations
inline constexpr Configuration kInputSmall = {.noTokens = 32, .duration = 92};
inline constexpr Configuration kInputMedium = {.noTokens = 64, .duration = 164};
inline constexpr Configuration kInputLarge = {.noTokens = 128, .duration = 296};
inline const std::unordered_map<std::string, Configuration> kInputs = {
    {"small", kInputSmall}, {"medium", kInputMedium}, {"large", kInputLarge}};

// Model input sizes - voice reference vector
inline constexpr int32_t kVoiceRefSize =
    256; // Always a fixed size, regardless of number of input tokens
inline constexpr int32_t kVoiceRefHalfSize = kVoiceRefSize / 2;

// Duration mappings
// This corresponds to a number of elements in resulting audio vector per each
// duration point.
inline constexpr int32_t kTicksPerDuration = 600;
inline constexpr int32_t kSamplingRate =
    24000; // Corresponds to Kokoro's model audio frequency
inline constexpr int32_t kSamplesPerMilisecond = kSamplingRate / 1000;

// Special phonemes
inline const std::unordered_set<char32_t> kEndOfSentencePhonemes = {
    U'.', U'?', U'!', U';', U'…'};
inline const std::unordered_set<char32_t> kPausePhonemes = {U',', U':', U'-'};

// Phoneme to token mappings
inline constexpr int32_t kVocabSize = 178;
inline const std::unordered_map<char32_t, Token> kVocab = {
    {U';', 1},       {U':', 2},   {U',', 3},   {U'.', 4},   {U'!', 5},
    {U'?', 6},       {U'—', 9},   {U'…', 10},  {U'"', 11},  {U'(', 12},
    {U')', 13},      {U'“', 14},  {U'”', 15},  {U' ', 16},  {U'\u0303', 17},
    {U'ʣ', 18},      {U'ʥ', 19},  {U'ʦ', 20},  {U'ʨ', 21},  {U'ᵝ', 22},
    {U'\uAB67', 23}, {U'A', 24},  {U'I', 25},  {U'O', 31},  {U'Q', 33},
    {U'S', 35},      {U'T', 36},  {U'W', 39},  {U'Y', 41},  {U'ᵊ', 42},
    {U'a', 43},      {U'b', 44},  {U'c', 45},  {U'd', 46},  {U'e', 47},
    {U'f', 48},      {U'h', 50},  {U'i', 51},  {U'j', 52},  {U'k', 53},
    {U'l', 54},      {U'm', 55},  {U'n', 56},  {U'o', 57},  {U'p', 58},
    {U'q', 59},      {U'r', 60},  {U's', 61},  {U't', 62},  {U'u', 63},
    {U'v', 64},      {U'w', 65},  {U'x', 66},  {U'y', 67},  {U'z', 68},
    {U'ɑ', 69},      {U'ɐ', 70},  {U'ɒ', 71},  {U'æ', 72},  {U'β', 75},
    {U'ɔ', 76},      {U'ɕ', 77},  {U'ç', 78},  {U'ɖ', 80},  {U'ð', 81},
    {U'ʤ', 82},      {U'ə', 83},  {U'ɚ', 85},  {U'ɛ', 86},  {U'ɜ', 87},
    {U'ɟ', 90},      {U'ɡ', 92},  {U'ɥ', 99},  {U'ɨ', 101}, {U'ɪ', 102},
    {U'ʝ', 103},     {U'ɯ', 110}, {U'ɰ', 111}, {U'ŋ', 112}, {U'ɳ', 113},
    {U'ɲ', 114},     {U'ɴ', 115}, {U'ø', 116}, {U'ɸ', 118}, {U'θ', 119},
    {U'œ', 120},     {U'ɹ', 123}, {U'ɾ', 125}, {U'ɻ', 126}, {U'ʁ', 128},
    {U'ɽ', 129},     {U'ʂ', 130}, {U'ʃ', 131}, {U'ʈ', 132}, {U'ʧ', 133},
    {U'ʊ', 135},     {U'ʋ', 136}, {U'ʌ', 138}, {U'ɣ', 139}, {U'ɤ', 140},
    {U'χ', 142},     {U'ʎ', 143}, {U'ʒ', 147}, {U'ʔ', 148}, {U'ˈ', 156},
    {U'ˌ', 157},     {U'ː', 158}, {U'ʰ', 162}, {U'ʲ', 164}, {U'↓', 169},
    {U'→', 171},     {U'↗', 172}, {U'↘', 173}, {U'ᵻ', 177}};

// Special tokens
inline constexpr Token kInvalidToken = -1;
inline constexpr Token kPadToken = 0;

} // namespace rnexecutorch::models::text_to_speech::kokoro::constants
