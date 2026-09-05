import { ContextStrategy, Message } from '../../../types/llm';

/**
 * A simple context strategy that retains a fixed number of the most recent messages.
 * This strategy trims the conversation history based purely on the message count.
 * @category Utils
 */
export class MessageCountContextStrategy implements ContextStrategy {
  /**
   * Initializes the MessageCountContextStrategy.
   * @param windowLength - The maximum number of recent messages to retain in the context. Defaults to 5.
   */
  constructor(private readonly windowLength: number = 5) {}

  /**
   * Builds the context by slicing the history to retain only the most recent `windowLength` messages.
   * @param systemPrompt - The top-level instructions for the model.
   * @param history - The complete conversation history.
   * @param _maxContextLength - Unused in this strategy.
   * @param _getTokenCount - Unused in this strategy.
   * @returns The truncated message history with the system prompt at the beginning.
   */
  buildContext(
    systemPrompt: string,
    history: Message[],
    _maxContextLength: number,
    _getTokenCount: (messages: Message[]) => number
  ): Message[] {
    return [
      { content: systemPrompt, role: 'system' as const },
      ...history.slice(-this.windowLength),
    ];
  }
}
