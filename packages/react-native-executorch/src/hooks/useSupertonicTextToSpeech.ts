import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createSupertonicTextToSpeech,
  type SupertonicTtsModel,
} from '../extensions/speech/tasks/supertonicTextToSpeech';

/**
 * React hook to load and manage the Supertonic 3 Text-to-Speech pipeline.
 *
 * It manages downloading (if the sources are remote URLs) and loading the 4 sub-model
 * `.pte` files, `unicode_indexer.json`, and all voice style `.json` files, tracking download
 * progress and errors, and cleaning up native memory when unmounting.
 * @category Hooks
 * @typeParam K Voice style keys record constraint.
 * @param config The Supertonic TTS model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the model.
 * @returns An object containing the model's loading state, error, download progress,
 * and synthesis functions.
 */
export function useSupertonicTextToSpeech<K extends PropertyKey>(
  config: SupertonicTtsModel<K>,
  options?: { preventLoad?: boolean }
) {
  const dpRes = useResourceDownload(config.modelPaths.durationPredictor, options?.preventLoad);
  const teRes = useResourceDownload(config.modelPaths.textEncoder, options?.preventLoad);
  const veRes = useResourceDownload(config.modelPaths.vectorEstimator, options?.preventLoad);
  const vocRes = useResourceDownload(config.modelPaths.vocoder, options?.preventLoad);
  const indexerRes = useResourceDownload(config.unicodeIndexerPath, options?.preventLoad);

  const voiceKeys = Object.keys(config.voiceStyles) as K[];
  const voiceResList = voiceKeys.map((key) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useResourceDownload(config.voiceStyles[key], options?.preventLoad)
  );

  const isVoiceReady = voiceResList.every((r) => r.localPath);
  const isReady = !!(
    dpRes.localPath &&
    teRes.localPath &&
    veRes.localPath &&
    vocRes.localPath &&
    indexerRes.localPath &&
    isVoiceReady
  );

  const localVoiceStyles = isReady
    ? (Object.fromEntries(voiceKeys.map((key, i) => [key, voiceResList[i]!.localPath!])) as Record<
        K,
        string
      >)
    : null;

  const localConfig = isReady
    ? {
        modelPaths: {
          durationPredictor: dpRes.localPath!,
          textEncoder: teRes.localPath!,
          vectorEstimator: veRes.localPath!,
          vocoder: vocRes.localPath!,
        },
        unicodeIndexerPath: indexerRes.localPath!,
        voiceStyles: localVoiceStyles!,
      }
    : null;

  const configKey = localConfig
    ? JSON.stringify(localConfig.modelPaths) + localConfig.unicodeIndexerPath
    : null;

  const { model, error } = useModel(createSupertonicTextToSpeech, localConfig, [
    isReady,
    configKey,
  ]);

  const downloadProgress =
    (dpRes.downloadProgress +
      teRes.downloadProgress +
      veRes.downloadProgress +
      vocRes.downloadProgress +
      indexerRes.downloadProgress +
      voiceResList.reduce((acc, r) => acc + r.downloadProgress, 0)) /
    (5 + voiceKeys.length);

  return {
    isReady: !!model,
    error:
      dpRes.downloadError ||
      teRes.downloadError ||
      veRes.downloadError ||
      vocRes.downloadError ||
      indexerRes.downloadError ||
      error,
    downloadProgress,
    synthesize: model?.synthesize,
    synthesizeStop: model?.synthesizeStop,
  };
}
