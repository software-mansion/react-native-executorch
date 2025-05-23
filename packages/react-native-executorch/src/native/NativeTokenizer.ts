import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(tokenizerSource: string): Promise<number>;
  decode(input: number[], skipSpecialTokens: boolean): Promise<string>;
  encode(input: string): Promise<number[]>;
  getVocabSize(): Promise<number>;
  idToToken(tokenId: number): Promise<string>;
  tokenToId(token: string): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>('Tokenizer');
