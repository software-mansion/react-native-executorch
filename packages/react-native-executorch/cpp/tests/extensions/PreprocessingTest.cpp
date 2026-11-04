#include <initializer_list>
#include <string>

#include <gtest/gtest.h>

#include <phonemis/base/pipeline.h>
#include <phonemis/utils/conversions.h>

namespace rnexecutorch::tests {
namespace {

using phonemis::utils::conversions::u32_to_utf8;
using phonemis::utils::conversions::utf8_to_u32;

// These languages are phonemized by a neural model, which these tests cannot
// run, so PhonemizerOutputTest covers only en-us, en-gb and zh. What phonemis
// feeds the model is still pinned here: the text after preprocessing (Verbalis),
// which reads numbers, dates, money, times and abbreviations out as words. It
// needs no data, so this goes below the JSI layer, to phonemis directly.

struct Case {
    const char *text;
    const char *preprocessed;
};

void expectPreprocessed(const char *lang, std::initializer_list<Case> cases) {
    phonemis::Pipeline pipeline(phonemis::Config{.lang = lang});
    for (const auto &c : cases) {
        SCOPED_TRACE(c.text);
        EXPECT_EQ(u32_to_utf8(pipeline.preprocess(utf8_to_u32(c.text))), c.preprocessed);
    }
}
TEST(PreprocessingTest, ReadsGerman) {
    expectPreprocessed("de", {
                                 {"Ich habe 25 Katzen.", "Ich habe fünfundzwanzig Katzen."},
                                 {"Es kostet 4,50 €.", "Es kostet vier Euro fünfzig."},
                                 {"Am 24.12.2024 fuhren wir.", "Am vierundzwanzigsten Dezember zweitausendvierundzwanzig fuhren wir."},
                                 {"Um 15:30 Uhr.", "Um fünfzehn Uhr dreißig."},
                                 {"Der 3. Mai.", "Der dritte Mai."},
                                 {"Dr. Müller lief z. B. 3,5 km.", "Doktor Müller lief zum Beispiel drei Komma fünf Kilometer."},
                                 {"Etwa 50 % stimmen zu.", "Etwa fünfzig Prozent stimmen zu."},
                                 {"Im Jahr 1999.", "Im Jahr neunzehnhundertneunundneunzig."},
                             });
}

TEST(PreprocessingTest, ReadsFrench) {
    expectPreprocessed("fr", {
                                 {"J'ai 25 chats.", "J'ai vingt-cinq chats."},
                                 {"Ça coûte 4,50 €.", "Ça coûte quatre euros cinquante."},
                                 {"Le 24/12/2024 nous sommes partis.", "Le vingt-quatre décembre deux mille vingt-quatre nous sommes partis."},
                                 {"À 15h30.", "À quinze heures trente."},
                                 {"Le 3e jour.", "Le troisième jour."},
                                 {"M. Dupont a couru 3,5 km.", "monsieur Dupont a couru trois virgule cinq kilomètres."},
                                 {"Environ 50 % sont d'accord.", "Environ cinquante pour cent sont d'accord."},
                                 {"En 1999.", "En mille neuf cent quatre-vingt-dix-neuf."},
                             });
}

TEST(PreprocessingTest, ReadsSpanish) {
    expectPreprocessed("es", {
                                 {"Tengo 25 gatos.", "Tengo veinticinco gatos."},
                                 {"Cuesta 4,50 €.", "Cuesta cuatro euros con cincuenta."},
                                 {"El 24/12/2024 salimos.", "El veinticuatro de diciembre de dos mil veinticuatro salimos."},
                                 {"A las 15:30.", "A las quince y media."},
                                 // Wrong: should be "tercer" (Verbalis#8).
                                 {"El 3.º día.", "El tercero día."},
                                 {"El Sr. García corrió 3,5 km.", "El señor García corrió tres coma cinco kilómetros."},
                                 {"Un 50 % está de acuerdo.", "Un cincuenta por ciento está de acuerdo."},
                                 {"En 1999.", "En mil novecientos noventa y nueve."},
                             });
}

TEST(PreprocessingTest, ReadsItalian) {
    expectPreprocessed("it", {
                                 {"Ho 25 gatti.", "Ho venticinque gatti."},
                                 {"Costa 4,50 €.", "Costa quattro euro e cinquanta centesimi."},
                                 {"Il 24/12/2024 siamo partiti.", "Il ventiquattro dicembre duemilaventiquattro siamo partiti."},
                                 {"Alle 15:30.", "Alle quindici e trenta."},
                                 {"Il 3° giorno.", "Il terzo giorno."},
                                 {"Il Sig. Rossi ha corso 3,5 km.", "Il signor Rossi ha corso tre virgola cinque chilometri."},
                                 {"Il 50% è d'accordo.", "Il cinquanta per cento è d'accordo."},
                                 {"Nel 1999.", "Nel millenovecentonovantanove."},
                             });
}

TEST(PreprocessingTest, ReadsPolish) {
    expectPreprocessed("pl", {
                                 {"Mam 25 kotów.", "Mam dwadzieścia pięć kotów."},
                                 {"Kosztuje 4,50 zł.", "Kosztuje cztery złote pięćdziesiąt groszy."},
                                 {"Dnia 24.12.2024 wyjechaliśmy.", "Dnia dwudziestego czwartego grudnia dwa tysiące dwudziestego czwartego wyjechaliśmy."},
                                 {"O 15:30.", "O piętnastej trzydzieści."},
                                 {"3 maja.", "trzeciego maja."},
                                 {"Dr Kowalski przebiegł np. 3,5 km.", "Doktor Kowalski przebiegł na przykład trzy i pół kilometra."},
                                 {"Około 50% się zgadza.", "Około pięćdziesięciu procent się zgadza."},
                                 {"W 1999 roku.", "W tysiąc dziewięćset dziewięćdziesiątym dziewiątym roku."},
                             });
}

TEST(PreprocessingTest, ReadsPortuguese) {
    expectPreprocessed("pt", {
                                 {"Tenho 25 gatos.", "Tenho vinte e cinco gatos."},
                                 {"Custa R$ 4,50.", "Custa quatro reais e cinquenta centavos."},
                                 {"Em 24/12/2024 partimos.", "Em vinte e quatro de dezembro de dois mil e vinte e quatro partimos."},
                                 {"Às 15h30.", "Às quinze horas e trinta."},
                                 {"O 3.º dia.", "O terceiro dia."},
                                 // Wrong: "Sr." should be "senhor" (Verbalis#8).
                                 {"O Sr. Silva correu 3,5 km.", "O Sr. Silva correu três vírgula cinco quilômetros."},
                                 {"Cerca de 50% concordam.", "Cerca de cinquenta por cento concordam."},
                                 {"Em 1999.", "Em mil novecentos e noventa e nove."},
                             });
}

TEST(PreprocessingTest, ReadsHindi) {
    expectPreprocessed("hi", {
                                 {"मेरे पास 25 बिल्लियाँ हैं।", "मेरे पास पच्चीस बिल्लियाँ हैं।"},
                                 {"इसकी कीमत ₹4.50 है।", "इसकी कीमत चार रुपये पचास पैसे है।"},
                                 {"24/12/2024 को हम गए।", "चौबीस दिसंबर दो हज़ार चौबीस को हम गए।"},
                                 // Wrong: says बजे twice (Verbalis#8).
                                 {"3:30 बजे।", "तीन बजकर तीस मिनट बजे।"},
                                 {"50% लोग सहमत हैं।", "पचास प्रतिशत लोग सहमत हैं।"},
                                 {"1999 में।", "एक हज़ार नौ सौ निन्यानवे में।"},
                             });
}
} // namespace
} // namespace rnexecutorch::tests
