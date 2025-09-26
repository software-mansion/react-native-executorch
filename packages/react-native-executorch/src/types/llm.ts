export interface LLMType {
  messageHistory: Message[];
  response: string;
  token: string;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  getGeneratedTokenCount: () => number;
  setTimeInterval: (timeInterval: number) => void;
  setCountInterval: (countInterval: number) => void;
  configure: ({
    chatConfig,
    toolsConfig,
  }: {
    chatConfig?: Partial<ChatConfig>;
    toolsConfig?: ToolsConfig;
  }) => void;
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

export const SPECIAL_TOKENS = {
  BOS_TOKEN: 'bos_token',
  EOS_TOKEN: 'eos_token',
  UNK_TOKEN: 'unk_token',
  SEP_TOKEN: 'sep_token',
  PAD_TOKEN: 'pad_token',
  CLS_TOKEN: 'cls_token',
  MASK_TOKEN: 'mask_token',
};
