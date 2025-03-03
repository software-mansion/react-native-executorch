// import { LLM } from '../../native/RnExecutorchModules';
// import { fetchResource } from '../../utils/fetchResource';
// import {
//   DEFAULT_CONTEXT_WINDOW_LENGTH,
//   DEFAULT_MESSAGE_HISTORY,
//   DEFAULT_SYSTEM_PROMPT,
// } from '../../constants/llamaDefaults';
// import { ResourceSource } from '../../types/common';

// export class SpeechToText {
//   static onDownloadProgressCallback = (_downloadProgress: number) => {};

//   static async load(
//     modelSource: ResourceSource,
//     tokenizerSource: ResourceSource,
//     systemPrompt = DEFAULT_SYSTEM_PROMPT,
//     messageHistory = DEFAULT_MESSAGE_HISTORY,
//     contextWindowLength = DEFAULT_CONTEXT_WINDOW_LENGTH
//   ) {
//     try {
//       const tokenizerFileUri = await fetchResource(tokenizerSource);
//       const modelFileUri = await fetchResource(
//         modelSource,
//         this.onDownloadProgressCallback
//       );

//       await LLM.loadLLM(
//         modelFileUri,
//         tokenizerFileUri,
//         systemPrompt,
//         messageHistory,
//         contextWindowLength
//       );
//     } catch (err) {
//       throw new Error((err as Error).message);
//     }
//   }

//   static async transcribe(waveform: number[]) {
//     try {
//     //   await LLM.runInference(input);
//     } catch (err) {
//       throw new Error((err as Error).message);
//     }
//   }

//   static onDownloadProgress(callback: (downloadProgress: number) => void) {
//     this.onDownloadProgressCallback = callback;
//   }
// }
