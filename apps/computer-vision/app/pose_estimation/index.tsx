import Spinner from '../../components/Spinner';
import { BottomBar } from '../../components/BottomBar';
import { getImage } from '../../utils';
import {
  usePoseEstimation,
  PoseDetections,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';
import { View, StyleSheet, Image, Text } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import { StatsBar } from '../../components/StatsBar';
import Svg, { Circle, Line } from 'react-native-svg';
import ErrorBanner from '../../components/ErrorBanner';

const YOLO_POSE_MODEL = {
  modelName: 'yolo26n-pose',
  modelSource: require('../../assets/yolo26n-pose_xnnpack.pte'),
} as const;

// Colors for different people
const PERSON_COLORS = ['lime', 'cyan', 'magenta', 'yellow', 'orange', 'pink'];

const COCO_SKELETON_CONNECTIONS = [
  ['NOSE', 'LEFT_EYE'],
  ['NOSE', 'RIGHT_EYE'],
  ['LEFT_EYE', 'LEFT_EAR'],
  ['RIGHT_EYE', 'RIGHT_EAR'],
  ['LEFT_SHOULDER', 'RIGHT_SHOULDER'],
  ['LEFT_SHOULDER', 'LEFT_ELBOW'],
  ['LEFT_ELBOW', 'LEFT_WRIST'],
  ['RIGHT_SHOULDER', 'RIGHT_ELBOW'],
  ['RIGHT_ELBOW', 'RIGHT_WRIST'],
  ['LEFT_SHOULDER', 'LEFT_HIP'],
  ['RIGHT_SHOULDER', 'RIGHT_HIP'],
  ['LEFT_HIP', 'RIGHT_HIP'],
  ['LEFT_HIP', 'LEFT_KNEE'],
  ['LEFT_KNEE', 'LEFT_ANKLE'],
  ['RIGHT_HIP', 'RIGHT_KNEE'],
  ['RIGHT_KNEE', 'RIGHT_ANKLE'],
] as const;

export default function PoseEstimationScreen() {
  const [imageUri, setImageUri] = useState('');
  const [results, setResults] = useState<PoseDetections>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  const model = usePoseEstimation({ model: YOLO_POSE_MODEL });
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
    const width = image?.width;
    const height = image?.height;

    if (uri && width && height) {
      setImageUri(image.uri as string);
      setImageDimensions({ width, height });
      setResults([]);
      setInferenceTime(null);
    }
  };

  const runForward = async () => {
    if (imageUri) {
      try {
        const start = Date.now();
        const output = await model.forward(imageUri, { inputSize: 384 });
        setInferenceTime(Date.now() - start);
        setResults(output);
      } catch (e) {
        if (e instanceof RnExecutorchError) {
          switch (e.code) {
            case RnExecutorchErrorCode.FileReadFailed:
              setError('Could not read the selected image.');
              break;
            case RnExecutorchErrorCode.ModelGenerating:
              setError('Model is busy — wait for the current run to finish.');
              break;
            case RnExecutorchErrorCode.InvalidUserInput:
            case RnExecutorchErrorCode.InvalidArgument:
              setError(`Invalid input: ${e.message}`);
              break;
            default:
              setError(e.message);
          }
        } else {
          setError(e instanceof Error ? e.message : String(e));
        }
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
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <View style={styles.imageContainer}>
        <View style={styles.image}>
          {imageUri && imageDimensions?.width && imageDimensions?.height ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
              {results.length > 0 && (
                <Svg style={StyleSheet.absoluteFill}>
                  {/* Draw skeleton and keypoints for each detected person */}
                  {results.map((personKeypoints, personIdx) => {
                    const color =
                      PERSON_COLORS[personIdx % PERSON_COLORS.length];
                    return (
                      <React.Fragment key={`person-${personIdx}`}>
                        {/* Draw skeleton lines for this person */}
                        {COCO_SKELETON_CONNECTIONS.map(
                          ([from, to], lineIdx) => {
                            const kp1 = personKeypoints[from];
                            const kp2 = personKeypoints[to];
                            if (!kp1 || !kp2) return null;
                            return (
                              <Line
                                key={`person-${personIdx}-line-${lineIdx}`}
                                x1={`${(kp1.x / imageDimensions.width) * 100}%`}
                                y1={`${(kp1.y / imageDimensions.height) * 100}%`}
                                x2={`${(kp2.x / imageDimensions.width) * 100}%`}
                                y2={`${(kp2.y / imageDimensions.height) * 100}%`}
                                stroke={color}
                                strokeWidth="2"
                              />
                            );
                          }
                        )}
                        {/* Draw keypoints for this person */}
                        {Object.entries(personKeypoints).map(([name, kp]) => (
                          <Circle
                            key={`person-${personIdx}-kp-${name}`}
                            cx={`${(kp.x / imageDimensions.width) * 100}%`}
                            cy={`${(kp.y / imageDimensions.height) * 100}%`}
                            r="4"
                            fill="red"
                          />
                        ))}
                      </React.Fragment>
                    );
                  })}
                </Svg>
              )}
            </View>
          ) : (
            <Image
              style={styles.fullSizeImage}
              resizeMode="contain"
              source={require('../../assets/icons/executorch_logo.png')}
            />
          )}
        </View>
        {!imageUri && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Pose Estimation</Text>
            <Text style={styles.infoText}>
              This model detects human body keypoints (17 COCO keypoints) and
              draws a skeleton overlay. Pick an image from your gallery or take
              one with your camera to get started.
            </Text>
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
  imageWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
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
