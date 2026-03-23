import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import { getImage } from '../../utils';
import {
  useStyleTransfer,
  STYLE_TRANSFER_CANDY_QUANTIZED,
  STYLE_TRANSFER_MOSAIC_QUANTIZED,
  STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED,
  STYLE_TRANSFER_UDNIE_QUANTIZED,
  StyleTransferModelName,
  ResourceSource,
} from 'react-native-executorch';

import { View, StyleSheet, Image } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import { StatsBar } from '../../components/StatsBar';

type StyleTransferModelSources = {
  modelName: StyleTransferModelName;
  modelSource: ResourceSource;
};

const MODELS: ModelOption<StyleTransferModelSources>[] = [
  { label: 'Candy', value: STYLE_TRANSFER_CANDY_QUANTIZED },
  { label: 'Mosaic', value: STYLE_TRANSFER_MOSAIC_QUANTIZED },
  { label: 'Rain Princess', value: STYLE_TRANSFER_RAIN_PRINCESS_QUANTIZED },
  { label: 'Udnie', value: STYLE_TRANSFER_UDNIE_QUANTIZED },
];

export default function StyleTransferScreen() {
  const [selectedModel, setSelectedModel] = useState<StyleTransferModelSources>(
    STYLE_TRANSFER_CANDY_QUANTIZED
  );

  const model = useStyleTransfer({ model: selectedModel });
  const { setGlobalGenerating } = useContext(GeneratingContext);
  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  const [imageUri, setImageUri] = useState('');
  const [styledUri, setStyledUri] = useState('');
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

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
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  imageContainer: { flex: 6, width: '100%', padding: 16 },
  image: { flex: 1, borderRadius: 8, width: '100%' },
});
