import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import { TokenizerProps, TokenizerType } from '../../types/tokenizer';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing a Tokenizer instance.
 * @category Hooks
 * @param props - Configuration object containing `tokenizer` source and optional `preventLoad` flag.
 * @returns Ready to use Tokenizer model.
 */
export const useTokenizer = ({
  tokenizer,
  preventLoad = false,
}: TokenizerProps): TokenizerType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        TokenizerModule.fromModelName(config, onProgress),
      config: { tokenizerSource: tokenizer.tokenizerSource },
      deps: [tokenizer.tokenizerSource],
      preventLoad,
    });

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    decode: (tokens, skipSpecialTokens) =>
      runForward((inst) => inst.decode(tokens, skipSpecialTokens)),
    encode: (input) => runForward((inst) => inst.encode(input)),
    getVocabSize: () => runForward((inst) => inst.getVocabSize()),
    idToToken: (tokenId) => runForward((inst) => inst.idToToken(tokenId)),
    tokenToId: (token) => runForward((inst) => inst.tokenToId(token)),
  };
};
