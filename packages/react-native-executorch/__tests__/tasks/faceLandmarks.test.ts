/**
 * The face mesh pipeline is thin: a schema contract, a threshold, and the
 * mapping of landmarks out of the model's input box and back onto the caller's
 * image. All three are pure TypeScript, so they are checked here rather than
 * left to a device run.
 */
import { f32, method } from '../../src/core/schema';
import { createFaceLandmarker } from '../../src/extensions/cv/tasks/faceLandmarks';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';

const MODEL_PATH = '/models/facemesh.pte';

/** Three landmarks, at the input box's origin, centre and far corner. */
const LANDMARKS = [0, 0, 0, 4, 4, 2, 8, 8, -2];

const config = (resizeMode: 'stretch' | 'letterbox' = 'stretch') =>
  ({
    modelPath: MODEL_PATH,
    modelOpts: { ...STRETCH_PREPROCESSING, resizeMode, defaultConfidenceThreshold: 0.5 },
  }) as const;

const register = (score: number) =>
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(method('forward', [f32(1, 3, 8, 8)], [f32(3, 3), f32(1)])),
    execute: writesOutputs(LANDMARKS, [score]),
  });

describe('createFaceLandmarker — model acceptance', () => {
  it('accepts a [1, 3, H, W] -> ([N, 3], [1]) model and disposes cleanly', async () => {
    register(0.9);
    const mesh = tracked(await createFaceLandmarker(config()));
    expect(mesh.detectFaceLandmarks).toBeInstanceOf(Function);

    mesh.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('rejects a model whose landmarks are not 3-D', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 8, 8)], [f32(3, 2), f32(1)])),
    });

    await expect(createFaceLandmarker(config())).rejects.toThrow(/Constant dimension mismatch/);
  });

  it('rejects a model that omits the score output', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 8, 8)], [f32(3, 3)])),
    });

    await expect(createFaceLandmarker(config())).rejects.toThrow(
      /doesn't match any of the provided/
    );
  });

  it('surfaces a load failure', async () => {
    await expect(
      createFaceLandmarker({ ...config(), modelPath: '/models/absent.pte' })
    ).rejects.toThrow(/absent.pte/);
  });
});

describe('createFaceLandmarker — detectFaceLandmarks', () => {
  it('returns every landmark, scaled onto the input image', async () => {
    register(0.9);
    const mesh = tracked(await createFaceLandmarker(config()));

    // A 16x8 image stretched into the model's 8x8 box doubles x and leaves y.
    const detection = await mesh.detectFaceLandmarks(imageBuffer(16, 8));

    expect(detection).not.toBeNull();
    expect(detection!.confidence).toBeCloseTo(0.9);
    expect(detection!.landmarks).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 8, y: 4, z: 4 },
      { x: 16, y: 8, z: -4 },
    ]);
  });

  it('scales z by the same factor as x under letterboxing', async () => {
    register(0.9);
    const mesh = tracked(await createFaceLandmarker(config('letterbox')));

    // A 16x8 image letterboxed into 8x8 scales by 1/2 and pads y by 2.
    const detection = await mesh.detectFaceLandmarks(imageBuffer(16, 8));

    expect(detection!.landmarks).toEqual([
      { x: 0, y: -4, z: 0 },
      { x: 8, y: 4, z: 4 },
      { x: 16, y: 12, z: -4 },
    ]);
  });

  it('reports no face when the score is below the model default', async () => {
    register(0.25);
    const mesh = tracked(await createFaceLandmarker(config()));

    expect(await mesh.detectFaceLandmarks(imageBuffer(8, 8))).toBeNull();
  });

  it('lets a per-call threshold override the model default', async () => {
    register(0.25);
    const mesh = tracked(await createFaceLandmarker(config()));

    expect(
      await mesh.detectFaceLandmarks(imageBuffer(8, 8), { confidenceThreshold: 0.2 })
    ).not.toBeNull();
    expect(
      await mesh.detectFaceLandmarks(imageBuffer(8, 8), { confidenceThreshold: 0.9 })
    ).toBeNull();
  });
});
