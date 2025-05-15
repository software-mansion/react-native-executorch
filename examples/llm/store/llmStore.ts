import { create } from 'zustand';
import { LLMModule, Message } from 'react-native-executorch';
import { ModelEntry } from '../database/modelRepository';
import { SQLiteDatabase } from 'expo-sqlite';
import { persistMessage } from '../database/chatRepository';

interface LLMStore {
  isLoading: boolean;
  isGenerating: boolean;
  db: SQLiteDatabase;
  activeChatId: number | null;
  activeChatMessages: Message[];
  response: string;
  model: ModelEntry | null;

  sendChatMessage: (messages: Message[]) => Promise<void>;
  setDB: (db: SQLiteDatabase) => void;
  loadModel: (model: ModelEntry) => Promise<void>;
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

  loadModel: async (model: ModelEntry) => {
    if (get().model !== null) {
      LLMModule.delete();
    }
    set({ isLoading: true });
    await LLMModule.load({
      modelSource: model.modelUrl,
      tokenizerSource: model.tokenizerUrl,
      tokenizerConfigSource: model.tokenizerConfigUrl,
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

      const generatedResponse = await LLMModule.generate(messages);

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
