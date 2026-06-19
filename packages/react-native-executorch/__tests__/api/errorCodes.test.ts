import { RnExecutorchErrorCode } from '../../src/errors/ErrorCodes';
import { RnExecutorchError } from '../../src/errors/errorUtils';

// TypeScript enums emit a numeric reverse-mapping: `Enum[42] === 'KeyName'`.
// We use that to walk the enum at runtime as `[name, code]` pairs.
function enumEntries(): Array<[string, number]> {
  return Object.entries(RnExecutorchErrorCode)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => [k, v as number]);
}

describe('RnExecutorchErrorCode', () => {
  const entries = enumEntries();

  it('contains entries', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every numeric code is unique', () => {
    const codes = entries.map(([, v]) => v);
    const dupes = codes.filter((c, i) => codes.indexOf(c) !== i);
    expect(dupes).toEqual([]);
  });

  it.each(entries)('%s = %s is a non-negative integer', (_name, code) => {
    expect(Number.isInteger(code)).toBe(true);
    expect(code).toBeGreaterThanOrEqual(0);
  });

  it.each(entries)('%s = %s has a working reverse lookup', (name, code) => {
    expect(
      (RnExecutorchErrorCode as unknown as Record<number, string>)[code]
    ).toBe(name);
  });

  it.each(entries)(
    'new RnExecutorchError(%s = %s) produces a non-empty message',
    (_name, code) => {
      const err = new RnExecutorchError(code);
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
      expect(err.code).toBe(code);
    }
  );
});
