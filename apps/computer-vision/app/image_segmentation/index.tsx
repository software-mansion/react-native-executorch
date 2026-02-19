import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import {
  DEEPLAB_V3_RESNET50,
  useImageSegmentation,
} from 'react-native-executorch';
import {
  Canvas,
  Image as SkiaImage,
  Skia,
  AlphaType,
  ColorType,
  SkImage,
} from '@shopify/react-native-skia';
import { View, StyleSheet, Image } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';

const numberToColor: number[][] = [
  [255, 87, 51], // 0 Red
  [51, 255, 87], // 1 Green
  [51, 87, 255], // 2 Blue
  [255, 51, 246], // 3 Magenta
  [51, 255, 246], // 4 Cyan
  [243, 255, 51], // 5 Yellow
  [141, 51, 255], // 6 Purple
  [255, 131, 51], // 7 Orange
  [51, 255, 131], // 8 Spring Green
  [131, 51, 255], // 9 Violet
  [255, 255, 51], // 10 Bright Yellow
  [51, 255, 255], // 11 Aqua
  [255, 51, 143], // 12 Deep Pink
  [127, 51, 255], // 13 Dark Orchid
  [51, 255, 175], // 14 Medium Spring Green
  [255, 175, 51], // 15 Sandy Brown
  [179, 255, 51], // 16 Chartreuse
  [255, 87, 51], // 17 Red (darker shade)
  [255, 51, 162], // 18 Hot Pink
  [51, 162, 255], // 19 Sky Blue
  [162, 51, 255], // 20 Amethyst
];

export default function ImageSegmentationScreen() {
  const { setGlobalGenerating } = useContext(GeneratingContext);
  const { isReady, isGenerating, downloadProgress, forward } =
    useImageSegmentation({
      model: DEEPLAB_V3_RESNET50,
    });
  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [segImage, setSegImage] = useState<SkImage | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    if (!image?.uri) return;
    setImageUri(image.uri);
    setImageSize({
      width: image.width ?? 0,
      height: image.height ?? 0,
    });
    setSegImage(null);
  };

  const runForward = async () => {
    if (!imageUri || imageSize.width === 0 || imageSize.height === 0) return;
    try {
      const { width, height } = imageSize;
      const output = await forward(imageUri, [], true);
      const argmax = output.ARGMAX || [];
      const pixels = new Uint8Array(width * height * 4);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const idx = row * width + col;
          const color = numberToColor[argmax[idx]] || [0, 0, 0];
          pixels[idx * 4] = color[0];
          pixels[idx * 4 + 1] = color[1];
          pixels[idx * 4 + 2] = color[2];
          pixels[idx * 4 + 3] = 255;
        }
      }

      const data = Skia.Data.fromBytes(pixels);
      const img = Skia.Image.MakeImage(
        {
          width,
          height,
          alphaType: AlphaType.Opaque,
          colorType: ColorType.RGBA_8888,
        },
        data,
        width * 4
      );
      setSegImage(img);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isReady) {
    return (
      <Spinner
        visible={!isReady}
        textContent={`Loading the model ${(downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.imageCanvasContainer}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={
              imageUri
                ? { uri: imageUri }
                : require('../../assets/icons/executorch_logo.png')
            }
          />
        </View>
        {segImage && (
          <View
            style={styles.canvasContainer}
            onLayout={(e) =>
              setCanvasSize({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }
          >
            <Canvas style={styles.canvas}>
              <SkiaImage
                image={segImage}
                fit="contain"
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
              />
            </Canvas>
          </View>
        )}
      </View>
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  imageCanvasContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
});
