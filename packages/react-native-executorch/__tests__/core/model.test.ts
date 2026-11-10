import { loadModel } from '../../src/core/model';
import { tensor } from '../../src/core/tensor';
import { f32, i64, method } from '../../src/core/schema';
import { fakeJsi } from '../support/fakeJsi';
import { exported, writesOutputs } from '../support/fixtures';

const PATH = '/models/fixture.pte';

describe('loadModel', () => {
  it('exposes the path, exported schema and per-method backends', () => {
    const schema = exported({
      ...method('forward', [f32(1, 3, 8, 8)], [f32(1, 4)]),
      ...method('encode', [i64(1, 16)], [f32(1, 16, 32)]),
    });
    fakeJsi.registerModel(PATH, {
      schema,
      backends: { forward: ['XnnpackBackend'], encode: ['CoreMLBackend'] },
    });

    const model = loadModel(PATH);

    expect(model.path).toBe(PATH);
    expect(Object.keys(model.schema).sort()).toEqual(['encode', 'forward']);
    expect(model.backends).toEqual({
      forward: ['XnnpackBackend'],
      encode: ['CoreMLBackend'],
    });

    model.dispose();
  });

  it('accepts optional eagerLoadMethods option', () => {
    const schema = exported(method('forward', [f32(4)], [f32(4)]));
    fakeJsi.registerModel(PATH, { schema });

    const model = loadModel(PATH, { eagerLoadMethods: false });
    expect(model.path).toBe(PATH);
    model.dispose();
  });

  it('loads from an in-memory ArrayBuffer and forwards dataMapPath', () => {
    const schema = exported(method('forward', [f32(4)], [f32(4)]));
    const modelBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const weightsBuffer = new Uint8Array([5, 6, 7, 8]).buffer;
    fakeJsi.registerModel(modelBuffer, { schema });

    const model = loadModel(modelBuffer, { dataMapPath: weightsBuffer });
    expect(model.path).toBe('<buffer>');
    expect(fakeJsi.modelLoads()).toEqual([
      { source: modelBuffer, options: { dataMapPath: weightsBuffer } },
    ]);
    model.dispose();
  });

  it('loads from a custom ModelDataLoader and forwards a loader dataMapPath', () => {
    const schema = exported(method('forward', [f32(4)], [f32(4)]));
    const modelLoader = {
      size: () => 4,
      load: (_offset: number, size: number) => new ArrayBuffer(size),
    };
    const weightsLoader = {
      size: () => 8,
      load: (_offset: number, size: number) => new ArrayBuffer(size),
    };
    fakeJsi.registerModel(modelLoader, { schema });

    const model = loadModel(modelLoader, { dataMapPath: weightsLoader });
    expect(model.path).toBe('<loader>');
    expect(fakeJsi.modelLoads()).toEqual([
      { source: modelLoader, options: { dataMapPath: weightsLoader } },
    ]);
    model.dispose();
  });

  it('propagates a load failure as a thrown error', () => {
    expect(() => loadModel('/models/missing.pte')).toThrow(/missing.pte/);
  });
});

describe('Model.execute', () => {
  beforeEach(() => {
    fakeJsi.registerModel(PATH, {
      schema: exported(method('forward', [f32(4)], [f32(4)])),
      execute: writesOutputs([10, 20, 30, 40]),
    });
  });

  it('writes into the pre-allocated output tensors and returns them', () => {
    const model = loadModel(PATH);
    const input = tensor('float32', [4]);
    const output = tensor('float32', [4]);

    const returned = model.execute('forward', [input], [output]);

    expect(returned).toEqual([output]);
    expect([...output.getData(new Float32Array(4))]).toEqual([10, 20, 30, 40]);

    input.dispose();
    output.dispose();
    model.dispose();
  });

  it('rejects a method the model does not export', () => {
    const model = loadModel(PATH);
    expect(() => model.execute('decode', [], [])).toThrow(/'decode'/);
    model.dispose();
  });

  it('rejects use after dispose rather than reading freed memory', () => {
    const model = loadModel(PATH);
    model.dispose();
    expect(() => model.execute('forward', [], [])).toThrow(/disposed/);
  });

  it('is idempotent on dispose', () => {
    const model = loadModel(PATH);
    model.dispose();
    expect(() => model.dispose()).not.toThrow();
  });
});
