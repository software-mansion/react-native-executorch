import { ContextStrategy, Message } from '../../../types/llm';

/**
 * A context strategy that performs no filtering or trimming of the message history.
 * * This strategy is ideal when the developer wants to manually manage the conversation
 * context.
 *
 * @category Utils
 */
export class NaiveContextStrategy implements ContextStrategy {
  /**
   * Builds the context by prepending the system prompt to the entire unfiltered history.
   *
   * @param {string} systemPrompt - The top-level instructions for the model.
   * @param {Message[]} history - The complete conversation history.
   * @param {number} _maxContextLength - Unused in this strategy.
   * @param {(messages: Message[]) => number} _getTokenCount - Unused in this strategy.
   * @returns {Message[]} The unedited message history with the system prompt at the beginning.
   */
  buildContext(
    systemPrompt: string,
    history: Message[],
    _maxContextLength: number,
    _getTokenCount: (messages: Message[]) => number
  ): Message[] {
    return [{ content: systemPrompt, role: 'system' as const }, ...history];
  }
}
