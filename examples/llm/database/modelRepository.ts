import { type SQLiteDatabase } from 'expo-sqlite';

export type ModelEntry = {
  id: string;
  source: 'local' | 'remote' | null;
  modelUrl: string;
  tokenizerUrl: string;
  tokenizerConfigUrl: string;
  modelPath: string | null;
  tokenizerPath: string | null;
  tokenizerConfigPath: string | null;
};

export async function addModel(db: SQLiteDatabase, model: ModelEntry) {
  await db.runAsync(
    `
    INSERT OR IGNORE INTO models (
      id,
      source,
      modelUrl,
      tokenizerUrl,
      tokenizerConfigUrl,
      modelPath,
      tokenizerPath,
      tokenizerConfigPath
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      model.id,
      model.source || 'remote',
      model.modelUrl,
      model.tokenizerUrl,
      model.tokenizerConfigUrl,
      model.modelPath,
      model.tokenizerPath,
      model.tokenizerConfigPath,
    ]
  );
}

export async function updateModelPaths(
  db: SQLiteDatabase,
  id: string,
  modelPath: string,
  tokenizerPath: string,
  tokenizerConfigPath: string
) {
  await db.runAsync(
    `
    UPDATE models
    SET modelPath = ?, tokenizerPath = ?, tokenizerConfigPath = ?
    WHERE id = ?
  `,
    [modelPath, tokenizerPath, tokenizerConfigPath, id]
  );
}

export async function clearModelPaths(db: SQLiteDatabase, id: string) {
  await db.runAsync(
    `
    UPDATE models
    SET modelPath = NULL,
        tokenizerPath = NULL,
        tokenizerConfigPath = NULL
    WHERE id = ?
  `,
    [id]
  );
}

export async function getAllModels(db: SQLiteDatabase): Promise<ModelEntry[]> {
  return await db.getAllAsync<ModelEntry>(`SELECT * FROM models`);
}

export async function getDownloadedModels(
  db: SQLiteDatabase
): Promise<ModelEntry[]> {
  return await db.getAllAsync<ModelEntry>(
    `
    SELECT * FROM models
    WHERE modelPath IS NOT NULL
      AND tokenizerPath IS NOT NULL
      AND tokenizerConfigPath IS NOT NULL
  `
  );
}
