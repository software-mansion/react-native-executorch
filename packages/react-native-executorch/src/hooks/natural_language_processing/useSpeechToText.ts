// import { useEffect, useCallback, useState } from 'react';
// import { SpeechToTextModule, Word } from '../../modules/natural_language_processing/SpeechToTextModule';
// import { DecodingOptions, SpeechToTextModelConfig } from '../../types/stt';
// import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
// import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

// export const useSpeechToText = ({
//   model,
//   preventLoad = false,
// }: {
//   model: SpeechToTextModelConfig;
//   preventLoad?: boolean;
// }) => {
//   const [error, setError] = useState<null | RnExecutorchError>(null);
//   const [isReady, setIsReady] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [downloadProgress, setDownloadProgress] = useState(0);

//   const [modelInstance] = useState(() => new SpeechToTextModule());
//   const [committedTranscription, setCommittedTranscription] = useState(Word);
//   const [nonCommittedTranscription, setNonCommittedTranscription] =
//     useState(Word);

//   useEffect(() => {
//     if (preventLoad) return;
//     (async () => {
//       setDownloadProgress(0);
//       setError(null);
//       try {
//         setIsReady(false);
//         await modelInstance.load(
//           {
//             isMultilingual: model.isMultilingual,
//             encoderSource: model.encoderSource,
//             decoderSource: model.decoderSource,
//             tokenizerSource: model.tokenizerSource,
//           },
//           setDownloadProgress
//         );
//         setIsReady(true);
//       } catch (err) {
//         setError(parseUnknownError(err));
//       }
//     })();
//   }, [
//     modelInstance,
//     model.isMultilingual,
//     model.encoderSource,
//     model.decoderSource,
//     model.tokenizerSource,
//     preventLoad,
//   ]);

//   const stateWrapper = useCallback(
//     <T extends (...args: any[]) => Promise<any>>(fn: T) =>
//       async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
//         if (!isReady)
//           throw new RnExecutorchError(
//             RnExecutorchErrorCode.ModuleNotLoaded,
//             'The model is currently not loaded. Please load the model before calling this function.'
//           );
//         if (isGenerating)
//           throw new RnExecutorchError(
//             RnExecutorchErrorCode.ModelGenerating,
//             'The model is currently generating. Please wait until previous model run is complete.'
//           );
//         setIsGenerating(true);
//         try {
//           return await fn.apply(modelInstance, args);
//         } finally {
//           setIsGenerating(false);
//         }
//       },
//     [isReady, isGenerating, modelInstance]
//   );

//   const stream = useCallback(
//     async (options?: DecodingOptions) => {
//       if (!isReady)
//         throw new RnExecutorchError(
//           RnExecutorchErrorCode.ModuleNotLoaded,
//           'The model is currently not loaded. Please load the model before calling this function.'
//         );
//       if (isGenerating)
//         throw new RnExecutorchError(
//           RnExecutorchErrorCode.ModelGenerating,
//           'The model is currently generating. Please wait until previous model run is complete.'
//         );
//       setIsGenerating(true);
//       setCommittedTranscription('');
//       setNonCommittedTranscription('');
//       let transcription = '';
//       try {
//         for await (const { committed, nonCommitted } of modelInstance.stream(
//           options
//         )) {
//           setCommittedTranscription((prev) => prev + committed);
//           setNonCommittedTranscription(nonCommitted);
//           transcription += committed;
//         }
//       } finally {
//         setIsGenerating(false);
//       }
//       return transcription;
//     },
//     [isReady, isGenerating, modelInstance]
//   );

//   const wrapper = useCallback(
//     <T extends (...args: any[]) => any>(fn: T) => {
//       return (...args: Parameters<T>): ReturnType<T> => {
//         if (!isReady)
//           throw new RnExecutorchError(
//             RnExecutorchErrorCode.ModuleNotLoaded,
//             'The model is currently not loaded. Please load the model before calling this function.'
//           );
//         return fn.apply(modelInstance, args);
//       };
//     },
//     [isReady, modelInstance]
//   );

//   return {
//     error,
//     isReady,
//     isGenerating,
//     downloadProgress,
//     committedTranscription,
//     nonCommittedTranscription,
//     encode: stateWrapper(SpeechToTextModule.prototype.encode),
//     decode: stateWrapper(SpeechToTextModule.prototype.decode),
//     transcribe: stateWrapper(SpeechToTextModule.prototype.transcribe),
//     stream,
//     streamStop: wrapper(SpeechToTextModule.prototype.streamStop),
//     streamInsert: wrapper(SpeechToTextModule.prototype.streamInsert),
//   };
// };

import { useEffect, useCallback, useState } from 'react';
import { SpeechToTextModule } from '../../modules/natural_language_processing/SpeechToTextModule';
import {
  DecodingOptions,
  SpeechToTextType,
  SpeechToTextProps,
} from '../../types/stt';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing a Speech to Text (STT) instance.
 *
 * @category Hooks
 * @param speechToTextProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Speech to Text model.
 */
export const useSpeechToText = ({
  model,
  preventLoad = false,
}: SpeechToTextProps): SpeechToTextType => {
  const [error, setError] = useState<null | RnExecutorchError>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [modelInstance] = useState(() => new SpeechToTextModule());

  // FIX 1: Initialize with empty array [], generic type Word[]
  const [committedTranscription, setCommittedTranscription] = useState<Word[]>(
    []
  );
  const [nonCommittedTranscription, setNonCommittedTranscription] = useState<
    Word[]
  >([]);

  useEffect(() => {
    if (preventLoad) return;
    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await modelInstance.load(
          {
            isMultilingual: model.isMultilingual,
            encoderSource: model.encoderSource,
            decoderSource: model.decoderSource,
            tokenizerSource: model.tokenizerSource,
          },
          setDownloadProgress
        );
        setIsReady(true);
      } catch (err) {
        setError(parseUnknownError(err));
      }
    })();
  }, [
    modelInstance,
    model.isMultilingual,
    model.encoderSource,
    model.decoderSource,
    model.tokenizerSource,
    preventLoad,
  ]);

  const stateWrapper = useCallback(
    <T extends (...args: any[]) => Promise<any>>(fn: T) =>
      async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        if (!isReady)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModuleNotLoaded,
            'The model is currently not loaded. Please load the model before calling this function.'
          );
        if (isGenerating)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModelGenerating,
            'The model is currently generating. Please wait until previous model run is complete.'
          );
        setIsGenerating(true);
        try {
          return await fn.apply(modelInstance, args);
        } finally {
          setIsGenerating(false);
        }
      },
    [isReady, isGenerating, modelInstance]
  );

  const stream = useCallback(
    async (options?: DecodingOptions) => {
      if (!isReady)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
      setIsGenerating(true);

      // FIX 2: Reset to empty arrays
      setCommittedTranscription([]);
      setNonCommittedTranscription([]);

      // Accumulator is now an array of Words, not a string
      const fullResult: Word[] = [];

      try {
        for await (const { committed, nonCommitted } of modelInstance.stream(
          options
        )) {
          // FIX 3: Update state by appending arrays
          if (committed.length > 0) {
            setCommittedTranscription((prev) => [...prev, ...committed]);
            fullResult.push(...committed);
          }

          // nonCommitted is always a fresh partial chunk
          setNonCommittedTranscription(nonCommitted);
        }
      } finally {
        setIsGenerating(false);
      }
      return fullResult;
    },
    [isReady, isGenerating, modelInstance]
  );

  const wrapper = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        if (!isReady)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModuleNotLoaded,
            'The model is currently not loaded. Please load the model before calling this function.'
          );
        return fn.apply(modelInstance, args);
      };
    },
    [isReady, modelInstance]
  );

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    committedTranscription,
    nonCommittedTranscription,
    encode: stateWrapper(SpeechToTextModule.prototype.encode),
    decode: stateWrapper(SpeechToTextModule.prototype.decode),
    transcribe: stateWrapper(SpeechToTextModule.prototype.transcribe),
    stream,
    streamStop: wrapper(SpeechToTextModule.prototype.streamStop),
    streamInsert: wrapper(SpeechToTextModule.prototype.streamInsert),
  };
};
