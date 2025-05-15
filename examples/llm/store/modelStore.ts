import { create } from 'zustand';
import {
  addModel,
  getAllModels,
  ModelEntry,
} from '../database/modelRepository';
import { SQLiteDatabase } from 'expo-sqlite';
import { Model } from '../components/model-hub/ModelCard';

interface ModelStore {
  db: SQLiteDatabase;
  models: Model[];
  downloadedModels: Model[];
  setDB: (db: SQLiteDatabase) => void;
  loadModels: () => Promise<void>;
  addModelToDB: (model: ModelEntry) => Promise<void>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  db: {} as SQLiteDatabase,
  models: [],
  downloadedModels: [],
  setDB: (db) => set({ db }),

  loadModels: async () => {
    const db = get().db;
    if (!db) return;
    const models = await getAllModels(db);

    set({
      models,
      downloadedModels: models.filter((m) => m.modelPath !== null),
    });
  },

  addModelToDB: async (model: ModelEntry) => {
    const db = get().db;
    if (!db) return;

    await addModel(db, model);

    await get().loadModels();
  },
}));
