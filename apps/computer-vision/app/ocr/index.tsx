import Spinner from '../../components/Spinner';
import { getImage } from '../../utils';
import { useOCR, OCR_ENGLISH } from 'react-native-executorch';
import { View, StyleSheet, Image, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DeviceInfo from 'react-native-device-info';
import ImageWithBboxes2 from '../../components/ImageWithOCRBboxes';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import ErrorBanner from '../../components/ErrorBanner';

const isDevice = DeviceInfo.isEmulatorSync();

export default function OCRScreen() {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();

  const model = useOCR({ model: OCR_ENGLISH });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const width = image?.width;
    const height = image?.height;
    setImageDimensions({ width: width as number, height: height as number });
    const uri = image?.uri;
    if (typeof uri === 'string') {
      setImageUri(uri as string);
      setResults([]);
    }
  };

  const runForward = async () => {
    try {
      const output = await model.forward(imageUri);
      setResults(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!model.isReady && !model.error) {
    return (
      <Spinner
        visible={true}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            {imageUri && imageDimensions?.width && imageDimensions?.height ? (
              <ImageWithBboxes2
                detections={results}
                imageWidth={imageDimensions?.width}
                imageHeight={imageDimensions?.height}
                imageUri={imageUri}
                isScanning={model.isGenerating}
              />
            ) : (
              <Image
                style={styles.image}
                resizeMode="contain"
                source={require('../../assets/icons/executorch_logo.png')}
              />
            )}
          </View>
          {!imageUri && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>OCR</Text>
              <Text style={styles.infoText}>
                This model reads and extracts text from images, returning each
                detected text region with its bounding box and confidence score.
                Pick an image from your gallery or take one with your camera to
                get started.
              </Text>
            </View>
          )}
        </View>
        <View
          style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}
        >
          <View style={styles.bottomIcons}>
            <Pressable
              onPress={() => handleCameraPress(false)}
              hitSlop={12}
              accessibilityLabel="Pick image from gallery"
            >
              <FontAwesome name="photo" size={26} color="#F8FAFF" />
            </Pressable>
            <Pressable
              onPress={() => isDevice && handleCameraPress(true)}
              hitSlop={12}
              accessibilityLabel="Take a photo"
            >
              <FontAwesome
                name="camera"
                size={26}
                color={isDevice ? '#F8FAFF' : 'rgba(248,250,255,0.3)'}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={runForward}
            disabled={!imageUri || model.isGenerating}
            style={({ pressed }) => [
              styles.runButton,
              (!imageUri || model.isGenerating) && { opacity: 0.55 },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.runButtonText}>
              {model.isGenerating
                ? 'Running…'
                : imageUri
                  ? 'Run model'
                  : 'Pick an image to run the model'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1224',
  },
  imageContainer: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
  container: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  infoTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F8FAFF',
    letterSpacing: 0.4,
  },
  infoText: {
    fontSize: 18,
    color: 'rgba(248, 250, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 560,
  },
  bottomBar: {
    width: '100%',
    gap: 15,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  bottomIcons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  runButton: {
    width: '100%',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(82, 107, 235)',
    borderRadius: 14,
    shadowColor: 'rgb(82, 107, 235)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
  },
  runButtonText: {
    color: '#F8FAFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
