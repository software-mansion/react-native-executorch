import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import {
  useImageSegmentation,
  DEEPLAB_V3_RESNET50,
  DeeplabLabel,
} from 'react-native-executorch';
import {
  Canvas,
  Image as SkiaImage,
  Skia,
  AlphaType,
  ColorType,
} from '@shopify/react-native-skia';
import { View, StyleSheet, Image } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';

const width = 224;
const height = 224;

let pixels = new Uint8Array(width * height * 4);
pixels.fill(255);

let data = Skia.Data.fromBytes(pixels);
let img = Skia.Image.MakeImage(
  {
    width: width,
    height: height,
    alphaType: AlphaType.Opaque,
    colorType: ColorType.RGBA_8888,
  },
  data,
  width * 4
);

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
  const model = useImageSegmentation({ model: DEEPLAB_V3_RESNET50 });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);
  const [imageUri, setImageUri] = useState('');

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const uri = image?.uri;
    setImageUri(uri as string);
  };

  const [resultPresent, setResultPresent] = useState(false);

  const runForward = async () => {
    if (imageUri) {
      try {
        const output = await model.forward(imageUri);
        pixels = new Uint8Array(width * height * 4);

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            for (let i = 0; i < 3; i++) {
              pixels[(x * height + y) * 4 + i] =
                numberToColor[
                  (output[DeeplabLabel.ARGMAX] || [])[x * height + y]
                ][i];
            }
            pixels[(x * height + y) * 4 + 3] = 255;
          }
        }

        data = Skia.Data.fromBytes(pixels);
        img = Skia.Image.MakeImage(
          {
            width: width,
            height: height,
            alphaType: AlphaType.Opaque,
            colorType: ColorType.RGBA_8888,
          },
          data,
          width * 4
        );
        setResultPresent(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!model.isReady) {
    return (
      <Spinner
        visible={!model.isReady}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
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
        {resultPresent && (
          <View style={styles.canvasContainer}>
            <Canvas style={styles.canvas}>
              <SkiaImage
                image={img}
                fit="contain"
                x={0}
                y={0}
                width={width}
                height={height}
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
    width: width,
    height: height,
  },
});
