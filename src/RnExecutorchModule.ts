import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-executorch' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const RnExecutorch = NativeModules.RnExecutorch
  ? NativeModules.RnExecutorch
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const eventEmitter = new NativeEventEmitter(RnExecutorch);

export const subscribeToTokenGenerated = (
  callback: (data?: string) => void
) => {
  const subscription = eventEmitter.addListener('onToken', callback);
  return () => subscription.remove();
};

export const subscribeToDownloadProgress = (
  callback: (data?: number) => void
) => {
  const subscription = eventEmitter.addListener('onDownloadProgress', callback);
  return () => subscription.remove();
};

export default RnExecutorch;
