import { Tokenizer } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';

export const load = async (modelSource: string) => {
  const fileUri = await fetchResource(modelSource);

  return await Tokenizer.loadModule(fileUri);
};

export const decode = async (input: number[]) => {
  return await Tokenizer.decode(input);
};

export const encode = async (input: string) => {
  return await Tokenizer.encode(input);
};
