import { create } from 'zustand';
import { SQLiteDatabase } from 'expo-sqlite';
import { createChat, getAllChats } from '../database/chatRepository';

type Chat = { id: number };

interface ChatStore {
  chats: Chat[];
  db: SQLiteDatabase;
  setDB: (db: SQLiteDatabase) => void;
  loadChats: () => Promise<void>;
  addChat: () => Promise<number | undefined>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  db: {} as SQLiteDatabase,
  setDB: (db) => set({ db }),
  loadChats: async () => {
    const db = get().db;
    if (!db) return;
    const chats = await getAllChats(db);
    set({ chats });
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
