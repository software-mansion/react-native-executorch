import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteDatabase } from 'expo-sqlite';

export type Chat = {
  id: number;
};

export type ChatSettings = {
  systemPrompt: string;
  contextWindow: number;
};

export type Message = {
  id: number;
  chatId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensPerSecond?: number;
  timeToFirstToken?: number;
  timestamp: number;
};

export const createChat = async (db: SQLiteDatabase): Promise<number> => {
  const result = await db.runAsync(`INSERT INTO chats DEFAULT VALUES;`);
  return result.lastInsertRowId;
};

export const getAllChats = async (db: SQLiteDatabase): Promise<Chat[]> => {
  return await db.getAllAsync<Chat>(`SELECT id FROM chats ORDER BY id DESC`);
};

export const getChatMessages = async (
  db: SQLiteDatabase,
  chatId: number
): Promise<Message[]> => {
  return db.getAllAsync<Message>(
    `SELECT * FROM messages WHERE chatId = ? ORDER BY id ASC`,
    [chatId]
  );
};

export const persistMessage = async (
  db: SQLiteDatabase,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<number> => {
  if (!message.tokensPerSecond || !message.timeToFirstToken) {
    message.tokensPerSecond = 0;
    message.timeToFirstToken = 0;
  }

  const result = await db.runAsync(
    `INSERT INTO messages (chatId, role, content, tokensPerSecond, timeToFirstToken) VALUES (?, ?, ?, ?, ?);`,
    [
      message.chatId,
      message.role,
      message.content,
      message.tokensPerSecond,
      message.timeToFirstToken,
    ]
  );

  return result.lastInsertRowId;
};

export const deleteChat = async (
  db: SQLiteDatabase,
  chatId: number
): Promise<void> => {
  await db.runAsync(`DELETE FROM chats WHERE id = ?;`, [chatId]);
};

export const getChatSettings = async (
  db: SQLiteDatabase,
  chatId: number | null
): Promise<ChatSettings> => {
  const result = await db.getFirstAsync<ChatSettings>(
    'SELECT systemPrompt, contextWindow FROM chatSettings WHERE chatId = ?',
    [chatId]
  );

  if (!result) {
    const defaultSettings = await AsyncStorage.getItem('default_chat_settings');
    if (defaultSettings) {
      return JSON.parse(defaultSettings);
    }
  }

  return (
    result ?? {
      systemPrompt: '',
      contextWindow: 6,
    }
  );
};

export const setChatSettings = async (
  db: SQLiteDatabase,
  chatId: number,
  settings: ChatSettings
): Promise<void> => {
  if (chatId === null) {
    await AsyncStorage.setItem(
      'default_chat_settings',
      JSON.stringify({
        systemPrompt: settings.systemPrompt,
        contextWindow: settings.contextWindow,
      })
    );

    return;
  }

  await db.runAsync(
    `
    INSERT INTO chatSettings (chatId, systemPrompt, contextWindow)
    VALUES (?, ?, ?)
    ON CONFLICT(chatId) DO UPDATE SET
      systemPrompt = excluded.systemPrompt,
      contextWindow = excluded.contextWindow
  `,
    [chatId, settings.systemPrompt, settings.contextWindow]
  );
};
