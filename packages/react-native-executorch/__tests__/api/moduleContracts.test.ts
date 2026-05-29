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

  describe.each(modules)('%s', (_name, ModuleClass) => {
    it('extends BaseModule', () => {
      expect(ModuleClass.prototype instanceof BaseModule).toBe(true);
    });

    it('declares at least one static factory method (from*)', () => {
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
    const expected = 'use' + name.replace(/Module$/, '');
    const hook = (RNE as unknown as Record<string, unknown>)[expected];
    expect(hook).toBeDefined();
    expect(typeof hook).toBe('function');
  });
});
