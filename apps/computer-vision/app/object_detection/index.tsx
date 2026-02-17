import Spinner from '../../components/Spinner';
import { getImage } from '../../utils';
import {
  Detection,
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';
import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import ImageWithBboxes from '../../components/ImageWithBboxes';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import ColorPalette from '../../colors';
import { Images } from 'react-native-nitro-image';

// Helper function to convert image URI to raw pixel data using NitroImage
async function imageUriToPixelData(
  uri: string,
  targetWidth: number,
  targetHeight: number
): Promise<{
  data: ArrayBuffer;
  width: number;
  height: number;
  channels: number;
}> {
  try {
    // Load image and resize to target dimensions
    const image = await Images.loadFromFileAsync(uri);
    const resized = image.resize(targetWidth, targetHeight);

    // Get pixel data as ArrayBuffer (RGBA format)
    const pixelData = resized.toRawPixelData();
    const buffer =
      pixelData instanceof ArrayBuffer ? pixelData : pixelData.buffer;

    // Calculate actual buffer dimensions (accounts for device pixel ratio)
    const bufferSize = buffer?.byteLength || 0;
    const totalPixels = bufferSize / 4; // RGBA = 4 bytes per pixel
    const aspectRatio = targetWidth / targetHeight;
    const actualHeight = Math.sqrt(totalPixels / aspectRatio);
    const actualWidth = totalPixels / actualHeight;

    console.log('Requested:', targetWidth, 'x', targetHeight);
    console.log('Buffer size:', bufferSize);
    console.log(
      'Actual dimensions:',
      Math.round(actualWidth),
      'x',
      Math.round(actualHeight)
    );

    return {
      data: buffer,
      width: Math.round(actualWidth),
      height: Math.round(actualHeight),
      channels: 4, // RGBA
    };
  } catch (error) {
    console.error('Error loading image with NitroImage:', error);
    throw error;
  }
}

export default function ObjectDetectionScreen() {
  const [imageUri, setImageUri] = useState('');
  const [results, setResults] = useState<Detection[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();

  const ssdLite = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(ssdLite.isGenerating);
  }, [ssdLite.isGenerating, setGlobalGenerating]);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const uri = image?.uri;
    const width = image?.width;
    const height = image?.height;

    if (uri && width && height) {
      setImageUri(image.uri as string);
      setImageDimensions({ width: width as number, height: height as number });
      setResults([]);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        console.log('Running forward with string URI...');
        const output = await ssdLite.forward(imageUri, 0.5);
        console.log('String URI result:', output.length, 'detections');
        setResults(output);
      } catch (e) {
        console.error('Error in runForward:', e);
      }
    }
  };

  const runForwardPixels = async () => {
    if (imageUri && imageDimensions) {
      try {
        console.log('Converting image to pixel data...');
        // Resize to 640x640 to avoid memory issues
        const intermediateSize = 640;
        const pixelData = await imageUriToPixelData(
          imageUri,
          intermediateSize,
          intermediateSize
        );

        console.log('Running forward with pixel data...', {
          width: pixelData.width,
          height: pixelData.height,
          channels: pixelData.channels,
          dataSize: pixelData.data.byteLength,
        });

        // Run inference using unified forward() API
        const output = await ssdLite.forward(pixelData, 0.5);
        console.log('Pixel data result:', output.length, 'detections');
        setResults(output);
      } catch (e) {
        console.error('Error in runForwardPixels:', e);
      }
    }
  };

  if (!ssdLite.isReady) {
    return (
      <Spinner
        visible={!ssdLite.isReady}
        textContent={`Loading the model ${(ssdLite.downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.imageContainer}>
        <View style={styles.image}>
          {imageUri && imageDimensions?.width && imageDimensions?.height ? (
            <ImageWithBboxes
              imageUri={
                imageUri || require('../../assets/icons/executorch_logo.png')
              }
              imageWidth={imageDimensions.width}
              imageHeight={imageDimensions.height}
              detections={results}
            />
          ) : (
            <Image
              style={styles.fullSizeImage}
              resizeMode="contain"
              source={require('../../assets/icons/executorch_logo.png')}
            />
          )}
        </View>
      </View>

      {/* Custom bottom bar with two buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomIconsContainer}>
          <TouchableOpacity onPress={() => handleCameraPress(false)}>
            <Text style={styles.iconText}>📷 Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.halfButton,
              !imageUri && styles.buttonDisabled,
            ]}
            onPress={runForward}
            disabled={!imageUri}
          >
            <Text style={styles.buttonText}>Run (String)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.halfButton,
              !imageUri && styles.buttonDisabled,
            ]}
            onPress={runForwardPixels}
            disabled={!imageUri}
          >
            <Text style={styles.buttonText}>Run (Pixels)</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flex: 2,
    borderRadius: 8,
    width: '100%',
  },
  results: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 4,
  },
  resultHeader: {
    fontSize: 18,
    color: 'navy',
  },
  resultsList: {
    flex: 1,
  },
  resultRecord: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
  },
  resultLabel: {
    flex: 1,
    marginRight: 4,
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    width: '100%',
    gap: 15,
    alignItems: 'center',
    padding: 16,
    flex: 1,
  },
  bottomIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  iconText: {
    fontSize: 16,
    color: ColorPalette.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorPalette.primary,
    color: '#fff',
    borderRadius: 8,
  },
  halfButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
