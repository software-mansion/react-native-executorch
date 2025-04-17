export type SenderType = 'user' | 'assistant';

export interface MessageType {
  role: SenderType;
  content: string;
}
