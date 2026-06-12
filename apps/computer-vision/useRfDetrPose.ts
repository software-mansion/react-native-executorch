import { useCallback, useEffect, useState } from 'react';
import {
  CocoKeypoint,
  PoseDetections,
  PoseEstimationModule,
  PoseEstimationOptions,
} from 'react-native-executorch';

// RF-DETR keypoint-preview export (CoreML-delegated, iOS-only). Not in the
// model registry yet, so it loads through fromCustomModel. The export uses
// ImageNet normalization, unlike the yolo pose preset.
const RF_DETR_POSE_MODEL = require('./assets/rfdetr-keypoint-preview-coreml-iOS16-all-fp32.pte');
const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const;
const IMAGENET_STD = [0.229, 0.224, 0.225] as const;

// Mirrors the usePoseEstimation hook surface for a custom (non-registry)
// model: load/unload lifecycle, download progress and a generating flag.
export function useRfDetrPose() {
  const [instance, setInstance] = useState<PoseEstimationModule<
    typeof CocoKeypoint
  > | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    let loaded: PoseEstimationModule<typeof CocoKeypoint> | null = null;
    PoseEstimationModule.fromCustomModel(
      RF_DETR_POSE_MODEL,
      {
        keypointMap: CocoKeypoint,
        preprocessorConfig: { normMean: IMAGENET_MEAN, normStd: IMAGENET_STD },
        defaultDetectionThreshold: 0.3,
        defaultKeypointThreshold: 0.3,
      },
      (p) => {
        if (active) setDownloadProgress(p);
      }
    )
      .then((m) => {
        if (!active) {
          m.delete();
          return;
        }
        loaded = m;
        setInstance(m);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
      loaded?.delete();
    };
  }, []);

  const forward = useCallback(
    async (
      input: string,
      options?: PoseEstimationOptions
    ): Promise<PoseDetections> => {
      if (!instance) throw new Error('Pose model is not loaded yet');
      setIsGenerating(true);
      try {
        return await instance.forward(input, options);
      } finally {
        setIsGenerating(false);
      }
    },
    [instance]
  );

  return {
    isReady: instance !== null,
    isGenerating,
    downloadProgress,
    error,
    forward,
  };
}
