import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_MODELS } from '../default-models';
import { addModel } from '../database/modelRepository';
import CustomDrawerLayout from '../components/CustomDrawerLayout';
import { useChatStore } from '../store/chatStore';
import { useModelStore } from '../store/modelStore';
import { useLLMStore } from '../store/llmStore';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="test.db" onInit={initDatabase}>
        <CustomDrawerLayout>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Chat' }} />
            <Stack.Screen
              name="modal/add-model"
              options={{ presentation: 'modal', title: 'Add Model' }}
            />
            <Stack.Screen
              name="model-hub/index"
              options={{ title: 'Model Hub' }}
            />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen
              name="chat/[id]/settings"
              options={{ title: 'Chat Settings', presentation: 'modal' }}
            />
          </Stack>
        </CustomDrawerLayout>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY NOT NULL,
        source TEXT,
        modelUrl TEXT,
        tokenizerUrl TEXT,
        tokenizerConfigUrl TEXT,
        modelPath TEXT,
        tokenizerPath TEXT,
        tokenizerConfigPath TEXT
      );`);

  // await db.execAsync(`DROP TABLE IF EXISTS chats`);
  // await db.execAsync(`DROP TABLE IF EXISTS messages`);

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
      FOREIGN KEY (chatId) REFERENCES chats (id) ON DELETE CASCADE
    )`);

  useChatStore.getState().setDB(db);
  useModelStore.getState().setDB(db);
  useLLMStore.getState().setDB(db);

  await db.withTransactionAsync(async () => {
    for (const model of DEFAULT_MODELS) {
      const { id, modelUrl, tokenizerUrl, tokenizerConfigUrl } = model;
      await addModel(db, {
        id,
        source: 'remote',
        modelUrl,
        tokenizerUrl,
        tokenizerConfigUrl,
        modelPath: null,
        tokenizerPath: null,
        tokenizerConfigPath: null,
      });
      console.log(`Inserted model: ${id}`);
    }
  });
}
