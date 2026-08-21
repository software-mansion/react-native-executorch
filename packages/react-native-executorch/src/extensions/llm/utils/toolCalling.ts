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
  /** JSON Schema type, typically `'object'`. */
  readonly type?: 'object' | string;
  /** JSON Schema properties mapping parameter names to their schemas. */
  readonly properties?: Record<string, unknown>;
  /** Names of required parameters. */
  readonly required?: readonly string[];
  readonly [key: string]: unknown;
};

/**
 * Declaration of a tool available to the model.
 * @category Types
 */
export type ToolDefinition<Args extends Record<string, unknown> = Record<string, unknown>> = {
  /** Tool type discriminator, typically `'function'`. */
  readonly type: 'function' | string;
  readonly function: {
    /** Function name the model should invoke. */
    readonly name: string;
    /** Human-readable description of what the tool does. */
    readonly description?: string;
    /** JSON Schema describing the function's parameters. */
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
  /** Optional tool call identifier for matching responses. */
  readonly id?: string;
  /** Tool type discriminator, typically `'function'`. */
  readonly type?: 'function' | string;
  readonly function: {
    /** Name of the function being called. */
    readonly name: string;
    /** Parsed arguments passed to the function. */
    readonly arguments: Record<string, unknown>;
  };
};

/**
 * Structured tool parsing result containing detected tool calls and remaining text.
 * @category Types
 */
export type ToolParserResult = {
  /** Detected tool calls extracted from the model output. */
  readonly toolCalls: readonly ToolCall[];
  /** Remaining text content after tool call extraction. */
  readonly textContent?: string;
};

/**
 * Function signature for parsing tool calls from model output text.
 * Returns undefined if no tool call was detected.
 * @category Types
 */
export type ToolParser = (text: string) => ToolParserResult | undefined;
