import { ResourceSource } from '../types/common';

export interface ResourceFetcherAdapter {
  fetch(
    callback: (downloadProgress: number) => void,
    ...sources: ResourceSource[]
  ): Promise<string[] | null>;
  pauseFetching(...sources: ResourceSource[]): Promise<void>;
  resumeFetching(...sources: ResourceSource[]): Promise<void>;
  cancelFetching(...sources: ResourceSource[]): Promise<void>;
  listDownloadedFiles(): Promise<string[]>;
  listDownloadedModels(): Promise<string[]>;
  deleteResources(...sources: ResourceSource[]): Promise<void>;
  getFilesTotalSize(...sources: ResourceSource[]): Promise<number>;
  readAsString(path: string): Promise<string>;
}

export class ResourceFetcher {
  private static adapter: ResourceFetcherAdapter | null = null;

  static setAdapter(adapter: ResourceFetcherAdapter) {
    this.adapter = adapter;
  }

  static getAdapter(): ResourceFetcherAdapter {
    if (!this.adapter) {
      throw new Error(
        'ResourceFetcher adapter is not initialized. Please call initExecutorch({ resourceFetcher: ... }) with a valid adapter, e.g., from @rn-executorch/expo-adapter or @rn-executorch/bare-adapter.'
      );
    }
    return this.adapter;
  }

  static async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    return this.getAdapter().fetch(callback, ...sources);
  }

  static async pauseFetching(...sources: ResourceSource[]) {
    return this.getAdapter().pauseFetching(...sources);
  }

  static async resumeFetching(...sources: ResourceSource[]) {
    return this.getAdapter().resumeFetching(...sources);
  }

  static async cancelFetching(...sources: ResourceSource[]) {
    return this.getAdapter().cancelFetching(...sources);
  }

  static async listDownloadedFiles() {
    return this.getAdapter().listDownloadedFiles();
  }

  static async listDownloadedModels() {
    return this.getAdapter().listDownloadedModels();
  }

  static async deleteResources(...sources: ResourceSource[]) {
    return this.getAdapter().deleteResources(...sources);
  }

  static async getFilesTotalSize(...sources: ResourceSource[]) {
    return this.getAdapter().getFilesTotalSize(...sources);
  }

  static fs = {
    readAsString: async (path: string) => {
      return this.getAdapter().readAsString(path);
    },
  };
}
