import { useFrameOutput } from 'react-native-vision-camera';
import { createSynchronizable } from 'react-native-worklets';

export type TaskProps = {
  activeModel: string;
  canvasSize: { width: number; height: number };
  frameKillSwitch: ReturnType<typeof createSynchronizable<boolean>>;
  onFrameOutputChange: (frameOutput: ReturnType<typeof useFrameOutput>) => void;
  onReadyChange: (isReady: boolean) => void;
  onProgressChange: (progress: number) => void;
  onGeneratingChange: (isGenerating: boolean) => void;
  onFpsChange: (fps: number, frameMs: number) => void;
};
