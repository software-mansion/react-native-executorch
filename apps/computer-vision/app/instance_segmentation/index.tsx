import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import { useInstanceSegmentation } from 'react-native-executorch';
import {
  Canvas,
  Image as SkiaImage,
  Skia,
  AlphaType,
  ColorType,
  SkImage,
  Rect,
  Paint,
  Group,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';

// Benchmark configurations
const IMAGE_SIZES = [
  {
    size: 384,
    description: 'Baseline - Extreme low-power / simple objects',
  },
  {
    size: 416,
    description: 'Recommended - Best balance for edge (default)',
  },
  {
    size: 512,
    description: 'Good balance for accuracy',
  },
  { size: 640, description: 'High accuracy standard' },
  {
    size: 1024,
    description: 'Maximum accuracy (optional)',
  },
];

interface BenchmarkResult {
  inputSize: number;
  description: string;
  resolution: string;
  timeMs: number;
  instanceCount: number;
  success: boolean;
  error?: string;
}

// Color palette for different instances
const instanceColors = [
  [255, 87, 51, 180], // Red
  [51, 255, 87, 180], // Green
  [51, 87, 255, 180], // Blue
  [255, 51, 246, 180], // Magenta
  [51, 255, 246, 180], // Cyan
  [243, 255, 51, 180], // Yellow
  [141, 51, 255, 180], // Purple
  [255, 131, 51, 180], // Orange
  [51, 255, 131, 180], // Spring Green
  [131, 51, 255, 180], // Violet
];

export default function InstanceSegmentationScreen() {
  const { setGlobalGenerating } = useContext(GeneratingContext);

  // TODO: Replace with actual model source when available
  const { isReady, isGenerating, downloadProgress, forward, error } =
    useInstanceSegmentation({
      model: {
        modelName: 'yolo26n-seg',
        modelSource: 'http://192.168.83.59:3000/yolo26n-seg.pte',
      },
    });

  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [maskImages, setMaskImages] = useState<SkImage[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>(
    []
  );
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [selectedInputSize, setSelectedInputSize] = useState(416);

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
    setMaskImages([]);
    setInstances([]);
  };

  const runBenchmark = async () => {
    if (!imageUri || imageSize.width === 0 || imageSize.height === 0) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setIsBenchmarking(true);
    setShowBenchmark(true);
    const results: BenchmarkResult[] = [];

    console.log('='.repeat(60));
    console.log('🚀 STARTING INSTANCE SEGMENTATION BENCHMARK');
    console.log('='.repeat(60));
    console.log(`Image: ${imageUri}`);
    console.log(`Image Size: ${imageSize.width}x${imageSize.height}`);
    console.log('');
    console.log('ℹ️  NOTE: Your model may only support certain input sizes.');
    console.log(
      '   Methods will fail if the input size is not exported in the .pte file.'
    );
    console.log('');

    for (const config of IMAGE_SIZES) {
      const resolution = `${config.size}x${config.size}`;

      console.log('-'.repeat(60));
      console.log(`Testing: ${config.size}x${config.size}`);
      console.log(`Description: ${config.description}`);
      console.log(`Resolution: ${resolution}`);
      console.log('-'.repeat(60));

      try {
        const startTime = performance.now();

        const output = await forward(imageUri, {
          confidenceThreshold: 0.5,
          iouThreshold: 0.45,
          maxInstances: 20,
          returnMaskAtOriginalResolution: true,
          inputSize: config.size,
        });

        const endTime = performance.now();
        const timeMs = endTime - startTime;

        console.log(`✅ SUCCESS`);
        console.log(`⏱️  Time: ${timeMs.toFixed(2)} ms`);
        console.log(`📊 Instances detected: ${output.length}`);
        console.log('');

        results.push({
          inputSize: config.size,
          description: config.description,
          resolution,
          timeMs,
          instanceCount: output.length,
          success: true,
        });

        // Update UI with the last result
        if (config.size === IMAGE_SIZES[IMAGE_SIZES.length - 1].size) {
          setInstances(output);
          // Create Skia images for visualization
          const images: SkImage[] = [];
          for (let i = 0; i < output.length; i++) {
            const instance = output[i];
            const color = instanceColors[i % instanceColors.length];

            const pixels = new Uint8Array(
              instance.maskWidth * instance.maskHeight * 4
            );

            for (let j = 0; j < instance.mask.length; j++) {
              if (instance.mask[j] > 0) {
                pixels[j * 4] = color[0];
                pixels[j * 4 + 1] = color[1];
                pixels[j * 4 + 2] = color[2];
                pixels[j * 4 + 3] = color[3];
              } else {
                pixels[j * 4 + 3] = 0;
              }
            }

            const data = Skia.Data.fromBytes(pixels);
            const img = Skia.Image.MakeImage(
              {
                width: instance.maskWidth,
                height: instance.maskHeight,
                alphaType: AlphaType.Premul,
                colorType: ColorType.RGBA_8888,
              },
              data,
              instance.maskWidth * 4
            );

            if (img) {
              images.push(img);
            }
          }
          setMaskImages(images);
        }
      } catch (e: any) {
        console.log(`❌ FAILED`);
        console.log(`Error: ${e.message || e}`);
        console.log('');

        results.push({
          inputSize: config.size,
          description: config.description,
          resolution,
          timeMs: 0,
          instanceCount: 0,
          success: false,
          error: e.message || 'Unknown error',
        });
      }
    }

    console.log('='.repeat(60));
    console.log('📈 BENCHMARK SUMMARY');
    console.log('='.repeat(60));

    const successfulRuns = results.filter((r) => r.success);
    if (successfulRuns.length > 0) {
      const fastest = successfulRuns.reduce((prev, curr) =>
        curr.timeMs < prev.timeMs ? curr : prev
      );
      const slowest = successfulRuns.reduce((prev, curr) =>
        curr.timeMs > prev.timeMs ? curr : prev
      );
      const avgTime =
        successfulRuns.reduce((sum, r) => sum + r.timeMs, 0) /
        successfulRuns.length;

      console.log(
        `⚡ Fastest: ${fastest.inputSize}x${fastest.inputSize} - ${fastest.timeMs.toFixed(2)} ms`
      );
      console.log(
        `🐌 Slowest: ${slowest.inputSize}x${slowest.inputSize} - ${slowest.timeMs.toFixed(2)} ms`
      );
      console.log(`📊 Average: ${avgTime.toFixed(2)} ms`);
      console.log(
        `✅ Success rate: ${successfulRuns.length}/${results.length}`
      );
    }
    console.log('='.repeat(60));
    console.log('');

    setBenchmarkResults(results);
    setIsBenchmarking(false);
  };

  const runForward = async () => {
    if (!imageUri || imageSize.width === 0 || imageSize.height === 0) {
      return;
    }

    try {
      console.log(
        `Running ${selectedInputSize}x${selectedInputSize} with image:`,
        imageUri
      );
      const startTime = performance.now();
      const output = await forward(imageUri, {
        confidenceThreshold: 0.5,
        iouThreshold: 0.55,
        maxInstances: 20,
        returnMaskAtOriginalResolution: true,
        inputSize: selectedInputSize,
      });
      const endTime = performance.now();
      console.log(
        `✅ ${selectedInputSize}x${selectedInputSize} succeeded in ${(endTime - startTime).toFixed(2)}ms - detected ${output.length} instances`
      );

      // Debug: log first instance structure
      if (output.length > 0) {
        console.log(
          'First instance:',
          JSON.stringify({
            label: output[0].label,
            score: output[0].score,
            bbox: output[0].bbox,
            maskWidth: output[0].maskWidth,
            maskHeight: output[0].maskHeight,
          })
        );
      }

      setInstances(output);

      // Create Skia images for each mask
      const images: SkImage[] = [];
      for (let i = 0; i < output.length; i++) {
        const instance = output[i];
        const color = instanceColors[i % instanceColors.length];

        // Create colored mask
        const pixels = new Uint8Array(
          instance.maskWidth * instance.maskHeight * 4
        );

        for (let j = 0; j < instance.mask.length; j++) {
          if (instance.mask[j] > 0) {
            pixels[j * 4] = color[0];
            pixels[j * 4 + 1] = color[1];
            pixels[j * 4 + 2] = color[2];
            pixels[j * 4 + 3] = color[3]; // Alpha for transparency
          } else {
            pixels[j * 4 + 3] = 0; // Fully transparent
          }
        }

        const data = Skia.Data.fromBytes(pixels);
        const img = Skia.Image.MakeImage(
          {
            width: instance.maskWidth,
            height: instance.maskHeight,
            alphaType: AlphaType.Premul,
            colorType: ColorType.RGBA_8888,
          },
          data,
          instance.maskWidth * 4
        );

        if (img) {
          images.push(img);
        }
      }

      setMaskImages(images);
    } catch (e) {
      console.error('Instance segmentation error:', e);
    }
  };

  // Show error if loading failed
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

  // Calculate scale factor for bounding boxes
  const scaleX = canvasSize.width / (imageSize.width || 1);
  const scaleY = canvasSize.height / (imageSize.height || 1);
  const scale = Math.min(scaleX, scaleY);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.imageCanvasContainer}>
          {/* Base image */}
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
          </View>

          {/* Overlay masks and bounding boxes */}
          {maskImages.length > 0 && (
            <View
              style={styles.canvasContainer}
              onLayout={(e) =>
                setCanvasSize({
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                })
              }
            >
              <Canvas style={styles.canvas}>
                {/* Render masks */}
                {maskImages.map((maskImg, idx) => (
                  <SkiaImage
                    key={`mask-${idx}`}
                    image={maskImg}
                    fit="contain"
                    x={0}
                    y={0}
                    width={canvasSize.width}
                    height={canvasSize.height}
                  />
                ))}

                {/* Render bounding boxes and labels */}
                {instances.map((instance, idx) => {
                  const color = instanceColors[idx % instanceColors.length];
                  const offsetX =
                    (canvasSize.width - imageSize.width * scale) / 2;
                  const offsetY =
                    (canvasSize.height - imageSize.height * scale) / 2;

                  const bboxX = instance.bbox.x1 * scale + offsetX;
                  const bboxY = instance.bbox.y1 * scale + offsetY;
                  const bboxWidth =
                    (instance.bbox.x2 - instance.bbox.x1) * scale;
                  const bboxHeight =
                    (instance.bbox.y2 - instance.bbox.y1) * scale;

                  const labelText = `${instance.label} ${(instance.score * 100).toFixed(0)}%`;
                  const font = matchFont({
                    fontFamily: 'System',
                    fontSize: 14,
                    fontWeight: 'bold',
                  });

                  // Calculate text width with fallback
                  let textWidth = 100; // Default width
                  if (font) {
                    try {
                      textWidth = font.getTextWidth(labelText);
                    } catch (e) {
                      console.warn('Failed to calculate text width:', e);
                    }
                  }

                  return (
                    <Group key={`bbox-${idx}`}>
                      {/* Bounding box */}
                      <Rect
                        x={bboxX}
                        y={bboxY}
                        width={bboxWidth}
                        height={bboxHeight}
                        style="stroke"
                        strokeWidth={3}
                        color={`rgb(${color[0]}, ${color[1]}, ${color[2]})`}
                      />
                      {/* Label background */}
                      {font && (
                        <Rect
                          x={bboxX}
                          y={bboxY - 26}
                          width={textWidth + 16}
                          height={26}
                          color={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`}
                        />
                      )}
                      {/* Label text */}
                      {font && (
                        <SkiaText
                          x={bboxX + 8}
                          y={bboxY - 8}
                          text={labelText}
                          font={font}
                          color="white"
                        />
                      )}
                    </Group>
                  );
                })}
              </Canvas>
            </View>
          )}
        </View>

        {/* Method selector */}
        {imageUri && (
          <View style={styles.methodSelectorContainer}>
            <Text style={styles.methodSelectorLabel}>Input Size:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.methodButtonsContainer}
            >
              {[
                { label: '384', value: 384 },
                { label: '416', value: 416 },
                { label: '512', value: 512 },
                { label: '640', value: 640 },
                { label: '1024', value: 1024 },
              ].map((sizeOption) => (
                <TouchableOpacity
                  key={sizeOption.value}
                  style={[
                    styles.methodButton,
                    selectedInputSize === sizeOption.value &&
                      styles.methodButtonActive,
                  ]}
                  onPress={() => {
                    console.log(`Selected input size: ${sizeOption.value}`);
                    setSelectedInputSize(sizeOption.value);
                  }}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      selectedInputSize === sizeOption.value &&
                        styles.methodButtonTextActive,
                    ]}
                  >
                    {sizeOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Benchmark button */}
        {imageUri && (
          <View style={styles.benchmarkButtonContainer}>
            <TouchableOpacity
              style={[
                styles.benchmarkButton,
                isBenchmarking && styles.benchmarkButtonDisabled,
              ]}
              onPress={runBenchmark}
              disabled={isBenchmarking}
            >
              <Text style={styles.benchmarkButtonText}>
                {isBenchmarking
                  ? '⏳ Running Benchmark...'
                  : '🚀 Run Benchmark (All Methods)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Benchmark Results */}
        {showBenchmark && benchmarkResults.length > 0 && (
          <View style={styles.benchmarkContainer}>
            <Text style={styles.benchmarkHeader}>
              🏁 Benchmark Results (
              {benchmarkResults.filter((r) => r.success).length}/
              {benchmarkResults.length} successful)
            </Text>
            <ScrollView style={styles.benchmarkList}>
              {benchmarkResults.map((result, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.benchmarkRow,
                    !result.success && styles.benchmarkRowError,
                  ]}
                >
                  <View style={styles.benchmarkRowHeader}>
                    <Text style={styles.benchmarkMethod}>
                      {result.success ? '✅' : '❌'} {result.inputSize}x
                      {result.inputSize}
                    </Text>
                    <Text style={styles.benchmarkResolution}>
                      {result.resolution}
                    </Text>
                  </View>
                  <Text style={styles.benchmarkDescription}>
                    {result.description}
                  </Text>
                  {result.success ? (
                    <View style={styles.benchmarkStats}>
                      <Text style={styles.benchmarkTime}>
                        ⏱️ {result.timeMs.toFixed(2)} ms
                      </Text>
                      <Text style={styles.benchmarkInstances}>
                        📊 {result.instanceCount} instances
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.benchmarkError}>{result.error}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Results list */}
        {instances.length > 0 && !showBenchmark && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              Detected {instances.length} instance(s)
            </Text>
            <ScrollView style={styles.resultsList}>
              {instances.map((instance, idx) => {
                const color = instanceColors[idx % instanceColors.length];
                return (
                  <View key={idx} style={styles.resultRow}>
                    <View
                      style={[
                        styles.colorBox,
                        {
                          backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                        },
                      ]}
                    />
                    <Text style={styles.resultText}>
                      {instance.label} ({(instance.score * 100).toFixed(1)}%)
                    </Text>
                  </View>
                );
              })}
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
    width: '100%',
    backgroundColor: '#f8f9fa',
  },
  imageCanvasContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  imageContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  resultsContainer: {
    maxHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  resultsList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    letterSpacing: -0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  errorCode: {
    fontSize: 13,
    color: '#7f8c8d',
    fontFamily: 'Courier',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  benchmarkButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  benchmarkButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  benchmarkButtonDisabled: {
    backgroundColor: '#a8b5f0',
    shadowOpacity: 0.15,
  },
  benchmarkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  benchmarkContainer: {
    maxHeight: 320,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  benchmarkHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#667eea',
    letterSpacing: -0.5,
  },
  benchmarkList: {
    flex: 1,
  },
  benchmarkRow: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  benchmarkRowError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftColor: '#ef4444',
  },
  benchmarkRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  benchmarkMethod: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  benchmarkResolution: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Courier',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  benchmarkDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  benchmarkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benchmarkTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Courier',
  },
  benchmarkInstances: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
  },
  benchmarkError: {
    fontSize: 13,
    color: '#ef4444',
    fontFamily: 'Courier',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodSelectorContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  methodSelectorLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  methodButtonsContainer: {
    flexDirection: 'row',
  },
  methodButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodButtonActive: {
    backgroundColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  methodButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#667eea',
    letterSpacing: -0.3,
  },
  methodButtonTextActive: {
    color: '#fff',
  },
});
