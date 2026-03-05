#include "BaseModelTests.h"
#include "utils/TestUtils.h"
#include <gtest/gtest.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/models/text_to_speech/kokoro/Kokoro.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::text_to_speech::kokoro;

constexpr auto kValidLang = "en-us";
constexpr auto kValidTaggerPath = "kokoro_en_tagger.json";
constexpr auto kValidPhonemizerPath = "kokoro_us_lexicon.json";
constexpr auto kValidDurationPath = "kokoro_duration_predictor.pte";
constexpr auto kValidSynthesizerPath = "kokoro_synthesizer.pte";
constexpr auto kValidVoicePath = "kokoro_af_heart.bin";

namespace {
bool isAudioValid(const std::vector<float> &audio) {
  if (audio.empty())
    return false;
  // Check for non-silence (amplitude greater than an arbitrary small noise
  // threshold)
  for (float sample : audio) {
    if (std::abs(sample) > 1e-4f) {
      return true;
    }
  }
  return false;
}

bool isAudioSimilar(const std::vector<float> &audio1,
                    const std::vector<float> &audio2, float tolerance = 0.1f) {
  if (audio1.empty() || audio2.empty())
    return false;

  double sumSqDiff = 0;
  size_t steps = std::max(audio1.size(), audio2.size());

  for (size_t i = 0; i < steps; ++i) {
    float idx1 = (static_cast<float>(i) / steps) * audio1.size();
    float idx2 = (static_cast<float>(i) / steps) * audio2.size();

    float diff =
        audio1[static_cast<size_t>(idx1)] - audio2[static_cast<size_t>(idx2)];
    sumSqDiff += diff * diff;
  }

  double rmse = std::sqrt(sumSqDiff / steps);
  if (rmse >= tolerance) {
    std::cerr << "Audio structural RMSE difference: " << rmse
              << " (tolerance: " << tolerance << ")" << std::endl;
    return false;
  }
  return true;
}

class KokoroTest : public ::testing::Test {
protected:
  void SetUp() override {
    try {
      model_ = std::make_unique<Kokoro>(
          kValidLang, kValidTaggerPath, kValidPhonemizerPath,
          kValidDurationPath, kValidSynthesizerPath, kValidVoicePath, nullptr);
    } catch (...) {
      model_ = nullptr;
    }
  }

  std::unique_ptr<Kokoro> model_;
};
} // namespace

TEST(TTSCtorTests, InvalidVoicePathThrows) {
  EXPECT_THROW(Kokoro(kValidLang, kValidTaggerPath, kValidPhonemizerPath,
                      kValidDurationPath, kValidSynthesizerPath,
                      "nonexistent_voice.bin", nullptr),
               RnExecutorchError);
}

TEST_F(KokoroTest, MaxTextSizeExceededThrows) {
  if (!model_) {
    GTEST_SKIP() << "Model assets not available, skipping test.";
  }
  std::string hugeText(10000, 'A'); // beyond params::kMaxTextSize
  EXPECT_THROW(model_->generate(hugeText, 1.0f), RnExecutorchError);
}

TEST_F(KokoroTest, EmptyStringReturnsEmptyVector) {
  if (!model_) {
    GTEST_SKIP() << "Model assets not available, skipping test.";
  }
  auto result = model_->generate("", 1.0f);
  EXPECT_TRUE(result.empty());
}

TEST_F(KokoroTest, GenerateReturnsValidAudio) {
  if (!model_) {
    GTEST_SKIP() << "Model assets not available, skipping test.";
  }
  auto result = model_->generate("Hello world! How are you doing?", 1.0f);
  auto reference = test_utils::loadAudioFromFile("test_speech.raw");

  ASSERT_FALSE(reference.empty())
      << "Reference audio 'test_speech.raw' not found.";

  // Compare against an audio waveform obtained from the original
  // Kokoro model (PyTorch)
  EXPECT_TRUE(isAudioSimilar(result, reference));
}

TEST_F(KokoroTest, GenerateSpeedAdjustsAudioLength) {
  if (!model_) {
    GTEST_SKIP() << "Model assets not available, skipping test.";
  }
  std::string text = "This is a sentence to test the speed modifications.";
  auto resultNormal = model_->generate(text, 1.0f);
  auto resultFast = model_->generate(text, 1.5f);

  EXPECT_TRUE(isAudioValid(resultNormal));
  EXPECT_TRUE(isAudioValid(resultFast));
  // Fast speech should result in a noticeably shorter output waveform
  EXPECT_LT(resultFast.size(), resultNormal.size());
}
