export interface LLMType {
  messageHistory: Message[];
  response: string;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  forward: (input: string) => Promise<void>;
  generate: (messages: Message[], tools?: LLMTool[]) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  deleteMessage: (index: number) => void;
  interrupt: () => void;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ToolCall {
  toolName: string;
  arguments: Object;
}

// usually tool is represented with dictionary (Object), but fields depend on the model
// unfortunately there's no one standard so it's hard to type it better
export type LLMTool = Object;

export interface ChatConfig {
  initialMessageHistory: Message[];
  contextWindowLength: number;
  systemPrompt: string;
}

export interface ToolsConfig {
  tools: LLMTool[];
  executeToolCallback: (call: ToolCall) => Promise<string | null>;
  displayToolCalls?: boolean;
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
