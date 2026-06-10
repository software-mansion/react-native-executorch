import * as RNE from '../../src';
import { BaseModule } from '../../src/modules/BaseModule';

// Mirror the abstract-module set from moduleContracts.test.ts.
const ABSTRACT_MODULES = new Set([
  'BaseModule',
  'VisionModule',
  'VisionLabeledModule',
]);

type ModuleClass = new (...args: never[]) => unknown;

function isClassConstructor(value: unknown): value is ModuleClass {
  return (
    typeof value === 'function' &&
    typeof (value as { prototype?: unknown }).prototype === 'object' &&
    (value as { prototype: { constructor?: unknown } }).prototype
      .constructor === value
  );
}

function getModuleClasses(): Array<[string, ModuleClass]> {
  return Object.entries(RNE).filter(
    ([name, value]) =>
      name.endsWith('Module') &&
      !name.startsWith('use') &&
      !ABSTRACT_MODULES.has(name) &&
      isClassConstructor(value)
  ) as Array<[string, ModuleClass]>;
}

// Walk the prototype chain (excluding Object.prototype) and collect every
// non-constructor, non-private callable surface name. Uses property
// descriptors rather than direct access so accessor properties (getters such
// as VisionModule.runOnFrame) are counted without being invoked — invoking
// them on the prototype with no native module loaded would throw.
function reachablePublicMethods(ModuleClass: ModuleClass): Set<string> {
  const out = new Set<string>();
  let proto: object | null = ModuleClass.prototype;
  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor') continue;
      if (name.startsWith('_')) continue;
      const desc = Object.getOwnPropertyDescriptor(proto, name);
      if (!desc) continue;
      if (typeof desc.value === 'function' || typeof desc.get === 'function') {
        out.add(name);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return out;
}

describe('Module prototype surface', () => {
  const modules = getModuleClasses();

  it.each(modules)(
    '%s exposes at least one public instance method on the prototype chain',
    (_name, ModuleClass) => {
      const methods = reachablePublicMethods(ModuleClass);
      expect(methods.size).toBeGreaterThan(0);
    }
  );

  it.each(modules)(
    '%s has a reachable delete() method',
    (_name, ModuleClass) => {
      const methods = reachablePublicMethods(ModuleClass);
      expect(methods.has('delete')).toBe(true);
    }
  );

  it('BaseModule itself exposes the documented base surface', () => {
    const surface = Object.getOwnPropertyNames(BaseModule.prototype).sort();
    // Stable, intentionally tiny. If BaseModule grows, the diff makes the
    // intent explicit; if a method is renamed accidentally, this fails.
    expect(surface).toEqual(
      ['constructor', 'delete', 'forwardET', 'getInputShape'].sort()
    );
  });
});
