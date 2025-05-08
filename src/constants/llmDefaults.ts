import { ChatConfig, Message } from '../types/llm';

export const DEFAULT_SYSTEM_PROMPT =
  "You are a knowledgeable, efficient, and direct AI assistant. Provide concise answers, focusing on the key information needed. Offer suggestions tactfully when appropriate to improve outcomes. Engage in productive collaboration with the user. Don't return too much text.";

export const DEFAULT_MESSAGE_HISTORY: Message[] = [];

export const DEFAULT_CONTEXT_WINDOW_LENGTH = 5;

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  initialMessageHistory: DEFAULT_MESSAGE_HISTORY,
  contextWindowLength: DEFAULT_CONTEXT_WINDOW_LENGTH,
};
