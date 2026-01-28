import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';

/**
 * Module for generating text embeddings from input text.
 * 
 * @category Typescript API
 */
export class TextEmbeddingsModule extends BaseModule {

  /**
   * Loads the model and tokenizer specified by the config object.
   * 
   * @param model - Object containing model and tokenizer sources.
   * @param model.modelSource - `ResourceSource` that specifies the location of the text embeddings model binary.
   * @param model.tokenizerSource - `ResourceSource` that specifies the location of the tokenizer JSON file.
   * @param onDownloadProgressCallback - Optional callback to track download progress (value between 0 and 1).
   */
  async load(
    model: { modelSource: ResourceSource; tokenizerSource: ResourceSource },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const modelPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.modelSource
    );
    const tokenizerPromise = ResourceFetcher.fetch(
      undefined,
      model.tokenizerSource
    );
    const [modelResult, tokenizerResult] = await Promise.all([
      modelPromise,
      tokenizerPromise,
    ]);
    const modelPath = modelResult?.[0];
    const tokenizerPath = tokenizerResult?.[0];
    if (!modelPath || !tokenizerPath) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = global.loadTextEmbeddings(modelPath, tokenizerPath);
  }

  /**
   * Executes the model's forward pass, where `input` is a text that will be embedded.
   * 
   * @param input - The text string to embed.
   * @returns A Float32Array containing the vector embeddings.
   */
  async forward(input: string): Promise<Float32Array> {
    return new Float32Array(await this.nativeModule.generate(input));
  }
}
