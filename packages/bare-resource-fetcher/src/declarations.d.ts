declare module '@kesha-antonov/react-native-background-downloader' {
  export const directories: {
    documents: string;
    library: string;
    temp: string;
  };

  export interface DownloadTask {
    id: string;
    percent: number;
    stop(): void;
    pause(): void;
    resume(): void;
    start(): void;

    begin(handler: (params: BeginHandlerParams) => void): DownloadTask;
    progress(handler: (params: ProgressHandlerParams) => void): DownloadTask;
    done(handler: () => void): DownloadTask;
    error(handler: (error: any) => void): DownloadTask;
  }

  export interface BeginHandlerParams {
    expectedBytes: number;
    headers: { [key: string]: string };
  }

  export interface ProgressHandlerParams {
    percent: number;
    bytesDownloaded: number;
    bytesTotal: number;
  }

  export function createDownloadTask(options: {
    id: string;
    url: string;
    destination: string;
    headers?: object;
  }): DownloadTask;

  export function completeHandler(jobId: string): void;

  const RNBackgroundDownloader: {
    download(options: {
      id: string;
      url: string;
      destination: string;
    }): DownloadTask;
    directories: { documents: string; library: string; temp: string };
  };
  export default RNBackgroundDownloader;
}

declare module '@dr.pogodin/react-native-fs';
