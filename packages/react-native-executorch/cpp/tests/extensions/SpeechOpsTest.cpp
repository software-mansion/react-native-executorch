#include <format>
#include <vector>

#include "support/JsiTestEnv.h"

namespace rnexecutorch::tests {
namespace {

using SpeechOpsTest = JsiTestEnv;
using ::testing::HasSubstr;

// extractFrames is the framing stage of the Whisper/VAD front-end: it slices a
// waveform into overlapping frames, removes each frame's mean, applies
// pre-emphasis and a Hann window, and centre-pads each frame into an FFT-length
// row. It was moved to C++ because doing it in JS dominated the runtime, so the
// numerics here are worth pinning down precisely.

constexpr const char *kNs =
    "const s = __rnexecutorch_jsi__.speech;"
    "const createTensor = __rnexecutorch_jsi__.createTensor;"
    "const fill = (t, values) => { t.setData(new Float32Array(values)); return t; };"
    "const read = (t) => { const o = new Float32Array(t.numel); t.getData(o); return Array.from(o); };";

TEST_F(SpeechOpsTest, IdentityWindowLeavesMeanRemovedSamples) {
    // preemphasis = 0 and an all-ones window reduce the transform to plain
    // mean subtraction, which is easy to verify by hand.
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([4], 'float32'), [1, 2, 3, 4]);
        const hann = fill(createTensor([2], 'float32'), [1, 1]);
        const dst = createTensor([2, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 2, hopLength: 2, preemphasis: 0 }});
        return read(dst);
    )",
                                              kNs));
    // Frame 0 = [1,2] (mean 1.5), frame 1 = [3,4] (mean 3.5).
    EXPECT_TRUE(almostEqual(result, {-0.5, 0.5, -0.5, 0.5}));
}

TEST_F(SpeechOpsTest, AppliesTheWindowElementwise) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([2], 'float32'), [1, 3]);
        const hann = fill(createTensor([2], 'float32'), [0, 2]);
        const dst = createTensor([1, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 1, hopLength: 1, preemphasis: 0 }});
        return read(dst);
    )",
                                              kNs));
    // Mean 2 -> [-1, 1], windowed by [0, 2] -> [0, 2].
    EXPECT_TRUE(almostEqual(result, {0, 2}));
}

TEST_F(SpeechOpsTest, AppliesPreemphasisFromTheSecondSample) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([2], 'float32'), [1, 3]);
        const hann = fill(createTensor([2], 'float32'), [1, 1]);
        const dst = createTensor([1, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 1, hopLength: 1, preemphasis: 0.5 }});
        return read(dst);
    )",
                                              kNs));
    // mean = 2, meanBias = 2 * (1 - 0.5) = 1.
    // out[0] = (1 - 2) * 1 = -1
    // out[1] = (3 - 0.5 * 1 - 1) * 1 = 1.5
    EXPECT_TRUE(almostEqual(result, {-1, 1.5}));
}

TEST_F(SpeechOpsTest, CentrePadsFramesIntoTheFftRow) {
    // frameLength 2 into fftLength 4 -> leftPad = 1, so the frame sits in the
    // middle and the surrounding cells stay zero.
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([2], 'float32'), [1, 3]);
        const hann = fill(createTensor([2], 'float32'), [1, 1]);
        const dst = createTensor([1, 4], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 1, hopLength: 1, preemphasis: 0 }});
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {0, -1, 1, 0}));
}

TEST_F(SpeechOpsTest, ZeroesUnusedTrailingRows) {
    // dst has capacity for 3 frames but only 1 is written; the rest must be
    // cleared rather than left with whatever the buffer held.
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([4], 'float32'), [1, 3, 5, 7]);
        const hann = fill(createTensor([2], 'float32'), [1, 1]);
        const dst = createTensor([3, 2], 'float32');
        dst.setData(new Float32Array([9, 9, 9, 9, 9, 9]));
        s.extractFrames(waveform, hann, dst, {{ numFrames: 1, hopLength: 1, preemphasis: 0 }});
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {-1, 1, 0, 0, 0, 0}));
}

TEST_F(SpeechOpsTest, OverlappingHopsShareSamples) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([4], 'float32'), [1, 2, 3, 4]);
        const hann = fill(createTensor([2], 'float32'), [1, 1]);
        const dst = createTensor([3, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 3, hopLength: 1, preemphasis: 0 }});
        return read(dst);
    )",
                                              kNs));
    // Frames [1,2], [2,3], [3,4] — each mean-removed to [-0.5, 0.5].
    EXPECT_TRUE(almostEqual(result, {-0.5, 0.5, -0.5, 0.5, -0.5, 0.5}));
}

TEST_F(SpeechOpsTest, ZeroFramesLeavesDestinationCleared) {
    auto result = evalNumberArray(std::format(R"(
        {}
        const waveform = fill(createTensor([4], 'float32'), [1, 2, 3, 4]);
        const hann = fill(createTensor([2], 'float32'), [1, 1]);
        const dst = createTensor([2, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 0, hopLength: 1, preemphasis: 0 }});
        return read(dst);
    )",
                                              kNs));
    EXPECT_TRUE(almostEqual(result, {0, 0, 0, 0}));
}

TEST_F(SpeechOpsTest, RejectsFrameWindowRunningPastTheWaveform) {
    // The last frame would need sample index 4 of a 4-sample waveform.
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const waveform = createTensor([4], 'float32');
        const hann = createTensor([2], 'float32');
        const dst = createTensor([4, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 4, hopLength: 1, preemphasis: 0 }});
    )",
                                                kNs)),
                HasSubstr("exceeds waveform bounds"));
}

TEST_F(SpeechOpsTest, RejectsMoreFramesThanDestinationCapacity) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const waveform = createTensor([16], 'float32');
        const hann = createTensor([2], 'float32');
        const dst = createTensor([2, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 3, hopLength: 1, preemphasis: 0 }});
    )",
                                                kNs)),
                HasSubstr("exceeds dst frame capacity"));
}

TEST_F(SpeechOpsTest, RejectsWindowLongerThanTheFftLength) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const waveform = createTensor([16], 'float32');
        const hann = createTensor([4], 'float32');
        const dst = createTensor([2, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 1, hopLength: 1, preemphasis: 0 }});
    )",
                                                kNs)),
                HasSubstr("exceeds dst fftLength"));
}

TEST_F(SpeechOpsTest, RequiresAllOptions) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const waveform = createTensor([16], 'float32');
        const hann = createTensor([2], 'float32');
        const dst = createTensor([2, 2], 'float32');
        s.extractFrames(waveform, hann, dst, {{ hopLength: 1, preemphasis: 0 }});
    )",
                                                kNs)),
                HasSubstr("'numFrames' is required"));
}

TEST_F(SpeechOpsTest, RequiresATwoDimensionalDestination) {
    EXPECT_THAT(evalThrowingMessage(std::format(R"(
        {}
        const waveform = createTensor([16], 'float32');
        const hann = createTensor([2], 'float32');
        const dst = createTensor([4], 'float32');
        s.extractFrames(waveform, hann, dst, {{ numFrames: 1, hopLength: 1, preemphasis: 0 }});
    )",
                                                kNs)),
                HasSubstr("extractFrames: dst"));
}

TEST_F(SpeechOpsTest, RejectsWrongArgumentCount) {
    EXPECT_THAT(evalThrowingMessage(std::format("{} s.extractFrames(createTensor([4], 'float32'));", kNs)),
                HasSubstr("Usage: extractFrames(waveform, hann, dst, options)"));
}

} // namespace
} // namespace rnexecutorch::tests
