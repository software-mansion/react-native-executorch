/**
 * Dense face landmark ("face mesh") task pipeline: one face in, a full mesh of
 * landmarks out, scaled back to the input image.
 */

import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateSpec, method, f32 } from '../../../core/schema';
import { wrapAsync } from '../../../core/runtime';
import { createResourceScope } from '../../../core/lifetime';

import type { ImageBuffer } from '../image';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../utils/imagePreprocessor';

import type { ResizeMode } from '../ops/image';
import { scalePoint, type Point } from '../ops/point';

/**
 * Options for configuring a face landmark detector runner.
 * @category CV / Types
 */
export type FaceLandmarkerOptions = Omit<ImagePreprocessorOptions, 'resizeMode'> & {
  /** Resize mode for preprocessing input images (excluding `'crop'`). */
  readonly resizeMode: Exclude<ResizeMode, 'crop'>;
  /**
   * Default minimum score below which the input is reported as holding no
   * face.
   */
  readonly defaultConfidenceThreshold: number;
};

/**
 * Model configuration required to instantiate a face landmark task runner.
 * @category CV / Types
 */
export type FaceLandmarkerModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /**
   * Image preprocessing and the default face-presence threshold.
   * See {@link FaceLandmarkerOptions}.
   */
  readonly modelOpts: FaceLandmarkerOptions;
};

/**
 * Optional configuration parameters for face landmark inference.
 * @category CV / Types
 */
export type DetectFaceLandmarksOptions = {
  /**
   * Minimum face-presence score to accept the result. If omitted, uses
   * {@link FaceLandmarkerOptions.defaultConfidenceThreshold}.
   */
  readonly confidenceThreshold?: number;
};

/**
 * A single mesh vertex: pixel coordinates in the input image, plus a relative
 * depth on roughly the same scale as `x`, negative towards the camera and
 * centred on the middle of the head.
 * @category CV / Types
 */
export type FaceLandmark = Point & { readonly z: number };

/**
 * Result structure representing the mesh found in one image.
 * @category CV / Types
 */
export type FaceLandmarksDetection = {
  /** Face-presence score of the input (between 0.0 and 1.0). */
  readonly confidence: number;
  /** The mesh vertices, in the model's own landmark order. */
  readonly landmarks: readonly FaceLandmark[];
};

/**
 * Dense face landmark task runner.
 *
 * These models see one already-cropped face and regress its full mesh; they do
 * not search an image for faces. Feed them the crop of a face detector such as
 * `models.keypointDetection.BLAZEFACE` (see `cv.restrictToBox`), or a photo
 * framed on a single face.
 * @category CV / Types
 */
export type FaceLandmarker = {
  /**
   * Releases all allocated native resources.
   */
  readonly dispose: () => void;

  /**
   * Asynchronously regresses the face mesh of the given input image.
   * @param input The input image buffer, cropped to one face.
   * @param options Configuration options for face landmark detection.
   * See {@link DetectFaceLandmarksOptions}.
   * @returns A promise resolving to the detection, or to `null` when the
   * face-presence score falls below the threshold.
   * @throws {RnExecuTorchError} With code `RESOURCE_BUSY` if the model is in
   * use, or `RESOURCE_DISPOSED` if disposed.
   */
  readonly detectFaceLandmarks: (
    input: ImageBuffer,
    options?: DetectFaceLandmarksOptions
  ) => Promise<FaceLandmarksDetection | null>;

  /**
   * Synchronous version of {@link detectFaceLandmarks} to be executed directly
   * on the caller or worklet thread.
   */
  readonly detectFaceLandmarksWorklet: (
    input: ImageBuffer,
    options?: DetectFaceLandmarksOptions
  ) => FaceLandmarksDetection | null;
};

/**
 * Creates a face landmark detector runner for executing local face mesh models.
 *
 * It validates the model input and output shapes (landmark coordinates and the
 * face-presence score), pre-allocates execution tensors, sets up preprocessing,
 * and registers clean disposal hooks to clear all native memory.
 * @category CV / Tasks
 * @param config Face landmark task configuration containing path and options.
 * See {@link FaceLandmarkerModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link FaceLandmarker} runner.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if model fails to load,
 * or `SCHEMA_MISMATCH` if model schema does not match the face mesh spec.
 */
export async function createFaceLandmarker(
  config: FaceLandmarkerModel,
  runtime?: WorkletRuntime
): Promise<FaceLandmarker> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, modelOpts } = config;
    const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));

    const { dims } = validateSpec(model.schema, {
      default: method(
        'forward', // prettier-ignore
        [f32(1, 3, 'H', 'W')],
        [f32('N', 3), f32(1)]
      ),
    });

    const [N, targetH, targetW] = dims.constant('N', 'H', 'W');
    const inpShape = [1, 3, targetH, targetW];

    const tensors = [
      tensor('float32', [N, 3]), // prettier-ignore
      tensor('float32', [1]),
    ] as const;

    tensors.forEach(scope.track);

    const [tLandmarks, tScore] = tensors;
    const preprocessor = scope.track(createImagePreprocessor(modelOpts, inpShape));

    const detectFaceLandmarksWorklet = (
      input: ImageBuffer,
      options?: DetectFaceLandmarksOptions
    ): FaceLandmarksDetection | null => {
      'worklet';
      const tInput = preprocessor.process(input);
      model.execute('forward', [tInput], [tLandmarks, tScore]);

      const confidenceThreshold =
        options?.confidenceThreshold ?? modelOpts.defaultConfidenceThreshold;
      const confidence = tScore.getData(new Float32Array(1))[0]!;
      if (confidence < confidenceThreshold) {
        return null;
      }

      const from = { width: targetW, height: targetH };
      const to = { width: input.width, height: input.height };
      const { resizeMode } = modelOpts;
      // z shares x's units, so it follows whatever scaling x undergoes. Taking
      // it from the origin's displacement keeps that true for every mode
      // without restating each mode's algebra here.
      const origin = scalePoint({ x: 0, y: 0 }, { from, to, resizeMode });
      const unit = scalePoint({ x: 1, y: 0 }, { from, to, resizeMode });
      const zScale = unit.x - origin.x;

      const raw = tLandmarks.getData(new Float32Array(tLandmarks.numel));
      const landmarks: FaceLandmark[] = [];
      for (let i = 0; i < N; i++) {
        const point = scalePoint({ x: raw[i * 3]!, y: raw[i * 3 + 1]! }, { from, to, resizeMode });
        landmarks.push({ ...point, z: raw[i * 3 + 2]! * zScale });
      }

      return { confidence, landmarks };
    };

    const detectFaceLandmarks = wrapAsync(detectFaceLandmarksWorklet, runtime);

    return { detectFaceLandmarks, detectFaceLandmarksWorklet, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
