// Hooks — primary API for app developers
export * from './hooks/useClassifier';
export * from './hooks/useStyleTransfer';
export * from './hooks/useSemanticSegmenter';
export * from './hooks/useInstanceSegmenter';
export * from './hooks/useKeypointDetector';
export * from './hooks/useObjectDetector';
export * from './hooks/useTokenizer';
export * from './hooks/useTextEmbedder';
export * from './hooks/usePrivacyFilter';
export * from './hooks/useImageEmbedder';
export * from './hooks/useVoiceActivityDetector';
export * from './hooks/useSpeechToText';
export * from './hooks/useTextToSpeech';
export * from './hooks/useTextToImage';
export * from './hooks/useOcr';
export * from './hooks/useResourceDownload';
export * from './hooks/useModel';

// Resource fetching — imperative download API
export * from './fetcher';

// Constants
export { models } from './models';
export * as constants from './constants';

// Task APIs — for developers needing manual lifetime/disposal control
export * from './extensions/cv/tasks/classification';
export * from './extensions/cv/tasks/styleTransfer';
export * from './extensions/cv/tasks/semanticSegmentation';
export * from './extensions/cv/tasks/instanceSegmentation';
export * from './extensions/cv/tasks/keypointDetection';
export * from './extensions/cv/tasks/objectDetection';
export * from './extensions/cv/tasks/imageEmbedding';
export * from './extensions/cv/tasks/sdxsTextToImage';
export * from './extensions/nlp/tasks/tokenization';
export * from './extensions/nlp/tasks/textEmbedding';
export * from './extensions/nlp/tasks/privacyFilter';
export * from './extensions/speech/tasks/fsmnVoiceActivityDetection';
export * from './extensions/speech/tasks/whisperSpeechToText';
export * from './extensions/speech/tasks/supertonicTextToSpeech';
export * from './extensions/speech/tasks/kokoroTextToSpeech';
export * from './extensions/cv/tasks/ocr/ocr';
export * from './extensions/cv/tasks/ocr/detectors';
export type { Quad } from './extensions/cv/ops/quad';
export type { NormalizeOptions } from './extensions/cv/ops/image';

// Core primitives — for library builders and power users
export * from './core/error';
export * from './core/model';
export * from './core/tensor';
export * from './core/runtime';

export type * from './core/schema';
export * as schema from './core/schema';

export * as math from './extensions/math';
export * as cv from './extensions/cv';
export * as nlp from './extensions/nlp';
export * as speech from './extensions/speech';

// Utils
export * from './utils';
