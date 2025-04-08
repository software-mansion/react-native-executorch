import { Template } from '@huggingface/jinja';
import { MessageType, ResourceSource } from '../../types/common';
import { readAsStringAsync } from 'expo-file-system';
import { fetchResource } from '../../utils/fetchResource';
import { useEffect, useState } from 'react';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_MESSAGE_HISTORY,
  DEFAULT_SYSTEM_PROMPT,
} from '../../constants/llmDefaults';
import { useLLM } from './useLLM';

const SPECIAL_TOKENS = [
  'bos_token',
  'eos_token',
  'unk_token',
  'sep_token',
  'pad_token',
  'cls_token',
  'mask_token',
];

/*
Converts a conversation to string with special tokens and template according to apply
TODO add tools here
*/
export const applyChatTemplate = (
  messages: Array<MessageType>,
  tokenizerConfig: any
): string => {
  if (!tokenizerConfig.chat_template) {
    throw Error("Tokenizer config doesn't include chat_template");
  }
  const template = new Template(tokenizerConfig.chat_template);

  const specialTokens = Object.fromEntries(
    SPECIAL_TOKENS.filter((key) => key in tokenizerConfig).map((key) => [
      key,
      tokenizerConfig[key],
    ])
  );

  const result = template.render({
    messages,
    ...specialTokens,
  });
  return result;
};

// TODO add useCallback for memoization of returned functions
export const useLLMChat = ({
  modelSource,
  tokenizerSource,
  tokenizerConfigSource,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  initialMessageHistory = DEFAULT_MESSAGE_HISTORY,
  contextWindowLength = DEFAULT_CONTEXT_WINDOW_LENGTH,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  tokenizerConfigSource: ResourceSource;
  systemPrompt?: string;
  initialMessageHistory?: MessageType[];
  contextWindowLength?: number;
}) => {
  const [tokenizerConfig, setTokenizerConfig] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageHistory, setMessageHistory] = useState<Array<MessageType>>([]);

  const llm = useLLM({
    modelSource,
    tokenizerSource,
  });

  useEffect(() => {
    // TODO not sure if we should throw at this condition, but it seems reasonable?
    if (initialMessageHistory.length > contextWindowLength) {
      throw new Error('Initial history is longer than context window length');
    }
    setMessageHistory(initialMessageHistory);
  }, [initialMessageHistory, contextWindowLength]);

  useEffect(() => {
    const parseTokenizerConfig = async () => {
      const tokenizerConfigFileUri = await fetchResource(tokenizerConfigSource);

      const config = JSON.parse(
        await readAsStringAsync(tokenizerConfigFileUri)
      );

      setTokenizerConfig(config);
    };
    parseTokenizerConfig();
  }, [tokenizerConfigSource]);

  useEffect(() => {
    if (
      llm.response &&
      'bos_token' in tokenizerConfig &&
      llm.response.endsWith(tokenizerConfig.bos_token)
    ) {
      appendToMessageHistory({ content: llm.response, role: 'assistant' });
      setIsGenerating(false);
    }
  }, [llm.response, tokenizerConfig, setIsGenerating]);

  useEffect(() => {
    setIsGenerating(false);
  }, [llm.error]);

  const appendToMessageHistory = (message: MessageType) => {
    setMessageHistory((prevMessageHistory) => [...prevMessageHistory, message]);
  };

  const sendMessage = async (message: string) => {
    const newMessageHistory: Array<MessageType> = [
      ...messageHistory,
      { content: message, role: 'user' },
    ];
    setMessageHistory(newMessageHistory);
    setIsGenerating(true);

    const messageHistoryWithPrompt: Array<MessageType> = [
      { content: systemPrompt, role: 'system' },
      ...newMessageHistory,
    ];
    const renderedChat = applyChatTemplate(
      messageHistoryWithPrompt,
      tokenizerConfig
    );
    await llm.generate(renderedChat);
  };

  return {
    messageHistory,
    sendMessage,
    isGenerating,
    isModelGenerating: isGenerating,
    response: llm.response,
    error: llm.error,
    isReady: llm.isReady,
    isModelReady: llm.isReady,
    downloadProgress: llm.downloadProgress,
    interrupt: llm.interrupt,
  };
};
