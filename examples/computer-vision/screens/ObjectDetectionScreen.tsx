import { useState } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../components/BottomBar';
import { getImage } from '../utils';
import {
  Detection,
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE_URL,
} from 'react-native-executorch';
import { View, StyleSheet, Image } from 'react-native';
import ImageWithBboxes from '../components/ImageWithBboxes';

export const ObjectDetectionScreen = ({
  imageUri,
  setImageUri,
}: {
  imageUri: string;
  setImageUri: (imageUri: string) => void;
}) => {
  const [results, setResults] = useState<Detection[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();

  const ssdLite = useObjectDetection({
    modelSource: SSDLITE_320_MOBILENET_V3_LARGE_URL,
  });

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
        const output = await ssdLite.forward(imageUri);
        console.log(output);
        setResults(output);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!ssdLite.isModelReady) {
    return (
      <Spinner
        visible={!ssdLite.isModelReady}
        textContent={`Loading the model...`}
      />
    );
  }

  return (
    <>
      <View style={styles.imageContainer}>
        <View style={styles.image}>
          {imageUri && imageDimensions?.width && imageDimensions?.height ? (
            <ImageWithBboxes
              imageUri={
                imageUri || require('../assets/icons/executorch_logo.png')
              }
              imageWidth={imageDimensions.width}
              imageHeight={imageDimensions.height}
              detections={results}
            />
          ) : (
            <Image
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              source={require('../assets/icons/executorch_logo.png')}
            />
          )}
        </View>
      </View>
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
      />
    </>
  );
};

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
});
