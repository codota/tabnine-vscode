import * as vscode from "vscode";
import { OutputChannel } from "vscode";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

export const Logger = new (class Logger implements vscode.Disposable {
  private outputChannel: OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Tabnine");
  }

  dispose() {
    this.outputChannel.dispose();
  }

  show(): void {
    this.outputChannel.show();
  }

  private log(
    level: LogLevel,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    const prefix = `${new Date().toTimeString()} [${LogLevel[level]}]`;
    this.outputChannel.appendLine(
      `${prefix}: ${(message as string)?.toString()} ${optionalParams
        .map((x) => (x as string)?.toString())
        .join(" ")}\n`
    );
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.log(LogLevel.DEBUG, message, optionalParams);
  }

  info(message: unknown, ...optionalParams: unknown[]): void {
    this.log(LogLevel.INFO, message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.log(LogLevel.WARN, message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.log(LogLevel.ERROR, message, optionalParams);
  }
})();
