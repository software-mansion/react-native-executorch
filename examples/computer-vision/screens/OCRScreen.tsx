import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../components/BottomBar';
import { getImage } from '../utils';
import {
  DETECTOR_CRAFT_800,
  RECOGNIZER_EN_CRNN_128,
  RECOGNIZER_EN_CRNN_256,
  RECOGNIZER_EN_CRNN_512,
  useOCR,
} from 'react-native-executorch';
import { View, StyleSheet, Image, Text, ScrollView } from 'react-native';
import { useState } from 'react';
import ImageWithBboxes2 from '../components/ImageWithOCRBboxes';

export const OCRScreen = ({
  imageUri,
  setImageUri,
}: {
  imageUri: string;
  setImageUri: (imageUri: string) => void;
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();

  const model = useOCR({
    detectorSource: DETECTOR_CRAFT_800,
    recognizerSources: {
      recognizerLarge: RECOGNIZER_EN_CRNN_512,
      recognizerMedium: RECOGNIZER_EN_CRNN_256,
      recognizerSmall: RECOGNIZER_EN_CRNN_128,
    },
    language: 'en',
  });

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
      console.log(output);
    } catch (e) {
      console.error(e);
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
    <>
      <View style={styles.imageContainer}>
        <View style={styles.image}>
          {imageUri && imageDimensions?.width && imageDimensions?.height ? (
            <ImageWithBboxes2
              detections={results}
              imageWidth={imageDimensions?.width}
              imageHeight={imageDimensions?.height}
              imageUri={
                imageUri || require('../assets/icons/executorch_logo.png')
              }
            />
          ) : (
            <Image
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              source={require('../assets/icons/executorch_logo.png')}
            />
          )}
        </View>
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultHeader}>Results</Text>
            <ScrollView style={styles.resultsList}>
              {results.map(({ text, score }) => (
                <View key={text} style={styles.resultRecord}>
                  <Text style={styles.resultLabel}>{text}</Text>
                  <Text>{score.toFixed(3)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
      />
    </>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 2,
    borderRadius: 8,
    width: '100%',
  },
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
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
