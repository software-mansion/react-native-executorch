import type { WorkletRuntime } from 'react-native-worklets';
import { scheduleOnRN } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';
import { loadTokenizer } from '../../nlp/tokenizer';
import { argmax } from '../../../extensions/math';
import { type VadOptions, type Segment } from './fsmnVoiceActivityDetection';

export const WHISPER_SAMPLE_RATE_HZ = 16000;

const MAX_SEQ_LEN = 128;
const MIN_CHUNK_SIZE = 201;
const CHUNK_LENGTH_SECONDS = 29;
const CHUNK_SIZE = CHUNK_LENGTH_SECONDS * WHISPER_SAMPLE_RATE_HZ;
const BUFFER_SIZE = CHUNK_LENGTH_SECONDS * WHISPER_SAMPLE_RATE_HZ;
const STRIDE_SIZE = WHISPER_SAMPLE_RATE_HZ;

// prettier-ignore
export const WHISPER_LANGUAGES = [
  'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja', 'pt', 'tr',
  'pl', 'ca', 'nl', 'ar', 'sv', 'it', 'id', 'hi', 'fi', 'vi',
  'he', 'uk', 'el', 'ms', 'cs', 'ro', 'da', 'hu', 'ta', 'no',
  'th', 'ur', 'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy', 'sk',
  'te', 'fa', 'lv', 'bn', 'sr', 'az', 'sl', 'kn', 'et', 'mk',
  'br', 'eu', 'is', 'hy', 'ne', 'mn', 'bs', 'kk', 'sq', 'sw',
  'gl', 'mr', 'pa', 'si', 'km', 'sn', 'yo', 'so', 'af', 'oc',
  'ka', 'be', 'tg', 'sd', 'gu', 'am', 'yi', 'lo', 'uz', 'fo',
  'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my', 'bo', 'tl',
  'mg', 'as', 'tt', 'haw', 'ln', 'ha', 'ba', 'jw', 'su', 'yue'
] as const;

export type WhisperLanguage = (typeof WHISPER_LANGUAGES)[number];

export type WhisperSttOptions<L extends WhisperLanguage = WhisperLanguage> = {
  readonly language: L;
  readonly vad?: {
    readonly detectWorklet: (waveform: Float32Array, options?: VadOptions) => Segment[];
  };
  readonly vadOptions?: VadOptions;
};

export type WhisperSttModel<L extends WhisperLanguage = WhisperLanguage> = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
  readonly supportedLanguages: readonly L[];
};

export async function createWhisperSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L>,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;

  transcribe: (
    audio: Float32Array,
    options: WhisperSttOptions<L>,
    onToken?: (token: string) => void
  ) => Promise<string>;

  transcribeWorklet: (
    audio: Float32Array,
    options: WhisperSttOptions<L>,
    onToken?: (token: string) => void
  ) => string;

  stream: (
    options: WhisperSttOptions<L>
  ) => AsyncGenerator<{ committed: string; nonCommitted: string }>;

  streamStop: () => void;

  streamInsert: (audioChunk: Float32Array) => void;
}> {
  const { modelPath, tokenizerPath, supportedLanguages } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);
  const tokenizer = await wrapAsync(loadTokenizer, runtime)(tokenizerPath);

  const eotToken = tokenizer.tokenToId('<|endoftext|>')!;
  const isEnglishOnly = supportedLanguages.length === 1 && supportedLanguages[0] === 'en';

  const encMeta = validateModelSchema(
    model,
    'encode',
    [SymbolicTensor('float32', ['T_audio'])],
    [SymbolicTensor('float32', [1, 'Seq', 'State'])]
  );

  const encSeqLen = encMeta.outputTensorMeta[0]!.shape[1]!;
  const encStateDim = encMeta.outputTensorMeta[0]!.shape[2]!;

  validateModelSchema(
    model,
    'decode',
    [
      SymbolicTensor('int64', [1, 'Tokens']),
      SymbolicTensor('int64', ['Tokens']),
      SymbolicTensor('float32', [1, encSeqLen, encStateDim]),
    ],
    [SymbolicTensor('float32', [1, 'Tokens', 'Vocab'])]
  );

  const tensors = [
    tensor('int64', [1]),
    tensor('int64', [1, 1]),
    tensor('int32', [1, 1, 1]),
    tensor('float32', [1, encSeqLen, encStateDim]),
    tensor('float32', [1, 1, tokenizer.getVocabSize()]),
  ] as const;

  const [tPosition, tToken, tArgmax, tEncodings, tLogits] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    tokenizer.dispose();
    model.dispose();
  };

  const decode = (token: number, position: number): number => {
    'worklet';
    tPosition.setData(new BigInt64Array([BigInt(position)]));
    tToken.setData(new BigInt64Array([BigInt(token)]));
    model.execute('decode', [tToken, tPosition, tEncodings], [tLogits]);
    return tLogits.through(argmax, tArgmax).getData(new Int32Array(1))[0]!;
  };

  const transcribeWorklet = (
    audio: Float32Array,
    options: WhisperSttOptions<L>,
    onToken?: (token: string) => void
  ): string => {
    'worklet';

    const promptTokenStrings = isEnglishOnly
      ? ['<|startoftranscript|>', '<|notimestamps|>']
      : ['<|startoftranscript|>', `<|${options.language}|>`, '<|transcribe|>', '<|notimestamps|>'];
    const promptTokens = promptTokenStrings.map((token) => tokenizer.tokenToId(token)!);
    const maxNewTokens = MAX_SEQ_LEN - promptTokens.length;

    let text = '';
    let offset = 0;

    while (offset < audio.length) {
      const audioChunk = audio.slice(offset, Math.min(offset + CHUNK_SIZE, audio.length));
      if (audioChunk.length < MIN_CHUNK_SIZE) {
        break;
      }

      const tAudioInput = tensor('float32', [audioChunk.length], audioChunk);
      try {
        model.execute('encode', [tAudioInput], [tEncodings]);
      } finally {
        tAudioInput.dispose();
      }

      let nextToken = eotToken;
      let position = promptTokens.length;

      promptTokens.forEach((token, pos) => (nextToken = decode(token, pos)));
      const generated: number[] = [];

      while (generated.length < maxNewTokens && nextToken !== eotToken) {
        generated.push(nextToken);
        if (onToken) {
          scheduleOnRN(onToken, tokenizer.decode([nextToken]));
        }
        nextToken = decode(nextToken, position);
        position++;
      }

      text += tokenizer.decode(generated);
      offset += CHUNK_SIZE;
    }

    return text.trim();
  };

  const transcribe = wrapAsync(transcribeWorklet, runtime);

  let isStreaming = false;
  let audioBuffer = new Float32Array(0);
  let signal: (() => void) | null = null;

  const streamInsert = (audioChunk: Float32Array): void => {
    if (!isStreaming) return;

    const next = new Float32Array(audioBuffer.length + audioChunk.length);
    next.set(audioBuffer);
    next.set(audioChunk, audioBuffer.length);
    audioBuffer = next;
    signal?.();
    signal = null;
  };

  const streamStop = (): void => {
    if (!isStreaming) return;

    isStreaming = false;
    signal?.();
    signal = null;
  };

  async function* stream(
    options: WhisperSttOptions<L>
  ): AsyncGenerator<{ committed: string; nonCommitted: string }> {
    if (isStreaming) {
      throw new Error('Streaming is already in progress');
    }
    isStreaming = true;
    audioBuffer = new Float32Array(0);

    let currentText = '';
    let committedText = '';
    let processedLength = 0;

    const commit = () => {
      if (currentText !== '') {
        committedText += (committedText ? ' ' : '') + currentText;
        currentText = '';
      }
      audioBuffer = audioBuffer.slice(processedLength);
      processedLength = 0;
    };

    try {
      while (isStreaming) {
        if (audioBuffer.length - processedLength < STRIDE_SIZE) {
          await new Promise<void>((resolve) => (signal = resolve));
          continue;
        }

        processedLength = audioBuffer.length;
        const audioToProcess = audioBuffer.slice(0, processedLength);

        if (options.vad && options.vad.detectWorklet) {
          const latestChunk = audioToProcess.slice(Math.max(0, processedLength - STRIDE_SIZE));
          const segments = options.vad.detectWorklet(latestChunk, options.vadOptions);
          if (segments.length === 0) {
            commit();
            yield { committed: committedText, nonCommitted: '' };
            continue;
          }
        }

        currentText = await transcribe(audioToProcess, options);
        if (processedLength >= BUFFER_SIZE) {
          commit();
        }
        yield { committed: committedText, nonCommitted: currentText };
      }
    } finally {
      isStreaming = false;
      signal = null;
    }
  }

  return { dispose, transcribe, transcribeWorklet, stream, streamStop, streamInsert };
}
