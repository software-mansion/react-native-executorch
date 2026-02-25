import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY,
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
  const model = useStyleTransfer({ model: STYLE_TRANSFER_CANDY });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  const [imageUri, setImageUri] = useState('');
  const [styledImage, setStyledImage] = useState<SkImage | null>(null);

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
        // Convert RGB -> RGBA for Skia
        const rgba = new Uint8Array(width * height * 4);
        const rgb = output.dataPtr;
        for (let i = 0; i < width * height; i++) {
          rgba[i * 4] = rgb[i * 3];
          rgba[i * 4 + 1] = rgb[i * 3 + 1];
          rgba[i * 4 + 2] = rgb[i * 3 + 2];
          rgba[i * 4 + 3] = 255;
        }
        const skData = Skia.Data.fromBytes(rgba);
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
          <Canvas style={styles.canvas}>
            <SkiaImage
              image={styledImage}
              fit="contain"
              x={0}
              y={0}
              width={styledImage.width()}
              height={styledImage.height()}
            />
          </Canvas>
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
