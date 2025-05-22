import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';
import { Chat, getAllChats, createChat } from '../database/chatRepository';

interface ChatStore {
  chats: Chat[];
  db: SQLiteDatabase | null;
  setDB: (db: SQLiteDatabase) => void;
  loadChats: () => Promise<void>;
  addChat: () => Promise<number | undefined>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  settings: {},
  db: null,
  setDB: (db) => set({ db }),
  loadChats: async () => {
    const db = get().db;
    if (!db) return;

    const chats = await getAllChats(db);
    set({
      chats,
    });
  },
  addChat: async () => {
    const db = get().db;
    if (!db) return;

    const newChatId = await createChat(db);

    set((state) => ({
      chats: [...state.chats, { id: newChatId }],
    }));

    return newChatId;
  },
}));
