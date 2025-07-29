export const dotProduct = (a: Float32Array, b: Float32Array) => {
  if (a.length !== b.length) {
    throw new Error('Vectors must be of the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};
