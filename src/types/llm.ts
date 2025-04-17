export type MessageRole = 'user' | 'assistant' | 'system';
export interface MessageType {
  role: MessageRole;
  content: string;
}
// usually tool is represented with dictionary (Object), but fields depend on the model
// unfortunately there's no one standard so it's hard to type it better
export type LLMTool = Object;

export interface ChatConfig {
  initialMessageHistory: MessageType[];
  contextWindowLength: number;
  systemPrompt: string;
}

export const SPECIAL_TOKENS = [
  'bos_token',
  'eos_token',
  'unk_token',
  'sep_token',
  'pad_token',
  'cls_token',
  'mask_token',
];
