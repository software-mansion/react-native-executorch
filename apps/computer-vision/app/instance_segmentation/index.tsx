import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import {
  useInstanceSegmentation,
  YOLO26N_SEG,
  YOLO26S_SEG,
  YOLO26M_SEG,
  YOLO26L_SEG,
  YOLO26X_SEG,
  RF_DETR_NANO_SEG,
  InstanceSegmentationModelSources,
  FASTSAM_S,
  FASTSAM_X,
} from 'react-native-executorch';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import ImageWithMasks, {
  buildDisplayInstances,
  DisplayInstance,
} from '../../components/ImageWithMasks';
import { StatsBar } from '../../components/StatsBar';

const MODELS: ModelOption<InstanceSegmentationModelSources>[] = [
  { label: 'Yolo26N', value: YOLO26N_SEG },
  { label: 'Yolo26S', value: YOLO26S_SEG },
  { label: 'Yolo26M', value: YOLO26M_SEG },
  { label: 'Yolo26L', value: YOLO26L_SEG },
  { label: 'Yolo26X', value: YOLO26X_SEG },
  { label: 'RF-DeTR Nano', value: RF_DETR_NANO_SEG },
  { label: 'FastSAM-S', value: FASTSAM_S },
  { label: 'FastSAM-X', value: FASTSAM_X },
];

export default function InstanceSegmentationScreen() {
  const [selectedModel, setSelectedModel] =
    useState<InstanceSegmentationModelSources>(YOLO26N_SEG);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  const { setGlobalGenerating } = useContext(GeneratingContext);

  const {
    isReady,
    isGenerating,
    downloadProgress,
    forward,
    error,
    getAvailableInputSizes,
  } = useInstanceSegmentation({
    model: selectedModel,
  });

  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [instances, setInstances] = useState<DisplayInstance[]>([]);
  const [selectedInputSize, setSelectedInputSize] = useState<number | null>(
    null
  );

  const availableInputSizes = getAvailableInputSizes();

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  // Set default input size when model is ready
  useEffect(() => {
    if (!isReady) return;

    if (availableInputSizes && availableInputSizes.length > 0) {
      setSelectedInputSize((prev) => {
        if (typeof prev === 'number' && availableInputSizes.includes(prev)) {
          return prev;
        }
        return availableInputSizes[0];
      });
      return;
    }

    setSelectedInputSize(null);
  }, [isReady, availableInputSizes]);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    if (!image?.uri) return;
    setImageUri(image.uri);
    setImageSize({
      width: image.width ?? 0,
      height: image.height ?? 0,
    });
    setInstances([]);
    setInferenceTime(null);
  };

  const runForward = async () => {
    if (!imageUri || imageSize.width === 0 || imageSize.height === 0) return;

    const inputSize =
      availableInputSizes &&
      typeof selectedInputSize === 'number' &&
      availableInputSizes.includes(selectedInputSize)
        ? selectedInputSize
        : undefined;

    try {
      const start = Date.now();
      const output = await forward(imageUri, {
        confidenceThreshold: 0.5,
        iouThreshold: 0.55,
        maxInstances: 20,
        returnMaskAtOriginalResolution: true,
        inputSize,
      });

      setInferenceTime(Date.now() - start);

      // Convert raw masks → small Skia images immediately.
      // Raw Uint8Array mask buffers (backed by native OwningArrayBuffer)
      // go out of scope here and become eligible for GC right away.
      setInstances(buildDisplayInstances(output));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isReady && error) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Model</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Unknown error occurred'}
          </Text>
          <Text style={styles.errorCode}>Code: {error?.code || 'N/A'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!isReady) {
    return (
      <Spinner
        visible={!isReady}
        textContent={`Loading the model ${(downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <ImageWithMasks
            imageUri={imageUri}
            instances={instances}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
          />
          {!imageUri && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Instance Segmentation</Text>
              <Text style={styles.infoText}>
                This model detects individual objects and draws a precise mask
                over each one. Pick an image from your gallery or take one with
                your camera to get started.
              </Text>
            </View>
          )}
        </View>

        {imageUri && availableInputSizes && availableInputSizes.length > 0 && (
          <View style={styles.inputSizeContainer}>
            <Text style={styles.inputSizeLabel}>Input Size:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.inputSizeScroll}
            >
              {availableInputSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedInputSize === size && styles.sizeButtonActive,
                  ]}
                  onPress={() => setSelectedInputSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      selectedInputSize === size && styles.sizeButtonTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {instances.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              Detected {instances.length} instance(s)
            </Text>
            <ScrollView style={styles.resultsList}>
              {instances.map((instance, idx) => (
                <View key={idx} style={styles.resultRow}>
                  <Text style={styles.resultText}>
                    {instance.label || 'Unknown'} (
                    {(instance.score * 100).toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <ModelPicker
        models={MODELS}
        selectedModel={selectedModel}
        disabled={isGenerating}
        onSelect={(m) => {
          setSelectedModel(m);
          setInstances([]);
          setInferenceTime(null);
        }}
      />

      <StatsBar
        inferenceTime={inferenceTime}
        detectionCount={instances.length > 0 ? instances.length : null}
      />

      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
        hasImage={!!imageUri}
        isGenerating={isGenerating}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 6,
    width: '100%',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  inputSizeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputSizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputSizeScroll: {
    flexDirection: 'row',
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  sizeButtonActive: {
    backgroundColor: '#007AFF',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sizeButtonTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    maxHeight: 200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resultsList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorCode: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Courier',
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
