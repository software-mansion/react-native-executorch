/**
 * The public headers the iOS podspec exposes.
 *
 * An app that sets `use_frameworks!` - directly, as Firebase requires, or
 * through expo-build-properties' `useFrameworks: "static"` - makes CocoaPods
 * build this pod as a framework instead of a static library. Xcode's Headers
 * build phase then copies every *public* header into one flat
 * `react_native_executorch.framework/Headers/`, so two public headers sharing
 * a basename become two build commands writing the same file and the build
 * dies while it is still being planned:
 *
 *     error: Multiple commands produce '.../Headers/Types.h'
 *
 * The source tree has 21 such basenames - `Types.h` sits in eleven task
 * directories, `constants.h` in thirteen phonemis ones - so leaving every
 * header public is not survivable. The podspec narrows the public set to the
 * Objective-C entry points and reaches the C++ headers through
 * HEADER_SEARCH_PATHS instead. See discussion #203.
 *
 * Nothing else notices when that narrowing is dropped or widened: the default
 * setup builds the pod as a static library, where public headers are not
 * copied into a framework at all, so every example app stays green while the
 * release is broken for `use_frameworks!` users. The invariant is checked here
 * instead, by reading the podspec.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PACKAGE_ROOT = join(__dirname, '..', '..');
const PODSPEC = join(PACKAGE_ROOT, 'react-native-executorch.podspec');

/**
 * The globs assigned to `public_header_files`, in declaration order.
 *
 * The podspec builds the list over several statements (a base list plus the
 * legacy entry point), so every `public_header_files = [...]` and
 * `public_header_files += [...]` contributes. The trailing
 * `s.public_header_files = public_header_files` carries no array literal and
 * is skipped by the same pattern.
 */
function declaredPublicHeaderGlobs(podspec: string): string[] {
  const assignments = podspec.matchAll(/public_header_files\s*\+?=\s*\[([^\]]*)\]/g);
  return [...assignments].flatMap((assignment) =>
    [...assignment[1]!.matchAll(/"([^"]+)"/g)].map((quoted) => quoted[1]!)
  );
}

/**
 * A CocoaPods file glob as a `RegExp` over paths relative to the package root.
 *
 * Covers the constructs the podspec uses - `**` for any depth, `*` within one
 * segment, `{h,mm}` alternatives - and throws on anything else rather than
 * quietly matching nothing, which would turn a real collision into a passing
 * test.
 */
function globToRegExp(glob: string): RegExp {
  if (/[?[\]!]/.test(glob)) {
    throw new Error(`unsupported glob syntax in podspec pattern: ${glob}`);
  }
  const segments = glob.split('/');
  const pattern = segments.flatMap((segment, index) => {
    // `**` stands for any number of directories, none included, so it brings
    // its own trailing separator: `a/**/b.h` has to match `a/b.h` as well.
    if (segment === '**') return ['(?:[^/]+/)*'];
    const escaped = segment
      .replace(/[.+^$()|\\]/g, '\\$&')
      .replace(
        /\{([^{}]*)\}/g,
        (_, alternatives: string) => `(?:${alternatives.split(',').join('|')})`
      )
      .replace(/\*/g, '[^/]*');
    return index < segments.length - 1 ? [escaped, '/'] : [escaped];
  });
  return new RegExp(`^${pattern.join('')}$`);
}

/** Every file under `directory`, as a path relative to the package root. */
function filesUnder(directory: string, prefix: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    const relative = `${prefix}/${entry}`;
    return statSync(full).isDirectory() ? filesUnder(full, relative) : [relative];
  });
}

/**
 * The files a glob matches. Only the top-level directory the glob names is
 * walked, so the phonemis submodule is never read: it holds no public header,
 * and CI installs without checking it out.
 */
function matches(glob: string): string[] {
  const root = glob.split('/')[0]!;
  const rootPath = join(PACKAGE_ROOT, root);
  if (!existsSync(rootPath)) return [];
  const regexp = globToRegExp(glob);
  const candidates = statSync(rootPath).isDirectory() ? filesUnder(rootPath, root) : [root];
  return candidates.filter((file) => regexp.test(file));
}

const globs = declaredPublicHeaderGlobs(readFileSync(PODSPEC, 'utf8'));
const publicHeaders = new Map(globs.map((glob) => [glob, matches(glob)]));

describe('podspec public headers', () => {
  it('narrows the public set with public_header_files', () => {
    // Without the attribute CocoaPods promotes every header in `source_files`,
    // which is the state that broke `use_frameworks!` builds in 0.10.0.
    expect(globs).not.toHaveLength(0);
  });

  it('declares no glob that matches nothing', () => {
    // A moved or renamed entry point would otherwise leave the framework with
    // no importable header, and no failing build until an app tried to use it.
    const empty = [...publicHeaders]
      .filter(([, files]) => files.length === 0)
      .map(([glob]) => glob);
    expect(empty).toEqual([]);
  });

  it('gives every public header a unique basename', () => {
    const byBasename = new Map<string, string[]>();
    for (const file of [...publicHeaders.values()].flat()) {
      const basename = file.split('/').pop()!;
      byBasename.set(basename, [...(byBasename.get(basename) ?? []), file]);
    }

    // Each entry here is one `Multiple commands produce` error in an app built
    // with `use_frameworks!`. Rename the header, or drop it from
    // `public_header_files` when nothing outside the pod imports it.
    const collisions = Object.fromEntries([...byBasename].filter(([, files]) => files.length > 1));
    expect(collisions).toEqual({});
  });
});
