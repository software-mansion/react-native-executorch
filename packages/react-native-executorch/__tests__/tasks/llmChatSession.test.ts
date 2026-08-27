/**
 * The LLM chat session.
 *
 * The generation itself belongs to the native runner, so what this suite owns
 * is everything the session does around it: the history it keeps, the prompt it
 * renders through the model's own chat template, the KV cache bookkeeping that
 * lets a turn prefill only what is new, the tool-calling loop, and the rollback
 * that has to leave the session usable after a failed turn.
 *
 * The fake runner models its KV cache as a token position that prefill and
 * generate advance and `reset` rewinds — which is the only part of the native
 * state the session reasons about — and hands out scripted responses, so a test
 * can drive a tool loop without any weights.
 */
import { createLLMChatSession } from '../../src/extensions/llm/tasks/llmChatSession';
import type { ToolCall, ToolParserResult } from '../../src/extensions/llm/utils/toolCalling';
import { fakeJsi } from '../support/fakeJsi';
import { fakeFs } from '../support/blobUtilMock';
import { tracked } from '../support/lifetime';
import { allowNativeLeaks } from '../support/setup';

const MODEL_PATH = '/models/llm.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const TOKENIZER_CONFIG_PATH = '/models/tokenizer_config.json';
const EOS = '<|eot|>';

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

/** Everything the session sent to the runner this test, prefill and generate. */
const promptsSent = (): string[] =>
  fakeJsi
    .runnerCalls()
    .filter((call) => call.kind === 'prefill' || call.kind === 'generate')
    .map((call) => (call as { text: string }).text);

beforeEach(() => {
  writeTokenizerConfig();
  fakeJsi.registerLLMRunner(MODEL_PATH, { generations: [{ response: 'hello there ' }] });
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
    expect(fakeJsi.runnerCalls().map((call) => call.kind)).toEqual(['prefill']);
    expect(session.getKVCacheState().pos).toBeGreaterThan(0);
  });

  it('releases the runner on dispose', async () => {
    const session = await createLLMChatSession(config);

    session.dispose();

    expect(fakeJsi.liveRunners()).toEqual([]);
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
    fakeJsi.registerLLMRunner(MODEL_PATH, { generations: [{ response: 'one two three' }] });
    const session = tracked(await createLLMChatSession(config));
    const tokens: string[] = [];

    await session.sendMessage('hi', (token) => tokens.push(token));
    // `scheduleOnRN` defers the callback by a macrotask, as the real dispatch does.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tokens.join('')).toBe('one two three');
  });

  it('keeps the eos token out of the response and out of the stream', async () => {
    fakeJsi.registerLLMRunner(MODEL_PATH, { generations: [{ response: `done ${EOS}` }] });
    const session = tracked(await createLLMChatSession(config));
    const tokens: string[] = [];

    const result = await session.sendMessage('hi', (token) => tokens.push(token));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.messages.at(-1)!.content).toBe('done ');
    expect(tokens).not.toContain(EOS);
  });

  it('stops generating as soon as the stop pattern matches', async () => {
    fakeJsi.registerLLMRunner(MODEL_PATH, { generations: [{ response: 'keep going STOP more' }] });
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
      numGeneratedTokens: expect.any(Number),
      numPromptTokens: expect.any(Number),
      prefillDurationMs: expect.any(Number),
    });
  });

  it('only prefills what is new on the second turn', async () => {
    const session = tracked(await createLLMChatSession(config));
    await session.sendMessage('first question');

    const before = fakeJsi.runnerCalls().length;
    await session.sendMessage('second question');

    const secondTurn = fakeJsi
      .runnerCalls()
      .slice(before)
      .filter((call) => call.kind === 'prefill')
      .map((call) => (call as { text: string }).text);

    // The first turn is already in the KV cache, so it must not be re-sent.
    expect(secondTurn.join('')).toContain('second question');
    expect(secondTurn.join('')).not.toContain('first question');
  });

  it('re-prefills the whole conversation each turn when asked to reset', async () => {
    const session = tracked(await createLLMChatSession(config, { resetOnTurn: true }));
    await session.sendMessage('first question');

    const before = fakeJsi.runnerCalls().length;
    await session.sendMessage('second question');

    const secondTurn = fakeJsi.runnerCalls().slice(before);
    expect(secondTurn[0]).toEqual({ kind: 'reset', targetPos: 0 });
    expect(
      secondTurn
        .filter((call) => call.kind === 'prefill')
        .map((call) => (call as { text: string }).text)
        .join('')
    ).toContain('first question');
  });

  it('forwards stop() to the runner', async () => {
    const session = tracked(await createLLMChatSession(config));

    session.stop();

    expect(fakeJsi.runnerCalls()).toContainEqual({ kind: 'stop' });
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
    fakeJsi.registerLLMRunner(MODEL_PATH, {
      generations: [{ response: 'TOOL weather' }, { response: 'it is sunny' }],
    });
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
    fakeJsi.registerLLMRunner(MODEL_PATH, {
      generations: [{ response: 'TOOL weather' }, { response: 'it is sunny' }],
    });
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
    fakeJsi.registerLLMRunner(MODEL_PATH, {
      generations: [{ response: 'TOOL missing' }, { response: 'sorry' }],
    });
    const session = tracked(
      await createLLMChatSession(config, { toolOpts: { tools: [weather], parseToolCalls } })
    );

    await session.sendMessage('hi');

    expect(session.getHistory()[2]!.content).toMatch(/not recognized|not available/);
  });

  it('reports a throwing tool back to the model rather than failing the turn', async () => {
    fakeJsi.registerLLMRunner(MODEL_PATH, {
      generations: [{ response: 'TOOL weather' }, { response: 'sorry' }],
    });
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
    fakeJsi.registerLLMRunner(MODEL_PATH, { generations: [{ response: 'TOOL weather' }] });
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

  it('surfaces a missing runner rather than resolving with a broken session', async () => {
    fakeJsi.reset();
    writeTokenizerConfig();

    await expect(createLLMChatSession(config)).rejects.toThrow(/no runner registered/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });
});
