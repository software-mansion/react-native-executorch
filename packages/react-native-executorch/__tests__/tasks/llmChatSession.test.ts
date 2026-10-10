/**
 * The LLM chat session.
 *
 * What this suite owns is everything the session does around generation: the
 * history it keeps, the prompt it renders through the model's own chat
 * template, the KV cache bookkeeping that lets a turn prefill only what is new,
 * the tool-calling loop, and the rollback that has to leave the session usable
 * after a failed turn.
 *
 * The session runs on the real TypeScript LLM runner; only the `.pte` below it
 * is scripted (see `support/fakeLLM.ts`), so a test can drive a tool loop
 * without any weights and observe exactly what the model was asked to read.
 */
import { createLLMChatSession } from '../../src/extensions/llm/tasks/llmChatSession';
import type { ToolCall, ToolParserResult } from '../../src/extensions/llm/utils/toolCalling';
import { fakeJsi } from '../support/fakeJsi';
import { fakeFs } from '../support/blobUtilMock';
import { tracked } from '../support/lifetime';
import { registerFakeLLM, type FakeGeneration } from '../support/fakeLLM';

const MODEL_PATH = '/models/llm.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const TOKENIZER_CONFIG_PATH = '/models/tokenizer_config.json';
const EOS = '<|eot|>';
const PAD = '<|endoftext|>';
const EOT = '<|end_of_turn|>';

// A minimal but real Jinja chat template: the session renders the prompt with
// `@huggingface/jinja`, so a hand-written string here exercises the same path a
// published model's `chat_template` takes.
const CHAT_TEMPLATE = [
  '{% for message in messages %}',
  '<|{{ message.role }}|>{{ message.content }}<|end|>',
  '{% endfor %}',
  '{% if add_generation_prompt %}<|assistant|>{% endif %}',
].join('');

const config = {
  modelPath: MODEL_PATH,
  tokenizerPath: TOKENIZER_PATH,
  tokenizerConfigPath: TOKENIZER_CONFIG_PATH,
};

// The keys are snake_case because they are the published `tokenizer_config.json`
// field names, which the session reads verbatim.
/* eslint-disable camelcase */
const writeTokenizerConfig = (extra: Record<string, unknown> = {}) =>
  fakeFs.write(
    TOKENIZER_CONFIG_PATH,
    JSON.stringify({ chat_template: CHAT_TEMPLATE, eos_token: EOS, ...extra })
  );

const writeRawTokenizerConfig = (raw: Record<string, unknown>) =>
  fakeFs.write(TOKENIZER_CONFIG_PATH, JSON.stringify(raw));

const CONFIG_WITHOUT_TEMPLATE = { eos_token: EOS };
const CONFIG_WITHOUT_EOS = { chat_template: CHAT_TEMPLATE };
const NAMED_TEMPLATES = {
  chat_template: [
    { name: 'tool_use', template: '{{ "wrong" }}' },
    { name: 'default', template: CHAT_TEMPLATE },
  ],
};
/* eslint-enable camelcase */

let llm: ReturnType<typeof registerFakeLLM>;

/** Registers the model, answering with `generations` in order. */
const script = (generations: readonly FakeGeneration[]) => {
  llm = registerFakeLLM(MODEL_PATH, TOKENIZER_PATH, { eosToken: EOS, generations });
};

/** Everything the model was asked to read this test, prefill by prefill. */
const promptsSent = (): string[] => llm.prompts().map((prompt) => prompt.text);

beforeEach(() => {
  writeTokenizerConfig();
  script([{ response: 'hello there ' }]);
});

describe('createLLMChatSession — construction', () => {
  it('rejects a tokenizer config without a chat template', async () => {
    writeRawTokenizerConfig(CONFIG_WITHOUT_TEMPLATE);

    await expect(createLLMChatSession(config)).rejects.toThrow(/chat_template/);
  });

  it('rejects a tokenizer config without an eos token', async () => {
    writeRawTokenizerConfig(CONFIG_WITHOUT_EOS);

    await expect(createLLMChatSession(config)).rejects.toThrow(/eos_token/);
  });

  it('picks the default entry when the config ships several named templates', async () => {
    writeTokenizerConfig(NAMED_TEMPLATES);
    const session = tracked(await createLLMChatSession(config));

    await session.sendMessage('hi');

    expect(promptsSent().join('')).toContain('<|user|>hi<|end|>');
  });

  it('starts with an empty history and an empty KV cache', async () => {
    const session = tracked(await createLLMChatSession(config));

    expect(session.getHistory()).toEqual([]);
    expect(session.getKVCacheState().pos).toBe(0);
  });

  it('prefills the initial messages without asking for a generation', async () => {
    const session = tracked(
      await createLLMChatSession(config, {
        initialMessages: [{ role: 'system', content: 'be brief' }],
      })
    );

    expect(session.getHistory()).toEqual([{ role: 'system', content: 'be brief' }]);
    expect(promptsSent()).toEqual(['<|system|>be brief<|end|>']);
    expect(session.getKVCacheState().pos).toBeGreaterThan(0);
  });

  it('releases the model and the tokenizer on dispose', async () => {
    const session = await createLLMChatSession(config);

    session.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });
});

describe('createLLMChatSession — a turn', () => {
  it('appends the user message and the assistant reply to the history', async () => {
    const session = tracked(await createLLMChatSession(config));

    const result = await session.sendMessage('hi');

    expect(session.getHistory()).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello there ' },
    ]);
    expect(result.messages).toEqual(session.getHistory());
    expect(result.finishReason).toBe('stop');
  });

  it('renders the prompt through the model chat template', async () => {
    const session = tracked(await createLLMChatSession(config));

    await session.sendMessage('hi');

    const sent = promptsSent().join('');
    expect(sent).toContain('<|user|>hi<|end|>');
    // The generation prompt is appended only for the generate call, never for
    // the prefill that commits the user message.
    expect(sent).toContain('<|assistant|>');
  });

  it('streams every token to the callback', async () => {
    script([{ response: 'one two three' }]);
    const session = tracked(await createLLMChatSession(config));
    const tokens: string[] = [];

    await session.sendMessage('hi', (token) => tokens.push(token));
    // `scheduleOnRN` defers the callback by a macrotask, as the real dispatch does.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tokens.join('')).toBe('one two three');
  });

  it('keeps the eos token out of the response and out of the stream', async () => {
    script([{ response: `done ${EOS}` }]);
    const session = tracked(await createLLMChatSession(config));
    const tokens: string[] = [];

    const result = await session.sendMessage('hi', (token) => tokens.push(token));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.messages.at(-1)!.content).toBe('done ');
    expect(tokens).not.toContain(EOS);
  });

  // Qwen ends a turn with `<|im_end|>` but also stops on `<|endoftext|>`, which
  // its config only names as `pad_token`, so `eos_token` alone does not cover it.
  it('keeps a terminal token named only as pad_token out of the response', async () => {
    writeTokenizerConfig({ pad_token: PAD }); // eslint-disable-line camelcase
    script([{ response: `done ${PAD}` }]);
    const session = tracked(await createLLMChatSession(config));
    const tokens: string[] = [];

    const result = await session.sendMessage('hi', (token) => tokens.push(token));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.messages.at(-1)!.content).toBe('done ');
    expect(tokens.join('')).not.toContain(PAD);
  });

  it('keeps a terminal token named only as eot_token out of the response', async () => {
    writeTokenizerConfig({ eot_token: EOT }); // eslint-disable-line camelcase
    script([{ response: `done ${EOT}` }]);
    const session = tracked(await createLLMChatSession(config));

    const result = await session.sendMessage('hi');

    expect(result.messages.at(-1)!.content).toBe('done ');
  });

  it('stops generating as soon as the stop pattern matches', async () => {
    script([{ response: 'keep going STOP more' }]);
    const session = tracked(await createLLMChatSession(config, { stopRegex: /STOP/ }));

    const result = await session.sendMessage('hi');

    expect(result.messages.at(-1)!.content).toContain('STOP');
    expect(result.messages.at(-1)!.content).not.toContain('more');
  });

  it('reports the generation statistics of the turn', async () => {
    const session = tracked(await createLLMChatSession(config));

    const [stats, ...rest] = (await session.sendMessage('hi')).stats;

    expect(rest).toEqual([]);
    expect(stats).toMatchObject({
      numTokens: 2,
      durationMs: expect.any(Number),
      tokensPerSecond: expect.any(Number),
      prefill: {
        numTokens: expect.any(Number),
        durationMs: expect.any(Number),
        tokensPerSecond: expect.any(Number),
      },
    });
  });

  it('only prefills what is new on the second turn', async () => {
    const session = tracked(await createLLMChatSession(config));
    await session.sendMessage('first question');

    const before = promptsSent().length;
    await session.sendMessage('second question');

    const secondTurn = promptsSent().slice(before);

    // The first turn is already in the KV cache, so it must not be re-sent.
    expect(secondTurn.join('')).toContain('second question');
    expect(secondTurn.join('')).not.toContain('first question');
  });

  it('re-prefills the whole conversation each turn when asked to reset', async () => {
    const session = tracked(await createLLMChatSession(config, { resetOnTurn: true }));
    await session.sendMessage('first question');

    const before = llm.prompts().length;
    await session.sendMessage('second question');

    const secondTurn = llm.prompts().slice(before);
    expect(secondTurn[0]!.startPos).toBe(0);
    expect(secondTurn.map((prompt) => prompt.text).join('')).toContain('first question');
  });

  it('stops the generation in flight on stop()', async () => {
    script([{ response: 'one two three' }]);
    const session = tracked(await createLLMChatSession(config));

    // The constraints callback runs on every sampling step, which makes it a
    // hook into the middle of a generation.
    const result = await session.sendMessage('hi', undefined, {
      constraints: () => {
        session.stop();
        return undefined;
      },
    });

    expect(result.messages.at(-1)!.content).toBe('one ');
  });
});

describe('createLLMChatSession — tool calling', () => {
  const callTool = (name: string, args: Record<string, unknown> = {}): ToolCall => ({
    id: `call-${name}`,
    type: 'function',
    function: { name, arguments: args },
  });

  /** Parses the first line of a response as `TOOL <name>`, and nothing else. */
  const parseToolCalls = (text: string): ToolParserResult | undefined => {
    const match = /^TOOL (\w+)/.exec(text.trim());
    if (!match) return { toolCalls: [], textContent: text };
    return { toolCalls: [callTool(match[1]!)], textContent: '' };
  };

  const weather = {
    type: 'function',
    function: { name: 'weather', description: 'current weather' },
    execute: jest.fn(async () => 'sunny'),
  };

  beforeEach(() => weather.execute.mockClear());

  it('runs the tool and feeds its result back for a second generation', async () => {
    script([{ response: 'TOOL weather' }, { response: 'it is sunny' }]);
    const session = tracked(
      await createLLMChatSession(config, { toolOpts: { tools: [weather], parseToolCalls } })
    );

    const result = await session.sendMessage('what is the weather');

    expect(weather.execute).toHaveBeenCalledTimes(1);
    expect(session.getHistory().map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'tool',
      'assistant',
    ]);
    expect(result.messages.at(-1)!.content).toBe('it is sunny');
    expect(result.finishReason).toBe('stop');
    // One generation per turn of the loop.
    expect(result.stats).toHaveLength(2);
  });

  it('records the tool result against the call that asked for it', async () => {
    script([{ response: 'TOOL weather' }, { response: 'it is sunny' }]);
    const session = tracked(
      await createLLMChatSession(config, { toolOpts: { tools: [weather], parseToolCalls } })
    );

    await session.sendMessage('what is the weather');

    expect(session.getHistory()[2]).toMatchObject({
      role: 'tool',
      name: 'weather',
      toolCallId: 'call-weather',
      content: 'sunny',
    });
  });

  it('reports an unknown tool back to the model rather than throwing', async () => {
    script([{ response: 'TOOL missing' }, { response: 'sorry' }]);
    const session = tracked(
      await createLLMChatSession(config, { toolOpts: { tools: [weather], parseToolCalls } })
    );

    await session.sendMessage('hi');

    expect(session.getHistory()[2]!.content).toMatch(/not recognized|not available/);
  });

  it('reports a throwing tool back to the model rather than failing the turn', async () => {
    script([{ response: 'TOOL weather' }, { response: 'sorry' }]);
    weather.execute.mockRejectedValueOnce(new Error('the service is down'));
    const session = tracked(
      await createLLMChatSession(config, { toolOpts: { tools: [weather], parseToolCalls } })
    );

    const result = await session.sendMessage('hi');

    expect(session.getHistory()[2]!.content).toMatch(/the service is down/);
    expect(result.finishReason).toBe('stop');
  });

  it('gives up after maxToolTurns rather than looping forever', async () => {
    // A model that only ever asks for the tool again.
    script([{ response: 'TOOL weather' }]);
    const session = tracked(
      await createLLMChatSession(config, {
        toolOpts: { tools: [weather], parseToolCalls, maxToolTurns: 3 },
      })
    );

    const result = await session.sendMessage('hi');

    expect(result.finishReason).toBe('maxToolTurns');
    expect(weather.execute).toHaveBeenCalledTimes(3);
  });
});

describe('createLLMChatSession — failure', () => {
  it('rolls the history and the KV cache back when a turn fails', async () => {
    const session = tracked(await createLLMChatSession(config));
    await session.sendMessage('first question');
    const historyBefore = session.getHistory();
    const posBefore = session.getKVCacheState().pos;

    // A tool parser that throws stands in for any mid-turn failure: the turn is
    // already past its prefill when it happens.
    const failing = tracked(
      await createLLMChatSession(config, {
        toolOpts: {
          tools: [],
          parseToolCalls: () => {
            throw new Error('parser blew up');
          },
        },
      })
    );
    await expect(failing.sendMessage('doomed')).rejects.toThrow('parser blew up');

    expect(failing.getHistory()).toEqual([]);
    // The session that did not fail is untouched.
    expect(session.getHistory()).toEqual(historyBefore);
    expect(session.getKVCacheState().pos).toBe(posBefore);
  });

  it("reports the turn's own error, not the rollback's, when resetting each turn", async () => {
    // `resetOnTurn` zeroes the cache at the start of the turn, so the position
    // captured before it is already unreachable by the time the rollback runs.
    // Rewinding to it throws, and that throw used to replace the real failure:
    // a bounded-prefill rejection on a dynamic-shape model surfaced as
    // "LLMRunner.reset: targetPos must be in range [0, 0]" and read as a KV
    // cache bug.
    let failing = false;
    const session = tracked(
      await createLLMChatSession(config, {
        resetOnTurn: true,
        toolOpts: {
          tools: [],
          parseToolCalls: (text) => {
            if (failing) throw new Error('prefill exceeded the model bound');
            return { toolCalls: [], textContent: text };
          },
        },
      })
    );

    // A first turn, so the pre-turn position is past zero when the next one
    // resets it.
    await session.sendMessage('first question');
    expect(session.getKVCacheState().pos).toBeGreaterThan(0);
    const historyBefore = session.getHistory();

    failing = true;
    await expect(session.sendMessage('doomed')).rejects.toThrow('prefill exceeded the model bound');

    // The session survives the failed turn: the doomed turn leaves no trace.
    expect(session.getHistory()).toEqual(historyBefore);
    failing = false;
    await expect(session.sendMessage('after')).resolves.toBeDefined();
  });

  it('is still usable after a failed turn', async () => {
    let shouldFail = true;
    const session = tracked(
      await createLLMChatSession(config, {
        toolOpts: {
          tools: [],
          parseToolCalls: (text) => {
            if (shouldFail) throw new Error('parser blew up');
            return { toolCalls: [], textContent: text };
          },
        },
      })
    );
    await expect(session.sendMessage('doomed')).rejects.toThrow();

    shouldFail = false;
    const result = await session.sendMessage('second try');

    expect(session.getHistory().map((message) => message.content)).toEqual([
      'second try',
      'hello there ',
    ]);
    expect(result.finishReason).toBe('stop');
  });

  it('surfaces a missing model rather than resolving with a broken session', async () => {
    fakeJsi.reset();
    writeTokenizerConfig();

    await expect(createLLMChatSession(config)).rejects.toThrow(/no program registered/);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('releases the runner when the initial prefill fails', async () => {
    // The one window where construction allocates and can still throw: the
    // runner exists, and rendering the initial messages blows up. The caller
    // never gets a `dispose`, so the factory has to release it itself.
    // eslint-disable-next-line camelcase
    writeRawTokenizerConfig({ chat_template: '{{ not_a_filter() }}', eos_token: EOS });

    await expect(
      createLLMChatSession(config, { initialMessages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });
});
