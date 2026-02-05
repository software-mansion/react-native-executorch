import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import { useVerticalOCR, OCR_ENGLISH } from 'react-native-executorch';
import { View, StyleSheet, Image, Text, ScrollView } from 'react-native';
import ImageWithBboxes2 from '../../components/ImageWithOCRBboxes';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';

export default function VerticalOCRScree() {
  const [imageUri, setImageUri] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();
  const model = useVerticalOCR({
    model: OCR_ENGLISH,
    independentCharacters: true,
  });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

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
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          {imageUri && imageDimensions?.width && imageDimensions?.height ? (
            <ImageWithBboxes2
              detections={results}
              imageWidth={imageDimensions?.width}
              imageHeight={imageDimensions?.height}
              imageUri={
                imageUri || require('../../assets/icons/executorch_logo.png')
              }
            />
          ) : (
            <Image
              style={styles.image}
              resizeMode="contain"
              source={require('../../assets/icons/executorch_logo.png')}
            />
          )}
        </View>
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultHeader}>Results</Text>
            <ScrollView style={styles.resultsList}>
              {results.map(({ text, score }, index) => (
                <View key={index} style={styles.resultRecord}>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 2,
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
