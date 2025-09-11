import { Buffer } from 'buffer';
import { PNG } from 'pngjs/browser';

export function arrayToRgba(data: Float32Array, imageSize: number): Uint8Array {
  if (!data.length) {
    return new Uint8Array(0);
  }
  const imagePixelCount = imageSize * imageSize;
  const imageData = new Uint8Array(imagePixelCount * 4);
  for (let i = 0; i < imagePixelCount; i++) {
    imageData[i * 4 + 0] = data[i * 3 + 0];
    imageData[i * 4 + 1] = data[i * 3 + 1];
    imageData[i * 4 + 2] = data[i * 3 + 2];
    imageData[i * 4 + 3] = 255;
  }
  return imageData;
}

export function rgbaToBase64(imageData: Uint8Array, imageSize: number): string {
  if (!imageData.length) {
    return '';
  }
  const png = new PNG({ width: imageSize, height: imageSize });
  png.data = Buffer.from(imageData);
  const pngBuffer = PNG.sync.write(png, { colorType: 6 });
  const pngString = pngBuffer.toString('base64');
  return pngString;
}
