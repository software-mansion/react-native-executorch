import { TokenizerNativeModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { BaseModule } from '../BaseModule';

export class TokenizerModule extends BaseModule {
  protected static override nativeModule = TokenizerNativeModule;

  static override async load(tokenizerSource: ResourceSource) {
    await super.load(tokenizerSource);
  }

  static async decode(
    input: number[],
    skipSpecialTokens = false
  ): Promise<string> {
    return await this.nativeModule.decode(input, skipSpecialTokens);
  }

  static async encode(input: string): Promise<number[]> {
    return await this.nativeModule.encode(input);
  }

  static async getVocabSize(): Promise<number> {
    return await this.nativeModule.getVocabSize();
  }

  static async idToToken(tokenId: number): Promise<string> {
    return await this.nativeModule.idToToken(tokenId);
  }

  static async tokenToId(token: string): Promise<number> {
    return await this.nativeModule.tokenToId(token);
  }
}
