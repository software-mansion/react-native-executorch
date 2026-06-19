import * as RNE from '../../src';

// Snapshots the sorted list of public export names from
// `src/index.ts`. Any addition or removal flips the snapshot so the change is
// surfaced in the diff — a deliberate API tweak just needs `--updateSnapshot`,
// an accidental break does not slip through.
describe('Public API surface', () => {
  it('export names match snapshot', () => {
    const exportNames = Object.keys(RNE).sort();
    expect(exportNames).toMatchSnapshot();
  });

  it('every export is non-undefined', () => {
    for (const [name, value] of Object.entries(RNE)) {
      expect({ name, defined: value !== undefined }).toEqual({
        name,
        defined: true,
      });
    }
  });
});
