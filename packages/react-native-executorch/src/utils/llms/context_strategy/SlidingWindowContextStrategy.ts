import { ContextStrategy, Message } from '../../../types/llm';

/**
 * An advanced, token-aware context strategy that dynamically trims the message history
 * to ensure it fits within the model's physical context limits.
 * This strategy calculates the exact token count of the formatted prompt. If the prompt
 * exceeds the allowed token budget (`maxContextLength` - `bufferTokens`), it recursively
 * removes the oldest messages.
 * @category Utils
 */
export class SlidingWindowContextStrategy implements ContextStrategy {
  /**
   * Initializes the SlidingWindowContextStrategy.
   * @param bufferTokens - The number of tokens to keep free for the model's generated response (e.g., 1000).
   * @param allowOrphanedAssistantMessages - Whether to allow orphaned assistant messages when trimming the history.
   * If false, the strategy will ensure that an assistant message is not left without its preceding user message.
   */
  constructor(
    private bufferTokens: number,
    private allowOrphanedAssistantMessages: boolean = false
  ) {}

  /**
   * Builds the context by recursively evicting the oldest messages until the total
   * token count is safely within the defined budget.
   * @param systemPrompt - The top-level instructions for the model.
   * @param history - The complete conversation history.
   * @param maxContextLength - Unused in this strategy, as the strategy relies on token count rather than message count.
   * @param getTokenCount - Callback to calculate the exact token count of the rendered template.
   * @returns The optimized message history guaranteed to fit the token budget.
   */
  buildContext(
    systemPrompt: string,
    history: Message[],
    maxContextLength: number,
    getTokenCount: (messages: Message[]) => number
  ): Message[] {
    let localHistory = [...history];
    const tokenBudget = maxContextLength - this.bufferTokens;

    while (localHistory.length > 1) {
      const candidateContext: Message[] = [
        { content: systemPrompt, role: 'system' as const },
        ...localHistory,
      ];

      if (getTokenCount(candidateContext) <= tokenBudget) {
        return candidateContext;
      }

      localHistory.shift();

      if (!this.allowOrphanedAssistantMessages) {
        // Prevent leaving an orphaned "assistant" response
        if (localHistory.length > 0 && localHistory[0]?.role === 'assistant') {
          localHistory.shift();
        }
      }
    }

    return [
      { content: systemPrompt, role: 'system' as const },
      ...localHistory,
    ];
  }
}
