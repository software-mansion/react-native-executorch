export type SenderType = 'user' | 'ai';

export interface MessageType {
  text: string;
  from: SenderType;
}
