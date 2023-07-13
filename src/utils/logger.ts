import * as vscode from "vscode";
import { OutputChannel } from "vscode";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

export class Logger implements vscode.Disposable {
  // eslint-disable-next-line no-use-before-define
  private static instance: Logger;

  private outputChannel: OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Tabnine");
  }

  dispose() {
    this.outputChannel.dispose();
  }

  private static log(level: LogLevel, message: string): void {
    const prefix = `${new Date().toTimeString()} [${LogLevel[level]}]`;
    Logger.getInstance().outputChannel.appendLine(`${prefix}: ${message}\n`);
  }

  public static debug(message: string): void {
    Logger.log(LogLevel.DEBUG, message);
  }

  public static info(message: string): void {
    Logger.log(LogLevel.INFO, message);
  }

  public static warn(message: string): void {
    Logger.log(LogLevel.WARN, message);
  }

  public static error(message: string): void {
    Logger.log(LogLevel.ERROR, message);
  }

  private static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }
}
