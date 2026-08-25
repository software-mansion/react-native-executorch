/**
 * React Native ExecuTorch is a high-performance, privacy-first on-device AI
 * inference library for React Native, powered by PyTorch's ExecuTorch runtime.
 *
 * It provides a layered architecture designed for different use cases:
 *
 * - **React Hooks (`use<Task>`)**:
 *   Declarative hooks (e.g. {@link useClassifier}, {@link useLLMChatSession},
 *   {@link useSpeechToText}, {@link useOpticalCharacterRecognizer}) designed
 *   for UI components. They manage downloading remote model assets with
 *   progress tracking, compilation, and automatic native memory disposal on
 *   unmount.
 *
 * - **Task APIs (`create<Task>`)**:
 *   Imperative, promise-based pipelines (e.g. {@link createClassifier},
 *   {@link createLLMChatSession}, {@link createPaddleOcr},
 *   {@link createWhisperSpeechToText}) with built-in preprocessing,
 *   postprocessing, and tokenizers. Ideal for background services, worklets, or
 *   apps needing manual lifecycle control.
 *
 * - **Domain Utilities (`cv`, `llm`, `speech`, `nlp`, `math`)**:
 *   Domain-specific low-level tools:
 *   - `cv`: Image transformations (resizing, normalization, layout conversions),
 *     bounding box, quadrilateral, and keypoint helpers.
 *   - `llm`: Token-by-token text generation runner, chat template formatting,
 *     and function calling helpers.
 *   - `nlp`: Fast native HuggingFace tokenizers and privacy filter utilities.
 *   - `speech`: Text-to-speech phonemizers, sentence splitters, voice activity
 *     detection, and audio utilities.
 *   - `math`: Native C++ tensor operations (softmax, sigmoid, argmax, linear,
 *     activations).
 *
 * - **Model Registry ({@link models})**:
 *   A curated catalog of verified, hosted on-device AI models across LLMs,
 *   Computer Vision, Speech, and NLP. Provides download URLs, pre-tuned
 *   configurations, and label maps for out-of-the-box inference.
 *
 * - **Resource Fetcher ({@link download})**:
 *   Imperative asset downloader and caching engine with abort control, progress
 *   tracking, and deduplicated local storage.
 *
 * - **Core Primitives ({@link Model}, {@link Tensor}, {@link schema}, {@link wrapAsync})**:
 *   Low-level building blocks for custom architectures: direct C++ tensor
 *   memory management, raw model execution, load-time shape/domain validation,
 *   and worklet threading.
 * @packageDocumentation
 */

// Hooks — primary API for app developers
export * from './hooks/useClassifier';
export * from './hooks/useStyleTransfer';
export * from './hooks/useSemanticSegmenter';
export * from './hooks/useInstanceSegmenter';
export * from './hooks/useKeypointDetector';
export * from './hooks/useObjectDetector';
export * from './hooks/useTokenizer';
export * from './hooks/useLLMChatSession';
export * from './hooks/useTextEmbedder';
export * from './hooks/usePrivacyFilter';
export * from './hooks/useImageEmbedder';
export * from './hooks/useVoiceActivityDetector';
export * from './hooks/useSpeechToText';
export * from './hooks/useTextToSpeech';
export * from './hooks/useTextToImage';
export * from './hooks/useOpticalCharacterRecognizer';
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
export * from './extensions/cv/tasks/paddleOcr';
export * from './extensions/llm/tasks/llmChatSession';
export * from './extensions/nlp/tasks/tokenization';
export * from './extensions/nlp/tasks/textEmbedding';
export * from './extensions/nlp/tasks/privacyFilter';
export * from './extensions/speech/tasks/fsmnVoiceActivityDetection';
export * from './extensions/speech/tasks/whisperSpeechToText';
export * from './extensions/speech/tasks/supertonicTextToSpeech';
export * from './extensions/speech/tasks/kokoroTextToSpeech';

// Core primitives — for library builders and power users
export * from './core/error';
export * from './core/model';
export * from './core/tensor';
export * from './core/runtime';

export type * from './core/schema';
export * as schema from './core/schema';

export * as math from './extensions/math';
export * as cv from './extensions/cv';
export * as llm from './extensions/llm';
export * as nlp from './extensions/nlp';
export * as speech from './extensions/speech';

// Utils
export * from './utils';
