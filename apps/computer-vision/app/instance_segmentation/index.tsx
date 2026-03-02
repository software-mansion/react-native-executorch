import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import ImageWithInstanceMasks from '../../components/ImageWithInstanceMasks';
import { getImage } from '../../utils';
import {
  useInstanceSegmentation,
  YOLO26N_SEG,
  InstanceSegmentationModule,
  CocoLabel,
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

// Available input sizes for YOLO models
const AVAILABLE_INPUT_SIZES = [384, 416, 512, 640, 1024];

export default function InstanceSegmentationScreen() {
  const { setGlobalGenerating } = useContext(GeneratingContext);

  // Custom model setup
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<any>(null);
  const [modelInstance, setModelInstance] = useState<InstanceSegmentationModule<
    typeof CocoLabel
  > | null>(null);

  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInputSize, setSelectedInputSize] = useState(640);

  // Load custom RFDetr model
  useEffect(() => {
    let isMounted = true;
    let instance: InstanceSegmentationModule<typeof CocoLabel> | null = null;

    (async () => {
      try {
        setIsReady(false);
        setError(null);

        instance = await InstanceSegmentationModule.fromCustomConfig(
          'http://192.168.0.201:3000/rfdetr_seg.pte',
          {
            labelMap: CocoLabel,
            postprocessorConfig: {
              type: 'rfdetr',
              defaultConfidenceThreshold: 0.5,
              defaultIouThreshold: 0.5,
              applyNMS: false,
            },
          },
          (progress) => {
            if (isMounted) setDownloadProgress(progress);
          }
        );

        if (isMounted) {
          setModelInstance(instance);
          setIsReady(true);
        }
      } catch (err) {
        if (isMounted) setError(err);
      }
    })();

    return () => {
      isMounted = false;
      instance?.delete();
    };
  }, []);

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    if (!image?.uri) return;
    setImageUri(image.uri);
    setImageSize({
      width: image.width ?? 0,
      height: image.height ?? 0,
    });
    setInstances([]);
  };

  const runForward = async () => {
    if (
      !imageUri ||
      imageSize.width === 0 ||
      imageSize.height === 0 ||
      !modelInstance
    )
      return;

    try {
      setIsGenerating(true);
      const output = await modelInstance.forward(imageUri, {
        confidenceThreshold: 0.5,
        iouThreshold: 0.55,
        maxInstances: 20,
        returnMaskAtOriginalResolution: true,
        inputSize: selectedInputSize,
      });

      setInstances(output);
    } catch (e) {
      console.error(e);
      setError(e);
    } finally {
      setIsGenerating(false);
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
        {/* Image with Instance Masks */}
        <View style={styles.imageCanvasContainer}>
          <ImageWithInstanceMasks
            imageUri={imageUri}
            instances={instances}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            showMasks={true}
          />
        </View>

        {imageUri && (
          <View style={styles.inputSizeContainer}>
            <Text style={styles.inputSizeLabel}>Input Size:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {AVAILABLE_INPUT_SIZES.map((size) => (
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

      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 6,
  },
  imageCanvasContainer: {
    flex: 1,
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
});
