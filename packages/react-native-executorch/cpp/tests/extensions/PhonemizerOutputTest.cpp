#include <format>
#include <initializer_list>
#include <string>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using PhonemizerOutputTest = JsiTestEnv;

// PhonemizerTest pins the JSI contract with no phonemis data. These run the
// en-us, en-gb and zh pipelines on Kokoro's shipped tagger, segmenter and
// lexicons (scripts/fetch-test-fixtures.sh), so they pin what TTS is fed: how
// numbers, dates and abbreviations are read out, and which phonemes each input
// word is located at, which is what word timings are built from.
//
// The neural fallback is not loaded (it needs ExecuTorch execution), so every
// sentence sticks to words the lexicon knows; an unknown one would come out
// empty here but not in the app.

// A pipeline and its data, relative to RNE_PHONEMIZER_FIXTURE_DIR.
struct Language {
    const char *lang;
    const char *tagger;
    const char *lexicon;
};

// en-gb's tagger is the same file as en-us's. zh's tagger slot holds its segmenter.
constexpr Language kEnUs{"en-us", "en-us/tags.json", "en-us/lexicon.json"};
constexpr Language kEnGb{"en-gb", "en-us/tags.json", "en-gb/lexicon.json"};
constexpr Language kZh{"zh", "zh/segmenter.json", "zh/lexicon.json"};

struct Case {
    const char *text;
    const char *phonemes;
    // Each located word as "text:phonemes", joined with '|'.
    const char *words;
};

// Phonemizes every case with one phonemizer, since loading the lexicon is
// what takes the time. The texts hold no quotes.
void expectPhonemized(JsiTestEnv &env, const Language &language, std::initializer_list<Case> cases) {
    std::string texts;
    for (const auto &c : cases) {
        texts += std::format("'{}',", c.text);
    }
    // Each result as "phonemes\nwords", separated by '\x1e'.
    auto results = env.evalString(std::format(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({{
            lang: '{}', taggerSource: '{}/{}', lexiconSource: '{}/{}' }});
        return [{}].map((text) => {{
            const r = p.phonemize(text, {{ words: true }});
            return r.phonemes + '\n' + r.words
                .map((w) => w.text + ':' + r.phonemes.substr(w.phonemeOffset, w.phonemeLength))
                .join('|');
        }}).join('\x1e');
    )",
                                              language.lang, RNE_PHONEMIZER_FIXTURE_DIR, language.tagger,
                                              RNE_PHONEMIZER_FIXTURE_DIR, language.lexicon, texts));

    size_t begin = 0;
    for (const auto &c : cases) {
        SCOPED_TRACE(c.text);
        auto end = results.find('\x1e', begin);
        EXPECT_EQ(results.substr(begin, end - begin), std::string(c.phonemes) + "\n" + c.words);
        begin = end == std::string::npos ? results.size() : end + 1;
    }
}

TEST_F(PhonemizerOutputTest, ReadsPlainWordsFromTheLexicon) {
    expectPhonemized(*this, kEnUs, {{"Hello world.", "həlˈO wˈɜɹld.", "Hello:həlˈO|world.:wˈɜɹld."}});
}

TEST_F(PhonemizerOutputTest, SpellsOutNumbers) {
    expectPhonemized(*this, kEnUs, {
                                       {"I have 25 cats.", "ˌI hæv twˈɛntifˈIv kˈæts.", "I:ˌI|have:hæv|25:twˈɛntifˈIv|cats.:kˈæts."},
                                       {"It happened in 1999.", "ˌɪt hˈæpənd ɪn nˌIntˈin nˈIndinˈIn.", "It:ˌɪt|happened:hˈæpənd|in:ɪn|1999.:nˌIntˈin nˈIndinˈIn."},
                                       {"The 21st century began.", "ðə twˈɛntifˈɜɹst sˈɛnʧəɹi bəɡˈæn.", "The:ðə|21st:twˈɛntifˈɜɹst|century:sˈɛnʧəɹi|began.:bəɡˈæn."},
                                       {"Pi is roughly 3.14.", "pˈI ɪz ɹˈʌfli θɹˈi pˈYnt wˈʌn fˈɔɹ.", "Pi:pˈI|is:ɪz|roughly:ɹˈʌfli|3.14.:θɹˈi pˈYnt wˈʌn fˈɔɹ."},
                                       {"We sold 1,000,000 copies.", "wˌi sˈOld wˈʌn mˈɪljᵊn kˈɑpiz.", "We:wˌi|sold:sˈOld|1,000,000:wˈʌn mˈɪljᵊn|copies.:kˈɑpiz."},
                                       {"Chapter IV starts here.", "ʧˈæptəɹ fˈɔɹ stˈɑɹts hˈɪɹ.", "Chapter:ʧˈæptəɹ|IV:fˈɔɹ|starts:stˈɑɹts|here.:hˈɪɹ."},
                                       {"Call 555-1234 now.", "kˈɔl fˈIv fˈIv fˈIv, wˈʌn tˈu θɹˈi fˈɔɹ nˈW.", "Call:kˈɔl|555-1234:fˈIv fˈIv fˈIv, wˈʌn tˈu θɹˈi fˈɔɹ|now.:nˈW."},
                                   });
}

TEST_F(PhonemizerOutputTest, ReadsMoneyAndPercentages) {
    expectPhonemized(*this, kEnUs, {
                                       {"It costs $4.50 today.", "ˌɪt kˈɔsts fˈɔɹ dˈɑləɹz ænd fˈɪfti sˈɛnts tədˈA.", "It:ˌɪt|costs:kˈɔsts|$4.50:fˈɔɹ dˈɑləɹz ænd fˈɪfti sˈɛnts|today.:tədˈA."},
                                       {"About 50% of people agree.", "əbˈWt fˈɪfti pəɹsˈɛnt ʌv pˈipᵊl əɡɹˈi.", "About:əbˈWt|50%:fˈɪfti pəɹsˈɛnt|of:ʌv|people:pˈipᵊl|agree.:əɡɹˈi."},
                                   });
}

TEST_F(PhonemizerOutputTest, ReadsDates) {
    expectPhonemized(*this, kEnUs, {
                                       {"On 12/25/2024 we left.", "ˈɔn disˈɛmbəɹ twˈɛntifˈɪfθ twˈɛnti twˈɛntifˈɔɹ wi lˈɛft.", "On:ˈɔn|12/25/2024:disˈɛmbəɹ twˈɛntifˈɪfθ twˈɛnti twˈɛntifˈɔɹ|we:wi|left.:lˈɛft."},
                                       {"Born on May 5, 2024.", "bˈɔɹn ˌɔn mˈA fˈɪfθ, twˈɛnti twˈɛntifˈɔɹ.", "Born:bˈɔɹn|on:ˌɔn|May:mˈA|5,:fˈɪfθ,|2024.:twˈɛnti twˈɛntifˈɔɹ."},
                                   });
}

TEST_F(PhonemizerOutputTest, ExpandsAbbreviationsAndSymbols) {
    expectPhonemized(*this, kEnUs, {
                                       {"Dr. Smith lives on Main St.", "dˈɑktəɹ smˈɪθ lˈIvz ˌɔn mˈAn stɹˈit.", "Dr.:dˈɑktəɹ|Smith:smˈɪθ|lives:lˈIvz|on:ˌɔn|Main:mˈAn|St.:stɹˈit."},
                                       {"Bring fruit, e.g. apples.", "bɹˈɪŋ fɹˈut, fɔɹ ɪɡzˈæmpəl ˈæpᵊlz.", "Bring:bɹˈɪŋ|fruit,:fɹˈut,|e.g.:fɔɹ ɪɡzˈæmpəl|apples.:ˈæpᵊlz."},
                                       {"Rock & roll.", "ɹˈɑk ænd ɹˈOl.", "Rock:ɹˈɑk|&:ænd|roll.:ɹˈOl."},
                                   });
}

// A time or a measure is read as one phrase, and comes back as one word that
// spans both input words, so their word timings are shared.
TEST_F(PhonemizerOutputTest, LocatesAPhraseReadAsOneUnitAsOneWord) {
    expectPhonemized(*this, kEnUs, {
                                       {"Meet me at 3:30 pm.", "mˈit mˌi æt θɹˈi θˈɜɹɾi pˈiˈɛm.", "Meet:mˈit|me:mˌi|at:æt|3:30 pm.:θɹˈi θˈɜɹɾi pˈiˈɛm."},
                                       {"She ran 5 km.", "ʃˌi ɹˈæn fˈIv kəlˈɑməɾəɹz.", "She:ʃˌi|ran:ɹˈæn|5 km.:fˈIv kəlˈɑməɾəɹz."},
                                   });
}

TEST_F(PhonemizerOutputTest, ReadsBritishEnglish) {
    expectPhonemized(*this, kEnGb, {
                                       {"It costs £4.50 today.", "ˌɪt kˈɒsts fˈɔː pˈWndz and fˈɪfti pˈɛns tədˈA.", "It:ˌɪt|costs:kˈɒsts|£4.50:fˈɔː pˈWndz and fˈɪfti pˈɛns|today.:tədˈA."},
                                       {"On 24/12/2024 we left.", "ˈɒn ðə twˈɛntifˈɔːθ ɒv dɪsˈɛmbə twˈɛnti twˈɛntifˈɔː wiː lˈɛft.", "On:ˈɒn|24/12/2024:ðə twˈɛntifˈɔːθ ɒv dɪsˈɛmbə twˈɛnti twˈɛntifˈɔː|we:wiː|left.:lˈɛft."},
                                       {"The 21st century.", "ðə twˈɛntifˈɜːst sˈɛnʧʊɹi.", "The:ðə|21st:twˈɛntifˈɜːst|century.:sˈɛnʧʊɹi."},
                                       {"About 50% agree.", "əbˈWt fˈɪfti pəsˈɛnt əɡɹˈiː.", "About:əbˈWt|50%:fˈɪfti pəsˈɛnt|agree.:əɡɹˈiː."},
                                       {"Meet me at 3:30 pm.", "mˈiːt mˌiː at θɹˈiː θˈɜːti pˈiːˈɛm.", "Meet:mˈiːt|me:mˌiː|at:at|3:30 pm.:θɹˈiː θˈɜːti pˈiːˈɛm."},
                                       {"Dr. Smith ran 5 km.", "dˈɒktə smˈɪθ ɹˈan fˈIv kˈɪləmˌiːtəz.", "Dr.:dˈɒktə|Smith:smˈɪθ|ran:ɹˈan|5 km.:fˈIv kˈɪləmˌiːtəz."},
                                       // Wrong: 946 should be read digit by digit (Verbalis#8).
                                       {"Call 0207 946 0018 now.", "kˈɔːl zˈɪəɹQ tˈuː zˈɪəɹQ sˈɛvᵊn nˈIn hˈʌndɹəd fˈɔːtisˈɪks zˈɪəɹQ zˈɪəɹQ wˈʌn ˈAt nˈW.", "Call:kˈɔːl|0207:zˈɪəɹQ tˈuː zˈɪəɹQ sˈɛvᵊn|946:nˈIn hˈʌndɹəd fˈɔːtisˈɪks|0018:zˈɪəɹQ zˈɪəɹQ wˈʌn ˈAt|now.:nˈW."},
                                   });
}

// zh segments the text into words, so a located word can span several characters.
TEST_F(PhonemizerOutputTest, ReadsChinese) {
    expectPhonemized(*this, kZh, {
                                     {"我有25只猫。", "wo↓ jou↓ ɚ↘ʂɨ↗u↓ ꭧɨ↓ mau→.", "我:wo↓|有:jou↓|25:ɚ↘ʂɨ↗u↓|只:ꭧɨ↓|猫。:mau→."},
                                     {"价格是4.50元。", "ʨja↘kɤ↗ ʂɨ↘ sɨ↘tjɛ↓n u↓li↗ŋ ɥɛ↗n.", "价格:ʨja↘kɤ↗|是:ʂɨ↘|4.50:sɨ↘tjɛ↓n u↓li↗ŋ|元。:ɥɛ↗n."},
                                     {"2024年12月24日我们走了。", "ɚ↘li↗ŋɚ↘ sɨ↘njɛ↗n ʂɨ↗ɚ↘ɥe↘ ɚ↘ʂɨ↗sɨ↘ɻɨ↘ wo↓mən ʦou↓ lɤ.", "2024年12月24日:ɚ↘li↗ŋɚ↘ sɨ↘njɛ↗n ʂɨ↗ɚ↘ɥe↘ ɚ↘ʂɨ↗sɨ↘ɻɨ↘|我们:wo↓mən|走:ʦou↓|了。:lɤ."},
                                     {"下午3:30见。", "ɕja↘u↓ sa→ntjɛ↓n sa→nʂɨ↗fə→n ʨjɛ↘n.", "下午:ɕja↘u↓|3:30:sa→ntjɛ↓n sa→nʂɨ↗fə→n|见。:ʨjɛ↘n."},
                                     {"第3天。", "ti↘sa→ntʰjɛ→n.", "第3天。:ti↘sa→ntʰjɛ→n."},
                                     {"大约50%的人同意。", "ta↘ɥe→ pai↓fə→nꭧɨ→u↓ʂɨ↗ tɤ ɻə↗n tʰʊ↗ŋi↘.", "大约:ta↘ɥe→|50%:pai↓fə→nꭧɨ→u↓ʂɨ↗|的:tɤ|人:ɻə↗n|同意。:tʰʊ↗ŋi↘."},
                                     {"1999年。", "i→ʨjou↓ʨjou↓ʨjou↓njɛ↗n.", "1999年。:i→ʨjou↓ʨjou↓ʨjou↓njɛ↗n."},
                                 });
}

} // namespace
} // namespace rnexecutorch::tests
