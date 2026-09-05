/**
 * The coded error type every failure in the library carries.
 *
 * `RnExecuTorchError` is deliberately not a class: an error thrown inside a
 * worklet crosses a JSI boundary on its way back, and prototype identity does
 * not survive that trip. Apps are therefore told to branch on `code` through
 * `isRnExecuTorchError`, and what has to hold is that the guard keeps working
 * on an error that has been reduced to plain data — which is exactly what an
 * `instanceof` check would silently get wrong.
 *
 * The other half is the code list itself. `VALID_ERROR_CODES` is public API and
 * the native side raises the same names, so an entry appearing, disappearing or
 * being renamed is an API event rather than an implementation detail.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import { RnExecuTorchError, VALID_ERROR_CODES, isRnExecuTorchError } from '../../src/core/error';

const SRC = join(__dirname, '..', '..', 'src');

/** Every `.ts` file under `src/`, relative to it. */
function sourceFiles(directory = SRC, prefix = ''): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    const relative = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(full).isDirectory()) return sourceFiles(full, relative);
    return entry.endsWith('.ts') ? [relative] : [];
  });
}

/** What an error looks like after a structured-clone-style round trip. */
const acrossABoundary = (error: Error): unknown => ({
  name: error.name,
  message: error.message,
  code: (error as RnExecuTorchError).code,
});

describe('RnExecuTorchError', () => {
  it('is constructible without `new`, so a worklet can throw it', () => {
    const error = RnExecuTorchError('LOAD_FAILED', 'could not read the file');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RnExecuTorchError');
    expect(error.code).toBe('LOAD_FAILED');
    expect(error.message).toBe('could not read the file');
  });

  it('carries a stack, so a crash reporter can place it', () => {
    expect(RnExecuTorchError('UNKNOWN', 'boom').stack).toEqual(expect.any(String));
  });

  it('attaches the raw ExecuTorch runtime code only when one is given', () => {
    expect(RnExecuTorchError('EXECUTION_FAILED', 'boom', 32).etRuntimeErrorCode).toBe(32);
    // Absent rather than `undefined`: the field is diagnostic, and an app
    // checking `'etRuntimeErrorCode' in error` should learn the truth.
    expect('etRuntimeErrorCode' in RnExecuTorchError('EXECUTION_FAILED', 'boom')).toBe(false);
  });

  it('keeps a runtime code of 0 rather than dropping it as falsy', () => {
    expect(RnExecuTorchError('EXECUTION_FAILED', 'boom', 0).etRuntimeErrorCode).toBe(0);
  });
});

describe('isRnExecuTorchError', () => {
  const error = RnExecuTorchError('RESOURCE_BUSY', 'a run is already in flight');

  it('narrows a library error', () => {
    expect(isRnExecuTorchError(error)).toBe(true);
  });

  it('narrows on an exact code', () => {
    expect(isRnExecuTorchError(error, 'RESOURCE_BUSY')).toBe(true);
    expect(isRnExecuTorchError(error, 'RESOURCE_DISPOSED')).toBe(false);
  });

  it('holds for an error that lost its prototype crossing a boundary', () => {
    // The whole reason the guard is duck-typed. `instanceof Error` is already
    // false for this value.
    const crossed = acrossABoundary(error);

    expect(crossed).not.toBeInstanceOf(Error);
    expect(isRnExecuTorchError(crossed, 'RESOURCE_BUSY')).toBe(true);
  });

  it.each([
    ['a plain Error', new Error('boom')],
    ['a TypeError', new TypeError('boom')],
    ['a string', 'RESOURCE_BUSY'],
    ['null', null],
    ['undefined', undefined],
    ['a bare object', {}],
  ])('rejects %s', (_label, value) => {
    expect(isRnExecuTorchError(value)).toBe(false);
  });

  it('rejects a look-alike carrying a code that is not in the list', () => {
    // An object can claim the name and still be something else — a caller's own
    // error type, or a code from a newer version of the library than this one.
    expect(isRnExecuTorchError({ name: 'RnExecuTorchError', code: 'NOT_A_REAL_CODE' })).toBe(false);
  });

  it('rejects a look-alike with the right code but the wrong name', () => {
    expect(isRnExecuTorchError({ name: 'Error', code: 'RESOURCE_BUSY' })).toBe(false);
  });

  it('rejects an error whose code is not a string', () => {
    expect(isRnExecuTorchError({ name: 'RnExecuTorchError', code: 7 })).toBe(false);
  });
});

describe('VALID_ERROR_CODES', () => {
  it('matches the recorded code list', () => {
    // Public API: apps switch on these, and the native side raises the same
    // names. An addition, removal or rename belongs in the pull request diff.
    expect([...VALID_ERROR_CODES]).toMatchSnapshot();
  });

  it('names every code in SCREAMING_SNAKE_CASE, without duplicates', () => {
    for (const code of VALID_ERROR_CODES) expect(code).toMatch(/^[A-Z][A-Z_]*[A-Z]$/);
    expect(new Set(VALID_ERROR_CODES).size).toBe(VALID_ERROR_CODES.length);
  });

  it('accepts every listed code, both to construct and to narrow', () => {
    for (const code of VALID_ERROR_CODES) {
      const raised = RnExecuTorchError(code, `raised as ${code}`);
      expect(isRnExecuTorchError(raised, code)).toBe(true);
      // And only that code — no two entries may alias each other.
      const others = VALID_ERROR_CODES.filter((other) => other !== code);
      expect(others.filter((other) => isRnExecuTorchError(raised, other))).toEqual([]);
    }
  });

  it('covers every code `src/` actually raises', () => {
    // A code raised but not listed would make `isRnExecuTorchError` reject the
    // library's own error — the guard would return false for a failure the
    // library itself threw. Read out of the source, since nothing types the
    // argument at the throw site once a code is misspelled.
    const listed = new Set<string>(VALID_ERROR_CODES);
    const raised = new Set<string>();
    for (const file of sourceFiles()) {
      const text = readFileSync(join(SRC, file), 'utf8');
      for (const [, code] of text.matchAll(/RnExecuTorchError\(\s*'([A-Z_]+)'/g)) {
        raised.add(code!);
      }
    }

    expect(raised.size).toBeGreaterThan(0);
    expect([...raised].filter((code) => !listed.has(code)).sort()).toEqual([]);
  });
});
