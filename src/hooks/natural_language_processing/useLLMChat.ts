import { Template } from '@huggingface/jinja';
import { LLMTool, MessageType, ResourceSource } from '../../types/common';
import { readAsStringAsync } from 'expo-file-system';
import { useEffect, useState, useCallback } from 'react';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_MESSAGE_HISTORY,
  DEFAULT_SYSTEM_PROMPT,
} from '../../constants/llmDefaults';
import { useLLM } from './useLLM';
import { ResourceFetcher } from '../../utils/ResourceFetcher';

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
  tools: LLMTool[],
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
    tools,
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
    const parseTokenizerConfig = async () => {
      const tokenizerConfigFileUri = await ResourceFetcher.fetch(
        tokenizerConfigSource
      );

      const config = JSON.parse(
        await readAsStringAsync(tokenizerConfigFileUri)
      );
      // console.log("config", config)
      // console.log("eos_token", config["eos_token"], config.eos_token)

      setTokenizerConfig(config);
    };
    parseTokenizerConfig();
  }, [initialMessageHistory, contextWindowLength, tokenizerConfigSource]);

  useEffect(() => {
    // console.log(
    //   '1',
    //   llm.response,
    //   tokenizerConfig
    //     ? 'eos_token' in tokenizerConfig
    //       ? tokenizerConfig.eos_token
    //       : 'no eos_token'
    //     : 'no config'
    // );
  }, [
    llm.response,
    tokenizerConfig,
    contextWindowLength,
    messageHistory,
    isGenerating,
  ]);

  useEffect(() => {
    console.log('useChatLLM consumes error', llm.error);
    setIsGenerating(false);
  }, [llm.error]);

  const sendMessage = useCallback(
    async (message: string, tools: LLMTool[]) => {
      let newMessageHistory: Array<MessageType> = [
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
        tools,
        tokenizerConfig
      );
      await llm.generate(renderedChat);

      setIsGenerating(false);
      if (llm.response) {
        newMessageHistory.push({
          content: llm.response.replace(tokenizerConfig.eos_token, ''),
          role: 'assistant',
        });

        if (newMessageHistory.length > contextWindowLength) {
          newMessageHistory.shift();
        }

        setMessageHistory(newMessageHistory);
      }
    },
    [contextWindowLength, llm, messageHistory, systemPrompt, tokenizerConfig]
  );

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
