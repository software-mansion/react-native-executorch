import { LLMTool, ToolCall } from '../types/llm';
import * as z from 'zod/v4';
import { Schema, Validator } from 'jsonschema';
import { jsonrepair } from 'jsonrepair';
import { DEFAULT_STRUCTURED_OUTPUT_PROMPT } from '../constants/llmDefaults';
import * as zCore from 'zod/v4/core';

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
    console.error(e);
    return [];
  }
};

export const getStructuredOutputPrompt = (
  responseSchema: z.ZodObject | Schema
) => {
  let schemaObject: Schema | zCore.JSONSchema.JSONSchema =
    responseSchema instanceof z.ZodObject
      ? z.toJSONSchema(responseSchema)
      : responseSchema;

  const schemaString = JSON.stringify(schemaObject);

  return DEFAULT_STRUCTURED_OUTPUT_PROMPT(schemaString);
};

export const fixAndValidateStructuredOutput = (
  output: string,
  responseSchema: z.ZodObject | Schema
) => {
  const repairedOutput = jsonrepair(output);
  const outputJSON = JSON.parse(repairedOutput);

  if (responseSchema instanceof z.ZodObject) {
    responseSchema.parse(outputJSON);
  } else {
    const validator = new Validator();
    validator.validate(outputJSON, responseSchema, {
      throwAll: true,
    });
  }

  return outputJSON;
};
