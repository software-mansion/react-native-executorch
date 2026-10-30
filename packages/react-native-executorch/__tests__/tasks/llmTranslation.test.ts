/**
 * The LLM (EuroLLM, Hy-MT2) translator.
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

describe('createLLMTranslator with Hy-MT2', () => {
  const HY_EOS = '<｜hy_place▁holder▁no▁2｜>';
  // Hy-MT2-1.8B's chat_template.jinja, which the published tokenizer_config.json carries.
  const HY_CHAT_TEMPLATE =
    "{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}<｜hy_begin▁of▁sentence｜>{{ system_message }}<｜hy_place▁holder▁no▁3｜>{% else %}{% set loop_messages = messages %}<｜hy_begin▁of▁sentence｜>{% endif %}{% for message in loop_messages %}{% if message['role'] == 'user' %}<｜hy_User｜>{{ message['content'] }}{% elif message['role'] == 'assistant' %}<｜hy_Assistant｜>{{ message['content'] }}<｜hy_place▁holder▁no▁2｜>{% endif %}{% endfor %}{% if add_generation_prompt %}<｜hy_Assistant｜>{% else %}<｜hy_place▁holder▁no▁8｜>{% endif %}";
  const hyConfig = { ...config, name: 'hy-mt2' as const };
  const hyTurn = (content: string) =>
    squash(`<｜hy_begin▁of▁sentence｜><｜hy_User｜>${content}<｜hy_Assistant｜>`);

  beforeEach(() => {
    // The fake fs stores one byte per char, so anything outside printable ASCII
    // goes in as a JSON escape.
    /* eslint-disable camelcase */
    const json = JSON.stringify({ chat_template: HY_CHAT_TEMPLATE, eos_token: HY_EOS });
    /* eslint-enable camelcase */
    fakeFs.write(
      TOKENIZER_CONFIG_PATH,
      json.replace(/[^ -~]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
    );
    llm = registerFakeLLM(MODEL_PATH, TOKENIZER_PATH, {
      eosToken: HY_EOS,
      generations: [{ response: 'Hallo Welt.' }],
    });
  });

  it('sends the model card prompt naming the target language', async () => {
    const translator = tracked(await createLLMTranslator(hyConfig));

    expect(await translator.translate('Hello world.', EN_DE)).toBe('Hallo Welt.');
    expect(promptsSent()).toEqual([
      hyTurn(
        'Translate the following text into German. Note that you should only output ' +
          'the translated result without any additional explanation:\n\nHello world.'
      ),
    ]);
  });

  it('uses the Chinese prompt when either side is Chinese', async () => {
    const translator = tracked(await createLLMTranslator(hyConfig));

    await translator.translate('Hello world.', { sourceLanguage: 'en', targetLanguage: 'zh' });

    expect(promptsSent()).toEqual([
      hyTurn('将以下文本翻译为中文，注意只需要输出翻译后的结果，不要额外解释：\n\nHello world.'),
    ]);
  });

  it('rejects a language the model does not know', async () => {
    const translator = tracked(await createLLMTranslator(hyConfig));

    // Maltese is a EuroLLM language, not a Hy-MT2 one.
    await expect(
      translator.translate('Hello', { sourceLanguage: 'mt', targetLanguage: 'en' })
    ).rejects.toThrow(/unsupported language 'mt'/);
  });
});
