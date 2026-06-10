import * as Voices from '../../src/constants/tts/voices';
import { URL_PREFIX } from '../../src/constants/versions';

// Voice variable-name region prefix → expected `phonemizerConfig.lang`. A
// voice constant exported under e.g. `KOKORO_FRENCH_*` is expected to carry
// `lang: 'fr'`. A mismatch is almost always a copy-paste bug, so we keep the
// map narrow and explicit.
const REGION_TO_LANG: Record<string, string> = {
  AMERICAN_ENGLISH: 'en-us',
  BRITISH_ENGLISH: 'en-gb',
  FRENCH: 'fr',
  SPANISH: 'es',
  ITALIAN: 'it',
  PORTUGUESE: 'pt',
  HINDI: 'hi',
  POLISH: 'pl',
  GERMAN: 'de',
};

type VoiceConfig = {
  voiceSource: string;
  phonemizerConfig: {
    lang: string;
    taggerSource?: string;
    lexiconSource?: string;
    neuralModelSource?: string;
  };
  model: { modelName?: string };
};

function regionOf(name: string): string | null {
  for (const region of Object.keys(REGION_TO_LANG)) {
    if (name.startsWith(`KOKORO_${region}_`)) return region;
  }
  return null;
}

function getVoiceEntries(): Array<[string, VoiceConfig]> {
  return Object.entries(Voices)
    .filter(([name]) => name.startsWith('KOKORO_'))
    .map(([name, value]) => [name, value as VoiceConfig]);
}

describe('Kokoro voices', () => {
  const voices = getVoiceEntries();

  it('exports voices', () => {
    expect(voices.length).toBeGreaterThan(0);
  });

  it.each(voices)('%s has a known region prefix', (name) => {
    expect(regionOf(name)).not.toBeNull();
  });

  it.each(voices)(
    '%s phonemizerConfig.lang matches its region prefix',
    (name, voice) => {
      const region = regionOf(name);
      if (!region) throw new Error(`No region for ${name}`);
      expect(voice.phonemizerConfig.lang).toBe(REGION_TO_LANG[region]);
    }
  );

  it.each(voices)(
    '%s voiceSource points at the Kokoro voices directory',
    (_name, voice) => {
      expect(voice.voiceSource.startsWith(URL_PREFIX)).toBe(true);
      expect(voice.voiceSource).toMatch(/\/voices\/[^/]+\.bin$/);
    }
  );

  it.each(voices)(
    '%s phonemizer URLs all live under the voice language directory',
    (_name, voice) => {
      const { lang, taggerSource, lexiconSource, neuralModelSource } =
        voice.phonemizerConfig;
      const expectedSegment = `/phonemizer/${lang}/`;
      for (const url of [taggerSource, lexiconSource, neuralModelSource]) {
        if (url === undefined) continue;
        expect(url.startsWith(URL_PREFIX)).toBe(true);
        expect(url).toContain(expectedSegment);
      }
    }
  );

  it.each(voices)('%s references a model with a modelName', (_name, voice) => {
    expect(typeof voice.model.modelName).toBe('string');
    expect(voice.model.modelName?.length ?? 0).toBeGreaterThan(0);
  });
});
