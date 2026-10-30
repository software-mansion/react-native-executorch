import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { getResourceCachePath } from '../../src/utils';
import { download } from '../../src/fetcher/fetcher';
import { setTelemetryEnabled } from '../../src/fetcher/telemetry';
import { RENAMED_HF_REPOS } from '../../src/fetcher/renamedRepos';
import { fakeFs, fakeNet } from '../support/blobUtilMock';

const org = 'https://huggingface.co/software-mansion/';

describe('getResourceCachePath', () => {
  it.each(Object.entries(RENAMED_HF_REPOS))('preserves cache identity for %s', (name, alias) => {
    const path = '/resolve/v1.0.0/model.pte';
    expect(getResourceCachePath(org + name + path)).toBe(getResourceCachePath(org + alias + path));
  });

  it('ignores query parameters and keeps different resource URLs distinct', () => {
    const source = 'https://example.com/models/one/model.pte';
    expect(getResourceCachePath(source + '?download=true')).toBe(getResourceCachePath(source));
    expect(getResourceCachePath(source)).not.toBe(
      getResourceCachePath(source.replace('/one/', '/two/'))
    );
  });

  it('uses the platform persistent directory', () => {
    const directory =
      Platform.OS === 'android'
        ? RNBlobUtil.fs.dirs.SDCardDir || RNBlobUtil.fs.dirs.DocumentDir
        : RNBlobUtil.fs.dirs.DocumentDir;
    expect(getResourceCachePath('https://example.com/model.pte')).toMatch(
      directory + '/react-native-executorch/'
    );
  });

  it('passes through local paths without filesystem or network work', () => {
    expect(getResourceCachePath('file:///local/model.pte')).toBe('/local/model.pte');
    expect(getResourceCachePath('/local/model.pte')).toBe('/local/model.pte');
    getResourceCachePath('https://example.com/model.pte');
    expect(fakeFs.paths()).toHaveLength(0);
    expect(fakeNet.requests()).toHaveLength(0);
  });

  it('returns the same path as the downloader', async () => {
    const source = 'https://example.com/model.pte';
    fakeNet.serve(source, { body: 'model-bytes' });
    setTelemetryEnabled(false);
    try {
      const path = await download(source);
      expect(path).toBe(getResourceCachePath(source));
      expect(fakeFs.readText(path)).toBe('model-bytes');
    } finally {
      setTelemetryEnabled(true);
    }
  });
});
