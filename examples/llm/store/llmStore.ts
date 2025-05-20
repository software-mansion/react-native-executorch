import { create } from 'zustand';
import { LLMModule, Message } from 'react-native-executorch';
import { Model } from '../database/modelRepository';
import { SQLiteDatabase } from 'expo-sqlite';
import { getChatSettings, persistMessage } from '../database/chatRepository';

interface LLMStore {
  isLoading: boolean;
  isGenerating: boolean;
  db: SQLiteDatabase;
  activeChatId: number | null;
  activeChatMessages: Message[];
  response: string;
  model: Model | null;

  sendChatMessage: (messages: Message[]) => Promise<void>;
  setDB: (db: SQLiteDatabase) => void;
  loadModel: (model: Model) => Promise<void>;
  setChatId: (chatId: number) => void;
}

export const useLLMStore = create<LLMStore>((set, get) => ({
  isLoading: false,
  isGenerating: false,
  activeChatId: null,
  activeChatMessages: [],
  db: {} as SQLiteDatabase,
  response: '',
  model: null,

  setDB: (db) => set({ db }),
  setChatId: (chatId) =>
    set({
      activeChatId: chatId,
      activeChatMessages: [],
    }),

  loadModel: async (model: Model) => {
    if (get().model !== null) {
      LLMModule.delete();
    }
    set({ isLoading: true });
    await LLMModule.load({
      modelSource: model.modelPath,
      tokenizerSource: model.tokenizerPath,
      tokenizerConfigSource: model.tokenizerConfigPath,
      responseCallback: (response) => {
        set({ response });
      },
    });

    set({ model, isLoading: false });
  },

  sendChatMessage: async (messages: Message[]) => {
    const { isGenerating, db, model, isLoading, activeChatId } = get();
    if (isGenerating || !db || model === null || isLoading || !activeChatId)
      return;
    set({ isGenerating: true, response: '', activeChatMessages: messages });
    try {
      await persistMessage(db, activeChatId, {
        role: 'user',
        content: messages[messages.length - 1].content,
      });

      const chatSettings = await getChatSettings(db, activeChatId);
      console.log(chatSettings);

      const systemPrompt = chatSettings.systemPrompt;
      const contextWindow = chatSettings.contextWindow;

      const messagesWithSystemPrompt: Message[] = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-contextWindow),
      ];

      console.log('messagesWithSystemPrompt', messagesWithSystemPrompt);

      const generatedResponse = await LLMModule.generate(
        messagesWithSystemPrompt
      );

      if (generatedResponse) {
        await persistMessage(db, activeChatId, {
          role: 'assistant',
          content: generatedResponse,
        });

        const newMessageHistory: Message[] = [
          ...messages,
          { role: 'assistant', content: generatedResponse },
        ];

        set({ activeChatMessages: newMessageHistory });
      }
    } catch (e) {
      console.error('Chat sendMessage failed', e);
    } finally {
      set({ isGenerating: false });
    }
  },
}));
