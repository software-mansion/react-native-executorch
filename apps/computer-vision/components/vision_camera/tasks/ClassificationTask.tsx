import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import { EFFICIENTNET_V2_S, useClassification } from 'react-native-executorch';
import { TaskProps } from './types';

type Props = Omit<TaskProps, 'activeModel' | 'canvasSize'>;

export default function ClassificationTask({
  frameKillSwitch,
  onFrameOutputChange,
  onReadyChange,
  onProgressChange,
  onGeneratingChange,
  onFpsChange,
}: Props) {
  const model = useClassification({ model: EFFICIENTNET_V2_S });
  const [classResult, setClassResult] = useState({ label: '', score: 0 });
  const lastFrameTimeRef = useRef(Date.now());

  useEffect(() => {
    onReadyChange(model.isReady);
  }, [model.isReady, onReadyChange]);

  useEffect(() => {
    onProgressChange(model.downloadProgress);
  }, [model.downloadProgress, onProgressChange]);

  useEffect(() => {
    onGeneratingChange(model.isGenerating);
  }, [model.isGenerating, onGeneratingChange]);

  const classRof = model.runOnFrame;

  const updateClass = useCallback(
    (r: { label: string; score: number }) => {
      setClassResult(r);
      const now = Date.now();
      const diff = now - lastFrameTimeRef.current;
      if (diff > 0) onFpsChange(Math.round(1000 / diff), diff);
      lastFrameTimeRef.current = now;
    },
    [onFpsChange]
  );

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    enablePreviewSizedOutputBuffers: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        if (frameKillSwitch.getDirty()) {
          frame.dispose();
          return;
        }
        try {
          if (!classRof) return;
          const result = classRof(frame);
          if (result) {
            let bestLabel = '';
            let bestScore = -1;
            const entries = Object.entries(result);
            for (let i = 0; i < entries.length; i++) {
              const [label, score] = entries[i]!;
              if ((score as number) > bestScore) {
                bestScore = score as number;
                bestLabel = label;
              }
            }
            scheduleOnRN(updateClass, { label: bestLabel, score: bestScore });
          }
        } catch {
          // ignore
        } finally {
          frame.dispose();
        }
      },
      [classRof, frameKillSwitch, updateClass]
    ),
  });

  useEffect(() => {
    onFrameOutputChange(frameOutput);
  }, [frameOutput, onFrameOutputChange]);

  return classResult.label ? (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={styles.label}>{classResult.label}</Text>
      <Text style={styles.score}>{(classResult.score * 100).toFixed(1)}%</Text>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    paddingHorizontal: 24,
  },
  score: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
