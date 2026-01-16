import {
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';

export const dotProduct = (a: Float32Array, b: Float32Array) => {
  if (a.length !== b.length) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.WrongDimensions,
      `dotProduct needs both vector to have the same length: got a: ${a.length}, b: ${b.length}`
    );
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};
