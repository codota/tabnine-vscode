import * as vscode from "vscode";
import { OutputChannel } from "vscode";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}
type UnknownWithToString = {
  toString(): string;
} & unknown;

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

  private log(level: LogLevel, message: string): void {
    const prefix = `${new Date().toTimeString()} [${LogLevel[level]}]`;
    this.outputChannel.appendLine(`${prefix}: ${message}\n`);
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(
    message: UnknownWithToString,
    ...optionalParams: UnknownWithToString[]
  ): void {
    this.log(
      LogLevel.ERROR,
      `${message.toString()} ${optionalParams.join(" ")}`
    );
  }
})();
