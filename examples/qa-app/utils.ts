export const dotProduct = (a: number[], b: number[]): number =>
  a.reduce((sum, val, i) => sum + val * b[i], 0);

export const findClosestEmbedding = (
  target: number[],
  embeddings: number[][]
) => {
  if (embeddings.length === 0) {
    throw new Error('The array of embeddings is empty.');
  }

  let closestIndex = -1;
  let highestSimilarity = -Infinity;

  embeddings.forEach((embedding, index) => {
    const similarity = dotProduct(target, embedding);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      closestIndex = index;
    }
  });

  return {
    index: closestIndex,
    similarity: highestSimilarity,
    embedding: embeddings[closestIndex],
  };
};

export const slidingWindowSlice = (
  input: number[],
  windowSize: number,
  overlap: number
): number[][] => {
  // Validate inputs
  if (windowSize <= 0) {
    throw new Error('Window size must be greater than 0');
  }
  if (overlap >= windowSize) {
    throw new Error('Overlap must be less than N');
  }

  const stepSize = windowSize - overlap; // Calculate how much to slide after each window
  let slices: number[][] = [];
  let index = 0;

  // Iterate over the string and slice it according to the window size and step size
  while (index + windowSize <= input.length) {
    slices.push(input.slice(index, index + windowSize));
    index += stepSize;
  }

  // Handle the last piece if necessary
  if (index < input.length) {
    slices.push(input.slice(input.length - windowSize));
  }

  return slices;
};
