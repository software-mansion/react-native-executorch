import { ChatConfig, Message } from '../types/llm';

export const DEFAULT_SYSTEM_PROMPT =
  "You are a knowledgeable, efficient, and direct AI assistant. Provide concise answers, focusing on the key information needed. Offer suggestions tactfully when appropriate to improve outcomes. Engage in productive collaboration with the user. Don't return too much text.";

export const DEFAULT_STRUCTURED_OUTPUT_PROMPT = (
  structuredOutputSchema: string
) => `The output should be formatted as a JSON instance that conforms to the JSON schema below.

As an example, for the schema {"properties": {"foo": {"title": "Foo", "description": "a list of strings", "type": "array", "items": {"type": "string"}}}, "required": ["foo"]}
the object {"foo": ["bar", "baz"]} is a well-formatted instance of the schema. The object {"properties": {"foo": ["bar", "baz"]}} is not well-formatted.

Here is the output schema:
${structuredOutputSchema}
`;

export const DEFAULT_MESSAGE_HISTORY: Message[] = [];

export const DEFAULT_CONTEXT_WINDOW_LENGTH = 5;

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  initialMessageHistory: DEFAULT_MESSAGE_HISTORY,
  contextWindowLength: DEFAULT_CONTEXT_WINDOW_LENGTH,
};
