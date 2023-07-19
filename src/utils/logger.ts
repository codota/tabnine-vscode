import * as vscode from "vscode";
import { OutputChannel } from "vscode";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  PROCESS,
}

export const Logger = new (class Logger implements vscode.Disposable {
  private outputChannel: OutputChannel;

  private showLogsDisposable: vscode.Disposable;

  private profilerDisposable: vscode.Disposable;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Tabnine");
    this.showLogsDisposable = vscode.commands.registerCommand(
      "tabnine.logs",
      () => this.show()
    );
    this.profilerDisposable = vscode.commands.registerCommand(
      "tabnine.profiler",
      () => {
        this.show();
        // const configuration = vscode.workspace.getConfiguration();
        // await configuration.update()
      }
    );
  }

  init(context: vscode.ExtensionContext) {
    context.subscriptions.push(this);
  }

  dispose() {
    this.outputChannel.dispose();
    this.showLogsDisposable.dispose();
    this.profilerDisposable.dispose();
  }

  show(): void {
    this.outputChannel.show();
  }

  private log(level: LogLevel, message: string): void {
    const prefix = `${new Date().toTimeString()} [${LogLevel[level]}]`;
    this.outputChannel.appendLine(
      `${level !== LogLevel.PROCESS ? `${prefix}: ` : ""}${message}\n`
    );
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  process(message: string): void {
    this.log(LogLevel.PROCESS, message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }

  error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }
})();
