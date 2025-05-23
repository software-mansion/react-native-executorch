import { LLMTool, ToolCall } from '../types/llm';

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
