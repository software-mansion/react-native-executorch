/**
 * Instruction-tuned LLM (EuroLLM) machine translation task pipeline.
 */

import { scheduleOnRN, type WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { wrapAsync } from '../../../core/runtime';
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

// Languages EuroLLM was trained on, keyed by ISO 639-1 code. The prompt names
// them in English, as in the model card.
const EUROLLM_LANGUAGES: Readonly<Record<string, string>> = {
  ar: 'Arabic',
  bg: 'Bulgarian',
  ca: 'Catalan',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  et: 'Estonian',
  fi: 'Finnish',
  fr: 'French',
  ga: 'Irish',
  gl: 'Galician',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  lt: 'Lithuanian',
  lv: 'Latvian',
  mt: 'Maltese',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sv: 'Swedish',
  tr: 'Turkish',
  uk: 'Ukrainian',
  zh: 'Chinese',
};

/**
 * Paths required to instantiate an LLM translator. One model translates
 * between any two of its supported languages.
 * @category NLP / Types
 */
export type LLMTranslatorModel = LLMModel & {
  /** Identifies the pipeline this config belongs to. */
  readonly name: 'eurollm';
};

const languageName = (code: string): string => {
  const name = EUROLLM_LANGUAGES[code];
  if (!name) {
    throw RnExecuTorchError('INVALID_ARGUMENT', `translate: unsupported language '${code}'.`);
  }
  return name;
};

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
 * Creates a translator on top of an instruction-tuned LLM such as EuroLLM.
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
 * @returns A promise resolving to the instantiated {@link Translator}.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the model or
 * tokenizer fails to load, or `SCHEMA_MISMATCH` if the model schema does not
 * match a text LLM.
 */
export async function createLLMTranslator(
  config: LLMTranslatorModel,
  runtime?: WorkletRuntime
): Promise<Translator> {
  const scope = createResourceScope();
  const dispose = scope.dispose;

  try {
    const { modelPath, tokenizerPath, tokenizerConfigPath } = config;
    const tokenizerConfigStr = await RNBlobUtil.fs.readFile(tokenizerConfigPath, 'utf8');
    const { chatTemplate, bosToken, eosToken, stopTokens } = parseTokenizerConfig(
      JSON.parse(tokenizerConfigStr)
    );
    const chatPreprocessor = scope.track(
      createChatPreprocessor({ chatTemplate, bosToken, eosToken })
    );
    // prettier-ignore
    const runner = scope.track(await createLLMRunner(modelPath, tokenizerPath, undefined, runtime));
    const generate = wrapAsync(generateWorklet, runtime);

    let busy = false;
    let stopped = false;

    const translateLine = async (
      line: string,
      source: string,
      target: string,
      onPiece: (piece: string) => void
    ): Promise<string> => {
      const content =
        `Translate the following ${source} source text to ${target}:\n` +
        `${source}: ${line} \n${target}: `;
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
      const source = languageName(languages.sourceLanguage);
      const target = languageName(languages.targetLanguage);
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
