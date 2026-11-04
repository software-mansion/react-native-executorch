#include <format>
#include <initializer_list>
#include <string>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using PhonemizerOutputTest = JsiTestEnv;

// PhonemizerTest pins the JSI contract with no phonemis data. These run the
// en-us pipeline on Kokoro's shipped tagger and lexicon
// (scripts/fetch-test-fixtures.sh), so they pin what TTS is actually fed: how
// numbers, dates and abbreviations are read out, and which phonemes each input
// word is located at, which is what word timings are built from.
//
// The neural fallback is not loaded (it needs ExecuTorch execution), so every
// sentence sticks to words the lexicon knows; an unknown one would come out
// empty here but not in the app.

struct Case {
    const char *text;
    const char *phonemes;
    // Each located word as "text:phonemes", joined with '|'.
    const char *words;
};

// Phonemizes every case with one phonemizer, since loading the lexicon is
// what takes the time. The texts hold no quotes.
void expectPhonemized(JsiTestEnv &env, std::initializer_list<Case> cases) {
    std::string texts;
    for (const auto &c : cases) {
        texts += std::format("'{}',", c.text);
    }
    // Each result as "phonemes\nwords", separated by '\x1e'.
    auto results = env.evalString(std::format(R"(
        const p = __rnexecutorch_jsi__.speech.createPhonemizer({{
            lang: 'en-us', taggerSource: '{}', lexiconSource: '{}' }});
        return [{}].map((text) => {{
            const r = p.phonemize(text, {{ words: true }});
            return r.phonemes + '\n' + r.words
                .map((w) => w.text + ':' + r.phonemes.substr(w.phonemeOffset, w.phonemeLength))
                .join('|');
        }}).join('\x1e');
    )",
                                              RNE_PHONEMIZER_EN_US_TAGGER, RNE_PHONEMIZER_EN_US_LEXICON, texts));

    size_t begin = 0;
    for (const auto &c : cases) {
        SCOPED_TRACE(c.text);
        auto end = results.find('\x1e', begin);
        EXPECT_EQ(results.substr(begin, end - begin), std::string(c.phonemes) + "\n" + c.words);
        begin = end == std::string::npos ? results.size() : end + 1;
    }
}

TEST_F(PhonemizerOutputTest, ReadsPlainWordsFromTheLexicon) {
    expectPhonemized(*this, {{"Hello world.", "həlˈO wˈɜɹld.", "Hello:həlˈO|world.:wˈɜɹld."}});
}

TEST_F(PhonemizerOutputTest, SpellsOutNumbers) {
    expectPhonemized(*this, {
                                {"I have 25 cats.", "ˌI hæv twˈɛntifˈIv kˈæts.",
                                 "I:ˌI|have:hæv|25:twˈɛntifˈIv|cats.:kˈæts."},
                                {"It happened in 1999.", "ˌɪt hˈæpənd ɪn nˌIntˈin nˈIndinˈIn.",
                                 "It:ˌɪt|happened:hˈæpənd|in:ɪn|1999.:nˌIntˈin nˈIndinˈIn."},
                                {"The 21st century began.", "ðə twˈɛntifˈɜɹst sˈɛnʧəɹi bəɡˈæn.",
                                 "The:ðə|21st:twˈɛntifˈɜɹst|century:sˈɛnʧəɹi|began.:bəɡˈæn."},
                                {"Pi is roughly 3.14.", "pˈI ɪz ɹˈʌfli θɹˈi pˈYnt wˈʌn fˈɔɹ.",
                                 "Pi:pˈI|is:ɪz|roughly:ɹˈʌfli|3.14.:θɹˈi pˈYnt wˈʌn fˈɔɹ."},
                                {"We sold 1,000,000 copies.", "wˌi sˈOld wˈʌn mˈɪljᵊn kˈɑpiz.",
                                 "We:wˌi|sold:sˈOld|1,000,000:wˈʌn mˈɪljᵊn|copies.:kˈɑpiz."},
                                {"Chapter IV starts here.", "ʧˈæptəɹ fˈɔɹ stˈɑɹts hˈɪɹ.",
                                 "Chapter:ʧˈæptəɹ|IV:fˈɔɹ|starts:stˈɑɹts|here.:hˈɪɹ."},
                                {"Call 555-1234 now.", "kˈɔl fˈIv fˈIv fˈIv, wˈʌn tˈu θɹˈi fˈɔɹ nˈW.",
                                 "Call:kˈɔl|555-1234:fˈIv fˈIv fˈIv, wˈʌn tˈu θɹˈi fˈɔɹ|now.:nˈW."},
                            });
}

TEST_F(PhonemizerOutputTest, ReadsMoneyAndPercentages) {
    expectPhonemized(*this, {
                                {"It costs $4.50 today.", "ˌɪt kˈɔsts fˈɔɹ dˈɑləɹz ænd fˈɪfti sˈɛnts tədˈA.",
                                 "It:ˌɪt|costs:kˈɔsts|$4.50:fˈɔɹ dˈɑləɹz ænd fˈɪfti sˈɛnts|today.:tədˈA."},
                                {"About 50% of people agree.", "əbˈWt fˈɪfti pəɹsˈɛnt ʌv pˈipᵊl əɡɹˈi.",
                                 "About:əbˈWt|50%:fˈɪfti pəɹsˈɛnt|of:ʌv|people:pˈipᵊl|agree.:əɡɹˈi."},
                            });
}

TEST_F(PhonemizerOutputTest, ReadsDates) {
    expectPhonemized(*this, {
                                {"On 12/25/2024 we left.", "ˈɔn disˈɛmbəɹ twˈɛntifˈɪfθ twˈɛnti twˈɛntifˈɔɹ wi lˈɛft.",
                                 "On:ˈɔn|12/25/2024:disˈɛmbəɹ twˈɛntifˈɪfθ twˈɛnti twˈɛntifˈɔɹ|we:wi|left.:lˈɛft."},
                                {"Born on May 5, 2024.", "bˈɔɹn ˌɔn mˈA fˈɪfθ, twˈɛnti twˈɛntifˈɔɹ.",
                                 "Born:bˈɔɹn|on:ˌɔn|May:mˈA|5,:fˈɪfθ,|2024.:twˈɛnti twˈɛntifˈɔɹ."},
                            });
}

TEST_F(PhonemizerOutputTest, ExpandsAbbreviationsAndSymbols) {
    expectPhonemized(*this, {
                                {"Dr. Smith lives on Main St.", "dˈɑktəɹ smˈɪθ lˈIvz ˌɔn mˈAn stɹˈit.",
                                 "Dr.:dˈɑktəɹ|Smith:smˈɪθ|lives:lˈIvz|on:ˌɔn|Main:mˈAn|St.:stɹˈit."},
                                {"Bring fruit, e.g. apples.", "bɹˈɪŋ fɹˈut, fɔɹ ɪɡzˈæmpəl ˈæpᵊlz.",
                                 "Bring:bɹˈɪŋ|fruit,:fɹˈut,|e.g.:fɔɹ ɪɡzˈæmpəl|apples.:ˈæpᵊlz."},
                                {"Rock & roll.", "ɹˈɑk ænd ɹˈOl.", "Rock:ɹˈɑk|&:ænd|roll.:ɹˈOl."},
                            });
}

// A time or a measure is read as one phrase, and comes back as one word that
// spans both input words, so their word timings are shared.
TEST_F(PhonemizerOutputTest, LocatesAPhraseReadAsOneUnitAsOneWord) {
    expectPhonemized(*this, {
                                {"Meet me at 3:30 pm.", "mˈit mˌi æt θɹˈi θˈɜɹɾi pˈiˈɛm.",
                                 "Meet:mˈit|me:mˌi|at:æt|3:30 pm.:θɹˈi θˈɜɹɾi pˈiˈɛm."},
                                {"She ran 5 km.", "ʃˌi ɹˈæn fˈIv kəlˈɑməɾəɹz.",
                                 "She:ʃˌi|ran:ɹˈæn|5 km.:fˈIv kəlˈɑməɾəɹz."},
                            });
}

} // namespace
} // namespace rnexecutorch::tests
