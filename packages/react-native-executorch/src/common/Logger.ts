export class Logger {
  private static readonly PREFIX = '[React Native ExecuTorch]';

  static debug(...data: any[]) {
    console.debug(Logger.PREFIX, ...data);
  }

  static info(...data: any[]) {
    console.info(Logger.PREFIX, ...data);
  }

  static warn(...data: any[]) {
    console.warn(Logger.PREFIX, ...data);
  }

  static error(...data: any[]) {
    console.error(Logger.PREFIX, ...data);
  }
}
