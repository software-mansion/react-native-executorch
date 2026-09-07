/**
 * The public export surface.
 *
 * A snapshot is a blunt instrument, but it is the right one here: this package
 * is consumed as a library, so *every* addition, rename and removal in
 * `src/index.ts` is an API event. The snapshot makes each of them show up in
 * the diff of the pull request that causes it, rather than in a user's app.
 *
 * Updating it (`yarn test -u`) is expected — it is a prompt to check the change
 * is intended and, when it is a removal or a rename, that it is called out as
 * breaking.
 */
import * as api from '../../src/index';

/** The namespace re-exports (`export * as math from ...`) plus the registry. */
const NAMESPACES = ['cv', 'llm', 'math', 'models', 'nlp', 'schema', 'speech'] as const;

describe('public API surface', () => {
  it('matches the recorded export list', () => {
    expect(Object.keys(api).sort()).toMatchSnapshot();
  });

  it.each(NAMESPACES)('exposes the %s namespace as an object', (name) => {
    expect(typeof (api as Record<string, unknown>)[name]).toBe('object');
  });

  it('matches the recorded contents of each namespace', () => {
    const namespaces = Object.fromEntries(
      NAMESPACES.filter((name) => name !== 'models').map((name) => [
        name,
        Object.keys((api as Record<string, unknown>)[name] as object).sort(),
      ])
    );

    expect(namespaces).toMatchSnapshot();
  });

  it('exports one hook per user-facing task', () => {
    const hooks = Object.keys(api).filter((key) => key.startsWith('use'));
    expect(hooks.sort()).toMatchSnapshot();
  });

  it('exports a create<Task> factory for every task hook that wraps one', () => {
    // `useModel` and `useResourceDownload` are generic helpers with no task of
    // their own; everything else pairs a hook with a factory.
    const generic = new Set(['useModel', 'useResourceDownload']);
    // `useOpticalCharacterRecognizer` names the task while its factory names
    // the model (`createPaddleOcr`), so the two cannot be matched by name.
    const namedAfterTheModel: Record<string, string> = {
      useOpticalCharacterRecognizer: 'createPaddleOcr',
    };
    const factories = new Set(Object.keys(api).filter((key) => key.startsWith('create')));

    // Every hand-listed pair still has to name a factory that exists.
    for (const factory of Object.values(namedAfterTheModel)) expect(factories).toContain(factory);

    const unpaired = Object.keys(api)
      .filter((key) => key.startsWith('use') && !generic.has(key))
      .filter((key) => !(key in namedAfterTheModel))
      .filter((hook) => {
        const task = hook.slice('use'.length);
        return ![...factories].some((factory) => factory.slice('create'.length).includes(task));
      });

    expect(unpaired).toEqual([]);
  });

  it('exports no symbol whose name starts with an underscore', () => {
    expect(Object.keys(api).filter((key) => key.startsWith('_'))).toEqual([]);
  });

  it('exports every value as a function, object or array — never undefined', () => {
    const undefinedExports = Object.keys(api).filter(
      (key) => (api as Record<string, unknown>)[key] === undefined
    );
    expect(undefinedExports).toEqual([]);
  });
});
