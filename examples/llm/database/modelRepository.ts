import { type SQLiteDatabase } from 'expo-sqlite';

export type Model = {
  id: string;
  source: 'local' | 'remote';
  isDownloaded: number;
  modelPath: string;
  tokenizerPath: string;
  tokenizerConfigPath: string;
};

export const addModel = async (
  db: SQLiteDatabase,
  model: Model
): Promise<number> => {
  const result = await db.runAsync(
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

  return result.lastInsertRowId;
};

export const updateModelDownloaded = async (
  db: SQLiteDatabase,
  id: string,
  downloadedStatus: number
) => {
  await db.runAsync(
    `
    UPDATE models
    SET isDownloaded = ?
    WHERE id = ?
  `,
    [downloadedStatus, id]
  );
};

export const removeModelFiles = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync(`DELETE FROM models WHERE id = ?`, [id]);
};

export const getAllModels = async (db: SQLiteDatabase): Promise<Model[]> => {
  const models = await db.getAllAsync<Model>(`SELECT * FROM models`);
  return models.map((model) => ({
    ...model,
  }));
};

export const getDownloadedModels = async (
  db: SQLiteDatabase
): Promise<Model[]> => {
  return await db.getAllAsync<Model>(
    `
    SELECT * FROM models
    WHERE modelPath IS NOT NULL
      AND tokenizerPath IS NOT NULL
      AND tokenizerConfigPath IS NOT NULL
  `
  );
};
