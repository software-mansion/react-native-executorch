# react-native-executorch

React Native ExecuTorch is a high-performance, privacy-first on-device AI
inference library for React Native, powered by PyTorch's ExecuTorch runtime.

It provides a layered architecture designed for different use cases:

- **React Hooks (`use<Task>`)**:
  Declarative hooks designed for UI components. They manage downloading
  remote model assets with progress tracking, compilation, and automatic
  native memory disposal on unmount.

- **Task APIs (`create<Task>`)**:
  Imperative, promise-based pipelines with built-in preprocessing and
  postprocessing. Ideal for background services, worklets, or apps needing
  manual lifecycle control.

- **Domain Utilities**:
  Domain-specific low-level tools:
  - [math](react-native-executorch/namespaces/math/index.md): Native C++ tensor operations (softmax, sigmoid, argmax,
    gather, etc.).
  - [cv](react-native-executorch/namespaces/cv/index.md): Image transformations (resizing, normalization, layout conversions),
    bounding box, quadrilateral, and keypoint helpers.
  - [llm](react-native-executorch/namespaces/llm/index.md): Token-by-token text generation runner, chat template formatting,
    and function calling helpers.
  - [nlp](react-native-executorch/namespaces/nlp/index.md): Fast native HuggingFace tokenizers and privacy filter utilities.
  - [speech](react-native-executorch/namespaces/speech/index.md): Text-to-speech phonemizers, sentence splitters, voice activity
    detection, and audio utilities.

- **Model Registry ([models](variables/models.md))**:
  A curated catalog of verified, hosted on-device AI models across LLMs,
  Computer Vision, Speech, and NLP. Provides download URLs, pre-tuned
  configurations, and label maps for out-of-the-box inference.

- **Resource Fetcher ([download](functions/download.md))**:
  Imperative asset downloader and caching engine with abort control, progress
  tracking, and deduplicated local storage.

- **Core Primitives ([Model](type-aliases/Model.md), [Tensor](type-aliases/Tensor.md), [schema](react-native-executorch/namespaces/schema/index.md), [wrapAsync](functions/wrapAsync.md),
  [createResourceScope](functions/createResourceScope.md))**:
  Low-level building blocks for custom architectures: direct C++ tensor
  memory management, raw model execution, load-time shape/domain validation,
  worklet threading, and construction-time ownership of native resources.

## Hooks

- [useClassifier](functions/useClassifier.md)
- [useImageEmbedder](functions/useImageEmbedder.md)
- [useInstanceSegmenter](functions/useInstanceSegmenter.md)
- [useKeypointDetector](functions/useKeypointDetector.md)
- [useLLMChatSession](functions/useLLMChatSession.md)
- [useModel](functions/useModel.md)
- [useObjectDetector](functions/useObjectDetector.md)
- [useOpticalCharacterRecognizer](functions/useOpticalCharacterRecognizer.md)
- [usePrivacyFilter](functions/usePrivacyFilter.md)
- [useResourceDownload](functions/useResourceDownload.md)
- [useSemanticSegmenter](functions/useSemanticSegmenter.md)
- [useSpeechToText](functions/useSpeechToText.md)
- [useStyleTransfer](functions/useStyleTransfer.md)
- [useTextEmbedder](functions/useTextEmbedder.md)
- [useTextToImage](functions/useTextToImage.md)
- [useTextToSpeech](functions/useTextToSpeech.md)
- [useTokenizer](functions/useTokenizer.md)
- [useVoiceActivityDetector](functions/useVoiceActivityDetector.md)

## Models

- [models](variables/models.md)

## Modules

- [cv](react-native-executorch/namespaces/cv/index.md)
- [llm](react-native-executorch/namespaces/llm/index.md)
- [math](react-native-executorch/namespaces/math/index.md)
- [nlp](react-native-executorch/namespaces/nlp/index.md)
- [schema](react-native-executorch/namespaces/schema/index.md)
- [speech](react-native-executorch/namespaces/speech/index.md)

## Core / Functions

- [createResourceScope](functions/createResourceScope.md)
- [isRnExecuTorchError](functions/isRnExecuTorchError.md)
- [loadModel](functions/loadModel.md)
- [RnExecuTorchError](functions/RnExecuTorchError.md)
- [tensor](functions/tensor.md)
- [wrapAsync](functions/wrapAsync.md)

## Core / Types

- [DType](type-aliases/DType.md)
- [LoadModelOptions](type-aliases/LoadModelOptions.md)
- [Model](type-aliases/Model.md)
- [ModelInput](type-aliases/ModelInput.md)
- [ModelOutput](type-aliases/ModelOutput.md)
- [NativeResource](type-aliases/NativeResource.md)
- [ResourceScope](type-aliases/ResourceScope.md)
- [RnExecuTorchError](type-aliases/RnExecuTorchError.md)
- [RnExecuTorchErrorCode](type-aliases/RnExecuTorchErrorCode.md)
- [Tensor](type-aliases/Tensor.md)

## Core / Constants

- [defaultWorkletRuntime](variables/defaultWorkletRuntime.md)
- [VALID_ERROR_CODES](variables/VALID_ERROR_CODES.md)

## CV / Tasks

- [createClassifier](functions/createClassifier.md)
- [createImageEmbedder](functions/createImageEmbedder.md)
- [createInstanceSegmenter](functions/createInstanceSegmenter.md)
- [createKeypointDetector](functions/createKeypointDetector.md)
- [createObjectDetector](functions/createObjectDetector.md)
- [createPaddleOcr](functions/createPaddleOcr.md)
- [createSdxsTextToImage](functions/createSdxsTextToImage.md)
- [createSemanticSegmenter](functions/createSemanticSegmenter.md)
- [createStyleTransfer](functions/createStyleTransfer.md)

## CV / Types

- [BlazeFaceLandmark](type-aliases/BlazeFaceLandmark.md)
- [Classification](type-aliases/Classification.md)
- [Classifier](type-aliases/Classifier.md)
- [ClassifierModel](type-aliases/ClassifierModel.md)
- [ClassifierOptions](type-aliases/ClassifierOptions.md)
- [ClassifyOptions](type-aliases/ClassifyOptions.md)
- [CocoClass](type-aliases/CocoClass.md)
- [CocoClassYolo](type-aliases/CocoClassYolo.md)
- [CocoLandmark](type-aliases/CocoLandmark.md)
- [ColorMap](type-aliases/ColorMap.md)
- [DetectKeypointsOptions](type-aliases/DetectKeypointsOptions.md)
- [DetectObjectsOptions](type-aliases/DetectObjectsOptions.md)
- [ImageEmbedder](type-aliases/ImageEmbedder.md)
- [ImageEmbedderModel](type-aliases/ImageEmbedderModel.md)
- [ImageNet1KLabel](type-aliases/ImageNet1KLabel.md)
- [InstanceSegmentationResult](type-aliases/InstanceSegmentationResult.md)
- [InstanceSegmenter](type-aliases/InstanceSegmenter.md)
- [InstanceSegmenterModel](type-aliases/InstanceSegmenterModel.md)
- [InstanceSegmenterOptions](type-aliases/InstanceSegmenterOptions.md)
- [KeypointDetection](type-aliases/KeypointDetection.md)
- [KeypointDetector](type-aliases/KeypointDetector.md)
- [KeypointDetectorModel](type-aliases/KeypointDetectorModel.md)
- [KeypointDetectorOptions](type-aliases/KeypointDetectorOptions.md)
- [Landmarks](type-aliases/Landmarks.md)
- [ObjectDetection](type-aliases/ObjectDetection.md)
- [ObjectDetector](type-aliases/ObjectDetector.md)
- [ObjectDetectorModel](type-aliases/ObjectDetectorModel.md)
- [ObjectDetectorOptions](type-aliases/ObjectDetectorOptions.md)
- [OcrDetection](type-aliases/OcrDetection.md)
- [PaddleOcr](type-aliases/PaddleOcr.md)
- [PaddleOcrModel](type-aliases/PaddleOcrModel.md)
- [PaddleOcrModelOptions](type-aliases/PaddleOcrModelOptions.md)
- [PascalVocLabel](type-aliases/PascalVocLabel.md)
- [RecognizeCharactersOptions](type-aliases/RecognizeCharactersOptions.md)
- [SdxsTextToImage](type-aliases/SdxsTextToImage.md)
- [SdxsTextToImageModel](type-aliases/SdxsTextToImageModel.md)
- [SegmentInstancesOptions](type-aliases/SegmentInstancesOptions.md)
- [SemanticSegmentationResult](type-aliases/SemanticSegmentationResult.md)
- [SemanticSegmenter](type-aliases/SemanticSegmenter.md)
- [SemanticSegmenterModel](type-aliases/SemanticSegmenterModel.md)
- [SemanticSegmenterOptions](type-aliases/SemanticSegmenterOptions.md)
- [StyleTransfer](type-aliases/StyleTransfer.md)
- [StyleTransferModel](type-aliases/StyleTransferModel.md)
- [StyleTransferOptions](type-aliases/StyleTransferOptions.md)

## CV / Constants

- [BLAZEFACE_LANDMARKS](variables/BLAZEFACE_LANDMARKS.md)
- [COCO_CLASSES](variables/COCO_CLASSES.md)
- [COCO_CLASSES_YOLO](variables/COCO_CLASSES_YOLO.md)
- [COCO_LANDMARKS](variables/COCO_LANDMARKS.md)
- [IMAGENET_NORM](variables/IMAGENET_NORM.md)
- [IMAGENET1K_LABELS](variables/IMAGENET1K_LABELS.md)
- [PASCAL_VOC_LABELS](variables/PASCAL_VOC_LABELS.md)

## LLM / Tasks

- [createLLMChatSession](functions/createLLMChatSession.md)

## LLM / Types

- [LLMChatSession](type-aliases/LLMChatSession.md)
- [LLMChatSessionOptions](type-aliases/LLMChatSessionOptions.md)
- [LLMChatTurnResult](type-aliases/LLMChatTurnResult.md)
- [LLMModel](type-aliases/LLMModel.md)
- [LLMToolOpts](type-aliases/LLMToolOpts.md)

## NLP / Tasks

- [createPrivacyFilter](functions/createPrivacyFilter.md)
- [createTextEmbedder](functions/createTextEmbedder.md)
- [createTokenizer](functions/createTokenizer.md)

## NLP / Types

- [PrivacyFilter](type-aliases/PrivacyFilter.md)
- [PrivacyFilterModel](type-aliases/PrivacyFilterModel.md)
- [PrivacyFilterNemotronLabel](type-aliases/PrivacyFilterNemotronLabel.md)
- [PrivacyFilterOpenaiLabel](type-aliases/PrivacyFilterOpenaiLabel.md)
- [PrivacyFilterOptions](type-aliases/PrivacyFilterOptions.md)
- [TextEmbedder](type-aliases/TextEmbedder.md)
- [TextEmbedderModel](type-aliases/TextEmbedderModel.md)

## NLP / Constants

- [PRIVACY_FILTER_NEMOTRON_LABELS](variables/PRIVACY_FILTER_NEMOTRON_LABELS.md)
- [PRIVACY_FILTER_OPENAI_LABELS](variables/PRIVACY_FILTER_OPENAI_LABELS.md)

## Speech / Tasks

- [createFsmnVoiceActivityDetector](functions/createFsmnVoiceActivityDetector.md)
- [createKokoroTextToSpeech](functions/createKokoroTextToSpeech.md)
- [createSupertonicTextToSpeech](functions/createSupertonicTextToSpeech.md)
- [createWhisperSpeechToText](functions/createWhisperSpeechToText.md)

## Speech / Types

- [FsmnVadModel](type-aliases/FsmnVadModel.md)
- [FsmnVoiceActivityDetector](type-aliases/FsmnVoiceActivityDetector.md)
- [KokoroTextToSpeech](type-aliases/KokoroTextToSpeech.md)
- [KokoroTtsChunk](type-aliases/KokoroTtsChunk.md)
- [KokoroTtsModel](type-aliases/KokoroTtsModel.md)
- [KokoroTtsOptions](type-aliases/KokoroTtsOptions.md)
- [SupertonicDefaultVoiceName](type-aliases/SupertonicDefaultVoiceName.md)
- [SupertonicTextToSpeech](type-aliases/SupertonicTextToSpeech.md)
- [SupertonicTtsChunk](type-aliases/SupertonicTtsChunk.md)
- [SupertonicTtsModel](type-aliases/SupertonicTtsModel.md)
- [SupertonicTtsOptions](type-aliases/SupertonicTtsOptions.md)
- [VadEvent](type-aliases/VadEvent.md)
- [VadOptions](type-aliases/VadOptions.md)
- [VadSegment](type-aliases/VadSegment.md)
- [VadStreamOptions](type-aliases/VadStreamOptions.md)
- [WhisperLanguage](type-aliases/WhisperLanguage.md)
- [WhisperSpeechToText](type-aliases/WhisperSpeechToText.md)
- [WhisperStreamOptions](type-aliases/WhisperStreamOptions.md)
- [WhisperSttModel](type-aliases/WhisperSttModel.md)
- [WhisperSttOptions](type-aliases/WhisperSttOptions.md)

## Speech / Constants

- [FSMN_VAD_SAMPLE_RATE_HZ](variables/FSMN_VAD_SAMPLE_RATE_HZ.md)
- [KOKORO_SAMPLE_RATE](variables/KOKORO_SAMPLE_RATE.md)
- [SUPERTONIC_DEFAULT_VOICE_NAMES](variables/SUPERTONIC_DEFAULT_VOICE_NAMES.md)
- [SUPERTONIC_SAMPLE_RATE](variables/SUPERTONIC_SAMPLE_RATE.md)
- [WHISPER_LANGUAGES](variables/WHISPER_LANGUAGES.md)
- [WHISPER_SAMPLE_RATE_HZ](variables/WHISPER_SAMPLE_RATE_HZ.md)

## Utils / Functions

- [download](functions/download.md)
- [getRegisteredBackends](functions/getRegisteredBackends.md)
- [inspectModel](functions/inspectModel.md)
- [setTelemetryEnabled](functions/setTelemetryEnabled.md)

## Utils / Types

- [DownloadOptions](interfaces/DownloadOptions.md)
- [ModelInspection](type-aliases/ModelInspection.md)
- [ResourceOptions](type-aliases/ResourceOptions.md)
