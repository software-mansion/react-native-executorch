import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import { getImage } from '../../utils';
import {
  models,
  useStyleTransfer,
  StyleTransferModelName,
  ResourceSource,
} from 'react-native-executorch';

import { View, StyleSheet, Image, Text } from 'react-native';

import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import { StatsBar } from '../../components/StatsBar';
const styleTransfer = models.style_transfer;

type StyleTransferModelSources = {
  modelName: StyleTransferModelName;
  modelSource: ResourceSource;
};

const MODELS: ModelOption<StyleTransferModelSources>[] = [
  { label: 'Candy', value: styleTransfer.candy() },
  { label: 'Mosaic', value: styleTransfer.mosaic() },
  {
    label: 'Rain Princess',
    value: styleTransfer.rain_princess(),
  },
  { label: 'Udnie', value: styleTransfer.udnie() },
];
import ErrorBanner from '../../components/ErrorBanner';

export default function StyleTransferScreen() {
  const [selectedModel, setSelectedModel] = useState<StyleTransferModelSources>(
    styleTransfer.candy()
  );

  const model = useStyleTransfer({ model: selectedModel });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  const [imageUri, setImageUri] = useState('');
  const [styledUri, setStyledUri] = useState('');
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    const uri = image?.uri;
    if (typeof uri === 'string') {
      setImageUri(uri);
      setStyledUri('');
      setInferenceTime(null);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        const start = Date.now();
        const uri = await model.forward(imageUri, 'url');
        setInferenceTime(Date.now() - start);
        setStyledUri(uri);
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
            styledUri
              ? { uri: styledUri }
              : imageUri
                ? { uri: imageUri }
                : require('../../assets/icons/executorch_logo.png')
          }
        />
        {!imageUri && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Style Transfer</Text>
            <Text style={styles.infoText}>
              This model applies artistic styles to your images, transforming
              them to look like famous paintings. Pick an image from your
              gallery or take one with your camera to get started.
            </Text>
          </View>
        )}
      </View>
      <ModelPicker
        models={MODELS}
        selectedModel={selectedModel}
        disabled={model.isGenerating}
        onSelect={(m) => {
          setSelectedModel(m);
          setStyledUri('');
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
  imageContainer: { flex: 6, width: '100%', padding: 16 },
  image: { flex: 1, borderRadius: 8, width: '100%' },
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
