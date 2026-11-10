/**
 * Instruction-tuned LLM (EuroLLM, Hy-MT2) machine translation task pipeline.
 */

import { scheduleOnRN, type WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { wrapAsync } from '../../../core/runtime';
import type { ModelSource } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';
import { createResourceScope } from '../../../core/lifetime';
import type { TranslationLanguages, Translator } from '../../nlp/utils/translationUtils';
import {
  createLLMRunner,
  type LLMGenerationConfig,
  type LLMRunner,
  type Prompt,
} from '../llmRunner';
import { parseTokenizerConfig } from '../utils/tokenizerConfig';
import { createChatPreprocessor } from '../utils/chatPreprocessor';
import type { LLMModel } from './llmChatSession';

/**
 * A translation prompt, as a model card gives it.
 * @category NLP / Types
 */
export type LLMTranslationPrompt = {
  /**
   * The user turn, in which `{source}`, `{target}` and `{text}` stand for the
   * source and target language names and the line to translate.
   */
  readonly template: string;
  /** The name the template uses for each language, keyed by language code. */
  readonly languageNames: Readonly<Record<string, string>>;
};

/**
 * Paths and prompt required to instantiate an LLM translator. One model
 * translates between any two of its supported languages.
 * @category NLP / Types
 */
export type LLMTranslatorModel<TSource extends ModelSource = string> = LLMModel<TSource> & {
  /** Identifies the pipeline this config belongs to. */
  readonly name: 'llm';
  /**
   * The model card's translation prompt. Its `languageNames` are the languages
   * the model translates between.
   */
  readonly prompt: LLMTranslationPrompt;
  /**
   * Prompts used instead of `prompt` when the source or target language is
   * their key, such as a Chinese prompt for pairs with Chinese.
   */
  readonly promptOverrides?: Readonly<Record<string, LLMTranslationPrompt>>;
};

/**
 * LLM translation task runner. Each line is translated on its own.
 * @category NLP / Types
 */
export type LLMTranslator = Translator;

function generateWorklet(
  runner: LLMRunner,
  prompt: Prompt,
  genConfig: LLMGenerationConfig,
  stopTokens: readonly string[],
  onToken?: (token: string) => void
): string {
  'worklet';
  let response = '';
  runner.generate(prompt, genConfig, (token) => {
    if (stopTokens.includes(token)) return;
    response += token;
    if (onToken) scheduleOnRN(onToken, token);
  });
  return response;
}

// Greedy decoding, as in the model card's evaluation.
const GENERATION_CONFIG: LLMGenerationConfig = { temperature: 0 };

/**
 * Creates a translator on top of an instruction-tuned LLM such as EuroLLM or
 * Hy-MT2.
 *
 * Every line is sent as its own single-turn chat with the model card's
 * translation prompt, from an empty KV cache, and decoded greedily. One model
 * translates between any two of its languages, so the pair can change per
 * call.
 * @category NLP / Tasks
 * @param config Model, tokenizer and tokenizer config paths. See
 * {@link LLMTranslatorModel}.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to the instantiated {@link LLMTranslator}.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model or
 * tokenizer fails to load, or `SCHEMA_MISMATCH` if the model schema does not
 * match a text LLM.
 */
export async function createLLMTranslator(
  config: LLMTranslatorModel<ModelSource>,
  runtime?: WorkletRuntime
): Promise<LLMTranslator> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, dataMapPath, tokenizerPath, tokenizerConfigPath } = config;
    const tokenizerConfigStr = await RNBlobUtil.fs.readFile(tokenizerConfigPath, 'utf8');
    const { chatTemplate, bosToken, eosToken, stopTokens } = parseTokenizerConfig(
      JSON.parse(tokenizerConfigStr)
    );
    const chatPreprocessor = scope.track(
      createChatPreprocessor({ chatTemplate, bosToken, eosToken })
    );
    // prettier-ignore
    const runner = scope.track(
      await createLLMRunner(
        modelPath,
        tokenizerPath,
        undefined,
        runtime,
        dataMapPath ? { dataMapPath } : undefined
      )
    );
    const generate = wrapAsync(generateWorklet, runtime);

    let busy = false;
    let stopped = false;

    const { prompt: basePrompt, promptOverrides = {} } = config;
    // Throws for a language the model does not know.
    const userTurn = (line: string, source: string, target: string): string => {
      for (const code of [source, target]) {
        if (!Object.prototype.hasOwnProperty.call(basePrompt.languageNames, code)) {
          throw RnExecuTorchError('INVALID_ARGUMENT', `translate: unsupported language '${code}'.`);
        }
      }
      const { template, languageNames } =
        promptOverrides[source] ?? promptOverrides[target] ?? basePrompt;
      const values: Record<string, string> = {
        source: languageNames[source]!,
        target: languageNames[target]!,
        text: line,
      };
      return template.replace(/\{(source|target|text)\}/g, (_, key: string) => values[key]!);
    };

    const translateLine = async (
      line: string,
      source: string,
      target: string,
      onPiece: (piece: string) => void
    ): Promise<string> => {
      const content = userTurn(line, source, target);
      runner.reset();
      const prompt = chatPreprocessor.process([{ role: 'user', content }], 1, {
        addGenPrompt: true,
      });
      try {
        let started = false;
        const response = await generate(runner, prompt, GENERATION_CONFIG, stopTokens, (token) => {
          const piece = started ? token : token.trimStart();
          if (piece === '') return;
          started = true;
          onPiece(piece);
        });
        return response.trimStart();
      } finally {
        chatPreprocessor.clear();
      }
    };

    const translate = async (
      text: string,
      languages: TranslationLanguages,
      onToken?: (token: string) => void
    ): Promise<string> => {
      const { sourceLanguage: source, targetLanguage: target } = languages;
      // Validates the pair before anything is queued.
      userTurn('', source, target);
      if (busy) {
        throw RnExecuTorchError('RESOURCE_BUSY', 'translate: A translation is in progress.');
      }

      busy = true;
      stopped = false;
      let output = '';
      // Text between translated lines (line breaks, blank lines) is streamed
      // ahead of the next translated piece, so the pieces keep their order.
      let pending = '';

      try {
        // Odd indices hold the line breaks themselves.
        const parts = text.split(/(\n+)/);
        for (let i = 0; i < parts.length && !stopped; i++) {
          const part = parts[i]!;
          const line = part.trim();
          if (i % 2 === 1 || line === '') {
            output += part;
            pending += part;
            continue;
          }

          const lead = part.slice(0, part.length - part.trimStart().length);
          const trail = part.slice(part.trimEnd().length);
          // Pieces arrive later on the RN thread, so each line captures the
          // separator it streams ahead of its first piece.
          const prefix = pending + lead;
          let first = true;
          const translated = await translateLine(line, source, target, (piece) => {
            onToken?.(first ? prefix + piece : piece);
            first = false;
          });
          output += lead + translated + trail;
          pending = translated === '' ? prefix + trail : trail;
        }
        if (!stopped && pending !== '') onToken?.(pending);
        return output;
      } finally {
        busy = false;
      }
    };

    const translateStop = () => {
      if (!busy) return;
      stopped = true;
      runner.stop();
    };

    return { dispose, translate, translateStop };
  } catch (error) {
    dispose();
    throw error;
  }
}
