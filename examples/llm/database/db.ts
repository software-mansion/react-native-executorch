import { type SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_MODELS } from '../constants/default-models';
import { useChatStore } from '../store/chatStore';
import { useLLMStore } from '../store/llmStore';
import { useModelStore } from '../store/modelStore';
import { addModel } from './modelRepository';

export const initDatabase = async (db: SQLiteDatabase) => {
  await db.execAsync(`
        PRAGMA journal_mode = 'wal';
        CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY NOT NULL,
          source TEXT,
          isDownloaded INTEGER DEFAULT 0,
          modelPath TEXT,
          tokenizerPath TEXT,
          tokenizerConfigPath TEXT
        );`);

  // await db.execAsync(`DROP TABLE IF EXISTS chats`);
  // await db.execAsync(`DROP TABLE IF EXISTS messages`);
  // await db.execAsync(`DROP TABLE IF EXISTS chatSettings`);
  // await db.execAsync(`DROP TABLE IF EXISTS benchmarks`);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT
      )`);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
        chatId INTEGER,
        role TEXT,
        content TEXT,
        tokensPerSecond INTEGER DEFAULT 0,
        timeToFirstToken INTEGER DEFAULT 0,
        FOREIGN KEY (chatId) REFERENCES chats (id) ON DELETE CASCADE
      )`);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chatSettings (
        chatId INTEGER PRIMARY KEY NOT NULL,
        systemPrompt TEXT DEFAULT '',
        contextWindow INTEGER DEFAULT 10,
        FOREIGN KEY(chatId) REFERENCES chats(id) ON DELETE CASCADE
    )`);

  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modelId TEXT,
        totalTime INTEGER DEFAULT 0,
        timeToFirstToken INTEGER DEFAULT 0,
        tokensGenerated INTEGER DEFAULT 0,
        tokensPerSecond INTEGER DEFAULT 0,
        peakMemory INTEGER DEFAULT 0
        )`);

  useChatStore.getState().setDB(db);
  useModelStore.getState().setDB(db);
  useLLMStore.getState().setDB(db);

  await db.withTransactionAsync(async () => {
    for (const model of DEFAULT_MODELS) {
      const { id, modelPath, tokenizerPath, tokenizerConfigPath } = model;
      await addModel(db, {
        id,
        source: 'remote',
        isDownloaded: 0,
        modelPath: modelPath,
        tokenizerPath: tokenizerPath,
        tokenizerConfigPath: tokenizerConfigPath,
      });
    }
  });
};
