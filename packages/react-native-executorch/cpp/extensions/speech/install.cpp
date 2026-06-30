#include "install.h"
#include "audio_ops.h"
#include "kokoro/duration.h"
#include "kokoro/partitioner.h"
#include "kokoro/tokenizer.h"
#include "kokoro/voice.h"
#include "phonemizer.h"

namespace mylib::extensions::speech {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object speechModule = jsi::Object(rt);

    // G2P
    install_createPhonemizer(rt, speechModule);

    // Audio ops
    jsi::Object audioModule = jsi::Object(rt);
    audio::install_crop(rt, audioModule);
    speechModule.setProperty(rt, "audio", audioModule);

    // Kokoro-specific ops and utilities
    jsi::Object kokoroModule = jsi::Object(rt);
    kokoro::install_tokenize(rt, kokoroModule);
    kokoro::install_partition(rt, kokoroModule);
    kokoro::install_loadVoiceEmbedding(rt, kokoroModule);
    kokoro::install_sumDurations(rt, kokoroModule);
    kokoro::install_scaleDurations(rt, kokoroModule);
    kokoro::install_expandDurations(rt, kokoroModule);
    kokoro::install_cropToTimestamp(rt, kokoroModule);
    speechModule.setProperty(rt, "kokoro", kokoroModule);

    module.setProperty(rt, "speech", speechModule);
}

} // namespace mylib::extensions::speech
