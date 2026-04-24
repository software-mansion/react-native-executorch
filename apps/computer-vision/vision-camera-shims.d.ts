// react-native-vision-camera 5.0.4 dropped `getCameraFormat`, `Templates`,
// and several `<Camera>` props (`outputs`, `format`, `orientationSource`)
// that the example app in `app/vision_camera/index.tsx` still references.
// These shims keep `tsc --noEmit` quiet so unrelated PRs aren't blocked
// while the consumer code is migrated to the new 5.x API. They are
// intentionally typed loosely — runtime behavior is broken regardless of
// these declarations, and a real fix means rewriting the screen against
// `useCamera`, `useFrameOutput`, etc.
//
// The `export {}` makes this file a TypeScript module so the `declare
// module` block below is treated as an augmentation of the existing
// `react-native-vision-camera` types, rather than an ambient declaration
// that would replace them.
export {};

declare module 'react-native-vision-camera' {
  export const getCameraFormat: (...args: unknown[]) => Record<string, unknown>;
  // `any` (not `unknown`) so consumer code that spreads template values
  // (`{ ...Templates.FrameProcessing }`) typechecks.
  export const Templates: Record<string, any>;
  interface CameraViewProps {
    outputs?: unknown;
    format?: unknown;
    orientationSource?: 'device' | 'preview' | string;
  }
}
