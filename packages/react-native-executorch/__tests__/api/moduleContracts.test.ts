import * as RNE from '../../src';
import { BaseModule } from '../../src/modules/BaseModule';

// Module classes that exist purely as shared bases and have no corresponding
// public hook. Anything not in this set is treated as part of the public API
// surface.
const ABSTRACT_MODULES = new Set([
  'BaseModule',
  'VisionModule',
  'VisionLabeledModule',
]);

// Modules that don't currently extend BaseModule. This is a known
// inconsistency in today's API — every other module class inherits the
// `delete()` / `forward()` plumbing from BaseModule. Listed here so the
// contract test passes on the current codebase; entries should be removed as
// each module is migrated.
const SKIPS_BASE_MODULE = new Set([
  'OCRModule',
  'VerticalOCRModule',
  'LLMModule',
  'SpeechToTextModule',
  'TextToSpeechModule',
  'TokenizerModule',
]);

// Modules that instantiate via something other than a static `from*` factory
// (e.g. ExecutorchModule constructs blank and exposes an instance `load()`;
// TokenizerModule has no factory at all).
const SKIPS_STATIC_FACTORY = new Set(['ExecutorchModule', 'TokenizerModule']);

// `useExecutorchModule` keeps the `Module` suffix while every other hook
// drops it (`useClassification`, `useLLM`, ...). Listed here so the contract
// test passes today — remove the entry when the hook is renamed.
const HOOK_NAME_EXCEPTIONS: Record<string, string> = {
  ExecutorchModule: 'useExecutorchModule',
};

type ModuleCtor = new (...args: never[]) => unknown;

function isClassConstructor(value: unknown): value is ModuleCtor {
  return (
    typeof value === 'function' &&
    typeof (value as { prototype?: unknown }).prototype === 'object' &&
    (value as { prototype: { constructor?: unknown } }).prototype
      .constructor === value
  );
}

function getModuleClasses(): Array<[string, ModuleCtor]> {
  return Object.entries(RNE).filter(
    ([name, value]) =>
      name.endsWith('Module') &&
      !name.startsWith('use') &&
      !ABSTRACT_MODULES.has(name) &&
      isClassConstructor(value)
  ) as Array<[string, ModuleCtor]>;
}

describe('Module contracts', () => {
  const modules = getModuleClasses();

  it('exports at least one concrete Module class', () => {
    expect(modules.length).toBeGreaterThan(0);
  });

  describe.each(modules)('%s', (name, ModuleClass) => {
    const baseTest = SKIPS_BASE_MODULE.has(name) ? it.skip : it;
    baseTest('extends BaseModule', () => {
      expect(ModuleClass.prototype instanceof BaseModule).toBe(true);
    });

    const factoryTest = SKIPS_STATIC_FACTORY.has(name) ? it.skip : it;
    factoryTest('declares at least one static factory method (from*)', () => {
      const factories = Object.getOwnPropertyNames(ModuleClass).filter(
        (n) =>
          n.startsWith('from') &&
          typeof (ModuleClass as unknown as Record<string, unknown>)[n] ===
            'function'
      );
      expect(factories.length).toBeGreaterThan(0);
    });
  });

  it.each(modules)('%s has a corresponding hook export', (name) => {
    const expected =
      HOOK_NAME_EXCEPTIONS[name] ?? 'use' + name.replace(/Module$/, '');
    const hook = (RNE as unknown as Record<string, unknown>)[expected];
    expect(hook).toBeDefined();
    expect(typeof hook).toBe('function');
  });
});
