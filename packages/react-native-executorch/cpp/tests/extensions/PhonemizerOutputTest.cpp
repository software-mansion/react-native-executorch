#include <format>
#include <map>
#include <stdexcept>
#include <string>
#include <vector>

#include <phonemis/base/pipeline.h>
#include <phonemis/utils/conversions.h>

#include "support/JsiTestEnv.h"
#include "support/Snapshots.h"

namespace rnexecutorch::tests {
namespace {

using PhonemizerOutputTest = JsiTestEnv;
using phonemis::utils::conversions::u32_to_utf8;
using phonemis::utils::conversions::utf8_to_u32;

// PhonemizerTest pins the JSI contract with no phonemis data. These run the
// en-us, en-gb and zh pipelines on Kokoro's shipped tagger, segmenter and
// lexicons (scripts/fetch-test-fixtures.sh), so they pin what TTS is fed: the
// phonemes, and which of them each input word is located at, which is what
// word timings are built from.

const std::string kSnapshot = std::string(RNE_SNAPSHOT_DIR) + "/phonemizer.txt";

// A pipeline's data, relative to RNE_PHONEMIZER_FIXTURE_DIR. en-gb's tagger is
// the same file as en-us's; zh's tagger slot holds its segmenter.
struct Data {
    const char *tagger;
    const char *lexicon;
};

const std::map<std::string, Data> kData = {
    {"en-us", {"en-us/tags.json", "en-us/lexicon.json"}},
    {"en-gb", {"en-us/tags.json", "en-gb/lexicon.json"}},
    {"zh", {"zh/segmenter.json", "zh/lexicon.json"}},
};

struct Phonemized {
    std::string phonemes;
    // Each located word as "text:phonemes", joined with '|'.
    std::string words;
    // What breaks the invariants of LocatesEveryWordOfTheInput, if anything.
    std::string problems;
};

// `s` as a JS string literal.
std::string jsString(const std::string &s) {
    std::string out = "'";
    for (char ch : s) {
        if (ch == '\\' || ch == '\'') {
            out += '\\';
        }
        out += ch;
    }
    return out + "'";
}

// Phonemizes every text with one phonemizer, since loading the lexicon is what
// takes the time.
std::vector<Phonemized> phonemize(JsiTestEnv &env, const std::string &lang, const std::vector<std::string> &texts) {
    auto data = kData.find(lang);
    if (data == kData.end()) {
        throw std::invalid_argument("no phonemizer data for " + lang);
    }
    std::string list;
    for (const auto &text : texts) {
        list += jsString(text) + ",";
    }
    // Each text as "phonemes\x1fwords\x1fproblems", separated by '\x1e'.
    auto results = env.evalString(std::format(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({{
            lang: '{}', taggerSource: '{}/{}', lexiconSource: '{}/{}' }});
        return [{}].map((text) => {{
            const r = p.phonemize(text, {{ words: true }});
            const problems = [];
            if (r.phonemes.length === 0) problems.push('no phonemes');
            if (r.words.length === 0) problems.push('no words located');
            let end = 0, phonemeEnd = 0;
            for (const w of r.words) {{
                if (text.substr(w.offset, w.text.length) !== w.text) problems.push(`'${{w.text}}' is not at ${{w.offset}}`);
                if (w.offset < end) problems.push(`'${{w.text}}' overlaps the word before`);
                if (w.phonemeLength === 0) problems.push(`'${{w.text}}' has no phonemes`);
                if (w.phonemeOffset < phonemeEnd) problems.push(`'${{w.text}}' phonemes overlap the word before`);
                if (w.phonemeOffset + w.phonemeLength > r.phonemes.length) problems.push(`'${{w.text}}' phonemes run past the end`);
                end = w.offset + w.text.length;
                phonemeEnd = w.phonemeOffset + w.phonemeLength;
            }}
            for (let i = 0; i < text.length; ++i) {{
                if (/\s/.test(text[i])) continue;
                if (!r.words.some((w) => w.offset <= i && i < w.offset + w.text.length)) {{
                    problems.push(`'${{text[i]}}' at ${{i}} is in no word`);
                    break;
                }}
            }}
            const words = r.words
                .map((w) => w.text + ':' + r.phonemes.substr(w.phonemeOffset, w.phonemeLength))
                .join('|');
            return [r.phonemes, words, problems.join('; ')].join('\x1f');
        }}).join('\x1e');
    )",
                                              lang, RNE_PHONEMIZER_FIXTURE_DIR, data->second.tagger,
                                              RNE_PHONEMIZER_FIXTURE_DIR, data->second.lexicon, list));

    std::vector<Phonemized> out;
    size_t begin = 0;
    for (size_t i = 0; i < texts.size(); ++i) {
        auto end = results.find('\x1e', begin);
        auto record = results.substr(begin, end - begin);
        auto first = record.find('\x1f');
        auto second = record.find('\x1f', first + 1);
        out.push_back({record.substr(0, first), record.substr(first + 1, second - first - 1),
                       record.substr(second + 1)});
        begin = end == std::string::npos ? results.size() : end + 1;
    }
    return out;
}

// Every case of the snapshot, phonemized, in order: one phonemizer per language.
std::vector<Phonemized> phonemizeAll(JsiTestEnv &env, const std::vector<snapshots::Case> &cases) {
    std::map<std::string, std::vector<size_t>> byLang;
    for (size_t i = 0; i < cases.size(); ++i) {
        byLang[cases[i].lang].push_back(i);
    }
    std::vector<Phonemized> out(cases.size());
    for (const auto &[lang, indices] : byLang) {
        std::vector<std::string> texts;
        for (auto i : indices) {
            texts.push_back(cases[i].input);
        }
        auto results = phonemize(env, lang, texts);
        for (size_t j = 0; j < indices.size(); ++j) {
            out[indices[j]] = std::move(results[j]);
        }
    }
    return out;
}

// Holds across versions: however a text is read, it has phonemes, and each of
// its words is located once, in order, at phonemes of its own. A phrase read
// as one unit ("3:30 pm") may come back as one word spanning several.
TEST_F(PhonemizerOutputTest, LocatesEveryWordOfTheInput) {
    auto cases = snapshots::read(kSnapshot);
    auto results = phonemizeAll(*this, cases);
    for (size_t i = 0; i < cases.size(); ++i) {
        EXPECT_EQ(results[i].problems, "") << "[" << cases[i].lang << "] " << cases[i].input;
    }
}

TEST_F(PhonemizerOutputTest, MatchesTheSnapshot) {
    snapshots::verify(kSnapshot, [this](const std::vector<snapshots::Case> &cases) {
        auto results = phonemizeAll(*this, cases);
        std::vector<snapshots::Values> out;
        for (size_t i = 0; i < cases.size(); ++i) {
            phonemis::Pipeline pipeline(phonemis::Config{.lang = cases[i].lang});
            out.push_back({
                {"preprocessed", u32_to_utf8(pipeline.preprocess(utf8_to_u32(cases[i].input)))},
                {"phonemes", results[i].phonemes},
                {"words", results[i].words},
            });
        }
        return out;
    });
}

} // namespace
} // namespace rnexecutorch::tests
