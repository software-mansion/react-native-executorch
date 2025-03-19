export function bytesToUnicode() {
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

  const byteToUnicodeMap: Record<string, number> = {};

  unicodeValues.forEach((unicodeValue, index) => {
    const character = String.fromCharCode(unicodeValue);
    byteToUnicodeMap[character] = definedBytes[index] as number;
  });

  return byteToUnicodeMap;
}
