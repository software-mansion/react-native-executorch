import { SQLiteDatabase } from 'expo-sqlite';
import { Message } from 'react-native-executorch';

export type Chat = {
  id: number;
};

export type DBMessage = {
  id: number;
  chatId: number;
  role: 'user' | 'assistant';
  content: string;
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
    `SELECT role, content FROM messages WHERE chatId = ? ORDER BY id ASC`,
    [chatId]
  );
};

export const persistMessage = async (
  db: SQLiteDatabase,
  chatId: number,
  message: Message
): Promise<void> => {
  await db.runAsync(
    `INSERT INTO messages (chatId, role, content) VALUES (?, ?, ?);`,
    [chatId, message.role, message.content]
  );
};

export const deleteChat = async (
  db: SQLiteDatabase,
  chatId: number
): Promise<void> => {
  await db.runAsync(`DELETE FROM chats WHERE id = ?;`, [chatId]);
};
