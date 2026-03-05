import { VADModule } from '../../modules/natural_language_processing/VADModule';
import { VADType, VADProps } from '../../types/vad';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing a VAD model instance.
 *
 * @category Hooks
 * @param VADProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use VAD model.
 */
export const useVAD = ({ model, preventLoad = false }: VADProps): VADType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        VADModule.fromModelName(config, onProgress),
      config: model,
      deps: [model.modelSource],
      preventLoad,
    });

  const forward = (waveform: Float32Array) =>
    runForward((inst) => inst.forward(waveform));

  return { error, isReady, isGenerating, downloadProgress, forward };
};
