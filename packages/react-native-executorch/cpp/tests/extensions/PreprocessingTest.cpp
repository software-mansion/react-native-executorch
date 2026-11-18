#include <string>
#include <string_view>
#include <vector>

#include <gtest/gtest.h>

#include <phonemis/base/pipeline.h>
#include <phonemis/utils/conversions.h>

#include "support/Snapshots.h"

namespace rnexecutorch::tests {
namespace {

using phonemis::utils::conversions::u32_to_utf8;
using phonemis::utils::conversions::utf8_to_u32;

// Preprocessing (Verbalis, inside phonemis) reads numbers, dates, money, times
// and abbreviations out as words before anything is phonemized. It needs no
// data, so these go below the JSI layer, to phonemis directly, and cover every
// language: de, fr, es, it, pl, pt and hi are phonemized by a neural model that
// these tests cannot run, so for them this is all that is pinned.

const std::string kSnapshot = std::string(RNE_SNAPSHOT_DIR) + "/preprocessing.txt";

std::string preprocess(const std::string &lang, const std::string &text) {
    phonemis::Pipeline pipeline(phonemis::Config{.lang = lang});
    return u32_to_utf8(pipeline.preprocess(utf8_to_u32(text)));
}

// Holds across versions: what a reading looks like may change, but nothing is
// left for the phonemizer to spell out character by character.
TEST(PreprocessingTest, LeavesNoDigitsOrSymbols) {
    constexpr std::string_view kUnread[] = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                                            "$", "€", "£", "₹", "%", "/", "º", "°"};
    for (const auto *file : {"/preprocessing.txt", "/phonemizer.txt"}) {
        for (const auto &c : snapshots::read(std::string(RNE_SNAPSHOT_DIR) + file)) {
            auto out = preprocess(c.lang, c.input);
            for (auto unread : kUnread) {
                EXPECT_EQ(out.find(unread), std::string::npos)
                    << "[" << c.lang << "] " << c.input << " => " << out << " still holds " << unread;
            }
        }
    }
}

TEST(PreprocessingTest, MatchesTheSnapshot) {
    snapshots::verify(kSnapshot, [](const std::vector<snapshots::Case> &cases) {
        std::vector<snapshots::Values> out;
        for (const auto &c : cases) {
            out.push_back({{"preprocessed", preprocess(c.lang, c.input)}});
        }
        return out;
    });
}

} // namespace
} // namespace rnexecutorch::tests
