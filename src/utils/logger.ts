import * as vscode from "vscode";
import { OutputChannel } from "vscode";

export class Logger {
  // eslint-disable-next-line no-use-before-define
  private static instance: Logger;

  private outputChannel: OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Tabnine");
  }

  public static log(message: string): void {
    const prefix = `[${new Date().toTimeString()}]`;
    this.getInstance().outputChannel.appendLine(`${prefix}: ${message}`);
  }

  private static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }
}
