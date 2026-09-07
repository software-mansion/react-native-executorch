import { Platform } from 'react-native';

import {
  setTelemetryEnabled,
  triggerDownloadEvent,
  triggerHuggingFaceDownloadCounter,
} from '../../src/fetcher/telemetry';
import { fakeJsi } from '../support/fakeJsi';
import { flush } from '../support/async';
import { fakeNet } from '../support/blobUtilMock';

const ANALYTICS = 'https://ai.swmansion.com/telemetry/downloads/api/downloads';
const SWM_MODEL = 'https://huggingface.co/software-mansion/whisper-tiny/resolve/v1/model.pte';
const SWM_COUNTER = 'https://huggingface.co/software-mansion/whisper-tiny/resolve/main/config.json';

/** The body the analytics endpoint was posted, parsed. */
const postedPayload = (): Record<string, unknown> => {
  const call = (globalThis.fetch as jest.Mock).mock.calls.find(([url]) => url === ANALYTICS);
  if (!call) throw new Error('the analytics endpoint was not called');
  return JSON.parse(call[1].body);
};

beforeEach(() => {
  fakeNet.serve(ANALYTICS);
  fakeNet.serve(SWM_COUNTER);
  globalThis.fetch = jest.fn(globalThis.fetch);
  setTelemetryEnabled(true);
});

afterEach(() => {
  setTelemetryEnabled(true);
});

describe('triggerHuggingFaceDownloadCounter', () => {
  it('HEADs the repo config.json for a Software Mansion repo', async () => {
    triggerHuggingFaceDownloadCounter(SWM_MODEL);
    await flush();

    expect(globalThis.fetch).toHaveBeenCalledWith(SWM_COUNTER, { method: 'HEAD' });
  });

  it('fires even when analytics are opted out of', async () => {
    setTelemetryEnabled(false);
    triggerHuggingFaceDownloadCounter(SWM_MODEL);
    await flush();

    expect(fakeNet.countRequests('HEAD', SWM_COUNTER)).toBe(1);
  });

  it.each([
    ['another Hugging Face org', 'https://huggingface.co/other-org/model/resolve/v1/model.pte'],
    ['a non-Hugging Face host', 'https://example.com/software-mansion/model.pte'],
  ])('does nothing for %s', async (_label, url) => {
    triggerHuggingFaceDownloadCounter(url);
    await flush();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('swallows a malformed URI rather than failing the download', async () => {
    expect(() => triggerHuggingFaceDownloadCounter('not a url')).not.toThrow();
  });

  it('swallows a rejected request', async () => {
    fakeNet.serve(SWM_COUNTER, { error: new Error('offline') });
    expect(() => triggerHuggingFaceDownloadCounter(SWM_MODEL)).not.toThrow();
    await flush();
  });
});

describe('triggerDownloadEvent', () => {
  it('posts the model name derived from the URI, without its extension', async () => {
    triggerDownloadEvent(SWM_MODEL);
    await flush();

    expect(postedPayload().modelName).toBe('model');
  });

  it('reports the platform and the emulator flag from the native installer', async () => {
    fakeJsi.setIsEmulator(true);
    triggerDownloadEvent(SWM_MODEL);
    await flush();

    expect(postedPayload()).toMatchObject({ isEmulator: true, platform: Platform.OS });
  });

  it('sends nothing once analytics are opted out of', async () => {
    setTelemetryEnabled(false);
    triggerDownloadEvent(SWM_MODEL);
    await flush();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('resumes sending when analytics are opted back in', async () => {
    setTelemetryEnabled(false);
    triggerDownloadEvent(SWM_MODEL);
    setTelemetryEnabled(true);
    triggerDownloadEvent(SWM_MODEL);
    await flush();

    expect(fakeNet.countRequests('POST', ANALYTICS)).toBe(1);
  });

  it('swallows a rejected request', async () => {
    fakeNet.serve(ANALYTICS, { error: new Error('offline') });
    expect(() => triggerDownloadEvent(SWM_MODEL)).not.toThrow();
    await flush();
  });

  describe('country code', () => {
    const withLocale = async (locale: string): Promise<unknown> => {
      const original = Intl.DateTimeFormat;
      jest
        .spyOn(Intl, 'DateTimeFormat')
        .mockImplementation(
          () => ({ resolvedOptions: () => ({ locale }) }) as unknown as Intl.DateTimeFormat
        );
      try {
        triggerDownloadEvent(SWM_MODEL);
        await flush();
        return postedPayload().countryCode;
      } finally {
        (Intl as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat = original;
      }
    };

    it.each([
      ['en-US', 'US'],
      ['pt-BR', 'BR'],
      ['es-419', '419'],
      ['de-DE-u-ca-gregory', 'DE'],
      ['zh-Hans-CN', 'CN'],
    ])('reads the region out of %s as %s', async (locale, expected) => {
      expect(await withLocale(locale)).toBe(expected);
    });

    it.each([
      // A language-only locale must not be misread as a country: 'de' is not
      // Germany, 'uk' is Ukrainian rather than the United Kingdom, and 'sv' is
      // Swedish rather than El Salvador.
      ['de'],
      ['uk'],
      ['sv'],
    ])('reports UNKNOWN for the language-only locale %s', async (locale) => {
      expect(await withLocale(locale)).toBe('UNKNOWN');
    });

    it('stops at an extension singleton rather than reading past it', async () => {
      expect(await withLocale('en-u-nu-latn')).toBe('UNKNOWN');
    });
  });
});
