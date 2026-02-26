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
    method: 'forward_384',
    description: 'Baseline - Extreme low-power / simple objects',
  },
  {
    size: 416,
    method: 'forward_416',
    description: 'Legacy standard (YOLOv3/v4 era)',
  },
  {
    size: 512,
    method: 'forward_512',
    description: 'Recommended - Best balance for edge',
  },
  { size: 640, method: 'forward_640', description: 'High accuracy standard' },
  {
    size: 1024,
    method: 'forward_1024',
    description: 'Maximum accuracy (optional)',
  },
];

interface BenchmarkResult {
  method: string;
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
        modelName: 'yolo26l-seg',
        modelSource: 'http://192.168.83.59:3000/yolo26l-seg.pte',
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
  const [selectedMethod, setSelectedMethod] = useState('forward_512');

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
    console.log('ℹ️  NOTE: Your model may only have forward_512 exported.');
    console.log('   Other methods will fail if not present in the .pte file.');
    console.log('');

    for (const config of IMAGE_SIZES) {
      const resolution = config.size
        ? `${config.size}x${config.size}`
        : `${config.width}x${config.height}`;

      console.log('-'.repeat(60));
      console.log(`Testing: ${config.method}`);
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
          methodName: config.method,
        });

        const endTime = performance.now();
        const timeMs = endTime - startTime;

        console.log(`✅ SUCCESS`);
        console.log(`⏱️  Time: ${timeMs.toFixed(2)} ms`);
        console.log(`📊 Instances detected: ${output.length}`);
        console.log('');

        results.push({
          method: config.method,
          description: config.description,
          resolution,
          timeMs,
          instanceCount: output.length,
          success: true,
        });

        // Update UI with the last result
        if (config.method === IMAGE_SIZES[IMAGE_SIZES.length - 1].method) {
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
          method: config.method,
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
        `⚡ Fastest: ${fastest.method} - ${fastest.timeMs.toFixed(2)} ms`
      );
      console.log(
        `🐌 Slowest: ${slowest.method} - ${slowest.timeMs.toFixed(2)} ms`
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
      console.log(`Running ${selectedMethod} with image:`, imageUri);
      const startTime = performance.now();
      const output = await forward(imageUri, {
        confidenceThreshold: 0.7,
        iouThreshold: 0.15,
        maxInstances: 20,
        returnMaskAtOriginalResolution: true,
        methodName: selectedMethod,
      });
      const endTime = performance.now();
      console.log(
        `✅ ${selectedMethod} succeeded in ${(endTime - startTime).toFixed(2)}ms - detected ${output.length} instances`
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
                { label: '384', value: 'forward_384' },
                { label: '416', value: 'forward_416' },
                { label: '512', value: 'forward_512' },
                { label: '640', value: 'forward_640' },
                { label: '1024', value: 'forward_1024' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.methodButton,
                    selectedMethod === method.value &&
                      styles.methodButtonActive,
                  ]}
                  onPress={() => {
                    console.log(`Selected method: ${method.value}`);
                    setSelectedMethod(method.value);
                  }}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      selectedMethod === method.value &&
                        styles.methodButtonTextActive,
                    ]}
                  >
                    {method.label}
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
                      {result.success ? '✅' : '❌'} {result.method}
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
  },
  imageCanvasContainer: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  imageContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  resultsContainer: {
    maxHeight: 200,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorCode: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  benchmarkButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  benchmarkButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  benchmarkButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  benchmarkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  benchmarkContainer: {
    maxHeight: 300,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
  },
  benchmarkHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2196F3',
  },
  benchmarkList: {
    flex: 1,
  },
  benchmarkRow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  benchmarkRowError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  benchmarkRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  benchmarkMethod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  benchmarkResolution: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  benchmarkDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  benchmarkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  benchmarkTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
  benchmarkInstances: {
    fontSize: 14,
    color: '#2196F3',
  },
  benchmarkError: {
    fontSize: 12,
    color: '#f44336',
    fontFamily: 'monospace',
  },
  methodSelectorContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  methodSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  methodButtonsContainer: {
    flexDirection: 'row',
  },
  methodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  methodButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
});
