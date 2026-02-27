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
  Group,
} from '@shopify/react-native-skia';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';

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

// Available input sizes for YOLO models
const AVAILABLE_INPUT_SIZES = [384, 416, 512, 640, 1024];

export default function InstanceSegmentationScreen() {
  const { setGlobalGenerating } = useContext(GeneratingContext);

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

  const runForward = async () => {
    if (!imageUri || imageSize.width === 0 || imageSize.height === 0) return;

    try {
      const output = await forward(imageUri, {
        confidenceThreshold: 0.5,
        iouThreshold: 0.45,
        maxInstances: 20,
        returnMaskAtOriginalResolution: true,
        inputSize: selectedInputSize,
      });

      // Debug: Check if labels are present
      if (output.length > 0) {
        console.log('First instance label:', output[0].label);
      }

      setInstances(output);

      // Create Skia images for each mask
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

  const scaleX = canvasSize.width / (imageSize.width || 1);
  const scaleY = canvasSize.height / (imageSize.height || 1);
  const scale = Math.min(scaleX, scaleY);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.imageCanvasContainer}>
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

                  return (
                    <Group key={`bbox-${idx}`}>
                      {/* Bounding box */}
                      <Rect
                        x={bboxX}
                        y={bboxY}
                        width={bboxWidth}
                        height={bboxHeight}
                        style="stroke"
                        strokeWidth={2}
                        color={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`}
                      />
                    </Group>
                  );
                })}
              </Canvas>

              {/* Labels using React Native Text - positioned absolutely */}
              {instances.map((instance, idx) => {
                const color = instanceColors[idx % instanceColors.length];
                const offsetX =
                  (canvasSize.width - imageSize.width * scale) / 2;
                const offsetY =
                  (canvasSize.height - imageSize.height * scale) / 2;

                const bboxX = instance.bbox.x1 * scale + offsetX;
                const bboxY = instance.bbox.y1 * scale + offsetY;

                const labelText = `${instance.label || 'Unknown'} ${(instance.score * 100).toFixed(0)}%`;

                return (
                  <View
                    key={`label-${idx}`}
                    style={[
                      styles.labelContainer,
                      {
                        left: bboxX,
                        top: bboxY - 20,
                        backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`,
                      },
                    ]}
                  >
                    <Text style={styles.labelText}>{labelText}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {imageUri && (
          <View style={styles.inputSizeContainer}>
            <Text style={styles.inputSizeLabel}>Input Size:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.inputSizeScroll}
            >
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
                      {instance.label || 'Unknown'} (
                      {(instance.score * 100).toFixed(1)}%)
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
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
