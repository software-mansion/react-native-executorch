import { PrivacyFilterModule } from '../../modules/natural_language_processing/PrivacyFilterModule';
import { useModuleFactory } from '../useModuleFactory';
import {
  PiiEntity,
  PrivacyFilterProps,
  PrivacyFilterType,
} from '../../types/privacyFilter';

/**
 * React hook for managing a Privacy Filter model instance.
 * @category Hooks
 * @param PrivacyFilterProps - Configuration object containing the model sources and an optional `preventLoad` flag.
 * @returns Ready to use Privacy Filter model.
 */
export const usePrivacyFilter = ({
  model,
  preventLoad = false,
}: PrivacyFilterProps): PrivacyFilterType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        PrivacyFilterModule.fromModelName(config, onProgress),
      config: model,
      deps: [model.modelName, model.modelSource, model.tokenizerSource],
      preventLoad,
    });

  const generate = (text: string): Promise<PiiEntity[]> =>
    runForward((inst) => inst.generate(text));

  return { error, isReady, isGenerating, downloadProgress, generate };
};
