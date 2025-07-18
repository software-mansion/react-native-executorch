import { LLMTool, ToolCall } from '../types/llm';
import * as z from 'zod/v4';
import { Schema, Validator } from 'jsonschema';
import { jsonrepair } from 'jsonrepair';
import { DEFAULT_STRUCTURED_OUTPUT_PROMPT } from '../constants/llmDefaults';
import * as zCore from 'zod/v4/core';
import { Logger } from '../common/Logger';

export const parseToolCall: (message: string) => ToolCall[] = (
  message: string
) => {
  try {
    const unparsedToolCalls = message.match('\\[(.|\\s)*\\]');
    if (!unparsedToolCalls) {
      throw Error('Regex did not match array.');
    }
    const parsedMessage: LLMTool[] = JSON.parse(unparsedToolCalls[0]);
    const results = [];

    for (const tool of parsedMessage) {
      if (
        'name' in tool &&
        typeof tool.name === 'string' &&
        'arguments' in tool &&
        tool.arguments !== null &&
        typeof tool.arguments === 'object'
      ) {
        results.push({
          toolName: tool.name,
          arguments: tool.arguments,
        });
      }
    }

    return results;
  } catch (e) {
    Logger.error(e);
    return [];
  }
};

const filterObjectKeys = (obj: object, keysToRemove: string[]) => {
  const entries = Object.entries(obj);
  const filteredEntries = entries.filter(
    ([key, _]) => !keysToRemove.includes(key)
  );
  return Object.fromEntries(filteredEntries);
};

export const getStructuredOutputPrompt = <T extends zCore.$ZodType>(
  responseSchema: T | Schema
) => {
  const schemaObject: Schema | zCore.JSONSchema.JSONSchema =
    responseSchema instanceof zCore.$ZodType
      ? filterObjectKeys(z.toJSONSchema(responseSchema), [
          '$schema',
          'additionalProperties',
        ])
      : responseSchema;

  const schemaString = JSON.stringify(schemaObject);

  return DEFAULT_STRUCTURED_OUTPUT_PROMPT(schemaString);
};

const extractBetweenBrackets = (text: string): string => {
  const startIndex = text.search(/[\\{\\[]/); // First occurrence of either { or [

  const openingBracket = text[startIndex];
  const closingBracket = openingBracket === '{' ? '}' : ']';

  if (!openingBracket) throw Error("Couldn't find JSON in text");

  return text.slice(
    text.indexOf(openingBracket),
    text.lastIndexOf(closingBracket) + 1
  );
};

// this is a bit hacky typing
export const fixAndValidateStructuredOutput = <T extends zCore.$ZodType>(
  output: string,
  responseSchema: T | Schema
): zCore.output<T> => {
  const extractedOutput = extractBetweenBrackets(output);
  const repairedOutput = jsonrepair(extractedOutput);
  const outputJSON = JSON.parse(repairedOutput);

  if (responseSchema instanceof zCore.$ZodType) {
    return z.parse(responseSchema, outputJSON) as zCore.output<T>;
  } else {
    const validator = new Validator();
    validator.validate(outputJSON, responseSchema, {
      throwAll: true,
    });
    return outputJSON;
  }
};
