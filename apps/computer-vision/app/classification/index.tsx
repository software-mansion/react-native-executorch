import Spinner from '../../components/Spinner';
import { getImage } from '../../utils';
import {
  useClassification,
  EFFICIENTNET_V2_S,
  EFFICIENTNET_V2_S_QUANTIZED,
  ClassificationModelSources,
} from 'react-native-executorch';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';

const MODELS: ModelOption<ClassificationModelSources>[] = [
  { label: 'EfficientNet V2 S Quantized', value: EFFICIENTNET_V2_S_QUANTIZED },
  { label: 'EfficientNet V2 S', value: EFFICIENTNET_V2_S },
];
import { View, StyleSheet, Image, Text, ScrollView } from 'react-native';
import { BottomBar } from '../../components/BottomBar';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import { StatsBar } from '../../components/StatsBar';
import ErrorBanner from '../../components/ErrorBanner';

export default function ClassificationScreen() {
  const [selectedModel, setSelectedModel] =
    useState<ClassificationModelSources>(EFFICIENTNET_V2_S_QUANTIZED);
  const [results, setResults] = useState<{ label: string; score: number }[]>(
    []
  );
  const [imageUri, setImageUri] = useState('');
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const model = useClassification({ model: selectedModel });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const uri = image?.uri;
    if (typeof uri === 'string') {
      setImageUri(uri as string);
      setResults([]);
      setInferenceTime(null);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        const start = Date.now();
        const output = await model.forward(imageUri);
        setInferenceTime(Date.now() - start);
        const top10 = Object.entries(output)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([label, score]) => ({ label, score: score as number }));
        setResults(top10);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
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
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

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
        {!imageUri && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Image Classification</Text>
            <Text style={styles.infoText}>
              This model analyzes an image and returns the top 10 most likely
              labels with confidence scores. Use the gallery or camera icons
              below to pick an image, then tap the button to run the model.
            </Text>
          </View>
        )}
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultHeader}>Results Top 10</Text>
            <ScrollView style={styles.resultsList}>
              {results.map(({ label, score }) => (
                <View key={label} style={styles.resultRecord}>
                  <Text style={styles.resultLabel}>{label}</Text>
                  <Text>{score.toFixed(3)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      <ModelPicker
        models={MODELS}
        selectedModel={selectedModel}
        disabled={model.isGenerating}
        onSelect={(m) => {
          setSelectedModel(m);
          setResults([]);
        }}
      />
      <StatsBar inferenceTime={inferenceTime} />
      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
        hasImage={!!imageUri}
        isGenerating={model.isGenerating}
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
