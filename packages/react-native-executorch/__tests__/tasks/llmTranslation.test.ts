/**
 * The LLM (EuroLLM) translator.
 *
 * It runs on the real chat session and LLM runner; only the `.pte` below them
 * is scripted (see `support/fakeLLM.ts`), so a test sees the exact prompt each
 * line was sent with.
 */
import { createLLMTranslator } from '../../src/extensions/llm/tasks/llmTranslation';
import { fakeJsi } from '../support/fakeJsi';
import { fakeFs } from '../support/blobUtilMock';
import { tracked } from '../support/lifetime';
import { registerFakeLLM, type FakeGeneration } from '../support/fakeLLM';

const MODEL_PATH = '/models/eurollm.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const TOKENIZER_CONFIG_PATH = '/models/tokenizer_config.json';
const EOS = '<|im_end|>';

// EuroLLM-1.7B-Instruct's published chat template.
const CHAT_TEMPLATE =
  "{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}<|im_start|>system\n{% if messages[0]['role'] == 'system' %}{{ messages[0]['content'] }}{% endif %}<|im_end|>\n{% for message in messages %}{% if message['role'] != 'system' %}<|im_start|>{{ message['role'] }}\n{{ message['content'] }}<|im_end|>\n{% endif %}{% endfor %}{% if add_generation_prompt %}<|im_start|>assistant\n{% endif %}";

const config = {
  name: 'eurollm' as const,
  modelPath: MODEL_PATH,
  tokenizerPath: TOKENIZER_PATH,
  tokenizerConfigPath: TOKENIZER_CONFIG_PATH,
};

const EN_DE = { sourceLanguage: 'en', targetLanguage: 'de' };

let llm: ReturnType<typeof registerFakeLLM>;

/** Registers the model, answering with `responses` in order, one per line. */
const script = (...responses: string[]) => {
  const generations: FakeGeneration[] = responses.map((response) => ({ response }));
  llm = registerFakeLLM(MODEL_PATH, TOKENIZER_PATH, { eosToken: EOS, generations });
};

// The fake tokenizer splits on whitespace, so prompts are compared with every
// whitespace run collapsed to one space.
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();
const promptsSent = (): string[] => llm.prompts().map((prompt) => squash(prompt.text));
const userTurn = (source: string, target: string, line: string) =>
  squash(
    `<|im_start|>system\n<|im_end|>\n<|im_start|>user\n` +
      `Translate the following ${source} source text to ${target}:\n` +
      `${source}: ${line} \n${target}: <|im_end|>\n<|im_start|>assistant\n`
  );

beforeEach(() => {
  // The keys are the published `tokenizer_config.json` field names.
  /* eslint-disable camelcase */
  fakeFs.write(
    TOKENIZER_CONFIG_PATH,
    JSON.stringify({ chat_template: CHAT_TEMPLATE, eos_token: EOS })
  );
  /* eslint-enable camelcase */
  script('Hallo Welt.');
});

describe('createLLMTranslator', () => {
  it('sends each line with the model card prompt and keeps line breaks', async () => {
    script('Hallo Welt.', 'Guten Morgen.');
    const translator = tracked(await createLLMTranslator(config));

    const text = await translator.translate('Hello world.\n\nGood morning.', EN_DE);

    expect(text).toBe('Hallo Welt.\n\nGuten Morgen.');
    // Each line starts from an empty cache, without the lines before it.
    expect(promptsSent()).toEqual([
      userTurn('English', 'German', 'Hello world.'),
      userTurn('English', 'German', 'Good morning.'),
    ]);
  });

  it('translates any supported pair with the same model', async () => {
    const translator = tracked(await createLLMTranslator(config));

    await translator.translate('Dzień dobry.', { sourceLanguage: 'pl', targetLanguage: 'en' });

    expect(promptsSent()).toEqual([userTurn('Polish', 'English', 'Dzień dobry.')]);
  });

  it('drops the whitespace the reply starts with', async () => {
    script(' Hallo');
    const translator = tracked(await createLLMTranslator(config));

    expect(await translator.translate('Hello', EN_DE)).toBe('Hallo');
  });

  it('streams pieces that add up to the translation', async () => {
    script('Hallo Welt.', 'Guten Morgen.');
    const translator = tracked(await createLLMTranslator(config));
    const pieces: string[] = [];

    const text = await translator.translate('Hello world.\nGood morning.', EN_DE, (piece) =>
      pieces.push(piece)
    );
    // Pieces are delivered on the RN thread, which the mock defers to a macrotask.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(pieces.join('')).toBe(text);
  });

  it('rejects a language the model does not know', async () => {
    const translator = tracked(await createLLMTranslator(config));

    await expect(
      translator.translate('Hello', { sourceLanguage: 'en', targetLanguage: 'xx' })
    ).rejects.toThrow(/unsupported language 'xx'/);
  });

  it('releases everything on dispose', async () => {
    const translator = tracked(await createLLMTranslator(config));
    await translator.translate('Hello world.', EN_DE);
    translator.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });
});
