import Spinner from 'react-native-loading-spinner-overlay';
import { BottomBar } from '../components/BottomBar';
import { getImage } from '../utils';
import { useOCR } from 'react-native-executorch';
import { View, StyleSheet, Image, Text } from 'react-native';
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
  const [detectedText, setDetectedText] = useState<string>('');
  const model = useOCR({
    detectorSource:
      'https://huggingface.co/nklockiewicz/ocr/resolve/main/xnnpack_craft_800.pte',
    recognizerSources: {
      recognizerLarge:
        'https://huggingface.co/nklockiewicz/ocr/resolve/main/xnnpack_crnn_512.pte',
      recognizerMedium:
        'https://huggingface.co/nklockiewicz/ocr/resolve/main/xnnpack_crnn_256.pte',
      recognizerSmall:
        'https://huggingface.co/nklockiewicz/ocr/resolve/main/xnnpack_crnn_128.pte',
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
      setDetectedText('');
    }
  };

  const runForward = async () => {
    console.log('RUnning forward');
    try {
      const output = await model.forward(imageUri);
      setResults(output);
      console.log(output);
      let txt = '';
      output.forEach((detection: any) => {
        txt += detection.text + ' ';
      });
      setDetectedText(txt);
    } catch (e) {
      console.error(e);
    }
  };

  if (!model.isReady) {
    return (
      <Spinner visible={!model.isReady} textContent={`Loading the model...`} />
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
        <Text>{detectedText}</Text>
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
});
