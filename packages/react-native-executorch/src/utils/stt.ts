export const longCommonInfPref = (
  seq1: number[],
  seq2: number[],
  hammingDistThreshold: number
) => {
  let maxInd = 0;
  let maxLength = 0;

  for (let i = 0; i < seq1.length; i++) {
    let j = 0;
    let hammingDist = 0;
    while (
      j < seq2.length &&
      i + j < seq1.length &&
      (seq1[i + j] === seq2[j] || hammingDist < hammingDistThreshold)
    ) {
      if (seq1[i + j] !== seq2[j]) {
        hammingDist++;
      }
      j++;
    }
    if (j >= maxLength) {
      maxLength = j;
      maxInd = i;
    }
  }
  return maxInd;
};
