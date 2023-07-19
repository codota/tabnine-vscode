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

  private showLogsDisposable: vscode.Disposable;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Tabnine");
    this.showLogsDisposable = vscode.commands.registerCommand(
      "tabnine.logs",
      () => this.show()
    );
  }

  init(context: vscode.ExtensionContext) {
    context.subscriptions.push(this);
  }

  dispose() {
    this.outputChannel.dispose();
    this.showLogsDisposable.dispose();
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

  process(message: string): void {
    this.outputChannel.appendLine(`${message}\n`);
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
