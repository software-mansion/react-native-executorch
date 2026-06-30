#include "install.h"
#include "audio_ops.h"
#include "kokoro/duration.h"
#include "kokoro/partitioner.h"
#include "kokoro/tokenizer.h"
#include "kokoro/voice.h"

#ifdef RNE_ENABLE_PHONEMIS
#include "phonemizer.h"
#endif

namespace rnexecutorch::extensions::speech {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object speechModule = jsi::Object(rt);

    // G2P (requires phonemis)
#ifdef RNE_ENABLE_PHONEMIS
    install_createPhonemizer(rt, speechModule);
#endif

    // Audio ops
    jsi::Object audioModule = jsi::Object(rt);
    audio::install_crop(rt, audioModule);
    speechModule.setProperty(rt, "audio", audioModule);

    // Kokoro-specific ops and utilities
    jsi::Object kokoroModule = jsi::Object(rt);
    // tokenize/partition reuse phonemis' unicode conversions, so they are only
    // available when phonemis support is compiled in.
#ifdef RNE_ENABLE_PHONEMIS
    kokoro::install_tokenize(rt, kokoroModule);
    kokoro::install_partition(rt, kokoroModule);
#endif
    kokoro::install_loadVoiceEmbedding(rt, kokoroModule);
    kokoro::install_sumDurations(rt, kokoroModule);
    kokoro::install_scaleDurations(rt, kokoroModule);
    kokoro::install_expandDurations(rt, kokoroModule);
    kokoro::install_cropToTimestamp(rt, kokoroModule);
    speechModule.setProperty(rt, "kokoro", kokoroModule);

    module.setProperty(rt, "speech", speechModule);
}

} // namespace rnexecutorch::extensions::speech
