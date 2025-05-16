import { type SQLiteDatabase } from 'expo-sqlite';

export type Model = {
  id: string;
  source: 'local' | 'remote' | null;
  isDownloaded: boolean;
  modelPath: string;
  tokenizerPath: string;
  tokenizerConfigPath: string;
};

export async function addModel(db: SQLiteDatabase, model: Model) {
  await db.runAsync(
    `
    INSERT OR IGNORE INTO models (
      id,
      isDownloaded,
      source,
      modelPath,
      tokenizerPath,
      tokenizerConfigPath
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      model.id,
      model.isDownloaded ? 1 : 0,
      model.source || 'remote',
      model.modelPath,
      model.tokenizerPath,
      model.tokenizerConfigPath,
    ]
  );
}

export async function updateModelDownloaded(db: SQLiteDatabase, id: string) {
  await db.runAsync(
    `
    UPDATE models
    SET isDownloaded = 1
    WHERE id = ?
  `,
    [id]
  );
}

export async function removeModelFiles(db: SQLiteDatabase, id: string) {
  await db.runAsync(
    `
    UPDATE models
    SET isDownloaded = 0
    WHERE id = ?
  `,
    [id]
  );
}

export async function getAllModels(db: SQLiteDatabase): Promise<Model[]> {
  return await db.getAllAsync<Model>(`SELECT * FROM models`);
}

export async function getDownloadedModels(
  db: SQLiteDatabase
): Promise<Model[]> {
  return await db.getAllAsync<Model>(
    `
    SELECT * FROM models
    WHERE modelPath IS NOT NULL
      AND tokenizerPath IS NOT NULL
      AND tokenizerConfigPath IS NOT NULL
  `
  );
}
