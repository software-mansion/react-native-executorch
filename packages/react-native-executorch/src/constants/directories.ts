import { importLegacyExpoFSModules } from '../utils/ResourceFetcher';

const { documentDirectory } = importLegacyExpoFSModules();

export const RNEDirectory = `${documentDirectory}react-native-executorch/`;
