/**
 * Tool call definition, XML/JSON parsing, and schema generation for LLM
 * function calling.
 * @module LLM/Utils/ToolCalling
 */

import type { ChatMessageContent } from './chatPreprocessor';

/**
 * JSON Schema definition for tool parameter inputs.
 * @category Types
 */
export type ToolParameters = {
  readonly type?: 'object' | string;
  readonly properties?: Record<string, unknown>;
  readonly required?: readonly string[];
  readonly [key: string]: unknown;
};

/**
 * Declaration of a tool available to the model.
 * @category Types
 */
export type ToolDefinition<Args extends Record<string, unknown> = Record<string, unknown>> = {
  readonly type: 'function' | string;
  readonly function: {
    readonly name: string;
    readonly description?: string;
    readonly parameters?: ToolParameters;
    readonly [key: string]: unknown;
  };

  /**
   * Execution callback invoked automatically when the model calls this tool.
   */
  readonly execute: (args: Args) => Promise<ChatMessageContent> | ChatMessageContent;
};

/**
 * Function call object embedded inside assistant tool_calls.
 * @category Types
 */
export type ToolCall = {
  readonly id?: string;
  readonly type?: 'function' | string;
  readonly function: {
    readonly name: string;
    readonly arguments: Record<string, unknown>;
  };
};

/**
 * Structured tool parsing result containing detected tool calls and remaining text.
 * @category Types
 */
export type ToolParserResult = {
  readonly toolCalls: readonly ToolCall[];
  readonly textContent?: string;
};

/**
 * Function signature for parsing tool calls from model output text.
 * Returns undefined if no tool call was detected.
 * @category Types
 */
export type ToolParser = (text: string) => ToolParserResult | undefined;
