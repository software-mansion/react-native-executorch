import { scheduleOnRN, type WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import { createPhonemizer, type PhonemizerConfig } from '../utils/phonemizer';
import { loadVoiceEmbedding } from '../ops/kokoro/voice';
import { partition, chunk } from '../ops/kokoro/partition';
import { crop } from '../ops/audio';
import { tokenize } from '../ops/kokoro/tokenize';
import { scaleDurations, sumDurations, expandDurations } from '../ops/kokoro/duration';
import {
  SAMPLE_RATE,
  SAMPLES_PER_FRAME,
  PAD_TOKEN_COUNT,
  CROP_STEPS,
  CROP_THRESHOLD,
  CROP_MARGIN,
  PAUSE_MS,
  DEFAULT_PAUSE_MS,
} from '../constants/kokoro';

/**
 * Text to speech model definition.
 * Aggregates all the subcomponents into one packed structure.
 */
export type TextToSpeechModel = {
  readonly durationPredictorPath: string;
  readonly synthesizerPath: string;
  readonly voicePath: string;
  readonly phonemizerConfig: PhonemizerConfig;
};

/**
 * Defines a streaming interface.
 */
export type TextToSpeechInput = {
  readonly text: string;
  readonly speed?: number;
  readonly onBegin?: () => void | Promise<void>;
  readonly onNext?: (audio: Float32Array) => void | Promise<void>;
  readonly onEnd?: () => void | Promise<void>;
};

export async function createTextToSpeech(
  config: TextToSpeechModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  stream: (input: TextToSpeechInput) => Promise<void>;
  synthesizeWorklet: (input: TextToSpeechInput) => void;
}> {
  // Step 1 - unpack components & load models
  const { durationPredictorPath, synthesizerPath, voicePath, phonemizerConfig } = config;
  const { lang, taggerSource, lexiconSource, neuralModelSource } = phonemizerConfig;
  console.log(neuralModelSource);

  const phonemizer = await wrapAsync(
    createPhonemizer,
    runtime
  )({
    lang,
    taggerSource,
    lexiconSource,
    neuralModelSource,
  });

  const durationPredictor = await wrapAsync(loadModel, runtime)(durationPredictorPath);
  const synthesizer = await wrapAsync(loadModel, runtime)(synthesizerPath);

  // Step 2 - validate model metadata
  // Duration predictor should have 3 forward methods.
  ([32, 64, 128] as const).map((size) =>
    validateModelSchema(
      durationPredictor,
      `forward_${size}`,
      [
        SymbolicTensor('int64', [1, 'N']),
        SymbolicTensor('bool', [1, 'N']),
        SymbolicTensor('float32', [1, 128]),
        SymbolicTensor('float32', [1]),
      ],
      [SymbolicTensor('int64', ['N']), SymbolicTensor('float32', [1, 'N', 640])]
    )
  );

  const synthMeta = validateModelSchema(
    synthesizer,
    'forward',
    [
      SymbolicTensor('int64', [1, 'N']),
      SymbolicTensor('bool', [1, 'N']),
      SymbolicTensor('int64', ['D']),
      SymbolicTensor('float32', [1, 'N', 640]),
      SymbolicTensor('float32', [1, 256]),
    ],
    [SymbolicTensor('float32', [1, 1, 'A'])]
  );

  // Step 3 - read size limits (from the obtained metadata).
  const maxTokens = synthMeta.inputTensorMeta[0]!.shape[1]!;
  const maxDuration = synthMeta.inputTensorMeta[2]!.shape[0]!;
  const maxAudioSamples = synthMeta.outputTensorMeta[0]!.shape[2]!;

  // Step 4 - initialize input/output tensors
  // The tensors are initialized with maximum capacity and
  // sliced later to handle dynamic shapes behavior without reallocations.
  const tokensTensor = tensor('int64', [1, maxTokens]);
  const maskTensor = tensor('bool', [1, maxTokens]);
  const voiceTensor = tensor('float32', [510, 256]); // Each row is a separate style vector
  const speedTensor = tensor('float32', [1]);
  const durationsTensor = tensor('int64', [maxTokens]);
  const intermediateTensor = tensor('float32', [1, maxTokens, 640]);
  const alignmentTensor = tensor('int64', [maxDuration]);
  const audioTensor = tensor('float32', [1, 1, maxAudioSamples]);

  // Mask and voice can be filled with values right away.
  maskTensor.setData(new Uint8Array(maxTokens).fill(1));
  loadVoiceEmbedding(voicePath, voiceTensor);

  // Step 5 - memory clean-up method
  const dispose = () => {
    phonemizer.dispose();
    durationPredictor.dispose();
    synthesizer.dispose();
    tokensTensor.dispose();
    maskTensor.dispose();
    voiceTensor.dispose();
    speedTensor.dispose();
    intermediateTensor.dispose();
    durationsTensor.dispose();
    alignmentTensor.dispose();
    audioTensor.dispose();
  };

  // Step 6 - synthesis worklet (runs on the background runtime)
  const synthesizeWorklet = (input: TextToSpeechInput): void => {
    'worklet';
    const { text, speed, onBegin, onNext, onEnd } = input;

    if (onBegin) scheduleOnRN(onBegin);

    speedTensor.setData(new Float32Array([speed ?? 1.0]));

    const phonemes = phonemizer.phonemize(text);
    const segments = partition(phonemes, maxTokens);

    for (const input of chunk(phonemes, segments)) {
      // This effective sequence length will be useful in slicing tensors.
      const tokenLength = input.length + PAD_TOKEN_COUNT;

      const dTokensTensor = tokensTensor.view([1, tokenLength]);
      const dMaskTensor = maskTensor.view([1, tokenLength]);
      const dDurationsTensor = durationsTensor.view([tokenLength]);
      const dIntermediateTensor = intermediateTensor.view([1, tokenLength, 640]);

      tokenize(input, dTokensTensor);

      // Now indexing the voice tensor to get the appropriate style vector.
      const voiceIndex = tokenLength - 1;
      const voiceOffset = voiceIndex * 256 * 4; // bytes: index * cols * sizeof(float)

      const dVoiceTensor = voiceTensor.view([1, 256], voiceOffset);
      const dVoiceHSTensor = dVoiceTensor.view([1, 128]); // First half of the style vector

      // First model call - predicting the effective durations.
      // Select most suitable forward method based on sequence length.
      const method =
        tokenLength <= 32 ? 'forward_32' : tokenLength <= 64 ? 'forward_64' : 'forward_128';
      durationPredictor.execute(
        method,
        [dTokensTensor, dMaskTensor, dVoiceHSTensor, speedTensor],
        [dDurationsTensor, dIntermediateTensor]
      );

      const totalDuration = sumDurations(dDurationsTensor);
      if (totalDuration > maxDuration) {
        scaleDurations(dDurationsTensor, tokenLength, maxDuration);
      }

      // We need to build a duration indices array for the synthesizer.
      // Each index i is repeated dDurationsTensor[i] times.
      const finalDuration = Math.min(totalDuration, maxDuration);
      const dAlignmentTensor = alignmentTensor.view([finalDuration]);
      expandDurations(dDurationsTensor, dAlignmentTensor);

      // Second model call - producing an audio.
      const audioSamples = finalDuration * SAMPLES_PER_FRAME;
      const dAudioTensor = audioTensor.view([1, 1, audioSamples]);
      synthesizer.execute(
        'forward',
        [dTokensTensor, dMaskTensor, dAlignmentTensor, dIntermediateTensor, dVoiceTensor],
        [dAudioTensor]
      );

      // Postprocessing - trimming the audio.
      // Important for removing artifacts.
      const trimmedAudio = crop(dAudioTensor, CROP_STEPS, CROP_THRESHOLD, CROP_MARGIN);

      // Add some additional pause to make speech sound more natural.
      const pauseMs = PAUSE_MS[input.trimEnd().slice(-1)] ?? DEFAULT_PAUSE_MS;
      const pauseSamples = Math.round((pauseMs * SAMPLE_RATE) / 1000);

      if (onNext) {
        // TODO: get rid of this allocation with double buffer approach
        const audioBuf = new Float32Array(trimmedAudio.numel + pauseSamples);
        trimmedAudio.getData(audioBuf.subarray(0, trimmedAudio.numel));
        scheduleOnRN(onNext, audioBuf);
      }
    }

    if (onEnd) scheduleOnRN(onEnd);
  };

  const synthesize = wrapAsync(synthesizeWorklet, runtime);

  // Step 7 - RN-side streaming orchestration
  const stream = async (input: TextToSpeechInput): Promise<void> => {
    const { onNext, onEnd, ...rest } = input;

    // Serial playback chain, owned by the RN thread (where onNext executes).
    let playback: Promise<void> = Promise.resolve();
    const enqueue =
      onNext &&
      ((audio: Float32Array) => {
        playback = playback.then(() => onNext(audio));
      });

    await synthesize({ ...rest, onNext: enqueue });

    // Wait for playback to finish, then signal the true end of the stream.
    await playback;
    await onEnd?.();
  };

  return { stream, synthesizeWorklet, dispose };
}
