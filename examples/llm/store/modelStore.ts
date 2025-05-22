import { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';
import {
  Model,
  getAllModels,
  addModel,
  updateModelDownloaded,
  removeModelFiles,
} from '../database/modelRepository';
import { ResourceFetcher } from 'react-native-executorch';

interface DownloadState {
  progress: number;
  status: 'not_started' | 'downloading' | 'downloaded' | 'error';
}

interface ModelStore {
  db: SQLiteDatabase | null;
  models: Model[];
  downloadedModels: Model[];
  downloadStates: Record<string, DownloadState>;
  setDB: (db: SQLiteDatabase) => void;
  loadModels: () => Promise<void>;
  addModelToDB: (model: Model) => Promise<void>;
  downloadModel: (model: Model) => Promise<void>;
  removeModel: (modelId: string) => Promise<void>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  db: null,
  models: [],
  downloadedModels: [],
  downloadStates: {},

  setDB: (db) => set({ db }),

  loadModels: async () => {
    const db = get().db;
    if (!db) return;
    const models = await getAllModels(db);
    set({
      models,
      downloadedModels: models.filter((m) => m.isDownloaded),
    });
  },

  addModelToDB: async (model: Model) => {
    const db = get().db;
    if (!db) return;
    await addModel(db, model);
    await get().loadModels();
  },

  downloadModel: async (model: Model) => {
    const setDownloading = (
      progress: number,
      status: DownloadState['status']
    ) => {
      set((state) => ({
        downloadStates: {
          ...state.downloadStates,
          [model.id]: { progress, status },
        },
      }));
    };

    let lastReportedPercent = -1;

    setDownloading(0, 'downloading');

    try {
      const { modelPath, tokenizerPath, tokenizerConfigPath } = model;

      await ResourceFetcher.fetch(modelPath, (p: number) => {
        const currentPercent = Math.floor(p * 100);
        if (currentPercent !== lastReportedPercent) {
          lastReportedPercent = currentPercent;
          setDownloading(p, 'downloading');
        }
      });

      await ResourceFetcher.fetchMultipleResources(
        () => {},
        tokenizerPath,
        tokenizerConfigPath
      );

      const db = get().db;
      if (db) {
        await updateModelDownloaded(db, model.id, 1);
        await get().loadModels();
      }

      setDownloading(1, 'downloaded');
    } catch (err) {
      console.error('Failed:', err);
      setDownloading(0, 'error');
    }
  },

  removeModel: async (modelId: string) => {
    const db = get().db;
    if (!db) return;

    const model = get().models.find((m) => m.id === modelId);
    if (!model) return;

    try {
      if (model.source === 'remote') {
        await ResourceFetcher.deleteMultipleResources(
          model.modelPath,
          model.tokenizerPath,
          model.tokenizerConfigPath
        );
      } else if (model.source === 'local') {
        await removeModelFiles(db, modelId);
        await get().loadModels();
      }

      await updateModelDownloaded(db, modelId, 0);
    } catch (err) {
      console.error('Failed to remove files:', err);
    }
  },
}));
