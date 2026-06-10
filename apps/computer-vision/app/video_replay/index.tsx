import Spinner from '../../components/Spinner';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import {
  models,
  Detection,
  useObjectDetection,
  ObjectDetectionModelSources,
} from 'react-native-executorch';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import ImageWithBboxes from '../../components/ImageWithBboxes';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Asset } from 'expo-asset';
import { GeneratingContext } from '../../context';
import ScreenWrapper from '../../ScreenWrapper';
import { StatsBar } from '../../components/StatsBar';
import ErrorBanner from '../../components/ErrorBanner';
import ColorPalette from '../../colors';
import { fps as sourceFps, frames } from '../../assets/video_frames';

const objectDetection = models.object_detection;

const MODELS: ModelOption<ObjectDetectionModelSources>[] = [
  {
    label: 'RF-DeTR Nano',
    value: objectDetection.rf_detr_nano(),
  },
  {
    label: 'SSDLite MobileNet',
    value: objectDetection.ssdlite_320_mobilenet_v3_large(),
  },
  { label: 'YOLO26N', value: objectDetection.yolo26n() },
];

interface LoadedFrame {
  uri: string;
  width: number;
  height: number;
}

export default function VideoReplayScreen() {
  const [loadedFrames, setLoadedFrames] = useState<LoadedFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<LoadedFrame | null>(null);
  const [results, setResults] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [effectiveFps, setEffectiveFps] = useState(0);
  const [selectedModel, setSelectedModel] =
    useState<ObjectDetectionModelSources>(objectDetection.rf_detr_nano());

  const model = useObjectDetection({ model: selectedModel });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  // The playback loop is a long-lived async function; refs let it see the
  // latest model and react to pause/unmount between awaits.
  const modelRef = useRef(model);
  modelRef.current = model;
  const playingRef = useRef(false);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (frames.length === 0) return;
      try {
        const assets = await Asset.loadAsync(frames);
        if (cancelled) return;
        const loaded = assets.map((a) => ({
          uri: a.localUri ?? a.uri,
          width: a.width ?? 0,
          height: a.height ?? 0,
        }));
        setLoadedFrames(loaded);
        setCurrentFrame(loaded[0] ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      playingRef.current = false;
    };
  }, []);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  const playLoop = useCallback(async (framesToPlay: LoadedFrame[]) => {
    const targetFrameMs = sourceFps > 0 ? 1000 / sourceFps : 0;
    while (playingRef.current) {
      const frame = framesToPlay[frameIndexRef.current]!;
      const start = Date.now();
      try {
        const output = await modelRef.current.forward(frame.uri);
        if (!playingRef.current) break;
        setCurrentFrame(frame);
        setResults(output);
        setInferenceTime(Date.now() - start);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        playingRef.current = false;
        setIsPlaying(false);
        break;
      }
      const elapsed = Date.now() - start;
      if (elapsed < targetFrameMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, targetFrameMs - elapsed)
        );
      }
      setEffectiveFps(1000 / Math.max(Date.now() - start, 1));
      frameIndexRef.current = (frameIndexRef.current + 1) % framesToPlay.length;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (playingRef.current) {
      stopPlayback();
      return;
    }
    playingRef.current = true;
    setIsPlaying(true);
    playLoop(loadedFrames);
  }, [loadedFrames, playLoop, stopPlayback]);

  if (frames.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Video Replay</Text>
          <Text style={styles.infoText}>
            No test video frames bundled. Extract frames from an mp4 first, then
            rebuild the app:
          </Text>
          <Text style={styles.codeText}>
            node scripts/extract-video-frames.mjs ~/video.mp4 --fps 5
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

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
          {currentFrame && (
            <ImageWithBboxes
              imageUri={currentFrame.uri}
              imageWidth={currentFrame.width}
              imageHeight={currentFrame.height}
              detections={results}
            />
          )}
        </View>
        <Text style={styles.fpsText}>
          Frame {frameIndexRef.current + 1}/{loadedFrames.length} ·{' '}
          {effectiveFps.toFixed(1)} FPS (source {sourceFps} FPS)
        </Text>
      </View>
      <ModelPicker
        models={MODELS}
        selectedModel={selectedModel}
        disabled={model.isGenerating}
        onSelect={(m) => {
          stopPlayback();
          setSelectedModel(m);
          setResults([]);
          setInferenceTime(null);
        }}
      />
      <StatsBar
        inferenceTime={inferenceTime}
        detectionCount={results.length > 0 ? results.length : null}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          disabled={loadedFrames.length === 0}
          onPress={togglePlayback}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>
      </View>
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
  fpsText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
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
  codeText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Courier',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 4,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  playButton: {
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 8,
    paddingHorizontal: 48,
    paddingVertical: 12,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
