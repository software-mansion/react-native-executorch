import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import { useVerticalOCR, OCR_ENGLISH } from 'react-native-executorch';
import { View, StyleSheet, Image, Text, ScrollView } from 'react-native';
import ImageWithBboxes2 from '../../components/ImageWithOCRBboxes';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import { StatsBar } from '../../components/StatsBar';
import ErrorBanner from '../../components/ErrorBanner';

export default function VerticalOCRScreen() {
  const [imageUri, setImageUri] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const model = useVerticalOCR({
    model: OCR_ENGLISH,
    independentCharacters: true,
  });

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
      setInferenceTime(null);
    }
  };

  const runForward = async () => {
    try {
      const start = Date.now();
      const output = await model.forward(imageUri);
      setInferenceTime(Date.now() - start);
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
      <View style={styles.container}>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

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
        {!imageUri && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Vertical OCR</Text>
            <Text style={styles.infoText}>
              This model reads vertical text (e.g. Japanese, Korean, Chinese
              columns) from images, returning each detected text region with its
              bounding box and confidence score. Pick an image from your gallery
              or take one with your camera to get started.
            </Text>
          </View>
        )}
        {imageUri && inferenceTime !== null && results.length === 0 && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>No text detected</Text>
            <Text style={styles.infoText}>
              The model did not find any vertical text in this image. Try an
              image containing vertical Japanese, Korean, or Chinese text.
            </Text>
          </View>
        )}
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultHeader}>Results</Text>
            <ScrollView style={styles.resultsList}>
              {results.map(({ text, score }, index) => (
                <View key={index} style={styles.resultRecord}>
                  <Text style={styles.resultLabel}>{text}</Text>
                  <Text>{score?.toFixed(3)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      <StatsBar
        inferenceTime={inferenceTime}
        detectionCount={results.length > 0 ? results.length : null}
      />
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
        hasImage={!!imageUri}
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
  infoContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'navy',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
});
