import { createTokenizer } from '../../src/extensions/nlp/tasks/tokenization';
import { loadTokenizer } from '../../src/extensions/nlp/tokenizer';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';

const TOKENIZER_PATH = '/models/tokenizer.json';
const TOKENS = ['<s>', '</s>', 'hello', 'world', 'react'];

const register = () =>
  fakeJsi.registerTokenizer(TOKENIZER_PATH, {
    tokens: TOKENS,
    prefix: [0],
    suffix: [1],
    specialIds: [0, 1],
  });

describe('loadTokenizer', () => {
  it('propagates a load failure', () => {
    expect(() => loadTokenizer('/models/absent.json')).toThrow(/absent.json/);
  });

  it('exposes the loaded path', () => {
    register();
    const tokenizer = loadTokenizer(TOKENIZER_PATH);
    expect(tokenizer.path).toBe(TOKENIZER_PATH);
    tokenizer.dispose();
  });
});

describe('createTokenizer', () => {
  beforeEach(register);

  it('encodes to an Int32Array, adding the post-processor special tokens', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));

    const ids = await tokenizer.encode('hello world');

    expect(ids).toBeInstanceOf(Int32Array);
    expect([...ids]).toEqual([0, 2, 3, 1]);
  });

  it('round-trips text through encode and decode', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));

    const ids = await tokenizer.encode('hello world');

    expect(await tokenizer.decode(ids)).toBe('hello world');
  });

  it('keeps the special tokens when asked not to skip them', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));

    const ids = await tokenizer.encode('hello');

    expect(await tokenizer.decode(ids, false)).toBe('<s> hello </s>');
  });

  it('reports the vocabulary size', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));
    expect(tokenizer.getVocabSize()).toBe(TOKENS.length);
  });

  it('maps between ids and tokens in both directions', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));

    expect(tokenizer.idToToken(2)).toBe('hello');
    expect(tokenizer.tokenToId('hello')).toBe(2);
  });

  it('throws for an id outside the vocabulary', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));
    expect(() => tokenizer.idToToken(999)).toThrow(/out of range/);
  });

  it('throws for a token outside the vocabulary', async () => {
    const tokenizer = tracked(await createTokenizer(TOKENIZER_PATH));
    expect(() => tokenizer.tokenToId('absent')).toThrow(/not in the vocabulary/);
  });

  it('surfaces a load failure as a rejected promise', async () => {
    await expect(createTokenizer('/models/absent.json')).rejects.toThrow(/absent.json/);
  });

  it('releases the native tokenizer on dispose', async () => {
    const tokenizer = await createTokenizer(TOKENIZER_PATH);
    expect(fakeJsi.liveTokenizers()).toEqual([TOKENIZER_PATH]);

    tokenizer.dispose();

    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });

  it('rejects use after dispose', async () => {
    const tokenizer = await createTokenizer(TOKENIZER_PATH);
    tokenizer.dispose();

    await expect(tokenizer.encode('hello')).rejects.toThrow(/disposed/);
  });
});
