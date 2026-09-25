/**
 * Locating the words of a text in its phonemization.
 *
 * The native phonemizer returns one IPA string for the whole text, and before
 * phonemizing it normalizes the text, spelling numbers out as words. What is
 * pinned here is how `phonemizeWords` undoes that: every word maps onto its
 * own space-separated phoneme group, except for numbers, which take as many
 * groups as they were spelled out into.
 */
import { createPhonemizer, phonemizeWords } from '../../src/extensions/speech/utils/phonemizer';
import { fakePhonemizer } from '../support/fakeOps';
import { tracked } from '../support/lifetime';

/** Every located word, with the phonemes it was located at. */
const locate = (text: string) => {
  const phonemizer = tracked(createPhonemizer({ lang: 'en-us' }));
  const { phonemes, words } = phonemizeWords(phonemizer, text);
  return {
    phonemes,
    words: words.map((word) => ({
      text: word.text,
      offset: word.offset,
      phonemes: phonemes.slice(word.phonemeOffset, word.phonemeOffset + word.phonemeLength),
    })),
  };
};

describe('phonemizeWords', () => {
  it('phonemizes the text the same way phonemize does', () => {
    fakePhonemizer.serve('Hello world', 'həlˈoʊ wˈɜɹld');
    const phonemizer = tracked(createPhonemizer({ lang: 'en-us' }));

    expect(phonemizeWords(phonemizer, 'Hello world').phonemes).toBe(
      phonemizer.phonemize('Hello world')
    );
  });

  it('maps each word onto its phoneme group, at its offset in the input', () => {
    fakePhonemizer.serve('Hello man world!', 'həlˈoʊ mˈæn wˈɜɹld!');

    expect(locate('  Hello \t man world!').words).toEqual([
      { text: 'Hello', offset: 2, phonemes: 'həlˈoʊ' },
      { text: 'man', offset: 10, phonemes: 'mˈæn' },
      { text: 'world!', offset: 14, phonemes: 'wˈɜɹld!' },
    ]);
  });

  it('maps a spelled-out number onto all the words it became', () => {
    fakePhonemizer.serveNormalization('I have 25 cats', 'I have twenty five cats');
    fakePhonemizer.serveNormalization('25', 'twenty five');

    expect(locate('I have 25 cats').words).toEqual([
      { text: 'I', offset: 0, phonemes: 'i' },
      { text: 'have', offset: 2, phonemes: 'have' },
      { text: '25', offset: 7, phonemes: 'twenty five' },
      { text: 'cats', offset: 10, phonemes: 'cats' },
    ]);
  });

  it('keeps the words after a number that was dropped in place', () => {
    fakePhonemizer.serveNormalization('a 99 b', 'a  b');
    fakePhonemizer.serveNormalization('99', '');

    expect(locate('a 99 b').words).toEqual([
      { text: 'a', offset: 0, phonemes: 'a' },
      { text: '99', offset: 2, phonemes: '' },
      { text: 'b', offset: 5, phonemes: 'b' },
    ]);
  });

  it('gives up on the words when a number reads differently on its own', () => {
    // Every word after the number would be off by one, so none is returned.
    fakePhonemizer.serveNormalization('x 7 y', 'x seven y');
    fakePhonemizer.serveNormalization('7', 'seven more');

    expect(locate('x 7 y')).toEqual({ phonemes: 'x seven y', words: [] });
  });
});
