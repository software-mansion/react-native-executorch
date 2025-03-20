/**
 * Generates a mapping of Unicode characters to their corresponding UTF-8 byte values.
 * This is useful for multilingual token decoding, as some tokenizers include
 * uncommon characters that need to be properly decoded.
 *
 * The function follows a predefined set of byte ranges for common characters
 * and assigns extended Unicode values to unused bytes (0-255) to ensure full coverage.
 *
 * @returns {Record<string, number>} A mapping of Unicode characters to their UTF-8 byte values.
 */
export function unicodeToBytes() {
  const predefinedByteRanges: [number, number][] = [
    [33, 126], // '!' to '~'
    [161, 172], // '¡' to '¬'
    [174, 255], // '®' to 'ÿ'
  ];

  let definedBytes: number[] = predefinedByteRanges.flatMap(([start, end]) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  let unicodeValues = [...definedBytes];
  let additionalUnicodeOffset = 0;

  // Add missing bytes (0-255) and assign extended Unicode values
  for (let byte = 0; byte < 256; byte++) {
    if (!definedBytes.includes(byte)) {
      definedBytes.push(byte);
      unicodeValues.push(256 + additionalUnicodeOffset);
      additionalUnicodeOffset++;
    }
  }

  const unicodeToByteMap: Record<string, number> = {};

  unicodeValues.forEach((unicodeValue, index) => {
    const character = String.fromCharCode(unicodeValue);
    unicodeToByteMap[character] = definedBytes[index] as number;
  });

  return unicodeToByteMap;
}

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
