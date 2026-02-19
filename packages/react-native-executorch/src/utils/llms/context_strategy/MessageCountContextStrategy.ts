import { DEFAULT_CONTEXT_WINDOW_LENGTH } from '../../../constants/llmDefaults';
import { ContextStrategy, Message } from '../../../types/llm';

/**
 * A simple context strategy that retains a fixed number of the most recent messages.
 * This strategy trims the conversation history based purely on the message count.
 *
 * @category Utils
 */
export class MessageCountContextStrategy implements ContextStrategy {
  /**
   * Initializes the MessageCountContextStrategy.
   * * @param {number} windowLength - The maximum number of recent messages to retain in the context. Defaults to {@link DEFAULT_CONTEXT_WINDOW_LENGTH}.
   */
  constructor(
    private readonly windowLength: number = DEFAULT_CONTEXT_WINDOW_LENGTH
  ) {}

  /**
   * Builds the context by slicing the history to retain only the most recent `windowLength` messages.
   *
   * @param {string} systemPrompt - The top-level instructions for the model.
   * @param {Message[]} history - The complete conversation history.
   * @param {(messages: Message[]) => number} _getTokenCount - Unused in this strategy.
   * @returns {Message[]} The truncated message history with the system prompt at the beginning.
   */
  buildContext(
    systemPrompt: string,
    history: Message[],
    _getTokenCount: (messages: Message[]) => number
  ): Message[] {
    return [
      { content: systemPrompt, role: 'system' as const },
      ...history.slice(-this.windowLength),
    ];
  }
}
