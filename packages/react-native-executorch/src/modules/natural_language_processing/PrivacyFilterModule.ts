import { ResourceSource } from '../../types/common';
import {
  PiiEntity,
  PrivacyFilterModelSources,
  ViterbiBiases,
} from '../../types/privacyFilter';
import { PRIVACY_FILTER_LABELS } from '../../constants/privacyFilterLabels';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Pack the optional ViterbiBiases struct into a 6-element array in the
 * fixed order the native side expects. Missing fields default to 0.
 * @param biases - Caller-supplied biases (any subset of the 6 fields).
 * @returns A 6-element number[] in the canonical bias order.
 */
function packViterbiBiases(biases?: ViterbiBiases): number[] {
  return [
    biases?.backgroundStay ?? 0,
    biases?.backgroundToStart ?? 0,
    biases?.endToBackground ?? 0,
    biases?.endToStart ?? 0,
    biases?.insideToContinue ?? 0,
    biases?.insideToEnd ?? 0,
  ];
}

/**
 * Module for running token-level PII detection over text. Supports any
 * privacy-filter-style model with a `forward(input_ids, attention_mask)`
 * graph and a BIOES label space (the runner reads `labelNames` to map
 * predicted indices back to entity types).
 * @category Typescript API
 */
export class PrivacyFilterModule extends BaseModule {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a Privacy Filter instance for a built-in preset. Pass one of
   * the `PRIVACY_FILTER_*` constants from `react-native-executorch/constants`
   * (or the matching `models.privacy_filter.*` accessor); the runner
   * resolves the BIOES label list from `modelName`. For custom fine-tunes
   * with a non-standard label space, use {@link fromCustomModel} instead.
   * @param namedSources - Built-in model + tokenizer resource locations.
   * @param onDownloadProgress - Optional 0..1 download progress callback.
   * @returns A Promise resolving to a `PrivacyFilterModule` instance.
   */
  static fromModelName(
    namedSources: PrivacyFilterModelSources,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<PrivacyFilterModule> {
    return PrivacyFilterModule.load(
      namedSources.modelSource,
      namedSources.tokenizerSource,
      PRIVACY_FILTER_LABELS[namedSources.modelName],
      undefined,
      onDownloadProgress
    );
  }

  /**
   * Creates a Privacy Filter instance with a user-provided model binary and tokenizer.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * @remarks The `labelNames` array must match the model's head dimension and id2label mapping exactly.
   * @param modelSource - A fetchable resource pointing to the .pte file.
   * @param tokenizerSource - A fetchable resource pointing to the tokenizer.json.
   * @param labelNames - BIOES label list; index 0 must be "O".
   * @param options - Optional Viterbi biases and download progress callback.
   * @returns A Promise resolving to a `PrivacyFilterModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    labelNames: readonly string[],
    options: {
      viterbiBiases?: ViterbiBiases;
      onDownloadProgress?: (progress: number) => void;
    } = {}
  ): Promise<PrivacyFilterModule> {
    return PrivacyFilterModule.load(
      modelSource,
      tokenizerSource,
      labelNames,
      options.viterbiBiases,
      options.onDownloadProgress ?? (() => {})
    );
  }

  private static async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    labelNames: readonly string[],
    viterbiBiases: ViterbiBiases | undefined,
    onDownloadProgress: (progress: number) => void
  ): Promise<PrivacyFilterModule> {
    try {
      const [modelResult, tokenizerResult] = await Promise.all([
        ResourceFetcher.fetch(onDownloadProgress, modelSource),
        ResourceFetcher.fetch(undefined, tokenizerSource),
      ]);
      const modelPath = modelResult?.[0];
      const tokenizerPath = tokenizerResult?.[0];
      if (!modelPath || !tokenizerPath) {
        throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
      }
      const labels = Array.from(labelNames);
      const biases = packViterbiBiases(viterbiBiases);
      return new PrivacyFilterModule(
        await global.loadPrivacyFilter(modelPath, tokenizerPath, labels, biases)
      );
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Executes the model's forward pass to detect PII entity spans within the provided text.
   * @param text - The input text to scan for PII.
   * @returns A Promise resolving to an array of detected {@link PiiEntity} spans.
   */
  async generate(text: string): Promise<PiiEntity[]> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling generate().'
      );
    }
    return (await this.nativeModule.generate(text)) as PiiEntity[];
  }
}
