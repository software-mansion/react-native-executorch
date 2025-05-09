import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_MODELS } from '../default-models';
import { addModel } from '../database/modelRepository';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="test.db" onInit={initDatabase}>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal/add-model"
            options={{ presentation: 'modal', title: 'Add Model' }}
          />
        </Stack>
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
