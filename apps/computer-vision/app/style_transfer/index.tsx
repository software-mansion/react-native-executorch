import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY_QUANTIZED,
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

export default function StyleTransferScreen() {
  const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY_QUANTIZED });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  const [imageUri, setImageUri] = useState('');
  const [styledImage, setStyledImage] = useState<SkImage | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const uri = image?.uri;
    if (typeof uri === 'string') {
      setImageUri(uri);
      setStyledImage(null);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        const output = await model.forward(imageUri);
        const height = output.sizes[0];
        const width = output.sizes[1];
        const skData = Skia.Data.fromBytes(output.dataPtr);
        const img = Skia.Image.MakeImage(
          {
            width,
            height,
            alphaType: AlphaType.Opaque,
            colorType: ColorType.RGBA_8888,
          },
          skData,
          width * 4
        );
        setStyledImage(img);
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
      <View style={styles.imageContainer}>
        {styledImage ? (
          <View
            style={styles.canvas}
            onLayout={(e) =>
              setCanvasSize({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }
          >
            <Canvas style={StyleSheet.absoluteFill}>
              <SkiaImage
                image={styledImage}
                fit="contain"
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
              />
            </Canvas>
          </View>
        ) : (
          <Image
            style={styles.image}
            resizeMode="contain"
            source={
              imageUri
                ? { uri: imageUri }
                : require('../../assets/icons/executorch_logo.png')
            }
          />
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
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
  canvas: {
    flex: 1,
    width: '100%',
  },
});
