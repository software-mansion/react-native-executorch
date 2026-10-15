import { useFrameOutput } from 'react-native-vision-camera';
import type { Synchronizable } from 'react-native-worklets';

export const FRAME_TARGET_RESOLUTION = { width: 1280, height: 720 } as const;

export type TaskProps = {
  activeModel: string;
  canvasSize: { width: number; height: number };
  cameraPositionSync: Synchronizable<'front' | 'back'>;
  frameKillSwitch: Synchronizable<boolean>;
  onFrameOutputChange: (frameOutput: ReturnType<typeof useFrameOutput>) => void;
  onReadyChange: (isReady: boolean) => void;
  onProgressChange: (progress: number) => void;
  onGeneratingChange: (isGenerating: boolean) => void;
  onFpsChange: (fps: number, frameMs: number) => void;
  onErrorChange: (error: string | null) => void;
};
